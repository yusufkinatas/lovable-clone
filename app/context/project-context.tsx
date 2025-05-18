'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type React from 'react'
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { validateAndEditApp } from '../actions/validate-and-edit-app'
import { validateAndInitApp } from '../actions/validate-and-init-app'
import { useDebugLogs } from '../hooks/use-debug-logs'
import { useDeploymentCheck } from '../hooks/use-deployment-check'
import type { Message, Project } from '../types'
import { getProjects, saveProject } from '../utils/project-storage'

type ProjectContextType = {
  project: Project
  inputValue: string
  isLoading: boolean
  debugLogs: string[]
  setInputValue: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({
  children,
  projectId,
}: {
  children: ReactNode
  projectId: string
}) {
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('initialPrompt')
  const initialPromptProcessed = useRef(false)

  // Project state
  const [project, setProject] = useState<Project | null>(null)
  const [projectsChanged, setProjectsChanged] = useState(0)

  // UI state
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastCommitTimestamp, setLastCommitTimestamp] = useState<number>(0)

  // Router
  const router = useRouter()

  // Custom hooks
  const { debugLogs } = useDebugLogs()

  // Load project on initial render
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const projects = getProjects()
    const foundProject = projects.find(p => p.id === projectId)
    if (foundProject) {
      setProject(foundProject)
    } else {
      // Project not found, redirect to home
      router.push('/')
    }
  }, [projectId, router, projectsChanged])

  // Handle initial prompt from URL parameter
  useEffect(() => {
    if (project && initialPrompt && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true

      // Add user message for the initial prompt
      const userMessage: Message = {
        id: Date.now().toString(),
        content: initialPrompt,
        isUser: true,
        timestamp: new Date(),
        role: 'user',
      }

      // Add initial system message indicating validation is in progress
      const processingMessage: Message = {
        id: `processing-${Date.now().toString()}`,
        content: 'Validating your request...',
        isUser: false,
        timestamp: new Date(),
        role: 'assistant',
      }

      const updatedProject = {
        ...project,
        messages: [userMessage, processingMessage],
        updatedAt: new Date(),
      }

      setProject(updatedProject)
      saveProject(updatedProject)
      setProjectsChanged(prev => prev + 1)

      // Remove the initialPrompt parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)

      // Start validation process
      validateAndInitApp(initialPrompt)
        .then(result => {
          // Get the latest project state
          const projects = getProjects()
          const currentProject = projects.find(p => p.id === projectId)

          if (currentProject) {
            // Filter out the processing message
            const updatedMessages = currentProject.messages.filter(
              msg => msg.id !== processingMessage.id
            )

            if (result.success && result.generationResult) {
              // Validation successful and app generated
              const validationMessage: Message = {
                id: Date.now().toString(),
                content: result.validationStatus.description,
                isUser: false,
                timestamp: new Date(),
                role: 'assistant',
              }

              const generationMessage: Message = {
                id: Date.now().toString() + 1,
                content: `Created app based on your prompt. Deployment URL: ${result.generationResult.repoInfo.deploymentUrl}`,
                isUser: false,
                timestamp: new Date(),
                role: 'assistant',
              }

              updatedMessages.push(validationMessage, generationMessage)

              const finalProject = {
                ...currentProject,
                messages: updatedMessages,
                generatedCode: result.generationResult.code,
                repoInfo: result.generationResult.repoInfo,
                deploymentStatus: 'pending' as const,
                validationStatus: result.validationStatus,
                name: result.validationStatus.name || currentProject.name,
                updatedAt: new Date(),
              }

              setProject(finalProject)
              saveProject(finalProject)
              setLastCommitTimestamp(Date.now())
            } else {
              // Validation failed or generation failed
              const errorMessage = result.error
                ? `Validation successful, but generation failed: ${result.error}`
                : result.validationStatus.description

              const systemMessage: Message = {
                id: Date.now().toString(),
                content: errorMessage,
                isUser: false,
                timestamp: new Date(),
                role: 'assistant',
              }

              const finalProject: Project = {
                ...currentProject,
                deploymentStatus: 'failure',
                messages: [...updatedMessages, systemMessage],
                validationStatus: result.validationStatus,
                updatedAt: new Date(),
              }

              setProject(finalProject)
              saveProject(finalProject)
            }

            setProjectsChanged(prev => prev + 1)
          }
        })
        .catch(error => {
          console.error('[DEBUG] Error in validation process:', error)

          // Get the latest project state
          const projects = getProjects()
          const currentProject = projects.find(p => p.id === projectId)

          if (currentProject) {
            // Filter out the processing message
            const updatedMessages = currentProject.messages.filter(
              msg => msg.id !== processingMessage.id
            )

            const errorMessage: Message = {
              id: Date.now().toString(),
              content: `Error during validation: ${error instanceof Error ? error.message : String(error)}`,
              isUser: false,
              timestamp: new Date(),
              role: 'assistant',
            }

            const finalProject = {
              ...currentProject,
              messages: [...updatedMessages, errorMessage],
              updatedAt: new Date(),
            }

            setProject(finalProject)
            saveProject(finalProject)
            setProjectsChanged(prev => prev + 1)
          }
        })
    }
  }, [project, initialPrompt, projectId])

  // Use deployment check hook
  useDeploymentCheck({
    activeProject: project,
    setActiveProject: setProject,
    setProjectsChanged,
    lastCommitTimestamp,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !project) return

    // Add user message to chat
    const userMessageId = Date.now().toString()
    const userMessage: Message = {
      id: userMessageId,
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      role: 'user',
    }

    const updatedMessages = [...project.messages, userMessage]
    const updatedProject = {
      ...project,
      messages: updatedMessages,
      updatedAt: new Date(),
    }
    setProject(updatedProject)
    saveProject(updatedProject)

    setIsLoading(true)

    console.log(
      `[DEBUG] Form submitted with prompt: "${inputValue.substring(0, 30)}${
        inputValue.length > 30 ? '...' : ''
      }"`
    )

    try {
      // Check if the project has already been successfully validated and has code
      if (project.repoInfo && project.generatedCode) {
        // Edit existing app
        console.log('[DEBUG] Editing existing app...')

        // Add processing message
        const processingMessage: Message = {
          id: `processing-${Date.now().toString()}`,
          content: 'Processing your edit request...',
          isUser: false,
          timestamp: new Date(),
          role: 'assistant',
        }

        const messagesWithProcessing = [...updatedMessages, processingMessage]
        const projectWithProcessing = {
          ...updatedProject,
          messages: messagesWithProcessing,
        }

        setProject(projectWithProcessing)
        saveProject(projectWithProcessing)

        // Process the edit
        const startTime = Date.now()
        const result = await validateAndEditApp(
          project.repoInfo.repoName,
          project.generatedCode,
          inputValue
        )
        const endTime = Date.now()
        console.log(`[DEBUG] App edited in ${endTime - startTime}ms`)

        // Replace processing message with result
        const updatedMessagesFiltered = messagesWithProcessing.filter(
          msg => msg.id !== processingMessage.id
        )

        // Add system message with result
        const systemMessage: Message = {
          id: Date.now().toString(),
          content: result.success
            ? 'Updated app based on your request. Deployment in progress...'
            : result.validationStatus.description,
          isUser: false,
          timestamp: new Date(),
          role: 'assistant',
        }

        const finalMessages = [...updatedMessagesFiltered, systemMessage]
        const finalProject: Project = {
          ...updatedProject,
          messages: finalMessages,
          generatedCode:
            result.success && result.editResult
              ? result.editResult.code
              : project.generatedCode,
          deploymentStatus: result.success ? 'pending' : project.deploymentStatus,
          validationStatus: result.validationStatus,
          name: result.validationStatus.name || project.name,
          updatedAt: new Date(),
        }

        setProject(finalProject)
        saveProject(finalProject)
        if (result.success) {
          setLastCommitTimestamp(Date.now())
        }
        setProjectsChanged(prev => prev + 1)
      } else {
        // Project doesn't have code yet, need to validate and generate
        console.log('[DEBUG] Validating and potentially generating app...')

        // Add processing message
        const processingMessage: Message = {
          id: `processing-${Date.now().toString()}`,
          content: 'Validating your request...',
          isUser: false,
          timestamp: new Date(),
          role: 'assistant',
        }

        const messagesWithProcessing = [...updatedMessages, processingMessage]
        const projectWithProcessing = {
          ...updatedProject,
          messages: messagesWithProcessing,
        }

        setProject(projectWithProcessing)
        saveProject(projectWithProcessing)

        const result = await validateAndInitApp(inputValue)

        // Replace processing message
        const updatedMessagesFiltered = messagesWithProcessing.filter(
          msg => msg.id !== processingMessage.id
        )

        if (result.success && result.generationResult) {
          // Validation successful and app generated
          const validationMessage: Message = {
            id: Date.now().toString(),
            content: result.validationStatus.description,
            isUser: false,
            timestamp: new Date(),
            role: 'assistant',
          }

          const generationMessage: Message = {
            id: Date.now().toString() + 1,
            content: `Created app based on your prompt. Deployment URL: ${result.generationResult.repoInfo.deploymentUrl}`,
            isUser: false,
            timestamp: new Date(),
            role: 'assistant',
          }

          const finalProject: Project = {
            ...updatedProject,
            name: result.validationStatus.name || `App: ${inputValue.substring(0, 30)}`,
            messages: [...updatedMessagesFiltered, validationMessage, generationMessage],
            generatedCode: result.generationResult.code,
            repoInfo: result.generationResult.repoInfo,
            deploymentStatus: 'pending' as const,
            validationStatus: result.validationStatus,
            updatedAt: new Date(),
          }

          setProject(finalProject)
          saveProject(finalProject)
          setLastCommitTimestamp(Date.now())
          setProjectsChanged(prev => prev + 1)
        } else {
          // Validation failed or generation failed
          const errorMessage = result.error
            ? `Validation successful, but generation failed: ${result.error}`
            : result.validationStatus.description

          const systemMessage: Message = {
            id: Date.now().toString(),
            content: errorMessage,
            isUser: false,
            timestamp: new Date(),
            role: 'assistant',
          }

          const finalProject: Project = {
            ...updatedProject,
            deploymentStatus: 'failure',
            messages: [...updatedMessagesFiltered, systemMessage],
            validationStatus: result.validationStatus,
            updatedAt: new Date(),
          }

          setProject(finalProject)
          saveProject(finalProject)
          setProjectsChanged(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('[DEBUG] Error in handleSubmit:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'

      const errorSystemMessage: Message = {
        id: Date.now().toString(),
        content: `Error: ${errorMessage}`,
        isUser: false,
        timestamp: new Date(),
        role: 'assistant',
      }

      const finalMessages = [...updatedMessages, errorSystemMessage]
      const finalProject: Project = {
        ...updatedProject,
        messages: finalMessages,
        updatedAt: new Date(),
      }

      setProject(finalProject)
      saveProject(finalProject)
      setProjectsChanged(prev => prev + 1)
    } finally {
      setIsLoading(false)
      setInputValue('')
    }
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-xl">Loading project...</div>
      </div>
    )
  }

  const value = {
    project,
    inputValue,
    isLoading,
    debugLogs,
    setInputValue,
    handleSubmit,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
}
