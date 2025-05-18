'use server'

import type { ValidationStatus } from '../types'
import { editApp } from './edit-app'
import { validateEditRequest } from './validate-edit-request'

export async function validateAndEditApp(
  repoName: string,
  currentCode: string,
  editRequest: string
) {
  try {
    console.log(
      `[DEBUG] Starting validateAndEditApp with edit request: "${editRequest.substring(0, 50)}${
        editRequest.length > 50 ? '...' : ''
      }"`
    )

    // First, validate the edit request
    const validationResult = await validateEditRequest(currentCode, editRequest)
    console.log(`[DEBUG] Validation result: ${validationResult['request-evaluation']}`)

    // Create a standardized validation status
    const validationStatus: ValidationStatus = {
      status:
        validationResult['request-evaluation'] === 'feasible'
          ? 'feasible'
          : validationResult['request-evaluation'],
      description: validationResult.description,
      name: validationResult.name,
    }

    // If the request is feasible, edit the app
    if (validationStatus.status === 'feasible') {
      console.log('[DEBUG] Edit request is feasible, editing app...')
      try {
        const editResult = await editApp(repoName, currentCode, editRequest)
        return {
          success: true,
          validationStatus,
          editResult,
        }
      } catch (editError) {
        console.error('[DEBUG] Error during app editing:', editError)
        return {
          success: false,
          validationStatus,
          error: editError instanceof Error ? editError.message : String(editError),
        }
      }
    } else {
      // Request is not feasible, return validation result only
      console.log(
        '[DEBUG] Edit request is not feasible, returning validation result only'
      )
      return {
        success: false,
        validationStatus,
        error: null,
      }
    }
  } catch (error) {
    console.error('[DEBUG] Error in validateAndEditApp:', error)
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
