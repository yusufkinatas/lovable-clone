'use server'

import { validateEditRequestPrompt } from '../prompts/validate-edit-request'
import { type ValidationResult, validateRequest } from '../utils/validation'

export async function validateEditRequest(
  currentCode: string,
  editRequest: string
): Promise<ValidationResult> {
  try {
    console.log('[DEBUG] Starting validateEditRequest with LangChain')
    console.log(
      `[DEBUG] Edit request: \"${editRequest.substring(0, 50)}${
        editRequest.length > 50 ? '...' : ''
      }\"`
    )

    // Use the common validation utility function
    return await validateRequest(
      validateEditRequestPrompt,
      'Current code: {current_code}\n\nEvaluate this edit request: {edit_request}',
      {
        current_code: currentCode,
        edit_request: editRequest,
      }
    )
  } catch (error) {
    console.error('[DEBUG] Error in validateEditRequest:', error)
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
