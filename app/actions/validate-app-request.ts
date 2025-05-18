'use server'

import { validateInitRequestPrompt } from '../prompts/validate-init-request'
import { type ValidationResult, validateRequest } from '../utils/validation'

export async function validateAppRequest(prompt: string): Promise<ValidationResult> {
  try {
    console.log('[DEBUG] Starting validateAppRequest with LangChain')
    console.log(
      `[DEBUG] Prompt: \"${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}\"`
    )

    // Use the common validation utility function
    return await validateRequest(
      validateInitRequestPrompt,
      'Evaluate this app creation request: {request}',
      { request: prompt }
    )
  } catch (error) {
    console.error('[DEBUG] Error in validateAppRequest:', error)
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
