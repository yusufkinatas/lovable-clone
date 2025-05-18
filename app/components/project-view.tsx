'use client'

import { CodeHighlighter } from '@/components/code-highlighter'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Code, Eye, GripVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useProjectContext } from '../context/project-context'
import { AppPreview } from './app-preview'
import { ChatInterface } from './chat-interface'
import { DebugLogs } from './debug-logs'

export function ProjectView() {
  const { project } = useProjectContext()

  const [showConsole, setShowConsole] = useState(false)
  const router = useRouter()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-bold text-xl">{project.name}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConsole(!showConsole)}
            >
              {showConsole ? 'Hide Console' : 'Show Console'}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex grow flex-col overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70} minSize={30}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50} minSize={30}>
                <ChatInterface />
              </ResizablePanel>
              <ResizableHandle withHandle>
                <div className="flex h-full items-center justify-center">
                  <GripVertical className="h-4 w-4" />
                </div>
              </ResizableHandle>
              <ResizablePanel defaultSize={50} minSize={30}>
                <Tabs defaultValue="preview" className="flex h-full flex-col ">
                  <TabsList className="rounded-none">
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="flex items-center gap-2">
                      <Code className="h-4 w-4" /> Code
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="flex-grow">
                    <AppPreview />
                  </TabsContent>
                  <TabsContent value="code" className="flex-grow overflow-auto">
                    <CodeHighlighter
                      code={project.generatedCode || 'No code generated yet.'}
                      language="tsx"
                    />
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          {showConsole && (
            <>
              <ResizableHandle withHandle>
                <div className="flex h-full items-center justify-center">
                  <GripVertical className="h-4 w-4" />
                </div>
              </ResizableHandle>
              <ResizablePanel defaultSize={30} minSize={10}>
                <DebugLogs />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
