'use client'

import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Edit, ExternalLink, Trash2 } from 'lucide-react'
import type { Project } from '../../types'

export const ProjectCard = ({
  project,
  onSelectProject,
  handleDeleteProject,
}: {
  project: Project
  onSelectProject: () => void
  handleDeleteProject: () => void
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <Card
      key={project.id}
      className="flex min-h-[200px] cursor-pointer flex-col transition-shadow hover:shadow-md"
      onClick={onSelectProject}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="truncate">{project.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteProject}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            Created: {formatDate(project.createdAt)}
          </div>
          <div className="text-muted-foreground text-sm">
            Updated: {formatDate(project.updatedAt)}
          </div>
          {project.repoInfo && (
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={`${
                  project.deploymentStatus === 'pending'
                    ? 'bg-yellow-500'
                    : project.deploymentStatus === 'success'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                }`}
              >
                {project.deploymentStatus === 'pending'
                  ? 'Deploying'
                  : project.deploymentStatus === 'success'
                    ? 'Deployed'
                    : 'Failed'}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-between">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Edit className="h-3 w-3" />
            Continue
          </Button>
          {project.repoInfo && project.deploymentStatus === 'success' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={e => {
                e.stopPropagation()
                window.open(project.repoInfo?.deploymentUrl, '_blank')
              }}
            >
              <ExternalLink className="h-3 w-3" />
              View App
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
