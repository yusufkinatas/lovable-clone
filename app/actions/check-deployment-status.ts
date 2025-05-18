'use server'

import { getDeploymentStatus } from '../utils/github'

export async function checkDeploymentStatus(
  repoName: string
): Promise<{ status: 'pending' | 'success' | 'failure' }> {
  try {
    const status = await getDeploymentStatus(repoName)
    return { status }
  } catch (error) {
    console.error('[DEBUG] Error checking deployment status:', error)
    return { status: 'failure' }
  }
}
