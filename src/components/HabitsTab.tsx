import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Flame, AlignCenter } from 'lucide-react';
import CalendarView from './CalendarView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Habit = Tables<'habits'>;
type HabitEntry = Tables<'habit_entries'>;

interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
}

const HabitsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchHabitEntries();
    }
  }, [user]);

  useEffect(() => {
    if (habits.length > 0 && !selectedHabit) {
      setSelectedHabit(habits[0].id);
    }
  }, [habits, selectedHabit]);

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const habitsWithStats = await Promise.all(
        (data || []).map(async (habit) => {
          const stats = await calculateHabitStats(habit.id);
          return { ...habit, ...stats };
        })
      );

      setHabits(habitsWithStats);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch habits",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHabitEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setHabitEntries(data || []);
    } catch (error) {
      console.error('Error fetching habit entries:', error);
    }
  };

  const calculateHabitStats = async (habitId: string): Promise<{ currentStreak: number; longestStreak: number }> => {
    try {
      const { data } = await supabase
        .from('habit_entries')
        .select('date, completed')
        .eq('habit_id', habitId)
        .eq('user_id', user?.id)
        .eq('completed', true)
        .order('date', { ascending: false });

      if (!data || data.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
      }

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = 0; i < data.length; i++) {
        const entryDate = new Date(data[i].date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);

        if (entryDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = data.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0 ||
          (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) === 24 * 60 * 60 * 1000) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }

      return { currentStreak, longestStreak };
    } catch (error) {
      console.error('Error calculating habit stats:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  };

  const addHabit = async () => {
    if (!user || !newHabitName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          title: newHabitName.trim(),
          user_id: user.id,
          color: 'bg-indigo-500',
          description: null,
          icon: null,
        })
        .select()
        .single();

      if (error) throw error;

      const newHabitWithStats = { ...data, currentStreak: 0, longestStreak: 0 };
      setHabits([newHabitWithStats, ...habits]);
      setNewHabitName('');
      setIsAddingHabit(false);

      toast({
        title: "Success",
        description: "Habit added successfully",
      });
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({
        title: "Error",
        description: "Failed to add habit",
        variant: "destructive",
      });
    }
  };
  
  const updateHabit = async () => {
    if (!user || !habitToEdit || !habitToEdit.title.trim()) return;
  
    try {
      const { data, error } = await supabase
        .from('habits')
        .update({ title: habitToEdit.title.trim() })
        .eq('id', habitToEdit.id)
        .eq('user_id', user.id)
        .select()
        .single();
  
      if (error) throw error;
  
      // Update the state with the new habit data
      setHabits(habits.map(h =>
        h.id === data.id
          ? { ...h, ...data,
              currentStreak: h.currentStreak,
              longestStreak: h.longestStreak,
            }
          : h
      ));
      setIsEditingHabit(false);
      setHabitToEdit(null);
  
      toast({
        title: "Success",
        description: "Habit updated successfully.",
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit.",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async () => {
    if (!user || !habitToDelete) return;
  
    try {
      // First, delete all habit entries linked to the habit
      const { error: entriesError } = await supabase
        .from('habit_entries')
        .delete()
        .eq('habit_id', habitToDelete)
        .eq('user_id', user.id);
  
      if (entriesError) throw entriesError;
  
      // Then, delete the habit itself
      const { error: habitError } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitToDelete)
        .eq('user_id', user.id);
  
      if (habitError) throw habitError;
  
      setHabits(habits.filter(h => h.id !== habitToDelete));
      setHabitEntries(habitEntries.filter(e => e.habit_id !== habitToDelete));
  
      if (selectedHabit === habitToDelete) {
        setSelectedHabit(habits.find(h => h.id !== habitToDelete)?.id || '');
      }
      
      toast({
        title: "Success",
        description: "Habit and all entries deleted successfully.",
      });
      setIsDeletingHabit(false);
      setHabitToDelete(null);
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit.",
        variant: "destructive",
      });
    }
  };

  const toggleHabitEntry = async (date: Date) => {
    if (!user || !selectedHabit) return;

    const dateString = date.toISOString().split('T')[0];
    const existingEntry = habitEntries.find(
      e => e.habit_id === selectedHabit && e.date === dateString
    );

    try {
      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('habit_entries')
          .update({ completed: !existingEntry.completed })
          .eq('id', existingEntry.id);

        if (error) throw error;

        setHabitEntries(habitEntries.map(e =>
          e.id === existingEntry.id
            ? { ...e, completed: !e.completed }
            : e
        ));
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('habit_entries')
          .insert({
            habit_id: selectedHabit,
            user_id: user.id,
            date: dateString,
            completed: true,
            notes: null,
          })
          .select()
          .single();

        if (error) throw error;

        setHabitEntries([...habitEntries, data]);
      }

      // Refresh habit stats
      await fetchHabits();
    } catch (error) {
      console.error('Error toggling habit entry:', error);
      toast({
        title: "Error",
        description: "Failed to update habit entry",
        variant: "destructive",
      });
    }
  };

  const getDayStatus = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const entry = habitEntries.find(
      e => e.habit_id === selectedHabit && e.date === dateString
    );

    if (entry) {
      return entry.completed ? 'complete' : 'incomplete';
    }

    return undefined;
  };

  const selectedHabitData = habits.find(h => h.id === selectedHabit);

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
          <h2 className="text-3xl font-small text-foreground">Track your Behavior</h2>
          <p className="text-2xl md:text-1xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-400 to-emerald-400 bg-clip-text text-transparent mb-4"
          >
            It takes 18-254 days for a Behavior to become automatic "Habit"</p>
          
        </div>

        <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter habit name..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingHabit(false)}>
                  Cancel
                </Button>
                <Button onClick={addHabit}>Add Habit</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Habits List */}
        <div className="lg:col-span-1">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg dark:text-gray-100">Your Habits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {habits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <p>No habits yet. Create your first habit to get started!</p>
                </div>
              ) : (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${selectedHabit === habit.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      }
                    `}
                    onClick={() => setSelectedHabit(habit.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${habit.color || 'bg-indigo-500'}`} />
                          <span className="font-medium text-sm dark:text-gray-100">{habit.title}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center space-x-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span>{habit.currentStreak}</span>
                          </div>
                          <div>
                            Best: {habit.longestStreak}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHabitToEdit(habit);
                            setIsEditingHabit(true);
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
                            setHabitToDelete(habit.id);
                            setIsDeletingHabit(true);
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

        {/* Update Habit Dialog */}
        {habitToEdit && (
          <Dialog open={isEditingHabit} onOpenChange={setIsEditingHabit}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter habit name..."
                  value={habitToEdit.title}
                  onChange={(e) => setHabitToEdit({ ...habitToEdit, title: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && updateHabit()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditingHabit(false)}>
                  Cancel
                </Button>
                <Button onClick={updateHabit}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Habit Confirmation Dialog */}
        <Dialog open={isDeletingHabit} onOpenChange={setIsDeletingHabit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete this habit? This will permanently remove the habit and all of its associated entries. This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDeletingHabit(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteHabit}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Calendar */}
        <div className="lg:col-span-3">
          {selectedHabitData ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">
                  Tracking: {selectedHabitData.title}
                </h3>
                <div className="flex items-center space-x-6 text-sm dark:text-gray-200">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Current Streak: <strong>{selectedHabitData.currentStreak} days</strong></span>
                  </div>
                  <div>
                    <span>Best Streak: <strong>{selectedHabitData.longestStreak} days</strong></span>
                  </div>
                </div>
              </div>
              <CalendarView
                onDayClick={toggleHabitEntry}
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
              <p className="text-muted-foreground dark:text-gray-400">Select a habit to start tracking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HabitsTab;