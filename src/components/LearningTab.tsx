import { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, Target, Trash2, Pencil } from 'lucide-react';
import CalendarView from './CalendarView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type LearningGoal = Tables<'learning_goals'>;
type LearningEntry = Tables<'learning_entries'>;

interface LearningGoalWithProgress extends LearningGoal {
  current: number;
  progressPercentage: number;
}

const LearningTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [goals, setGoals] = useState<LearningGoalWithProgress[]>([]);
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_value: 100,
    unit: 'pages'
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch goals and entries when user changes
  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchEntries();
    } else {
      setGoals([]);
      setEntries([]);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Keep a selected goal if none
  useEffect(() => {
    if (!selectedGoal && goals.length > 0) {
      setSelectedGoal(goals[0].id as string);
    }
  }, [goals, selectedGoal]);

  // ====== FETCHING ======
  const fetchGoals = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const goalsData = (data || []) as LearningGoal[];

      // For each goal, compute current sum from entries and percentage using its target_value
      const goalsWithProgress = await Promise.all(
        goalsData.map(async (goal) => {
          const { current, percentage } = await calculateGoalProgress(goal.id as string, Number(goal.target_value || 0));
          return {
            ...goal,
            current,
            progressPercentage: percentage
          } as LearningGoalWithProgress;
        })
      );

      setGoals(goalsWithProgress);
      // if no selectedGoal, pick first
      if (!selectedGoal && goalsWithProgress.length > 0) {
        setSelectedGoal(goalsWithProgress[0].id as string);
      }
    } catch (err) {
      console.error('Error fetching learning goals:', err);
      toast?.({
        title: "Error",
        description: "Failed to fetch learning goals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntries = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('learning_entries')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setEntries((data || []) as LearningEntry[]);
    } catch (err) {
      console.error('Error fetching learning entries:', err);
    }
  };

  /**
   * Calculate the sum of entries for a goal and percentage vs provided targetValue.
   * This function does NOT rely on `goals` state to avoid stale state issues.
   */
  const calculateGoalProgress = async (goalId: string, targetValue: number) : Promise<{ current: number; percentage: number }> => {
    try {
      const { data, error } = await supabase
        .from('learning_entries')
        .select('value')
        .eq('goal_id', goalId)
        .eq('user_id', user?.id);

      if (error) {
        console.warn('calculateGoalProgress: error reading entries', error);
        return { current: 0, percentage: 0 };
      }

      const rows = (data || []) as Array<{ value?: number }>;
      const current = rows.reduce((sum, r) => sum + (Number(r?.value) || 0), 0);

      const safeTarget = Number(targetValue) || 0;
      const percentage = safeTarget > 0 ? Math.min(100, Math.round((current / safeTarget) * 100)) : 0;

      return { current, percentage };
    } catch (err) {
      console.error('Error calculating goal progress:', err);
      return { current: 0, percentage: 0 };
    }
  };

  // ====== GOAL CRUD / ENTRIES ======
  const addGoal = async () => {
    if (!user || !newGoal.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .insert({
          title: newGoal.title.trim(),
          target_value: Number(newGoal.target_value) || 100,
          unit: newGoal.unit,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // compute progress for the new goal (should be zero)
      const g = data as LearningGoal;
      const newGoalWithProgress: LearningGoalWithProgress = {
        ...(g as any),
        current: 0,
        progressPercentage: 0
      };

      setGoals(prev => [newGoalWithProgress, ...prev]);
      // select newly created goal automatically
      setSelectedGoal((g.id as string) || '');
      setNewGoal({ title: '', target_value: 100, unit: 'pages' });
      setIsAddingGoal(false);

      toast?.({ title: "Success", description: "Learning goal added successfully" });
    } catch (err) {
      console.error('Error adding learning goal:', err);
      toast?.({
        title: "Error",
        description: "Failed to add learning goal",
        variant: "destructive",
      });
    }
  };

  const updateGoal = async () => {
    if (!user || !editingGoal || !editingGoal.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('learning_goals')
        .update({
          title: editingGoal.title.trim(),
          target_value: Number(editingGoal.target_value) || 0,
          unit: editingGoal.unit,
        })
        .eq('id', editingGoal.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update the state with the new goal data. Recompute progress for the updated goal.
      const updated = data as LearningGoal;
      const { current, percentage } = await calculateGoalProgress(updated.id as string, Number(updated.target_value || 0));

      setGoals(prev => prev.map(goal =>
        goal.id === updated.id
          ? { ...goal, ...updated, current, progressPercentage: percentage }
          : goal
      ));
      setIsEditingGoal(false);
      setEditingGoal(null);

      toast?.({ title: "Success", description: "Learning goal updated successfully." });
    } catch (err) {
      console.error('Error updating learning goal:', err);
      toast?.({ title: "Error", description: "Failed to update learning goal.", variant: "destructive" });
    }
  };

  const addEntry = async () => {
    if (!user || !selectedDate || !entryAmount || !selectedGoal) return;

    try {
      const amount = parseInt(entryAmount, 10);
      if (Number.isNaN(amount)) {
        toast?.({ title: "Invalid input", description: "Entry amount must be a number." });
        return;
      }

      const dateString = selectedDate.toISOString().split('T')[0];

      const existingEntry = (entries || []).find(
        e => String(e.goal_id) === String(selectedGoal) && e.date === dateString
      );

      if (existingEntry && existingEntry.id) {
        // Update existing entry
        const { error } = await supabase
          .from('learning_entries')
          .update({
            value: amount,
            notes: entryNotes || null
          })
          .eq('id', existingEntry.id);

        if (error) throw error;

        setEntries(prev => prev.map(e => e.id === existingEntry.id ? { ...e, value: amount, notes: entryNotes || null } : e));
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('learning_entries')
          .insert({
            goal_id: selectedGoal,
            user_id: user.id,
            date: dateString,
            value: amount,
            notes: entryNotes || null,
          })
          .select()
          .single();

        if (error) throw error;

        setEntries(prev => [...prev, data as LearningEntry]);
      }

      // Refresh goals to update progress using DB-accurate sums
      await fetchGoals();

      setSelectedDate(null);
      setEntryAmount('');
      setEntryNotes('');

      toast?.({ title: "Success", description: "Learning entry saved successfully" });
    } catch (err) {
      console.error('Error saving learning entry:', err);
      toast?.({ title: "Error", description: "Failed to save learning entry", variant: "destructive" });
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      // Delete all entries related to the goal first
      const { error: entriesError } = await supabase
        .from('learning_entries')
        .delete()
        .eq('goal_id', goalId)
        .eq('user_id', user.id);

      if (entriesError) throw entriesError;

      // Then, delete the goal itself
      const { error: goalError } = await supabase
        .from('learning_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (goalError) throw goalError;

      // Update state to remove the deleted goal and entries
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      setEntries(prev => prev.filter(entry => String(entry.goal_id) !== String(goalId)));

      // If the deleted goal was the selected one, deselect or switch to first
      setSelectedGoal(prevSel => {
        if (String(prevSel) === String(goalId)) {
          const remaining = goals.filter(g => String(g.id) !== String(goalId));
          return remaining.length ? String(remaining[0].id) : '';
        }
        return prevSel;
      });

      toast?.({ title: "Success", description: "Learning goal and all entries deleted successfully." });
      setIsDeletingGoal(false);
    } catch (err) {
      console.error('Error deleting learning goal:', err);
      toast?.({ title: "Error", description: "Failed to delete learning goal.", variant: "destructive" });
    }
  };

  // ====== Calendar helpers ======
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    const existingEntry = entries.find(
      e => String(e.goal_id) === String(selectedGoal) && e.date === dateString
    );

    if (existingEntry) {
      setEntryAmount(existingEntry.value?.toString() || '');
      setEntryNotes(existingEntry.notes || '');
    } else {
      setEntryAmount('');
      setEntryNotes('');
    }
  };

  const getDayStatus = (date: Date): 'complete' | 'incomplete' | 'partial' | undefined => {
    const dateString = date.toISOString().split('T')[0];
    const entry = entries.find(e => String(e.goal_id) === String(selectedGoal) && e.date === dateString);
    return entry ? 'complete' : undefined;
  };

  const selectedGoalData = goals.find(g => String(g.id) === String(selectedGoal));

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Learning Goals</h2>
          <p className="text-muted-foreground mt-1">Track your learning progress and achieve your educational goals</p>
        </div>

        <div className="flex space-x-2">
          {/* Add Goal Dialog */}
          <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Learning Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Goal Title</label>
                  <Input
                    placeholder="e.g., Read 'The Pragmatic Programmer'"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Target Value</label>
                    <Input
                      type="number"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({ ...newGoal, target_value: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    >
                      <option value="pages">Pages</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="chapters">Chapters</option>
                      <option value="sessions">Sessions</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addGoal}>Add Goal</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Goal Dialog */}
          {selectedGoalData && (
            <Dialog open={isDeletingGoal} onOpenChange={setIsDeletingGoal}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Are you sure you want to delete the goal "<strong>{selectedGoalData.title}</strong>"? This will permanently remove the goal and all of its associated entries. This action cannot be undone.</p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDeletingGoal(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteGoal(String(selectedGoalData.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-1">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg dark:text-gray-100">Your Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <p>No learning goals yet. Create your first goal to get started!</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div
                    key={String(goal.id)}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${selectedGoal === String(goal.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      }
                    `}
                    onClick={() => setSelectedGoal(String(goal.id))}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-sm dark:text-gray-100">{goal.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGoal(goal as any);
                            setIsEditingGoal(true);
                          }}
                          className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>{goal.current} / {goal.target_value} {goal.unit}</span>
                          <span>{Math.round(goal.progressPercentage)}%</span>
                        </div>
                        <Progress value={Math.min(100, Math.max(0, Math.round(goal.progressPercentage)))} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Update Goal Dialog */}
        {editingGoal && (
          <Dialog open={isEditingGoal} onOpenChange={setIsEditingGoal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Learning Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Goal Title</label>
                  <Input
                    placeholder="e.g., Read 'The Pragmatic Programmer'"
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Target Value</label>
                    <Input
                      type="number"
                      value={Number(editingGoal.target_value)}
                      onChange={(e) => setEditingGoal({ ...editingGoal, target_value: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={editingGoal.unit}
                      onChange={(e) => setEditingGoal({ ...editingGoal, unit: e.target.value })}
                    >
                      <option value="pages">Pages</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="chapters">Chapters</option>
                      <option value="sessions">Sessions</option>
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditingGoal(false)}>
                  Cancel
                </Button>
                <Button onClick={updateGoal}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Calendar and Entry Form */}
        <div className="lg:col-span-3">
          {selectedGoalData ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">
                  Tracking: {selectedGoalData.title}
                </h3>
                <div className="flex items-center space-x-6 text-sm dark:text-gray-200">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span>Progress: <strong>{selectedGoalData.current} / {selectedGoalData.target_value} {selectedGoalData.unit}</strong></span>
                  </div>
                  <div>
                    <span>Completion: <strong>{Math.round(selectedGoalData.progressPercentage)}%</strong></span>
                  </div>
                </div>
                <Progress value={Math.min(100, Math.max(0, Math.round(selectedGoalData.progressPercentage)))} className="h-2 mt-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CalendarView
                  onDayClick={handleDayClick}
                  getDayStatus={getDayStatus}
                  statusColors={{
                    complete: 'bg-green-500',
                    incomplete: 'bg-red-500',
                    partial: 'bg-yellow-500'
                  }}
                />
                {/* Entry Form */}
                {selectedDate && (
                  <Card className="dark:bg-gray-900 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-gray-100">Add Entry for {selectedDate.toLocaleDateString()}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium dark:text-gray-200">Amount ({selectedGoalData.unit})</label>
                        <Input
                          type="number"
                          placeholder="Enter amount..."
                          value={entryAmount}
                          onChange={(e) => setEntryAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium dark:text-gray-200">Notes (optional)</label>
                        <Input
                          placeholder="Note: How do you feel?..."
                          value={entryNotes}
                          onChange={(e) => setEntryNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={addEntry} className="flex-1">
                          Save Entry
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedDate(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center border dark:border-gray-700">
              <p className="text-muted-foreground dark:text-gray-400">Select a learning goal to start tracking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningTab;
