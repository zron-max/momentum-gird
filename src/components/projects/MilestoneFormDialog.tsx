// src/components/projects/MilestoneFormDialog.tsx

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DBProject, ProjectMilestone, MilestoneStatus, Priority } from './types'

// Omit fields that are auto-generated or handled separately
type MilestoneFormData = Omit<
  ProjectMilestone,
  'id' | 'created_at' | 'updated_at' | 'user_id'
>

interface MilestoneFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (milestoneData: MilestoneFormData) => void
  initialData?: ProjectMilestone | null
  projects: DBProject[]
  defaultProjectId?: string
}

export const MilestoneFormDialog: React.FC<MilestoneFormDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  projects,
  defaultProjectId,
}) => {
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'todo',
    project_id: defaultProjectId || '',
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || '',
          due_date: initialData.due_date || '',
          priority: initialData.priority || 'medium',
          status: (initialData.status as MilestoneStatus) || 'todo',
          project_id: initialData.project_id,
        })
      } else {
        setFormData({
          title: '',
          description: '',
          due_date: '',
          priority: 'medium',
          status: 'todo',
          project_id:
            defaultProjectId || (projects.length > 0 ? projects[0].id : ''),
        })
      }
    }
  }, [initialData, isOpen, defaultProjectId, projects])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Milestone' : 'Add New Milestone'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="title"
            placeholder="Milestone title..."
            value={formData.title}
            onChange={handleChange}
          />
          <Input
            name="due_date"
            type="date"
            value={formData.due_date || ''}
            onChange={handleChange}
          />
          <Input
            name="description"
            placeholder="Description (optional)..."
            value={formData.description || ''}
            onChange={handleChange}
          />

          <select
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>

          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
