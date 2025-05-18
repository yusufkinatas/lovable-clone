'use server'

import { AIMessage } from '@langchain/core/messages'
import { v4 as uuidv4 } from 'uuid'

import { RunnableLambda } from '@langchain/core/runnables'
import { initAppPromptTemplate } from '../prompts/init-app-prompt-template'
import { claudeChat } from '../utils/claude-chat'
import { createOrUpdateRepository } from '../utils/github'
import {
  TypeScriptValidationError,
  validateTypeScriptCode,
} from '../utils/typescript-validator'

// Define the prompt template

export async function initApp(prompt: string) {
  try {
    console.log('[DEBUG] Starting generateApp with LangChain')
    console.log(
      `[DEBUG] Prompt: \"${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}\"`
    )

    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log(
      `[DEBUG] Anthropic API Key ${apiKey ? 'found' : 'not found'} (length: ${apiKey?.length || 0})`
    )

    if (!apiKey || apiKey.trim() === '') {
      const errorMsg =
        'ANTHROPIC API key is not configured. Please add the API key in your environment variables.'
      console.error(`[DEBUG] Error: ${errorMsg}`)
      throw new Error(errorMsg)
    }

    // Check for GitHub token
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken || githubToken.trim() === '') {
      throw new Error(
        'GitHub token is not configured. Please add GITHUB_TOKEN to your environment variables.'
      )
    }

    // Generate a unique ID for this prompt
    const promptId = uuidv4().substring(0, 8)
    console.log(`[DEBUG] Generated prompt ID: ${promptId}`)

    // Generate the React component code using LangChain LCEL with validation and retries
    console.log('[DEBUG] Generating component code via LangChain LCEL...')
    const startCodeGen = Date.now()
    let rawCode = ''
    try {
      // Create a validation function as a RunnableLambda
      const validateCode = new RunnableLambda({
        func: async (result: unknown) => {
          let codeToValidate = ''

          // Extract code from result
          if (result instanceof AIMessage) {
            codeToValidate = result.content as string
          } else {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            codeToValidate = (result as any).text?.trim() ?? ''
            if (!codeToValidate) {
              throw new Error('Could not extract code from LLM response.')
            }
          }

          // Validate the code
          console.log('[DEBUG] Validating TypeScript code...')
          try {
            validateTypeScriptCode(codeToValidate)
            console.log('[DEBUG] TypeScript validation passed.')
            return result // Return original result if validation passes
          } catch (error) {
            if (error instanceof TypeScriptValidationError) {
              console.error('[DEBUG] TypeScript validation failed:', error.message)
              throw error // Rethrow to trigger retry
            }
            throw error // Rethrow other errors
          }
        },
      })

      // Create the chain using LCEL .pipe() with validation and retry
      const baseChain = initAppPromptTemplate.pipe(claudeChat)
      const chainWithValidation = baseChain.pipe(validateCode)

      // Apply retry logic
      const chainWithRetry = chainWithValidation.withRetry({
        stopAfterAttempt: 3, // 1 initial + 2 retries
        onFailedAttempt: (error: Error) => {
          // Only continue retrying if it's a TypeScriptValidationError
          if (!(error instanceof TypeScriptValidationError)) {
            throw error // Re-throw other errors to stop retry
          }
          console.log('[DEBUG] Retry attempt triggered by validation error')
          return Promise.resolve() // Continue with retry for TypeScriptValidationError
        },
      })

      // Invoke the chain with retries
      const result = await chainWithRetry.invoke({ user_request: prompt })

      // Extract content from result
      if (result instanceof AIMessage) {
        rawCode = result.content as string
      } else {
        console.warn('[DEBUG] Unexpected result format from LCEL chain:', result)
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        rawCode = (result as any).text?.trim() ?? ''
        if (!rawCode) {
          throw new Error(
            'LCEL chain returned an unexpected result format without content.'
          )
        }
      }
    } catch (lcError) {
      console.error('[DEBUG] Error during LangChain call:', lcError)

      // Check if it's a final validation error after all retries
      if (lcError instanceof TypeScriptValidationError) {
        console.error('[DEBUG] TypeScript validation failed after all retry attempts.')
        throw new Error(
          'Failed to generate valid TypeScript code after multiple attempts. Please try rephrasing your request.'
        )
      }

      const errorMessage = lcError instanceof Error ? lcError.message : String(lcError)
      throw new Error(`LangChain code generation failed: ${errorMessage}`)
    }

    const codeGenTime = Date.now() - startCodeGen
    console.log(`[DEBUG] LangChain code generated in ${codeGenTime}ms`)
    console.log(`[DEBUG] Raw code length: ${rawCode.length}`)

    // Create or update GitHub repository with the generated code
    console.log('[DEBUG] Creating/updating GitHub repository...')
    const startRepoTime = Date.now()
    const repoInfo = await createOrUpdateRepository(rawCode, promptId) // Use rawCode here
    const repoTime = Date.now() - startRepoTime
    console.log(`[DEBUG] Repository created/updated in ${repoTime}ms`)

    return {
      code: rawCode,
      modelUsed: 'anthropic-langchain',
      repoInfo,
      promptId,
    }
  } catch (error) {
    console.error('[DEBUG] Error in generateApp:', error)
    if (error instanceof Error) {
      console.error(`[DEBUG] Error name: ${error.name}`)
      console.error(`[DEBUG] Error message: ${error.message}`)
      console.error(`[DEBUG] Error stack: ${error.stack}`)
    } else {
      console.error('[DEBUG] Unknown error type:', error)
    }
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(errorMessage)
  }
}
