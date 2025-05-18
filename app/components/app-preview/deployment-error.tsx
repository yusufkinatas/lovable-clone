'use client'

import { AlertTriangle } from 'lucide-react'

export const DeploymentError = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-md border border-destructive/50 bg-destructive/5 p-8">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="text-center">
        <h3 className="mb-2 font-medium text-lg">Deployment Failed</h3>
        <p className="text-muted-foreground">
          There was an error deploying your app. Please try again.
        </p>
      </div>
    </div>
  )
}
