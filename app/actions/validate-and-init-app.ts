'use server'

import type { ValidationStatus } from '../types'
import { initApp } from './init-app'
import { validateAppRequest } from './validate-app-request'

export async function validateAndInitApp(prompt: string) {
  try {
    console.log(
      `[DEBUG] Starting validateAndGenerateApp with prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`
    )

    // First, validate the app request
    const validationResult = await validateAppRequest(prompt)
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

    // If the request is feasible, generate the app
    if (validationStatus.status === 'feasible') {
      console.log('[DEBUG] Request is feasible, generating app...')
      try {
        const generationResult = await initApp(prompt)
        return {
          success: true,
          validationStatus,
          generationResult,
        }
      } catch (genError) {
        console.error('[DEBUG] Error during app generation:', genError)
        return {
          success: false,
          validationStatus,
          error: genError instanceof Error ? genError.message : String(genError),
        }
      }
    } else {
      // Request is not feasible, return validation result only
      console.log('[DEBUG] Request is not feasible, returning validation result only')
      return {
        success: false,
        validationStatus,
        error: null,
      }
    }
  } catch (error) {
    console.error('[DEBUG] Error in validateAndGenerateApp:', error)
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
