// src/components/projects/ProjectFormDialog.tsx

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DBProject } from './types'

interface ProjectFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (projectData: { title: string; description: string }) => void
  initialData?: DBProject | null
}

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // When the dialog opens or initialData changes, populate the form
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description || '')
    } else {
      // Reset form when opening for a new project
      setTitle('')
      setDescription('')
    }
  }, [initialData, isOpen])

  const handleSubmit = () => {
    onSubmit({ title, description })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Project name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Project description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              {initialData ? 'Save Changes' : 'Add Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
