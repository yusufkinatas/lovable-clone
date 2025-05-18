'use client'

import type React from 'react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProjectList } from './components/project-list'
import { QuickStartForm } from './components/quick-start-form'
import type { Project } from './types'
import { createProject, getProjects } from './utils/project-storage'

export default function ProjectsPage() {
  // Project state
  const [projects, setProjects] = useState<Project[]>([])

  // UI state
  const [inputValue, setInputValue] = useState('')

  // Router
  const router = useRouter()

  // Load projects on initial render
  useEffect(() => {
    const loadedProjects = getProjects()
    setProjects(loadedProjects)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Create a new project immediately
    const newProject = createProject(
      `App: ${inputValue.substring(0, 30)}` // Name from prompt
    )

    // Clear input immediately
    setInputValue('')

    // Navigate to the project page immediately with the prompt as a URL parameter
    router.push(
      `/project/${newProject.id}?initialPrompt=${encodeURIComponent(inputValue)}`
    )
  }

  // Handle selecting a project
  const handleSelectProject = (project: Project) => {
    router.push(`/project/${project.id}`)
  }

  // Handle projects change
  const handleProjectsChange = () => {
    // update projects state
    const loadedProjects = getProjects()
    setProjects(loadedProjects)
  }

  return (
    <div className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <Header />

      <WelcomeMessage />

      <QuickStartForm
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={handleSubmit}
      />

      {!!projects.length && (
        <ProjectList
          projects={projects}
          onSelectProject={handleSelectProject}
          onProjectsChange={handleProjectsChange}
        />
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-bold text-3xl">Prompt-to-App Builder</h1>
      <ThemeToggle />
    </div>
  )
}

function WelcomeMessage() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Welcome to Prompt-to-App Builder</AlertTitle>
      <AlertDescription>
        Create new projects or continue working on existing ones. Each project is a React
        app generated from your prompts.
      </AlertDescription>
    </Alert>
  )
}
