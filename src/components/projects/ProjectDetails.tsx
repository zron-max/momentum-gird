// src/components/projects/ProjectDetails.tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MilestoneListItem } from './MilestoneListItem'
import type { DBProject, ProjectMilestone } from './types'
import { Target } from 'lucide-react'

interface ProjectDetailsProps {
  project: DBProject
  milestones: ProjectMilestone[]
  isOverdue: (milestone: ProjectMilestone) => boolean
  onEditMilestone: (milestone: ProjectMilestone) => void
  onDeleteMilestone: (milestone: ProjectMilestone) => void
  onCycleStatus: (milestone: ProjectMilestone) => void
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  milestones,
  isOverdue,
  onEditMilestone,
  onDeleteMilestone,
  onCycleStatus,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle
          className="text-lg truncate flex items-center"
          title={project.title}
        >
          <Target className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" />
          {project.title}
        </CardTitle>
        <p className="text-muted-foreground text-sm break-words">
          {project.description}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
              <p className="font-semibold">
                This project has no milestones yet.
              </p>
              <p className="text-sm">
                Add a milestone to start tracking your tasks!
              </p>
            </div>
          ) : (
            milestones.map((m) => (
              <MilestoneListItem
                key={m.id}
                milestone={m}
                isOverdue={isOverdue}
                onEdit={onEditMilestone}
                onDelete={onDeleteMilestone}
                onCycleStatus={onCycleStatus}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
