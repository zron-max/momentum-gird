// src/components/projects/types.ts

import type { Tables } from '@/integrations/supabase/types'

export type DBProject = Tables<'projects'>

export type ProjectMilestone = Tables<'project_milestones'> & {
  priority?: 'low' | 'medium' | 'high'
}

export type MilestoneStatus = 'todo' | 'in-progress' | 'completed' | 'delayed'

export type Priority = 'low' | 'medium' | 'high'

// Constants moved from the component
export const statusColors: Record<MilestoneStatus, string> = {
  todo: 'bg-yellow-500',
  'in-progress': 'bg-blue-800',
  completed: 'bg-green-800',
  delayed: 'bg-red-800',
}

export const statusLabels: Record<MilestoneStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
}

export const priorityBadgeClasses: Record<Priority, string> = {
  low: 'border-green-450 text-green-600',
  medium: 'border-orange-450 text-yellow-600',
  high: 'border-red-450 text-red-600',
}

export const priorityBorderClasses: Record<Priority, string> = {
  high: 'border-l-4 border-red-500',
  medium: 'border-l-4 border-purple-500',
  low: 'border-l-4 border-blue-500',
}
