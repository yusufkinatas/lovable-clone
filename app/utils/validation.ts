import { ChatPromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { claudeChat } from './claude-chat'

// Define the validation schema using Zod
const validationSchema = z.object({
  'request-evaluation': z.enum([
    'feasible',
    'too-complex',
    'inappropriate',
    'irrelevant',
  ]),
  name: z.string().describe('The name of the app in few words, based on the prompt'),
  description: z.string().describe('Explanation of what evaluation was made and why'),
})

// Export the type derived from the schema
export type ValidationResult = z.infer<typeof validationSchema>

/**
 * Generic validation function that can be used for different types of requests
 */
export async function validateRequest(
  systemPrompt: string,
  userPrompt: string,
  params: Record<string, unknown>
): Promise<ValidationResult> {
  try {
    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log(
      `[DEBUG] Anthropic API Key ${apiKey ? 'found' : 'not found'} (length: ${
        apiKey?.length || 0
      })`
    )

    if (!apiKey || apiKey.trim() === '') {
      const errorMsg =
        'ANTHROPIC API key is not configured. Please add the API key in your environment variables.'
      console.error(`[DEBUG] Error: ${errorMsg}`)
      throw new Error(errorMsg)
    }

    // Use the withStructuredOutput method to get structured validation results
    console.log('[DEBUG] Validating request via LangChain structured output...')
    const startValidation = Date.now()

    // Create a prompt template
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', userPrompt],
    ])

    // Enhanced model with structured output
    const structuredOutputModel = claudeChat.withStructuredOutput(validationSchema, {
      name: 'validateRequest',
    })

    // Create the chain
    const chain = promptTemplate.pipe(structuredOutputModel)

    // Execute the chain
    const validationResult = await chain.invoke(params)

    const validationTime = Date.now() - startValidation
    console.log(`[DEBUG] LangChain validation completed in ${validationTime}ms`)

    return validationResult
  } catch (error) {
    console.error('[DEBUG] Error in validateRequest:', error)
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
