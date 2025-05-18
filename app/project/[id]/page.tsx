'use client'

import { use } from 'react'
import { ProjectView } from '../../components/project-view'
import { ProjectProvider } from '../../context/project-context'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const unwrappedParams = use(params)
  const projectId = unwrappedParams.id

  return (
    <ProjectProvider projectId={projectId}>
      <ProjectView />
    </ProjectProvider>
  )
}
