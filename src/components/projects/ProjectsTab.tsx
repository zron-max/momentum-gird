// src/components/projects/ProjectsTab.tsx

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Plus, FolderKanban } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Import our new components and types
import { ProjectList } from './ProjectList'
import { ProjectDetails } from './ProjectDetails'
import { ProjectFormDialog } from './ProjectFormDialog'
import { MilestoneFormDialog } from './MilestoneFormDialog'
import { ConfirmationDialog } from './ConfirmationDialog'
import type { DBProject, ProjectMilestone, MilestoneStatus } from './types'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const ProjectsTab: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  // Core state for data
  const [projects, setProjects] = useState<DBProject[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // UI State
  const [selectedProject, setSelectedProject] = useState<string>('')

  // State for Modals
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DBProject | null>(null)
  const [editingMilestone, setEditingMilestone] =
    useState<ProjectMilestone | null>(null)
  const [deletingProject, setDeletingProject] = useState<DBProject | null>(null)
  const [deletingMilestone, setDeletingMilestone] =
    useState<ProjectMilestone | null>(null)

  // =====================
  // Data Fetching
  // =====================
  const fetchData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const { data: projectsData, error: pError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (pError) throw pError

      const { data: milestonesData, error: mError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
      if (mError) throw mError

      setProjects(projectsData || [])
      setMilestones(milestonesData || [])

      if (projectsData && projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0].id)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch data.',
        variant: 'destructive',
      })
    } finally {
      setDataLoading(false)
    }
  }, [user, toast, selectedProject])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  // =====================
  // Memoized Helpers
  // =====================
  const selectedProjectData = useMemo(
    () => projects.find((p) => p.id === selectedProject),
    [projects, selectedProject],
  )
  const projectMilestones = useMemo(
    () => milestones.filter((m) => m.project_id === selectedProject),
    [milestones, selectedProject],
  )

  const isOverdue = useCallback((milestone: ProjectMilestone) => {
    if (!milestone.due_date) return false
    const due = new Date(milestone.due_date)
    const today = new Date()
    due.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return due < today && milestone.status !== 'completed'
  }, [])

  // =====================
  // CRUD Handlers
  // =====================

  // Project Handlers
  const handleSaveProject = async (projectData: {
    title: string
    description: string
  }) => {
    if (!user) return
    const { title, description } = projectData
    const isEditing = !!editingProject

    const query = isEditing
      ? supabase
          .from('projects')
          .update({ title, description, updated_at: new Date().toISOString() })
          .eq('id', editingProject!.id)
      : supabase
          .from('projects')
          .insert({ user_id: user.id, title, description })

    const { data, error } = await query.select().single()

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'add'} project.`,
        variant: 'destructive',
      })
      return
    }

    if (isEditing) {
      setProjects((prev) => prev.map((p) => (p.id === data.id ? data : p)))
    } else {
      setProjects((prev) => [data, ...prev])
      setSelectedProject(data.id)
    }

    toast({ title: `Project ${isEditing ? 'updated' : 'added'}` })
    setIsProjectFormOpen(false)
    setEditingProject(null)
  }

  const handleConfirmDeleteProject = async () => {
    if (!user || !deletingProject) return
    await supabase
      .from('project_milestones')
      .delete()
      .eq('project_id', deletingProject.id)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', deletingProject.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project.',
        variant: 'destructive',
      })
      return
    }

    const remainingProjects = projects.filter(
      (p) => p.id !== deletingProject.id,
    )
    setProjects(remainingProjects)

    if (selectedProject === deletingProject.id) {
      setSelectedProject(remainingProjects[0]?.id || '')
    }
    toast({ title: 'Project deleted', variant: 'destructive' })
    setDeletingProject(null)
  }

  // Milestone Handlers
  const handleSaveMilestone = async (formData: any) => {
    if (!user) return
    const isEditing = !!editingMilestone

    const query = isEditing
      ? supabase
          .from('project_milestones')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingMilestone!.id)
      : supabase
          .from('project_milestones')
          .insert({ ...formData, user_id: user.id })

    const { data, error } = await query.select().single()

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to save milestone.`,
        variant: 'destructive',
      })
      return
    }

    if (isEditing) {
      setMilestones((prev) => prev.map((m) => (m.id === data.id ? data : m)))
    } else {
      setMilestones((prev) =>
        [...prev, data].sort(
          (a, b) =>
            new Date(a.due_date || 0).getTime() -
            new Date(b.due_date || 0).getTime(),
        ),
      )
    }

    toast({ title: `Milestone ${isEditing ? 'updated' : 'added'}` })
    setIsMilestoneFormOpen(false)
    setEditingMilestone(null)
  }

  const handleConfirmDeleteMilestone = async () => {
    if (!user || !deletingMilestone) return
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', deletingMilestone.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete milestone.',
        variant: 'destructive',
      })
      return
    }
    setMilestones((prev) => prev.filter((m) => m.id !== deletingMilestone.id))
    toast({ title: 'Milestone deleted', variant: 'destructive' })
    setDeletingMilestone(null)
  }

  const handleCycleStatus = async (milestone: ProjectMilestone) => {
    if (!user) return
    const statuses: MilestoneStatus[] = [
      'todo',
      'in-progress',
      'completed',
      'delayed',
    ]
    const currentIndex = statuses.indexOf(
      (milestone.status as MilestoneStatus) || 'todo',
    )
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]

    const { data, error } = await supabase
      .from('project_milestones')
      .update({ status: nextStatus })
      .eq('id', milestone.id)
      .select()
      .single()

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      })
      return
    }
    setMilestones((prev) => prev.map((m) => (m.id === milestone.id ? data : m)))
  }

  // =====================
  // Render Logic
  // =====================

  if (authLoading || dataLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="bg-card rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          Please sign in to manage your projects.
        </p>
      </div>
    )
  }

  // Special "Get Started" view if there are no projects
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg mt-8">
        <FolderKanban className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Welcome to Your Projects!</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          It looks like you don't have any projects yet. No worries! Create your
          first project to start adding milestones and tracking your progress.
        </p>
        <Button
          className="mt-6"
          onClick={() => {
            setEditingProject(null)
            setIsProjectFormOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Your First Project
        </Button>
        <ProjectFormDialog
          isOpen={isProjectFormOpen}
          onOpenChange={setIsProjectFormOpen}
          onSubmit={handleSaveProject}
          initialData={editingProject}
        />
      </div>
    )
  }

  // Regular view when projects exist
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-secondary rounded-lg">
        <div>
          <h2 className="text-3xl font-bold">Project Milestones</h2>
          <p className="text-muted-foreground mt-1">
            Track progress on your important projects and goals
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingProject(null)
              setIsProjectFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    onClick={() => {
                      setEditingMilestone(null)
                      setIsMilestoneFormOpen(true)
                    }}
                    disabled={projects.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Milestone
                  </Button>
                </span>
              </TooltipTrigger>
              {projects.length === 0 && (
                <TooltipContent>
                  <p>You need to create a project first.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ProjectList
            projects={projects}
            milestones={milestones}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onEdit={(p) => {
              setEditingProject(p)
              setIsProjectFormOpen(true)
            }}
            onDelete={setDeletingProject}
          />
        </div>
        <div className="lg:col-span-3">
          {selectedProjectData ? (
            <ProjectDetails
              project={selectedProjectData}
              milestones={projectMilestones}
              isOverdue={isOverdue}
              onEditMilestone={(m) => {
                setEditingMilestone(m)
                setIsMilestoneFormOpen(true)
              }}
              onDeleteMilestone={setDeletingMilestone}
              onCycleStatus={handleCycleStatus}
            />
          ) : (
            <div className="bg-card rounded-lg p-8 text-center h-full flex flex-col justify-center">
              <p className="text-muted-foreground font-semibold">
                Select a project from the list to see its details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ProjectFormDialog
        isOpen={isProjectFormOpen}
        onOpenChange={setIsProjectFormOpen}
        onSubmit={handleSaveProject}
        initialData={editingProject}
      />
      <MilestoneFormDialog
        isOpen={isMilestoneFormOpen}
        onOpenChange={setIsMilestoneFormOpen}
        onSubmit={handleSaveMilestone}
        initialData={editingMilestone}
        projects={projects}
        defaultProjectId={selectedProject}
      />
      <ConfirmationDialog
        isOpen={!!deletingProject}
        onOpenChange={() => setDeletingProject(null)}
        onConfirm={handleConfirmDeleteProject}
        title="Delete Project"
        description={
          <>
            Are you sure you want to delete{' '}
            <strong>{deletingProject?.title}</strong>? All associated milestones
            will also be deleted. This cannot be undone.
          </>
        }
      />
      <ConfirmationDialog
        isOpen={!!deletingMilestone}
        onOpenChange={() => setDeletingMilestone(null)}
        onConfirm={handleConfirmDeleteMilestone}
        title="Delete Milestone"
        description={
          <>
            Are you sure you want to delete{' '}
            <strong>{deletingMilestone?.title}</strong>? This cannot be undone.
          </>
        }
      />
    </div>
  )
}

export default ProjectsTab
