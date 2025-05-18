'use client'

import { Info } from 'lucide-react'

export const DeploymentEmpty = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-md border border-muted-foreground/30 border-dashed p-8 dark:border-muted-foreground/20">
      <Info className="h-8 w-8 text-muted-foreground/70" />
      <div className="text-center">
        <h3 className="mb-2 font-medium text-lg">No Preview Available</h3>
        <p className="mb-2 text-muted-foreground">Your app hasn't been deployed yet.</p>
        <p className="text-muted-foreground/70 text-sm">
          Submit your prompt to generate and deploy an app.
        </p>
      </div>
    </div>
  )
}
