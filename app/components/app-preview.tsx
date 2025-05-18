'use client'

import { Button } from '@/components/ui/button'
import { ExternalLink, Github, RefreshCw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useProjectContext } from '../context/project-context'
import { DeploymentEmpty } from './app-preview/deployment-empty'
import { DeploymentError } from './app-preview/deployment-error'
import { DeploymentPending } from './app-preview/deployment-pending'

export function AppPreview() {
  const { project } = useProjectContext()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { deploymentStatus, repoInfo } = project
  const { deploymentUrl, repoUrl } = repoInfo ?? {}

  // Cache busting URL creation
  const getRefreshedUrl = (url: string) => {
    const timestamp = new Date().getTime()
    // Remove any existing timestamp parameter to avoid accumulation
    const baseUrl = url.split('?')[0]
    return `${baseUrl}?t=${timestamp}&nocache=true`
  }

  const handleRefresh = () => {
    if (iframeRef.current && deploymentUrl) {
      // Set the iframe src to a blank page first to force a complete reload
      iframeRef.current.src = 'about:blank'

      // Use setTimeout to ensure the blank page loads before setting the new URL
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = getRefreshedUrl(deploymentUrl)
        }
      }, 100)
    }
  }

  const handleOpenInNewTab = () => {
    if (deploymentUrl) {
      window.open(deploymentUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // If deployment status changes to success, refresh the iframe
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (deploymentStatus === 'success' && iframeRef.current && deploymentUrl) {
      handleRefresh()
    }
  }, [deploymentStatus, deploymentUrl])

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 px-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={!deploymentUrl || deploymentStatus !== 'success'}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {repoUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(repoUrl, '_blank', 'noopener,noreferrer')}
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          )}

          {deploymentUrl && deploymentStatus === 'success' && (
            <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
          )}
        </div>
      </div>

      {deploymentUrl ? (
        deploymentStatus === 'success' ? (
          <iframe
            title="App Preview"
            ref={iframeRef}
            src={deploymentUrl ? getRefreshedUrl(deploymentUrl) : undefined}
            className="h-full w-full"
            key={`frame-${deploymentUrl}-${deploymentStatus}`} // Key helps React recreate the iframe when URL changes
          />
        ) : deploymentStatus === 'pending' ? (
          <DeploymentPending />
        ) : (
          <DeploymentError />
        )
      ) : (
        <DeploymentEmpty />
      )}
    </div>
  )
}
