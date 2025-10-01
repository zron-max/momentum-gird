import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Flame, Target, CalendarDays } from 'lucide-react'
import CalendarView from './CalendarView'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import type { Tables } from '@/integrations/supabase/types'

type Habit = Tables<'habits'>
type HabitEntry = Tables<'habit_entries'>

interface HabitWithStats extends Habit {
  currentStreak: number
  longestStreak: number
}

const HabitsTab = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [habits, setHabits] = useState<HabitWithStats[]>([])
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([])
  const [selectedHabit, setSelectedHabit] = useState<string>('')
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [isDeletingHabit, setIsDeletingHabit] = useState(false)
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null)
  const [isEditingHabit, setIsEditingHabit] = useState(false)
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null)

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchHabitEntries()
    }
  }, [user])

  useEffect(() => {
    if (habits.length > 0 && !selectedHabit) {
      setSelectedHabit(habits[0].id)
    }
  }, [habits, selectedHabit])

  const fetchHabits = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const habitsWithStats = await Promise.all(
        (data || []).map(async (habit) => {
          const stats = await calculateHabitStats(habit.id)
          return { ...habit, ...stats }
        }),
      )

      setHabits(habitsWithStats)
    } catch (error) {
      console.error('Error fetching habits:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch habits',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHabitEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', user?.id)

      if (error) throw error
      setHabitEntries(data || [])
    } catch (error) {
      console.error('Error fetching habit entries:', error)
    }
  }

  const calculateHabitStats = async (
    habitId: string,
  ): Promise<{ currentStreak: number; longestStreak: number }> => {
    try {
      const { data } = await supabase
        .from('habit_entries')
        .select('date, completed')
        .eq('habit_id', habitId)
        .eq('user_id', user?.id)
        .eq('completed', true)
        .order('date', { ascending: false })

      if (!data || data.length === 0) {
        return { currentStreak: 0, longestStreak: 0 }
      }

      const completedDates = data
        .map((d) => {
          const date = new Date(d.date)
          date.setUTCHours(0, 0, 0, 0)
          return date.getTime()
        })
        .sort((a, b) => b - a)

      const uniqueDates = [...new Set(completedDates)]

      if (uniqueDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 }
      }

      // Current Streak Calculation
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let expectedDate = new Date(today)

      // Check if the most recent completion was today or yesterday
      const mostRecentDate = new Date(uniqueDates[0])
      const timeDiff = today.getTime() - mostRecentDate.getTime()
      const dayDiff = timeDiff / (1000 * 3600 * 24)

      if (dayDiff <= 1) {
        // Habit was completed today or yesterday
        expectedDate = new Date(mostRecentDate)
        for (let i = 0; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i])
          if (currentDate.getTime() === expectedDate.getTime()) {
            currentStreak++
            expectedDate.setDate(expectedDate.getDate() - 1)
          } else {
            break
          }
        }
      }

      // Longest Streak Calculation
      let longestStreak = 0
      let tempStreak = 0
      if (uniqueDates.length > 0) {
        tempStreak = 1
        longestStreak = 1
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const diff = uniqueDates[i] - uniqueDates[i + 1]
          // Check if the difference is exactly one day
          if (diff === 24 * 60 * 60 * 1000) {
            tempStreak++
          } else {
            tempStreak = 1 // Reset streak if there's a gap
          }
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak
          }
        }
      }

      return { currentStreak, longestStreak }
    } catch (error) {
      console.error('Error calculating habit stats:', error)
      return { currentStreak: 0, longestStreak: 0 }
    }
  }

  const addHabit = async () => {
    if (!user || !newHabitName.trim()) return
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          title: newHabitName.trim(),
          user_id: user.id,
          color: 'bg-pink-500',
        })
        .select()
        .single()
      if (error) throw error
      const newHabitWithStats = { ...data, currentStreak: 0, longestStreak: 0 }
      setHabits([newHabitWithStats, ...habits])
      setNewHabitName('')
      setIsAddingHabit(false)
      toast({ title: 'Success', description: 'Habit added successfully' })
    } catch (error) {
      console.error('Error adding habit:', error)
      toast({
        title: 'Error',
        description: 'Failed to add habit',
        variant: 'destructive',
      })
    }
  }

  const updateHabit = async () => {
    if (!user || !habitToEdit || !habitToEdit.title.trim()) return
    try {
      const { data, error } = await supabase
        .from('habits')
        .update({ title: habitToEdit.title.trim() })
        .eq('id', habitToEdit.id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      setHabits(habits.map((h) => (h.id === data.id ? { ...h, ...data } : h)))
      setIsEditingHabit(false)
      setHabitToEdit(null)
      toast({ title: 'Success', description: 'Habit updated successfully.' })
    } catch (error) {
      console.error('Error updating habit:', error)
      toast({
        title: 'Error',
        description: 'Failed to update habit.',
        variant: 'destructive',
      })
    }
  }

  const deleteHabit = async () => {
    if (!user || !habitToDelete) return
    try {
      await supabase
        .from('habit_entries')
        .delete()
        .eq('habit_id', habitToDelete)
        .eq('user_id', user.id)
      await supabase
        .from('habits')
        .delete()
        .eq('id', habitToDelete)
        .eq('user_id', user.id)

      const newHabits = habits.filter((h) => h.id !== habitToDelete)
      setHabits(newHabits)
      setHabitEntries(habitEntries.filter((e) => e.habit_id !== habitToDelete))

      if (selectedHabit === habitToDelete) {
        setSelectedHabit(newHabits.length > 0 ? newHabits[0].id : '')
      }

      toast({ title: 'Success', description: 'Habit deleted successfully.' })
    } catch (error) {
      console.error('Error deleting habit:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete habit.',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingHabit(false)
      setHabitToDelete(null)
    }
  }

  const toggleHabitEntry = async (date: Date) => {
    if (!user || !selectedHabit) return
    const dateString = date.toISOString().split('T')[0]
    const existingEntry = habitEntries.find(
      (e) => e.habit_id === selectedHabit && e.date === dateString,
    )
    try {
      if (existingEntry) {
        await supabase.from('habit_entries').delete().eq('id', existingEntry.id)
        setHabitEntries(habitEntries.filter((e) => e.id !== existingEntry.id))
      } else {
        const { data, error } = await supabase
          .from('habit_entries')
          .insert({
            habit_id: selectedHabit,
            user_id: user.id,
            date: dateString,
            completed: true,
          })
          .select()
          .single()
        if (error) throw error
        setHabitEntries([...habitEntries, data])
      }
      fetchHabits()
    } catch (error) {
      console.error('Error toggling habit entry:', error)
      toast({
        title: 'Error',
        description: 'Failed to update habit entry',
        variant: 'destructive',
      })
    }
  }

  const getDayStatus = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const entry = habitEntries.find(
      (e) => e.habit_id === selectedHabit && e.date === dateString,
    )
    if (entry) return entry.completed ? 'complete' : 'incomplete'
    return undefined
  }

  const selectedHabitData = habits.find((h) => h.id === selectedHabit)

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Page Title and Subtitle */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Habit Tracking
        </h1>
        <p className="text-muted-foreground mt-2">
          It takes 21 days to make a habit and 90 days to make it a permanent
          lifestyle change.
        </p>
      </div>

      <div className="flex h-full w-full flex-col gap-6 md:flex-row">
        {/* Left Panel: Habits List */}
        <Card className="flex w-full flex-col md:w-72 lg:w-80">
          <CardHeader>
            <CardTitle className="text-xl">Your Habits</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4">
            <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md transition-transform hover:scale-105">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Habit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Habit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="e.g., Read for 15 minutes"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingHabit(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addHabit}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                  >
                    Add Habit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {habits.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
                <Target className="mb-4 h-12 w-12 text-gray-400" />
                <p className="font-semibold">No habits yet.</p>
                <p className="text-sm">
                  Create your first habit to get started!
                </p>
              </div>
            ) : (
              habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`group flex cursor-pointer items-center rounded-lg border-2 p-3 transition-all ${selectedHabit === habit.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent'}`}
                  onClick={() => setSelectedHabit(habit.id)}
                >
                  <div
                    className={`mr-3 h-3 w-3 flex-shrink-0 rounded-full ${habit.color || 'bg-pink-500'}`}
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-semibold">{habit.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-400" />
                        <span>{habit.currentStreak}</span>
                      </div>
                      <span>Best: {habit.longestStreak}</span>
                    </div>
                  </div>
                  <div className="ml-2 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        setHabitToEdit(habit)
                        setIsEditingHabit(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/70 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setHabitToDelete(habit.id)
                        setIsDeletingHabit(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Panel: Main Content */}
        <main className="flex flex-1 flex-col gap-6">
          {selectedHabitData ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {selectedHabitData.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span>
                        Current streak:{' '}
                        <span className="font-bold text-foreground">
                          {selectedHabitData.currentStreak}
                        </span>
                      </span>
                    </div>
                    <span>
                      Longest streak:{' '}
                      <span className="font-bold text-foreground">
                        {selectedHabitData.longestStreak}
                      </span>
                    </span>
                  </div>
                </CardHeader>
              </Card>
              <CalendarView
                onDayClick={toggleHabitEntry}
                getDayStatus={getDayStatus}
              />
            </>
          ) : (
            <Card className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
              <CalendarDays className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <h3 className="text-xl font-semibold">Select a habit</h3>
              <p>Choose a habit from the list to see your progress.</p>
            </Card>
          )}
        </main>

        {/* Dialogs for Edit/Delete */}
        {habitToEdit && (
          <Dialog open={isEditingHabit} onOpenChange={setIsEditingHabit}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  value={habitToEdit.title}
                  onChange={(e) =>
                    setHabitToEdit({ ...habitToEdit, title: e.target.value })
                  }
                  onKeyPress={(e) => e.key === 'Enter' && updateHabit()}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingHabit(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateHabit}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isDeletingHabit} onOpenChange={setIsDeletingHabit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete this habit? This will permanently
              remove the habit and all its associated entries.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeletingHabit(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteHabit}>
                Delete Habit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default HabitsTab
