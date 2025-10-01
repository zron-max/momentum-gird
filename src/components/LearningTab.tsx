import { useState, useEffect } from 'react'
import {
  Plus,
  BookOpen,
  Target,
  Trash2,
  Pencil,
  Compass,
  Calendar,
  Award,
  TrendingUp,
  Star,
  ChevronRight,
  Sparkles,
  BookMarked,
  Timer,
  Clock,
  BarChart3,
} from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import type { Tables } from '@/integrations/supabase/types'

type LearningGoal = Tables<'learning_goals'>
type LearningEntry = Tables<'learning_entries'>

interface LearningGoalWithProgress extends LearningGoal {
  current: number
  progressPercentage: number
}

const LearningTab = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [goals, setGoals] = useState<LearningGoalWithProgress[]>([])
  const [entries, setEntries] = useState<LearningEntry[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_value: 100,
    unit: 'pages',
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [entryAmount, setEntryAmount] = useState('')
  const [entryNotes, setEntryNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const unitIcons = {
    pages: BookOpen,
    minutes: Timer,
    hours: Clock,
    chapters: BookMarked,
    sessions: Target,
  }

  const unitColors = {
    pages: 'from-blue-500 to-indigo-500',
    minutes: 'from-green-500 to-emerald-500',
    hours: 'from-purple-500 to-violet-500',
    chapters: 'from-orange-500 to-amber-500',
    sessions: 'from-pink-500 to-rose-500',
  }

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return 'Goal achieved! Incredible work!'
    if (percentage >= 80) return 'Almost there! Keep pushing!'
    if (percentage >= 60) return 'Great momentum! Stay consistent!'
    if (percentage >= 40) return 'Making solid progress!'
    if (percentage >= 20) return 'Good start! Keep building!'
    return 'Begin your learning journey!'
  }

  // Fetch goals and entries when user changes
  useEffect(() => {
    if (user) {
      fetchGoals()
      fetchEntries()
    } else {
      setGoals([])
      setEntries([])
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Keep a selected goal if none
  useEffect(() => {
    if (!selectedGoal && goals.length > 0) {
      setSelectedGoal(goals[0].id as string)
    }
  }, [goals, selectedGoal])

  const fetchGoals = async () => {
    if (!user?.id) return
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const goalsData = (data || []) as LearningGoal[]

      const goalsWithProgress = await Promise.all(
        goalsData.map(async (goal) => {
          const { current, percentage } = await calculateGoalProgress(
            goal.id as string,
            Number(goal.target_value || 0),
          )
          return {
            ...goal,
            current,
            progressPercentage: percentage,
          } as LearningGoalWithProgress
        }),
      )

      setGoals(goalsWithProgress)
      if (!selectedGoal && goalsWithProgress.length > 0) {
        setSelectedGoal(goalsWithProgress[0].id as string)
      }
    } catch (err) {
      console.error('Error fetching learning goals:', err)
      toast?.({
        title: 'Error',
        description: 'Failed to fetch learning goals',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEntries = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('learning_entries')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setEntries((data || []) as LearningEntry[])
    } catch (err) {
      console.error('Error fetching learning entries:', err)
    }
  }

  const calculateGoalProgress = async (
    goalId: string,
    targetValue: number,
  ): Promise<{ current: number; percentage: number }> => {
    try {
      const { data, error } = await supabase
        .from('learning_entries')
        .select('value')
        .eq('goal_id', goalId)
        .eq('user_id', user?.id)

      if (error) {
        console.warn('calculateGoalProgress: error reading entries', error)
        return { current: 0, percentage: 0 }
      }

      const rows = (data || []) as Array<{ value?: number }>
      const current = rows.reduce((sum, r) => sum + (Number(r?.value) || 0), 0)

      const safeTarget = Number(targetValue) || 0
      const percentage =
        safeTarget > 0
          ? Math.min(100, Math.round((current / safeTarget) * 100))
          : 0

      return { current, percentage }
    } catch (err) {
      console.error('Error calculating goal progress:', err)
      return { current: 0, percentage: 0 }
    }
  }

  const addGoal = async () => {
    if (!user || !newGoal.title.trim()) return

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
        .single()

      if (error) throw error

      const g = data as LearningGoal
      const newGoalWithProgress: LearningGoalWithProgress = {
        ...(g as any),
        current: 0,
        progressPercentage: 0,
      }

      setGoals((prev) => [newGoalWithProgress, ...prev])
      setSelectedGoal((g.id as string) || '')
      setNewGoal({ title: '', target_value: 100, unit: 'pages' })
      setIsAddingGoal(false)

      toast?.({
        title: 'Success',
        description: 'Learning goal added successfully',
      })
    } catch (err) {
      console.error('Error adding learning goal:', err)
      toast?.({
        title: 'Error',
        description: 'Failed to add learning goal',
        variant: 'destructive',
      })
    }
  }

  const updateGoal = async () => {
    if (!user || !editingGoal || !editingGoal.title.trim()) return

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
        .single()

      if (error) throw error

      const updated = data as LearningGoal
      const { current, percentage } = await calculateGoalProgress(
        updated.id as string,
        Number(updated.target_value || 0),
      )

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === updated.id
            ? { ...goal, ...updated, current, progressPercentage: percentage }
            : goal,
        ),
      )
      setIsEditingGoal(false)
      setEditingGoal(null)

      toast?.({
        title: 'Success',
        description: 'Learning goal updated successfully.',
      })
    } catch (err) {
      console.error('Error updating learning goal:', err)
      toast?.({
        title: 'Error',
        description: 'Failed to update learning goal.',
        variant: 'destructive',
      })
    }
  }

  const addEntry = async () => {
    if (!user || !selectedDate || !entryAmount || !selectedGoal) return

    try {
      const amount = parseInt(entryAmount, 10)
      if (Number.isNaN(amount)) {
        toast?.({
          title: 'Invalid input',
          description: 'Entry amount must be a number.',
        })
        return
      }

      const dateString = selectedDate.toISOString().split('T')[0]

      const existingEntry = (entries || []).find(
        (e) =>
          String(e.goal_id) === String(selectedGoal) && e.date === dateString,
      )

      if (existingEntry && existingEntry.id) {
        const { error } = await supabase
          .from('learning_entries')
          .update({
            value: amount,
            notes: entryNotes || null,
          })
          .eq('id', existingEntry.id)

        if (error) throw error

        setEntries((prev) =>
          prev.map((e) =>
            e.id === existingEntry.id
              ? { ...e, value: amount, notes: entryNotes || null }
              : e,
          ),
        )
      } else {
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
          .single()

        if (error) throw error

        setEntries((prev) => [...prev, data as LearningEntry])
      }

      await fetchGoals()

      setSelectedDate(null)
      setEntryAmount('')
      setEntryNotes('')

      toast?.({
        title: 'Success',
        description: 'Learning entry saved successfully',
      })
    } catch (err) {
      console.error('Error saving learning entry:', err)
      toast?.({
        title: 'Error',
        description: 'Failed to save learning entry',
        variant: 'destructive',
      })
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!user) return

    try {
      const { error: entriesError } = await supabase
        .from('learning_entries')
        .delete()
        .eq('goal_id', goalId)
        .eq('user_id', user.id)

      if (entriesError) throw entriesError

      const { error: goalError } = await supabase
        .from('learning_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id)

      if (goalError) throw goalError

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId))
      setEntries((prev) =>
        prev.filter((entry) => String(entry.goal_id) !== String(goalId)),
      )

      setSelectedGoal((prevSel) => {
        const remaining = goals.filter((g) => String(g.id) !== String(goalId))
        return remaining.length ? String(remaining[0].id) : ''
      })

      toast?.({
        title: 'Success',
        description: 'Learning goal and all entries deleted successfully.',
      })
      setIsDeletingGoal(false)
    } catch (err) {
      console.error('Error deleting learning goal:', err)
      toast?.({
        title: 'Error',
        description: 'Failed to delete learning goal.',
        variant: 'destructive',
      })
    }
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    const dateString = date.toISOString().split('T')[0]
    const existingEntry = entries.find(
      (e) =>
        String(e.goal_id) === String(selectedGoal) && e.date === dateString,
    )

    if (existingEntry) {
      setEntryAmount(existingEntry.value?.toString() || '')
      setEntryNotes(existingEntry.notes || '')
    } else {
      setEntryAmount('')
      setEntryNotes('')
    }
  }

  const getDayStatus = (
    date: Date,
  ): 'complete' | 'incomplete' | 'partial' | undefined => {
    const dateString = date.toISOString().split('T')[0]
    const entry = entries.find(
      (e) =>
        String(e.goal_id) === String(selectedGoal) && e.date === dateString,
    )
    return entry ? 'complete' : undefined
  }

  const selectedGoalData = goals.find(
    (g) => String(g.id) === String(selectedGoal),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-glow animate-float">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-20 animate-ping"></div>
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            Preparing your learning dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-mesh-1 opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/20 via-transparent to-transparent rounded-full blur-3xl"></div>

        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-glow animate-float">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Learning Goals
                  </h1>
                  <p className="text-muted-foreground text-xl mt-2">
                    Transform knowledge into wisdom through consistent progress
                  </p>
                </div>
              </div>

              {/* Enhanced Stats Dashboard */}
              {goals.length > 0 && (
                <div className="flex flex-wrap items-center gap-6 mt-6">
                  <div className="flex items-center space-x-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30 shadow-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        {goals.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active Goals
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30 shadow-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        {Math.round(
                          goals.reduce(
                            (acc, goal) => acc + goal.progressPercentage,
                            0,
                          ) / goals.length,
                        )}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Progress
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30 shadow-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        {
                          goals.filter((g) => g.progressPercentage >= 100)
                            .length
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              {/* Add Goal Button */}
              <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group px-8 py-3 text-lg">
                    <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Create Learning Goal
                    <Sparkles className="w-4 h-4 ml-3 opacity-70" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <span>Create New Learning Goal</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground">
                        What would you like to learn?
                      </label>
                      <Input
                        placeholder="e.g., Master React Development, Read Clean Code..."
                        value={newGoal.title}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, title: e.target.value })
                        }
                        className="border-2 border-input focus:border-blue-500 transition-all duration-200 h-12 text-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground">
                          Target Amount
                        </label>
                        <Input
                          type="number"
                          value={newGoal.target_value}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              target_value: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="border-2 border-input focus:border-blue-500 transition-all duration-200 h-12 text-lg"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground">
                          Measurement Unit
                        </label>
                        <select
                          className="w-full px-4 py-3 border-2 border-input rounded-lg bg-background focus:border-blue-500 transition-all duration-200 text-lg h-12"
                          value={newGoal.unit}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, unit: e.target.value })
                          }
                        >
                          <option value="pages">📖 Pages</option>
                          <option value="minutes">⏱️ Minutes</option>
                          <option value="hours">🕐 Hours</option>
                          <option value="chapters">📚 Chapters</option>
                          <option value="sessions">🎯 Sessions</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingGoal(false)}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addGoal}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8"
                    >
                      Create Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Enhanced Goals Sidebar */}
        <div className="xl:col-span-1">
          <Card className="glass-light border-0 shadow-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Target className="w-6 h-6 text-blue-500" />
                <span>Your Learning Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
                {goals.length === 0 ? (
                  <div className="text-center py-16 px-6 space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                      <Compass className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg text-foreground">
                        Start Your Learning Journey
                      </p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Create your first learning goal and begin tracking your
                        progress toward mastery.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {goals.map((goal) => {
                      const IconComponent =
                        unitIcons[goal.unit as keyof typeof unitIcons] ||
                        BookOpen
                      const isSelected = selectedGoal === String(goal.id)
                      const isCompleted = goal.progressPercentage >= 100

                      return (
                        <div
                          key={String(goal.id)}
                          className={`
                            group relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]
                            ${
                              isSelected
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-lg'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white/80 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800/80'
                            }
                          `}
                          onClick={() => setSelectedGoal(String(goal.id))}
                        >
                          {isCompleted && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                              <Star className="w-4 h-4 text-white fill-current" />
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div
                                  className={`w-12 h-12 bg-gradient-to-r ${unitColors[goal.unit as keyof typeof unitColors]} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
                                >
                                  <IconComponent className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold leading-tight truncate text-base">
                                    {goal.title}
                                  </h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {goal.unit.charAt(0).toUpperCase() +
                                      goal.unit.slice(1)}{' '}
                                    Goal
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingGoal(goal as any)
                                  setIsEditingGoal(true)
                                }}
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">
                                  {goal.current.toLocaleString()} /{' '}
                                  {goal.target_value?.toLocaleString() || 0}{' '}
                                  {goal.unit}
                                </span>
                                <Badge
                                  variant={
                                    isCompleted ? 'default' : 'secondary'
                                  }
                                  className={`text-xs ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : ''}`}
                                >
                                  {Math.round(goal.progressPercentage)}%
                                </Badge>
                              </div>
                              <div className="relative">
                                <Progress
                                  value={Math.min(
                                    100,
                                    Math.max(0, goal.progressPercentage),
                                  )}
                                  className="h-3 bg-gray-200 dark:bg-gray-700"
                                />
                                {isCompleted && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-20 animate-pulse"></div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground italic font-medium text-center bg-white/50 dark:bg-gray-800/50 rounded-lg py-2">
                                {getMotivationalMessage(
                                  goal.progressPercentage,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-8">
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 text-blue-500 mb-6 animate-bounce-slow">
                <BarChart3 className="w-full h-full" />
              </div>
              <p className="text-xl font-semibold text-foreground">
                No goals yet!
              </p>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Start by creating your first learning goal. Set a target, choose
                a unit, and begin tracking your progress.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Goal Card */}
              <Card className="glass-light border-0 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center space-x-3">
                    {selectedGoalData && (
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${unitColors[selectedGoalData.unit as keyof typeof unitColors]} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        {(() => {
                          const IconComponent =
                            unitIcons[
                              selectedGoalData.unit as keyof typeof unitIcons
                            ] || BookOpen
                          return (
                            <IconComponent className="w-6 h-6 text-white" />
                          )
                        })()}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        {selectedGoalData?.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {selectedGoalData?.current?.toLocaleString()}
                        </span>{' '}
                        / {selectedGoalData?.target_value?.toLocaleString()}{' '}
                        {selectedGoalData?.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedGoalData?.progressPercentage === 100 && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-3 py-1 text-sm font-bold">
                        <Award className="w-4 h-4 mr-2" />
                        Completed
                      </Badge>
                    )}
                    <Dialog
                      open={isEditingGoal}
                      onOpenChange={setIsEditingGoal}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setEditingGoal(selectedGoalData as any)
                          }
                          className="h-9 w-9 text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-3 text-xl">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                              <Pencil className="w-5 h-5 text-white" />
                            </div>
                            <span>Edit Learning Goal</span>
                          </DialogTitle>
                        </DialogHeader>
                        {editingGoal && (
                          <div className="space-y-6 py-6">
                            <div className="space-y-3">
                              <label className="text-sm font-semibold text-foreground">
                                Title
                              </label>
                              <Input
                                placeholder="e.g., Master React Development"
                                value={editingGoal.title}
                                onChange={(e) =>
                                  setEditingGoal({
                                    ...editingGoal,
                                    title: e.target.value,
                                  })
                                }
                                className="border-2 border-input focus:border-blue-500 transition-all duration-200 h-12 text-lg"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground">
                                  Target Amount
                                </label>
                                <Input
                                  type="number"
                                  value={editingGoal.target_value}
                                  onChange={(e) =>
                                    setEditingGoal({
                                      ...editingGoal,
                                      target_value:
                                        parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="border-2 border-input focus:border-blue-500 transition-all duration-200 h-12 text-lg"
                                />
                              </div>
                              <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground">
                                  Measurement Unit
                                </label>
                                <select
                                  className="w-full px-4 py-3 border-2 border-input rounded-lg bg-background focus:border-blue-500 transition-all duration-200 text-lg h-12"
                                  value={editingGoal.unit}
                                  onChange={(e) =>
                                    setEditingGoal({
                                      ...editingGoal,
                                      unit: e.target.value,
                                    })
                                  }
                                >
                                  <option value="pages">📖 Pages</option>
                                  <option value="minutes">⏱️ Minutes</option>
                                  <option value="hours">🕐 Hours</option>
                                  <option value="chapters">📚 Chapters</option>
                                  <option value="sessions">🎯 Sessions</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Dialog
                            open={isDeletingGoal}
                            onOpenChange={setIsDeletingGoal}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                className="px-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setIsDeletingGoal(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>
                                  Are you absolutely sure?
                                </DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                This action cannot be undone. This will
                                permanently delete your goal and all associated
                                entries.
                              </p>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDeletingGoal(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    deleteGoal(editingGoal?.id as string)
                                  }
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingGoal(false)}
                            className="px-6"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={updateGoal}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8"
                          >
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Progress
                      value={Math.min(
                        100,
                        Math.max(0, selectedGoalData?.progressPercentage || 0),
                      )}
                      className="h-3 bg-gray-200 dark:bg-gray-700 w-full"
                    />
                    <span className="font-semibold text-sm">
                      {Math.round(selectedGoalData?.progressPercentage || 0)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    {getMotivationalMessage(
                      selectedGoalData?.progressPercentage || 0,
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Calendar and Entry Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Calendar View */}
                <Card className="glass-light border-0 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <Calendar className="w-6 h-6 text-primary" />
                      <span>Calendar</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CalendarView
                      onDayClick={handleDayClick}
                      getDayStatus={getDayStatus}
                      selectedDate={selectedDate}
                    />
                  </CardContent>
                </Card>

                {/* Daily Learning Entry Form */}
                <Card className="glass-light border-0 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <Pencil className="w-6 h-6 text-primary" />
                      <span>Log Your Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        Selected Date
                      </label>
                      <Input
                        type="text"
                        value={
                          selectedDate
                            ? selectedDate.toLocaleDateString()
                            : 'Select a date from the calendar'
                        }
                        readOnly
                        className="h-12 text-lg font-medium bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-muted-foreground" />
                        Amount ({selectedGoalData?.unit})
                      </label>
                      <Input
                        type="number"
                        value={entryAmount}
                        onChange={(e) => setEntryAmount(e.target.value)}
                        placeholder={`e.g., 25 ${selectedGoalData?.unit || 'pages'}`}
                        disabled={!selectedDate}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                        Notes (Optional)
                      </label>
                      <textarea
                        value={entryNotes}
                        onChange={(e) => setEntryNotes(e.target.value)}
                        placeholder="What did you learn today? What went well?"
                        rows={3}
                        disabled={!selectedDate}
                        className="w-full rounded-md border-2 border-input bg-background px-4 py-3 text-lg focus:border-blue-500 transition-all duration-200 resize-none"
                      />
                    </div>
                    <Button
                      onClick={addEntry}
                      disabled={!selectedDate || !entryAmount}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg h-12"
                    >
                      <ChevronRight className="w-5 h-5 mr-2" />
                      Save Entry
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LearningTab
