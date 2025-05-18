'use client'

import type { Project } from '../types'
import { deleteProject } from '../utils/project-storage'
import { ProjectCard } from './project-list/project-card'

interface ProjectListProps {
  projects: Project[]
  onSelectProject: (project: Project) => void
  onProjectsChange: () => void
}

export function ProjectList({
  projects,
  onSelectProject,
  onProjectsChange,
}: ProjectListProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl">Your Projects</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelectProject={() => onSelectProject(project)}
            handleDeleteProject={() => {
              if (confirm('Are you sure you want to delete this project?')) {
                deleteProject(project.id)
                onProjectsChange()
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
