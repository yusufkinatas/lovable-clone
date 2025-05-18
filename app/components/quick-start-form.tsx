'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type React from 'react'

interface QuickStartFormProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function QuickStartForm({
  inputValue,
  onInputChange,
  onSubmit,
}: QuickStartFormProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <h3 className="font-medium text-lg">Create a new project</h3>
          <Textarea
            placeholder="Describe the app you want to build..."
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            className="min-h-[120px]"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSubmit(e)
              }
            }}
          />
          <Button type="submit" className="w-full">
            Generate App
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
