// src/components/projects/ProjectList.tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Pencil, Trash2 } from 'lucide-react'
import type { DBProject, ProjectMilestone } from './types'

interface ProjectListProps {
  projects: DBProject[]
  milestones: ProjectMilestone[]
  selectedProject: string
  onSelectProject: (projectId: string) => void
  onEdit: (project: DBProject) => void
  onDelete: (project: DBProject) => void
}

const getProjectProgress = (
  projectId: string,
  milestones: ProjectMilestone[],
) => {
  const ms = milestones.filter((m) => m.project_id === projectId)
  if (ms.length === 0) return 0
  const completed = ms.filter((m) => m.status === 'completed').length
  return (completed / ms.length) * 100
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  milestones,
  selectedProject,
  onSelectProject,
  onEdit,
  onDelete,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No projects yet. Add one to start!</p>
          </div>
        ) : (
          projects.map((project) => {
            const progress = getProjectProgress(project.id, milestones)
            return (
              <div
                key={project.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedProject === project.id
                    ? 'border-purple-500 bg-card'
                    : 'border-border hover:border-muted'
                }`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1 min-w-0 pr-2">
                    <span
                      className="font-medium text-sm block truncate"
                      title={project.title}
                    >
                      {project.title}
                    </span>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(project)
                      }}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(project)
                      }}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={progress} className="h-2" />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
