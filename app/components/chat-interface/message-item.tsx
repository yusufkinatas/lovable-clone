'use client'

import type { Message } from '@/app/types'
import { cn } from '@/lib/utils'

export function MessageItem({ message }: { message: Message }) {
  return (
    <div
      key={message.id}
      className={cn('flex flex-col', message.isUser ? 'items-end' : 'items-start')}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-3',
          message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {message.content}
      </div>
      <span className="mt-1 text-muted-foreground text-xs">
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  )
}
