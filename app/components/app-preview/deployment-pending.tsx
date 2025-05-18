'use client'

import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export const DeploymentPending = () => {
  const [progress, setProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const loadingMessages = [
    'Convincing AI overlords to cooperate…',
    'Optimizing the optimizer…',
    'Taming rogue neural networks…',
    'Spinning up quantum hamsters…',
    'Whispering sweet prompts to the model…',
    'Aligning chakras of the data…',
    'Massaging the API gently…',
    'Hiring virtual interns…',
    'Polishing the machine learning crystal ball…',
    'Talking to the server nicely…',
    'Downloading more RAM…',
    "Debugging Schrödinger's bug…",
    'Sending bribes to the cloud…',
    'Retraining on cat memes…',
    'Running sudo make it work…',
    'Compiling excuses for the delay…',
    'Asking Stack Overflow politely…',
    'Sacrificing a rubber duck for debugging…',
    'Juggling dependencies…',
    'Calibrating nonsense generator…',
  ]

  // Progress bar animation
  useEffect(() => {
    // Reset progress
    setProgress(0)

    // Fast at start, slows down approaching the end
    const animateProgress = () => {
      setProgress(prev => {
        if (prev >= 95) return prev

        // Speed based on current progress
        const speedFactor = prev < 70 ? 1 : (95 - prev) / 25
        const increment = 1.5 * speedFactor

        return Math.min(95, prev + increment)
      })
    }

    // Total animation time approximately 60 seconds
    const timer = setInterval(animateProgress, 1000)

    return () => clearInterval(timer)
  }, [])

  // Loading message rotation with transition
  useEffect(() => {
    // Set initial message
    const initialMessage =
      loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
    setLoadingMessage(initialMessage)

    const rotateMessage = () => {
      // Start transition out
      setIsTransitioning(true)

      // After transition out completes, change the message
      setTimeout(() => {
        let newMessage: string
        do {
          newMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
        } while (newMessage === loadingMessage)

        setLoadingMessage(newMessage)

        // Start transition in
        setIsTransitioning(false)
      }, 400) // Match this with the CSS transition duration
    }

    const messageTimer = setInterval(rotateMessage, 3000)

    return () => clearInterval(messageTimer)
  }, [loadingMessage])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-md border p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <h3 className="mb-2 font-medium text-lg">Deployment in Progress</h3>
        <p className="mb-4 text-muted-foreground">
          Your app is being deployed. This may take a few minutes.
        </p>
        <Progress value={progress} className="mx-auto w-64" />
        <div className="mt-2 h-6 overflow-hidden">
          <p
            className={`text-muted-foreground/70 text-sm transition-all duration-400 ease-in-out ${
              isTransitioning ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            {loadingMessage}
          </p>
        </div>
      </div>
    </div>
  )
}
