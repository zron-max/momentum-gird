import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Users, Target, BookOpen } from 'lucide-react';

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number }>;
  habitCompletion: Array<{ date: string; completions: number }>;
  topHabits: Array<{ habit: string; count: number }>;
  userActivity: {
    totalHabits: number;
    totalGoals: number;
    totalProjects: number;
    activeToday: number;
  };
}

function ActivityAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    habitCompletion: [],
    topHabits: [],
    userActivity: {
      totalHabits: 0,
      totalGoals: 0,
      totalProjects: 0,
      activeToday: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user growth data
      const { data: userGrowthData } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at');

      // Fetch habit completion data
      const { data: habitData } = await supabase
        .from('habit_entries')
        .select('date, completed')
        .eq('completed', true)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Fetch activity counts
      const [
        { count: totalHabits },
        { count: totalGoals },
        { count: totalProjects },
        { count: activeToday }
      ] = await Promise.all([
        supabase.from('habits').select('*', { count: 'exact', head: true }),
        supabase.from('learning_goals').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('habit_entries').select('*', { count: 'exact', head: true })
          .eq('date', new Date().toISOString().split('T')[0])
          .eq('completed', true)
      ]);

      // Process user growth data
      const userGrowth = processUserGrowthData(userGrowthData || []);
      
      // Process habit completion data
      const habitCompletion = processHabitCompletionData(habitData || []);

      setAnalytics({
        userGrowth,
        habitCompletion,
        topHabits: [], // Placeholder for now
        userActivity: {
          totalHabits: totalHabits || 0,
          totalGoals: totalGoals || 0,
          totalProjects: totalProjects || 0,
          activeToday: activeToday || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processUserGrowthData = (data: Array<{ created_at: string }>) => {
    const monthlyData: { [key: string]: number } = {};
    
    data.forEach(user => {
      const month = new Date(user.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, users]) => ({ month, users }));
  };

  const processHabitCompletionData = (data: Array<{ date: string; completed: boolean }>) => {
    const dailyData: { [key: string]: number } = {};
    
    data.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    return Object.entries(dailyData).map(([date, completions]) => ({ date, completions }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userActivity.totalHabits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Goals</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userActivity.totalGoals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userActivity.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userActivity.activeToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users registered by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habit Completions</CardTitle>
            <CardDescription>Daily habit completions over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.habitCompletion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="completions" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ActivityAnalytics;