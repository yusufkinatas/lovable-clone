'use server'

import { AIMessage } from '@langchain/core/messages'
import { RunnableLambda } from '@langchain/core/runnables'
import { editAppPromptTemplate } from '../prompts/edit-app-prompt-template'
import { claudeChat } from '../utils/claude-chat'
import { updateRepositoryFile } from '../utils/github'
import {
  TypeScriptValidationError,
  validateTypeScriptCode,
} from '../utils/typescript-validator'

export async function editApp(
  repoName: string,
  currentCode: string,
  editRequest: string
) {
  try {
    console.log('[DEBUG] Starting editApp with LangChain LCEL')
    console.log(
      `[DEBUG] Edit request: "${editRequest.substring(0, 50)}${editRequest.length > 50 ? '...' : ''}"`
    )

    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY
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

    // Edit the React component code using LangChain LCEL with validation and retries
    console.log('[DEBUG] Editing component code via LangChain LCEL...')
    const startCodeEdit = Date.now()
    let rawUpdatedCode = ''
    try {
      // Create a validation function as a RunnableLambda
      const validateCode = new RunnableLambda({
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        func: async (result: AIMessage | any) => {
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
      const baseChain = editAppPromptTemplate.pipe(claudeChat)
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
      const result = await chainWithRetry.invoke({
        existing_code: currentCode,
        edit_request: editRequest,
      })

      // Extract content from result
      if (result instanceof AIMessage) {
        rawUpdatedCode = result.content as string
      } else {
        // Handle unexpected result format
        console.warn('[DEBUG] Unexpected result format from LCEL chain:', result)
        // Attempt to access .text as a fallback
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        rawUpdatedCode = (result as any).text?.trim() ?? ''
        if (!rawUpdatedCode) {
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
      throw new Error(`LangChain code editing failed: ${errorMessage}`)
    }

    const codeEditTime = Date.now() - startCodeEdit
    console.log(`[DEBUG] LangChain code edited in ${codeEditTime}ms`)
    console.log(`[DEBUG] Raw updated code length: ${rawUpdatedCode.length}`)

    // Update the GitHub repository with the edited code
    console.log('[DEBUG] Updating GitHub repository...')
    const startRepoTime = Date.now()
    const updateInfo = await updateRepositoryFile(
      repoName,
      'src/App.tsx',
      rawUpdatedCode,
      `Edit: ${editRequest.substring(0, 50)}`
    )
    const repoTime = Date.now() - startRepoTime
    console.log(`[DEBUG] Repository updated in ${repoTime}ms`)

    return {
      code: rawUpdatedCode,
      modelUsed: 'anthropic-langchain-lcel',
      updateInfo,
    }
  } catch (error) {
    console.error('[DEBUG] Error in editApp:', error)
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
