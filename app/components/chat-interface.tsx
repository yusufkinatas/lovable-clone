'use client'

import { useEffect, useRef } from 'react'
import { useProjectContext } from '../context/project-context'
import { ChatInput } from './chat-interface/chat-input'
import { MessageItem } from './chat-interface/message-item'

export function ChatInterface() {
  const { project } = useProjectContext()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [project?.messages])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {project.messages.map(message => (
            <MessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput />
    </div>
  )
}
