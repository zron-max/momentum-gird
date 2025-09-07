import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Target,
  Clock8,
  CheckSquare,
  Pencil,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';

// =====================
// Types
// =====================

type DBProject = Tables<'projects'>;
// Add optional 'priority' to support UI even if the column isn't present in DB yet
export type ProjectMilestone = Tables<'project_milestones'> & {
  priority?: 'low' | 'medium' | 'high';
};

export type MilestoneStatus = 'todo' | 'in-progress' | 'completed' | 'delayed';

// =====================
// Component
// =====================

const ProjectsTab: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<DBProject[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  const [selectedProject, setSelectedProject] = useState<string>('');

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    due_date: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const [editingProject, setEditingProject] = useState<DBProject | null>(null);
  const [editProjectData, setEditProjectData] = useState({ title: '', description: '' });

  const [deletingProject, setDeletingProject] = useState<DBProject | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [editMilestoneData, setEditMilestoneData] = useState({
    title: '',
    due_date: '',
    status: 'todo' as MilestoneStatus,
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    project_id: '',
  });

  const [deletingMilestone, setDeletingMilestone] = useState<ProjectMilestone | null>(null);
  const [showDeleteMilestoneModal, setShowDeleteMilestoneModal] = useState(false);

  const [dataLoading, setDataLoading] = useState(true);

  const statusColors: Record<MilestoneStatus, string> = {
    'todo': 'bg-yellow-500',
    'in-progress': 'bg-blue-800',
    'completed': 'bg-green-800',
    'delayed': 'bg-red-800',
  };

  const statusLabels: Record<MilestoneStatus, string> = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'delayed': 'Delayed',
  };

  const priorityBadgeClasses: Record<'low' | 'medium' | 'high', string> = {
    low: 'border-green-450 text-green-600',
    medium: 'border-orange-450 text-yellow-600',
    high: 'border-red-450 text-red-600',
  };

  const priorityBorderClasses: Record<'low' | 'medium' | 'high', string> = {
    high: 'border border-red-500',
    medium: 'border border-purple-500',
    low: 'border border-blue-500',
  };

  // =====================
  // Data Fetching
  // =====================

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      setDataLoading(true);
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        const { data: milestonesData, error: milestonesError } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true });

        if (milestonesError) throw milestonesError;

        setProjects(projectsData || []);
        setMilestones(milestonesData || []);

        if (projectsData && projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        } else {
          setSelectedProject('');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast({ title: 'Error', description: 'Failed to fetch data.', variant: 'destructive' });
      } finally {
        setDataLoading(false);
      }
    };

    if (user) fetchAllData();
  }, [user, toast]);

  // =====================
  // Helpers
  // =====================

  const selectedProjectData = useMemo(
    () => projects.find((p) => p.id === selectedProject),
    [projects, selectedProject]
  );

  const projectMilestones = useMemo(
    () => milestones.filter((m) => m.project_id === selectedProject),
    [milestones, selectedProject]
  );

  const nextUpMilestones = useMemo(() => {
    const safeDate = (d?: string | null) => new Date(d || '9999-12-31');
    return [...milestones]
      .filter((m) => m.status !== 'completed')
      .sort((a, b) => safeDate(a.due_date).getTime() - safeDate(b.due_date).getTime())
      .slice(0, 3);
  }, [milestones]);

  const getProjectProgress = (projectId: string) => {
    const ms = milestones.filter((m) => m.project_id === projectId);
    const completed = ms.filter((m) => m.status === 'completed').length;
    const total = ms.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const isOverdue = (milestone: ProjectMilestone) => {
    if (!milestone.due_date) return false;
    const due = new Date(milestone.due_date);
    const today = new Date();
    // Normalize to ignore time-of-day
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return due < today && milestone.status !== 'completed';
  };

  // =====================
  // Project CRUD
  // =====================

  const addProject = async () => {
    if (!user || !newProject.title.trim()) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: newProject.title.trim(),
        description: newProject.description.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Add project error:', error);
      toast({ title: 'Error', description: 'Failed to add project', variant: 'destructive' });
      return;
    }

    setProjects((prev) => [data, ...prev]);
    setNewProject({ title: '', description: '' });
    setIsAddingProject(false);
    setSelectedProject(data.id);
    toast({ title: 'Project added', description: 'Project has been created.' });
  };

  const handleEditProject = (project: DBProject) => {
    setEditingProject(project);
    setEditProjectData({ title: project.title, description: project.description || '' });
  };

  const saveEditProject = async () => {
    if (!user || !editingProject) return;
    const { data, error } = await supabase
      .from('projects')
      .update({
        title: editProjectData.title.trim(),
        description: editProjectData.description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingProject.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Edit project error:', error);
      toast({ title: 'Error', description: 'Failed to update project', variant: 'destructive' });
      return;
    }

    setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? data : p)));
    setEditingProject(null);
    toast({ title: 'Project updated', description: 'Project details have been updated.' });
  };

  const handleDeleteProject = (project: DBProject) => {
    setDeletingProject(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!user || !deletingProject) return;

    // Delete milestones first to avoid FK constraint issues
    await supabase.from('project_milestones').delete().eq('project_id', deletingProject.id);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', deletingProject.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete project error:', error);
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
    setMilestones((prev) => prev.filter((m) => m.project_id !== deletingProject.id));
    setShowDeleteModal(false);
    toast({ title: 'Project deleted', description: `Project '${deletingProject.title}' has been deleted.`, variant: 'destructive' });

    // Update selection
    setSelectedProject((cur) => {
      if (cur !== deletingProject.id) return cur;
      const remaining = projects.filter((p) => p.id !== deletingProject.id);
      return remaining[0]?.id || '';
    });

    setDeletingProject(null);
  };

  // =====================
  // Milestone CRUD
  // =====================

  const addMilestone = async () => {
    if (!user || !newMilestone.title.trim() || !selectedProject) return;

    const { data, error } = await supabase
      .from('project_milestones')
      .insert({
        user_id: user.id,
        project_id: selectedProject,
        title: newMilestone.title.trim(),
        due_date: newMilestone.due_date || null,
        status: 'todo',
        description: newMilestone.description.trim() || null,
        priority: newMilestone.priority,
      })
      .select()
      .single();

    if (error) {
      console.error('Add milestone error:', error);
      toast({ title: 'Error', description: 'Failed to add milestone', variant: 'destructive' });
      return;
    }

    setMilestones((prev) => [data, ...prev]);
    setNewMilestone({ title: '', due_date: '', description: '', priority: 'medium' });
    setIsAddingMilestone(false);
    toast({ title: 'Milestone added', description: 'Milestone has been created.' });
  };

  const handleEditMilestone = (milestone: ProjectMilestone) => {
    setEditingMilestone(milestone);
    setEditMilestoneData({
      title: milestone.title,
      due_date: milestone.due_date || '',
      status: (milestone.status as MilestoneStatus) || 'todo',
      description: milestone.description || '',
      priority: milestone.priority || 'medium',
      project_id: milestone.project_id,
    });
  };

  const saveEditMilestone = async () => {
    if (!user || !editingMilestone) return;

    const { data, error } = await supabase
      .from('project_milestones')
      .update({
        title: editMilestoneData.title.trim(),
        due_date: editMilestoneData.due_date || null,
        status: editMilestoneData.status,
        description: editMilestoneData.description.trim() || null,
        priority: editMilestoneData.priority,
        project_id: editMilestoneData.project_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingMilestone.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Edit milestone error:', error);
      toast({ title: 'Error', description: 'Failed to update milestone', variant: 'destructive' });
      return;
    }

    setMilestones((prev) => prev.map((m) => (m.id === editingMilestone.id ? data : m)));
    setEditingMilestone(null);
    toast({ title: 'Milestone updated', description: 'Milestone details have been updated.' });
  };

  const handleDeleteMilestone = (milestone: ProjectMilestone) => {
    setDeletingMilestone(milestone);
    setShowDeleteMilestoneModal(true);
  };

  const confirmDeleteMilestone = async () => {
    if (!user || !deletingMilestone) return;

    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', deletingMilestone.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete milestone error:', error);
      toast({ title: 'Error', description: 'Failed to delete milestone', variant: 'destructive' });
      return;
    }

    setMilestones((prev) => prev.filter((m) => m.id !== deletingMilestone.id));
    setShowDeleteMilestoneModal(false);
    toast({ title: 'Milestone deleted', description: `Milestone '${deletingMilestone.title}' has been deleted.`, variant: 'destructive' });
    setDeletingMilestone(null);
  };

  // Quick status cycle
  const cycleStatus = async (milestone: ProjectMilestone) => {
    if (!user) return;
    const statuses: MilestoneStatus[] = ['todo', 'in-progress', 'completed', 'delayed'];
    const currentIndex = statuses.indexOf((milestone.status as MilestoneStatus) || 'todo');
    const next = statuses[(currentIndex + 1) % statuses.length] || 'todo';

    const { data, error } = await supabase
      .from('project_milestones')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', milestone.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Toggle status error:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      return;
    }

    setMilestones((prev) => prev.map((m) => (m.id === milestone.id ? data : m)));
  };

  // =====================
  // UI
  // =====================

  if (isLoading || dataLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-card rounded-lg p-8 text-center border-border shadow-sm">
        <p className="text-muted-foreground">Please sign in to manage your projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-bold text-foreground truncate">Project Milestones</h2>
          <p className="text-muted-foreground mt-1 break-words">
            Track progress on your important projects and goals
          </p>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          {/* Add Project Dialog */}
          <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
            <DialogTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Project name..."
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
                <Input
                  placeholder="Project description..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingProject(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addProject} disabled={!user || !newProject.title.trim()}>
                    Add Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Milestone Dialog */}
          <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Milestone title..."
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                />
                <Input
                  type="date"
                  value={newMilestone.due_date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)..."
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                />
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={newMilestone.priority}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, priority: e.target.value as 'low' | 'medium' | 'high' })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingMilestone(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addMilestone} disabled={!user || !newMilestone.title.trim()}>
                    Add Milestone
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-1 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="break-words">No projects yet. Add your first project to get started! Tip: Create a project and then add milestones to it. Manage your tasks effectively.
                  </p>
                </div>
              ) : (
                projects.map((project) => {
                  const progress = getProjectProgress(project.id);
                  return (
                    <div
                      key={project.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 min-w-0 ${
                        selectedProject === project.id ? 'border-purple-500 bg-card' : 'border-border hover:border-muted'
                      }`}
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div className="flex items-start justify-between min-w-0">
                        <div className="flex-1 space-y-1 min-w-0 pr-2">
                          <span className="font-medium text-sm text-foreground block truncate" title={project.title}>
                            {project.title}
                          </span>
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words" title={project.description || ''}>
                            {project.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {milestones.filter((m) => m.project_id === project.id).length} milestones
                          </div>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <button
                            className="p-1 rounded-full hover:bg-muted flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-1 rounded-full hover:bg-muted flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-muted-foreground mt-1 block">{Math.round(progress)}% Complete</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Details & Milestones */}
        <div className="lg:col-span-3 min-w-0">
          {selectedProjectData ? (
            <div className="space-y-6">
              {/* Next Up */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="w-5 h-5 mr-2 text-pink-500 flex-shrink-0" />
                    Next Up
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nextUpMilestones.length > 0 ? (
                    nextUpMilestones.map((m) => {
                      const project = projects.find((p) => p.id === m.project_id);
                      const prio = (m.priority || 'medium') as 'low' | 'medium' | 'high';
                      const overdue = isOverdue(m);
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between p-3 rounded-lg bg-secondary min-w-0 cursor-pointer hover:bg-secondary/80 transition-colors ${priorityBorderClasses[prio]}`}
                          onClick={() => handleEditMilestone(m)}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${overdue ? 'bg-red-500' : 'bg-purple-500'}`} />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-foreground block truncate" title={m.title}>
                                {m.title}
                              </span>
                              <div
                                className="text-xs text-muted-foreground truncate"
                                title={`${project?.title || ''} - Due: ${m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A'}`}
                              >
                                {project?.title} - Due: {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className={priorityBadgeClasses[prio]}>
                              {prio.toUpperCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${overdue ? 'border-red-500 text-red-500' : 'border-purple-500 text-purple-500'} cursor-default`}
                            >
                              {overdue ? 'OVERDUE' : 'UPCOMING'}
                            </Badge>
                            <button
                              className="p-1 rounded-full hover:bg-muted flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMilestone(m);
                              }}
                              title="Edit Milestone"
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </button>
                            <button
                              className="p-1 rounded-full hover:bg-muted flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMilestone(m);
                              }}
                              title="Delete Milestone"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted-foreground py-4">No upcoming milestones.</div>
                  )}
                </CardContent>
              </Card>

              {/* Current Project Details */}
              <Card className="shadow-sm">
                <CardHeader className="min-w-0">
                  <CardTitle className="text-lg min-w-0">
                    <span className="font-semibold text-foreground block truncate" title={selectedProjectData.title}>
                      {selectedProjectData.title}
                    </span>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm break-words" title={selectedProjectData.description || ''}>
                    {selectedProjectData.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectMilestones.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">No milestones for this project.</div>
                    ) : (
                      projectMilestones.map((m) => {
                        const complete = m.status === 'completed';
                        const overdue = isOverdue(m);
                        const prio = (m.priority || 'medium') as 'low' | 'medium' | 'high';
                        return (
                          <div key={m.id} className={`flex items-center justify-between p-3 bg-secondary rounded-lg min-w-0 cursor-pointer hover:bg-secondary/80 transition-colors ${priorityBorderClasses[prio]}`}
                          onClick={() => handleEditMilestone(m)}>
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              {complete ? (
                                <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" />
                              ) : overdue ? (
                                <Clock8 className="w-5 h-5 text-red-500 flex-shrink-0" />
                              ) : (
                                <Target className="w-5 h-5 text-purple-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-sm font-medium block truncate ${complete ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                  title={m.title}
                                >
                                  {m.title}
                                </span>
                                <div className="text-xs text-muted-foreground truncate">
                                  {complete ? 'Completed' : overdue ? 'Overdue' : 'Due'}: {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className={`text-xs whitespace-nowrap ${priorityBadgeClasses[prio]}`}>
                                {prio.toUpperCase()}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={`text-xs whitespace-nowrap ${statusColors[m.status as MilestoneStatus as keyof typeof statusColors]} text-white cursor-pointer`}
                                onClick={(e) => { e.stopPropagation(); cycleStatus(m); }}
                                title="Click to cycle status"
                              >
                                {statusLabels[m.status as MilestoneStatus as keyof typeof statusLabels]}
                              </Badge> 
                              <button className="p-1 rounded-full hover:bg-muted flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleEditMilestone(m); }} title="Edit Milestone">
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button className="p-1 rounded-full hover:bg-muted flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteMilestone(m); }} title="Delete Milestone">
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="bg-card rounded-lg p-8 text-center border-border shadow-sm">
              <p className="text-muted-foreground">Select a project to view its milestones.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => { if (!open) setEditingProject(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Project name..."
              value={editProjectData.title}
              onChange={(e) => setEditProjectData({ ...editProjectData, title: e.target.value })}
            />
            <Input
              placeholder="Project description..."
              value={editProjectData.description}
              onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditProject} disabled={!editProjectData.title.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base text-foreground break-words">
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-destructive break-words">{deletingProject?.title}</strong>? All
              associated milestones will also be deleted. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProject}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Milestone Dialog */}
      <Dialog open={!!editingMilestone} onOpenChange={(open) => { if (!open) setEditingMilestone(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Milestone Title</label>
              <Input
                placeholder="Milestone title..."
                value={editMilestoneData.title}
                onChange={(e) => setEditMilestoneData({ ...editMilestoneData, title: e.target.value })}
              /></div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={editMilestoneData.due_date}
                onChange={(e) => setEditMilestoneData({ ...editMilestoneData, due_date: e.target.value })}
              /></div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Description (optional)..."
                value={editMilestoneData.description}
                onChange={(e) => setEditMilestoneData({ ...editMilestoneData, description: e.target.value })}
              /></div>

            <div>
              <label className="text-sm font-medium">Project</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={editMilestoneData.project_id}
                onChange={(e) => setEditMilestoneData({ ...editMilestoneData, project_id: e.target.value })}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={editMilestoneData.status}
                onChange={(e) => setEditMilestoneData({ ...editMilestoneData, status: e.target.value as MilestoneStatus })}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={editMilestoneData.priority}
                onChange={(e) => setEditMilestoneData({ ...editMilestoneData, priority: e.target.value as 'low' | 'medium' | 'high' })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingMilestone(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditMilestone} disabled={!editMilestoneData.title.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Milestone Confirmation Dialog */}
      <Dialog open={showDeleteMilestoneModal} onOpenChange={setShowDeleteMilestoneModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base text-foreground">
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-destructive">{deletingMilestone?.title}</strong>? This action cannot be
              undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteMilestoneModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMilestone}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsTab;
