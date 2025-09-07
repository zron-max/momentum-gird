import { useEffect, useState } from 'react';
import { Plus, CheckCircle, Edit2, Trash2, Trophy } from 'lucide-react';
import CalendarView from './CalendarView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Tables } from '@/integrations/supabase/types';

interface Routine extends Tables<'routines'> {
  tasks: string[];
}

interface RoutineEntry extends Tables<'routine_entries'> {
  completed_tasks: string[];
}

const RoutinesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineEntries, setRoutineEntries] = useState<RoutineEntry[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<string>('');
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);
  const [newRoutine, setNewRoutine] = useState({ title: '', tasks: [''] });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New states for CRUD functionality
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<Routine | null>(null);
  const [isDeletingRoutine, setIsDeletingRoutine] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

  // Fetch routines and entries on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const { data: routinesData, error: routinesError } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (routinesError) throw routinesError;

        const { data: entriesData, error: entriesError } = await supabase
          .from('routine_entries')
          .select('*')
          .eq('user_id', user.id);

        if (entriesError) throw entriesError;

        const routinesWithTasks = (routinesData || []).map(r => ({ ...r, tasks: r.tasks || [] }));
        const entriesWithTasks = (entriesData || []).map(e => ({ ...e, completed_tasks: e.completed_tasks || [] }));
        
        setRoutines(routinesWithTasks as Routine[]);
        setRoutineEntries(entriesWithTasks as RoutineEntry[]);

        if (routinesWithTasks.length > 0) {
          setSelectedRoutine(routinesWithTasks[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast({
          title: "Error",
          description: "Failed to fetch routines and entries",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [user]);

  // Handle selected routine change
  useEffect(() => {
    if (routines.length > 0 && !selectedRoutine) {
      setSelectedRoutine(routines[0].id);
    }
  }, [routines, selectedRoutine]);
  
  // Calculate streaks
  const calculateStreaks = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return { currentStreak: 0 };
    
    const completedDates = routineEntries
        .filter(e => e.routine_id === routineId && e.completed_tasks.length === routine.tasks.length)
        .map(e => e.date)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    if (completedDates.length === 0) return { currentStreak: 0 };
    
    let currentStreak = 0;
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const latestCompleted = completedDates[completedDates.length - 1];

    // Check if the latest completed date is today or yesterday to start the streak
    if (latestCompleted === todayString) {
        currentStreak = 1;
    } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        if (latestCompleted === yesterdayString) {
            currentStreak = 1;
        } else {
            return { currentStreak: 0 };
        }
    }

    // Iterate backwards from the second to last completed date
    for (let i = completedDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(completedDates[i]);
        const nextDate = new Date(completedDates[i + 1]);
        const diffInMs = nextDate.getTime() - currentDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays === 1) {
            currentStreak++;
        } else {
            break;
        }
    }
    return { currentStreak };
  };

  const addRoutine = async () => {
    if (!user || !newRoutine.title.trim() || !newRoutine.tasks.some(t => t.trim())) return;
    const tasks = newRoutine.tasks.filter(t => t.trim());

    try {
      const { data, error } = await supabase
        .from('routines')
        .insert({
          title: newRoutine.title.trim(),
          tasks: tasks,
          user_id: user.id,
          color: 'bg-orange-500',
        })
        .select()
        .single();

      if (error) throw error;

      setRoutines([data, ...routines]);
      setNewRoutine({ title: '', tasks: [''] });
      setIsAddingRoutine(false);

      toast({
        title: "Success",
        description: "Routine added successfully",
      });
    } catch (error) {
      console.error('Error adding routine:', error);
      toast({
        title: "Error",
        description: "Failed to add routine",
        variant: "destructive",
      });
    }
  };

  const updateRoutine = async () => {
    if (!user || !routineToEdit || !routineToEdit.title.trim() || !routineToEdit.tasks.some(t => t.trim())) return;
    const tasks = routineToEdit.tasks.filter(t => t.trim());

    try {
      const { data, error } = await supabase
        .from('routines')
        .update({
          title: routineToEdit.title.trim(),
          tasks: tasks,
        })
        .eq('id', routineToEdit.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setRoutines(routines.map(r => r.id === data.id ? data : r));
      setRoutineToEdit(null);
      setIsEditingRoutine(false);

      toast({
        title: "Success",
        description: "Routine updated successfully.",
      });
    } catch (err) {
      console.error('Error updating routine:', err);
      toast({
        title: "Error",
        description: "Failed to update routine.",
        variant: "destructive",
      });
    }
  };

  const deleteRoutine = async () => {
    if (!user || !routineToDelete) return;
    const routineId = routineToDelete.id;

    try {
      const { error: entriesError } = await supabase
        .from('routine_entries')
        .delete()
        .eq('routine_id', routineId)
        .eq('user_id', user.id);

      if (entriesError) throw entriesError;

      const { error: routineError } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId)
        .eq('user_id', user.id);

      if (routineError) throw routineError;

      setRoutines(routines.filter(r => r.id !== routineId));
      setRoutineEntries(routineEntries.filter(e => e.routine_id !== routineId));
      if (selectedRoutine === routineId) {
        setSelectedRoutine(routines.find(r => r.id !== routineId)?.id || '');
      }

      toast({
        title: "Success",
        description: "Routine and all entries deleted successfully.",
      });
      setIsDeletingRoutine(false);
      setRoutineToDelete(null);
    } catch (err) {
      console.error('Error deleting routine:', err);
      toast({
        title: "Error",
        description: "Failed to delete routine.",
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (task: string) => {
    if (!user || !selectedDate || !selectedRoutine) return;

    const dateString = selectedDate.toISOString().split('T')[0];
    let entry = routineEntries.find(e => e.date === dateString && e.routine_id === selectedRoutine);

    let updatedTasks = entry
      ? entry.completed_tasks.includes(task)
        ? entry.completed_tasks.filter(t => t !== task)
        : [...entry.completed_tasks, task]
      : [task];

    try {
      if (entry) {
        const { error } = await supabase
          .from('routine_entries')
          .update({ completed_tasks: updatedTasks })
          .eq('id', entry.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setRoutineEntries(routineEntries.map(e =>
          e.id === entry.id ? { ...e, completed_tasks: updatedTasks } : e
        ));
      } else {
        const { data, error } = await supabase
          .from('routine_entries')
          .insert({
            routine_id: selectedRoutine,
            date: dateString,
            completed_tasks: [task],
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setRoutineEntries([...routineEntries, data]);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive",
      });
    }
  };

  const addTask = () => {
    setNewRoutine({ ...newRoutine, tasks: [...newRoutine.tasks, ''] });
  };

  const updateTask = (index: number, value: string) => {
    const updatedTasks = [...newRoutine.tasks];
    updatedTasks[index] = value;
    setNewRoutine({ ...newRoutine, tasks: updatedTasks });
  };

  const removeTask = (index: number) => {
    if (newRoutine.tasks.length > 1) {
      const updatedTasks = newRoutine.tasks.filter((_, i) => i !== index);
      setNewRoutine({ ...newRoutine, tasks: updatedTasks });
    }
  };

  const addTaskToEdit = () => {
    if (routineToEdit) {
      setRoutineToEdit({ ...routineToEdit, tasks: [...routineToEdit.tasks, ''] });
    }
  };

  const updateTaskInEdit = (index: number, value: string) => {
    if (routineToEdit) {
      const updatedTasks = [...routineToEdit.tasks];
      updatedTasks[index] = value;
      setRoutineToEdit({ ...routineToEdit, tasks: updatedTasks });
    }
  };

  const removeTaskFromEdit = (index: number) => {
    if (routineToEdit && routineToEdit.tasks.length > 1) {
      const updatedTasks = routineToEdit.tasks.filter((_, i) => i !== index);
      setRoutineToEdit({ ...routineToEdit, tasks: updatedTasks });
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const getDayStatus = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const entry = routineEntries.find(
      e => e.routine_id === selectedRoutine && e.date === dateString
    );
    if (!entry) return undefined;
    const selectedRoutineData = routines.find(r => r.id === selectedRoutine);
    if (!selectedRoutineData) return undefined;
    const completionRate = entry.completed_tasks.length / selectedRoutineData.tasks.length;
    if (completionRate === 1) return 'complete';
    if (completionRate > 0) return 'partial';
    return 'incomplete';
  };

  const getSelectedDateEntry = () => {
    if (!selectedDate || !selectedRoutine) return null;
    const dateString = selectedDate.toISOString().split('T')[0];
    return routineEntries.find(
      e => e.routine_id === selectedRoutine && e.date === dateString
    );
  };

  const selectedRoutineData = routines.find(r => r.id === selectedRoutine);
  const selectedDateEntry = getSelectedDateEntry();
  const isTodayComplete = selectedRoutineData && routineEntries.find(
    e => e.routine_id === selectedRoutine && e.date === new Date().toISOString().split('T')[0] && e.completed_tasks.length === selectedRoutineData.tasks.length
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white-900">Daily Routine Tracking</h2>
          <p className="text-gray-600 mt-1">Track your daily routines and build consistent habits</p>
        </div>
        
        <Dialog open={isAddingRoutine} onOpenChange={setIsAddingRoutine}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Routine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Routine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Routine name..."
                value={newRoutine.title}
                onChange={(e) => setNewRoutine({ ...newRoutine, title: e.target.value })}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
                {newRoutine.tasks.map((task, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      placeholder={`Task ${index + 1}...`}
                      value={task}
                      onChange={(e) => updateTask(index, e.target.value)}
                    />
                    {newRoutine.tasks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTask(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                  className="mt-2"
                >
                  + Add Task
                </Button>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingRoutine(false)}>
                  Cancel
                </Button>
                <Button onClick={addRoutine}>Add Routine</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Routines List */}
        <div className="lg:col-span-1">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg dark:text-gray-100">Your Routines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {routines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <p>No routines yet. Create your first routine to get started!</p>
                </div>
              ) : (
                routines.map((routine) => (
                  <div
                    key={routine.id}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${selectedRoutine === routine.id 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      }
                    `}
                    onClick={() => setSelectedRoutine(routine.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${routine.color}`} />
                          <span className="font-medium text-sm dark:text-gray-100">{routine.title}</span>
                          {routineEntries.find(e => e.routine_id === routine.id && e.date === new Date().toISOString().split('T')[0] && e.completed_tasks.length === routine.tasks.length) && (
                            <span className="ml-2 text-green-500">
                              <Trophy className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-300">
                            <span>{routine.tasks.length} tasks</span>
                            <div className="flex items-center space-x-1">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                <span>{calculateStreaks(routine.id).currentStreak} day streak</span>
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                setRoutineToEdit(routine);
                                setIsEditingRoutine(true);
                            }}
                            className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                setRoutineToDelete(routine);
                                setIsDeletingRoutine(true);
                            }}
                            className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Routine Dialog */}
        {routineToEdit && (
            <Dialog open={isEditingRoutine} onOpenChange={setIsEditingRoutine}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Routine</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Routine name..."
                            value={routineToEdit.title}
                            onChange={(e) => setRoutineToEdit({ ...routineToEdit, title: e.target.value })}
                        />
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
                            {routineToEdit.tasks.map((task, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-2">
                                    <Input
                                        placeholder={`Task ${index + 1}...`}
                                        value={task}
                                        onChange={(e) => updateTaskInEdit(index, e.target.value)}
                                    />
                                    {routineToEdit.tasks.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeTaskFromEdit(index)}
                                        >
                                            ×
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTaskToEdit}
                                className="mt-2"
                            >
                                + Add Task
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditingRoutine(false)}>
                            Cancel
                        </Button>
                        <Button onClick={updateRoutine}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}

        {/* Delete Routine Confirmation Dialog */}
        <Dialog open={isDeletingRoutine} onOpenChange={setIsDeletingRoutine}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p>Are you sure you want to delete the routine "<strong>{routineToDelete?.title}</strong>"? This will permanently remove the routine and all of its associated entries. This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsDeletingRoutine(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteRoutine}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Calendar and Task Details */}
        <div className="lg:col-span-3">
          {selectedRoutineData ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">
                  {selectedRoutineData.title}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-200">
                  <span>
                    {selectedRoutineData.tasks.length} tasks
                  </span>
                  <div className="flex items-center space-x-1">
                      <Trophy className="w-3 h-3 text-yellow-500" />
                      <span>{calculateStreaks(selectedRoutineData.id).currentStreak} day streak</span>
                  </div>
                </div>
                <div className="border-t dark:border-gray-700 pt-4 mt-4">
                  <h4 className="font-medium text-sm mb-3 dark:text-gray-200">
                    Tasks for {selectedDate ? selectedDate.toLocaleDateString() : 'Today'}
                  </h4>
                  {selectedDate && (
                    <div className="space-y-2">
                      {selectedRoutineData.tasks.map((task, index) => {
                        const isCompleted = selectedDateEntry?.completed_tasks.includes(task) || false;
                        return (
                          <div key={index} className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleTask(task)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isCompleted 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
                              }`}
                            >
                              {isCompleted && <CheckCircle className="w-3 h-3" />}
                            </button>
                            <span className={`text-sm ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-gray-100'}`}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <CalendarView
                onDayClick={handleDayClick}
                getDayStatus={getDayStatus}
                statusColors={{
                  complete: 'bg-green-500',
                  incomplete: 'bg-red-500',
                  partial: 'bg-yellow-500'
                }}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center border dark:border-gray-700">
              <p className="text-muted-foreground dark:text-gray-400">Select a routine to start tracking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutinesTab;