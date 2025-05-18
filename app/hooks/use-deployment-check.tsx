'use client'

import { useEffect, useRef } from 'react'

import { checkDeploymentStatus } from '../actions/check-deployment-status'
import type { Project } from '../types'
import { assertExists } from '../utils/assert-exists'
import { saveProject } from '../utils/project-storage'

interface UseDeploymentCheckProps {
  activeProject: Project | null
  setActiveProject: (project: Project) => void
  setProjectsChanged: (callback: (prev: number) => number) => void
  lastCommitTimestamp: number
}

export function useDeploymentCheck({
  activeProject,
  setActiveProject,
  setProjectsChanged,
  lastCommitTimestamp,
}: UseDeploymentCheckProps) {
  const deploymentCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (activeProject?.repoInfo && activeProject.deploymentStatus === 'pending') {
      // Clear any existing interval
      if (deploymentCheckInterval.current) {
        clearInterval(deploymentCheckInterval.current)
      }

      // Check status every 10 seconds
      deploymentCheckInterval.current = setInterval(async () => {
        try {
          assertExists(activeProject.repoInfo, 'activeProject.repoInfo')
          const { status } = await checkDeploymentStatus(activeProject.repoInfo?.repoName)
          console.log(`[DEBUG] Deployment status: ${status}`)

          if (status !== 'pending') {
            // Update the project with the new status
            const updatedProject = {
              ...activeProject,
              deploymentStatus: status,
              updatedAt: new Date(),
            }
            setActiveProject(updatedProject)
            saveProject(updatedProject)
            setProjectsChanged(prev => prev + 1)

            if (deploymentCheckInterval.current) {
              clearInterval(deploymentCheckInterval.current)
            }
          }
        } catch (error) {
          console.error('[DEBUG] Error checking deployment status:', error)
        }
      }, 5000)

      return () => {
        if (deploymentCheckInterval.current) {
          clearInterval(deploymentCheckInterval.current)
        }
      }
    }
  }, [activeProject, lastCommitTimestamp, setActiveProject, setProjectsChanged])
}
