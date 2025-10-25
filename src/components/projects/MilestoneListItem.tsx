// src/components/projects/MilestoneListItem.tsx

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Clock8, Target, Pencil, Trash2 } from 'lucide-react'
import {
  ProjectMilestone,
  Priority,
  statusColors,
  statusLabels,
  priorityBadgeClasses,
  priorityBorderClasses,
} from './types'

interface MilestoneListItemProps {
  milestone: ProjectMilestone
  isOverdue: (milestone: ProjectMilestone) => boolean
  onEdit: (milestone: ProjectMilestone) => void
  onDelete: (milestone: ProjectMilestone) => void
  onCycleStatus: (milestone: ProjectMilestone) => void
}

export const MilestoneListItem: React.FC<MilestoneListItemProps> = ({
  milestone,
  isOverdue,
  onEdit,
  onDelete,
  onCycleStatus,
}) => {
  const complete = milestone.status === 'completed'
  const overdue = isOverdue(milestone)
  const priority = (milestone.priority || 'medium') as Priority

  const getIcon = () => {
    if (complete)
      return <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" />
    if (overdue)
      return <Clock8 className="w-5 h-5 text-red-500 flex-shrink-0" />
    return <Target className="w-5 h-5 text-purple-500 flex-shrink-0" />
  }

  return (
    <div
      className={`flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 ${priorityBorderClasses[priority]}`}
      onClick={() => onEdit(milestone)}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm font-medium block truncate ${complete ? 'line-through text-muted-foreground' : 'text-foreground'}`}
          >
            {milestone.title}
          </span>
          <div className="text-xs text-muted-foreground truncate">
            Due:{' '}
            {milestone.due_date
              ? new Date(milestone.due_date).toLocaleDateString()
              : 'N/A'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          variant="outline"
          className={`text-xs ${priorityBadgeClasses[priority]}`}
        >
          {priority.toUpperCase()}
        </Badge>
        <Badge
          variant="secondary"
          className={`text-xs text-white cursor-pointer ${statusColors[milestone.status as keyof typeof statusColors]}`}
          onClick={(e) => {
            e.stopPropagation()
            onCycleStatus(milestone)
          }}
        >
          {statusLabels[milestone.status as keyof typeof statusLabels]}
        </Badge>
        <button
          className="p-1 rounded-full hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(milestone)
          }}
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          className="p-1 rounded-full hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(milestone)
          }}
        >
          <Trash2 className="w-3 h-3 text-destructive" />
        </button>
      </div>
    </div>
  )
}
