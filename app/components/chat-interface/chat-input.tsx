'use client'

import { useProjectContext } from '@/app/context/project-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MessageSquare } from 'lucide-react'

export function ChatInput() {
  const { project, inputValue, isLoading, setInputValue, handleSubmit } =
    useProjectContext()

  // Check if input should be disabled
  const isInputDisabled = isLoading || project.deploymentStatus === 'pending'

  // Get placeholder text based on status
  const getPlaceholderText = () => {
    if (project.deploymentStatus === 'pending')
      return 'Input disabled during deployment...'
    if (isLoading) return 'Processing your request...'
    return 'Type your message...'
  }

  return (
    <div className="shrink-0 border-t p-4">
      <form
        onSubmit={e => {
          handleSubmit(e)
        }}
        className="flex space-x-2"
      >
        <Input
          placeholder={getPlaceholderText()}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="flex-1"
          disabled={isInputDisabled}
        />
        <Button type="submit" disabled={isInputDisabled}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
