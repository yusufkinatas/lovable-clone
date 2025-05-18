import type { Project } from '../types'

// Storage key for projects in localStorage
const PROJECTS_STORAGE_KEY = 'prompt-to-app-projects'

// Helper to serialize dates for storage
const serializeProject = (project: Project) => {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    messages: project.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    })),
  }
}

// Helper to deserialize dates from storage
const deserializeProject = (serialized: ReturnType<typeof serializeProject>): Project => {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
    updatedAt: new Date(serialized.updatedAt),
    messages: serialized.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    })),
  }
}

// Get all projects from storage
export const getProjects = (): Project[] => {
  if (typeof window === 'undefined') return []

  try {
    const projectsJson = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!projectsJson) return []

    const serializedProjects = JSON.parse(projectsJson)
    return serializedProjects.map(deserializeProject)
  } catch (error) {
    console.error('[DEBUG] Error loading projects from storage:', error)
    return []
  }
}

// Save a project to storage
export const saveProject = (project: Project): void => {
  if (typeof window === 'undefined') return

  try {
    // Update the project's updatedAt timestamp
    project.updatedAt = new Date()

    // Get existing projects
    const projects = getProjects()

    // Find and replace the project if it exists, otherwise add it
    const index = projects.findIndex(p => p.id === project.id)
    if (index >= 0) {
      projects[index] = project
    } else {
      projects.push(project)
    }

    // Sort projects by updatedAt (newest first)
    projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    // Save back to localStorage
    const serializedProjects = projects.map(serializeProject)
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(serializedProjects))
  } catch (error) {
    console.error('[DEBUG] Error saving project to storage:', error)
  }
}

// Delete a project from storage
export const deleteProject = (id: string): void => {
  if (typeof window === 'undefined') return

  try {
    const projects = getProjects()
    const filteredProjects = projects.filter(p => p.id !== id)

    const serializedProjects = filteredProjects.map(serializeProject)
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(serializedProjects))
  } catch (error) {
    console.error('[DEBUG] Error deleting project from storage:', error)
  }
}

// Create a new project
export const createProject = (name: string): Project => {
  const id = `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const now = new Date()

  const newProject: Project = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    messages: [],
    generatedCode: '',
    repoInfo: null,
    deploymentStatus: 'pending',
    validationStatus: null,
  }

  saveProject(newProject)
  return newProject
}
