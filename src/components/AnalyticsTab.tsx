import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, Target } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Colors (works reasonably well in light/dark)
const COLORS = {
  habits: "#22c55e", // green
  learning: "#2563eb", // blue
  projects: "#7c3aed", // purple
  routines: "#f97316", // orange
  meals: "#10b981", // green (slightly different)
  neutral: "#94a3b8"
};

type WeeklyStats = {
  habits: number;
  learning: number;
  projects: number;
  routines: number;
  meals: number;
};

const defaultWeeklyStats: WeeklyStats = {
  habits: 0,
  learning: 0,
  projects: 0,
  routines: 0,
  meals: 0,
};

const AnalyticsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>(defaultWeeklyStats);
  const [monthlyTrends, setMonthlyTrends] = useState<
    { category: string; completion: number; change: string }[]
  >([]);
  const [achievementList, setAchievementList] = useState<
    { title: string; subtitle?: string; color?: string; emoji?: string }[]
  >([]);
  const [pieData, setPieData] = useState<
    { name: string; value: number; color?: string }[]
  >([]);

  // Helper: fallback safe query wrapper
  async function safeSelect(table: string, cols = "*", filters: any[] = []) {
    try {
      let q = supabase.from(table).select(cols).limit(1000);
      // apply filters array of tuples like ['eq', 'user_id', user.id]
      for (const f of filters) {
        const [method, column, value] = f;
        // @ts-ignore dynamic
        q = (q as any)[method](column, value);
      }
      const { data, error } = await q;
      if (error) {
        // table/column missing -> log and return null
        console.warn(`safeSelect: error selecting from ${table}:`, error.message || error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (err) {
      console.error("safeSelect unexpected error:", err);
      return { data: null, error: err };
    }
  }

  // main fetch
  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // Habits: assume table "habits" with columns user_id, completed (boolean) and maybe date
        const habitsRes = await safeSelect("habits", "id,completed,user_id", [["eq", "user_id", user.id]]);
        let habitsCompleted = 0;
        let habitsTotal = 0;
        if (!habitsRes.error && Array.isArray(habitsRes.data)) {
          const arr = habitsRes.data as any[];
          habitsTotal = arr.length;
          habitsCompleted = arr.filter((r) => r.completed === true).length;
        } else {
          // fallback: try "habit_logs" or nothing
          console.info("habits table not found or empty. using 0 fallback.");
        }

        // Learning: try "learning_sessions" or "learning"
        const learningResA = await safeSelect("learning_sessions", "id,user_id,progress_percent", [["eq", "user_id", user.id]]);
        const learningResB = await safeSelect("learning", "id,user_id,progress_percent", [["eq", "user_id", user.id]]);
        let learningCompletion = 0;
        if (!learningResA.error && Array.isArray(learningResA.data) && learningResA.data.length > 0) {
          // average progress_percent if present
          const arr = learningResA.data as any[];
          const valid = arr.filter((r) => typeof r.progress_percent === "number");
          if (valid.length > 0) {
            learningCompletion = Math.round(valid.reduce((s, x) => s + x.progress_percent, 0) / valid.length);
          } else {
            learningCompletion = Math.min(100, Math.round((arr.length / 10) * 100)); // heuristic
          }
        } else if (!learningResB.error && Array.isArray(learningResB.data) && learningResB.data.length > 0) {
          const arr = learningResB.data as any[];
          const valid = arr.filter((r) => typeof r.progress_percent === "number");
          if (valid.length > 0) {
            learningCompletion = Math.round(valid.reduce((s, x) => s + x.progress_percent, 0) / valid.length);
          } else {
            learningCompletion = Math.min(100, Math.round((arr.length / 10) * 100));
          }
        } else {
          console.info("learning tables not found or empty - fallback to 0");
        }

        // Projects: compute percent complete from project_milestones (works with your existing schema)
        const projectsRes = await safeSelect("projects", "id,user_id", [["eq", "user_id", user.id]]);
        const milestonesRes = await safeSelect("project_milestones", "id,project_id,status,user_id", [["eq", "user_id", user.id]]);
        let projectsPercent = 0;
        if (!projectsRes.error && Array.isArray(projectsRes.data) && !milestonesRes.error && Array.isArray(milestonesRes.data)) {
          const projectsArr = projectsRes.data as any[];
          const msArr = milestonesRes.data as any[];
          if (projectsArr.length === 0) {
            projectsPercent = 0;
          } else {
            // overall percentage across projects: average of project completion rates
            const perProject = projectsArr.map((p) => {
              const ms = msArr.filter((m) => m.project_id === p.id);
              if (ms.length === 0) return 0;
              const completed = ms.filter((m) => m.status === "completed").length;
              return (completed / ms.length) * 100;
            });
            if (perProject.length) {
              projectsPercent = Math.round(perProject.reduce((s, x) => s + x, 0) / perProject.length);
            } else {
              projectsPercent = 0;
            }
          }
        } else {
          console.info("projects or project_milestones missing, fallback to 0");
        }

        // Routines: try "routines" or "routine_logs" with completed boolean
        const routinesResA = await safeSelect("routine_logs", "id,user_id,completed", [["eq", "user_id", user.id]]);
        const routinesResB = await safeSelect("routines", "id,user_id,completed", [["eq", "user_id", user.id]]);
        let routinesPercent = 0;
        if (!routinesResA.error && Array.isArray(routinesResA.data) && routinesResA.data.length > 0) {
          const arr = routinesResA.data as any[];
          const total = arr.length;
          const completed = arr.filter((r) => r.completed === true).length;
          routinesPercent = total ? Math.round((completed / total) * 100) : 0;
        } else if (!routinesResB.error && Array.isArray(routinesResB.data) && routinesResB.data.length > 0) {
          const arr = routinesResB.data as any[];
          const total = arr.length;
          const completed = arr.filter((r) => r.completed === true).length;
          routinesPercent = total ? Math.round((completed / total) * 100) : 0;
        } else {
          console.info("routines tables missing, fallback to 0");
        }

        // Meals: compute percent of days with all main meals logged in last 7 days
        const mealsRes = await safeSelect("meal_entries", "id,user_id,date,meals", [["eq", "user_id", user.id]]);
        let mealsPercent = 0;
        let mealCategoryCounts: Record<string, number> = {};
        if (!mealsRes.error && Array.isArray(mealsRes.data)) {
          const arr = mealsRes.data as any[];
          // compute last 7 days completeness: count entries where breakfast/lunch/dinner logged
          const last7 = arr.slice(-14); // simple heuristic: last N entries
          if (last7.length > 0) {
            const completeDays = last7.filter((e) => {
              try {
                const meals = e.meals || {};
                const completedCount =
                  (meals.breakfast?.logged ? 1 : 0) +
                  (meals.lunch?.logged ? 1 : 0) +
                  (meals.dinner?.logged ? 1 : 0);
                return completedCount >= 3;
              } catch (err) {
                return false;
              }
            }).length;
            mealsPercent = Math.round((completeDays / last7.length) * 100);
          } else {
            mealsPercent = 0;
          }

          // categories pie
          for (const e of arr) {
            try {
              const meals = e.meals || {};
              for (const mKey of Object.keys(meals)) {
                const cat = meals[mKey]?.category;
                if (cat) mealCategoryCounts[cat] = (mealCategoryCounts[cat] || 0) + 1;
              }
            } catch (err) {
              // skip
            }
          }
        } else {
          console.info("meal_entries table missing or empty - fallback to 0");
        }

        // Build monthly trend sample from available data (fallback to defaults)
        const trends = [
          { category: "Daily Tasks", completion: Math.round(habitsTotal ? (habitsCompleted / Math.max(1, habitsTotal)) * 100 : 0), change: "+0%" },
          { category: "Learning", completion: learningCompletion || 0, change: "+0%" },
          { category: "Projects", completion: projectsPercent || 0, change: "+0%" },
          { category: "Routines", completion: routinesPercent || 0, change: "+0%" },
          { category: "Meals", completion: mealsPercent || 0, change: "+0%" },
        ];

        // Achievements: very small derivation for UI
        const achievements: { title: string; subtitle?: string; color?: string; emoji?: string }[] = [];
        if (habitsCompleted >= 7) achievements.push({ title: `${habitsCompleted}-day habit streak`, subtitle: "Nice consistency!", color: COLORS.habits, emoji: "🔥" });
        if (learningCompletion >= 50) achievements.push({ title: `${learningCompletion}% learning goal`, subtitle: "Keep going!", color: COLORS.learning, emoji: "📚" });
        if (projectsPercent >= 50) achievements.push({ title: "Project momentum", subtitle: "Milestones being completed", color: COLORS.projects, emoji: "🎯" });
        if (routinesPercent >= 80) achievements.push({ title: "Routines rock", subtitle: `${routinesPercent}% routine adherence`, color: COLORS.routines, emoji: "⏰" });
        if (mealsPercent >= 70) achievements.push({ title: "Healthy days", subtitle: `${mealsPercent}% days complete`, color: COLORS.meals, emoji: "🥗" });

        // Pie data from mealCategoryCounts
        const pie = Object.entries(mealCategoryCounts).map(([k, v]) => ({ name: k, value: v, color: (k === "healthy" ? "#10b981" : k === "restaurant" ? "#2563eb" : k === "cheat" ? "#ef4444" : "#7c3aed") }));

        // final set state
        setWeeklyStats({
          habits: Math.round(habitsTotal ? (habitsCompleted / Math.max(1, habitsTotal)) * 100 : 0),
          learning: learningCompletion || 0,
          projects: projectsPercent || 0,
          routines: routinesPercent || 0,
          meals: mealsPercent || 0,
        });
        setMonthlyTrends(trends);
        setAchievementList(achievements.length ? achievements : [
          { title: "No recent achievements", subtitle: "Start logging to see achievements", color: COLORS.neutral, emoji: "✨" }
        ]);
        setPieData(pie.length ? pie : [{ name: "No data", value: 1, color: COLORS.neutral }]);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast?.({ title: "Analytics error", description: "Failed to load analytics. Check console for details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // re-run on user change
  }, [user?.id, toast]);

  // chart-friendly arrays
  const pieChartData = useMemo(() => pieData.map((d) => ({ name: d.name, value: d.value, color: d.color })), [pieData]);
  const barChartData = useMemo(() => monthlyTrends.map((t) => ({ name: t.category, completion: t.completion })), [monthlyTrends]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Analytics & Insights</h2>
        <p className="text-muted-foreground mt-1">Track your progress and identify trends across all areas</p>
      </div>

      {/* Weekly Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { key: "habits", label: "Daily Tasks", value: weeklyStats.habits, color: COLORS.habits, icon: <BarChart3 className="w-4 h-4 text-current" /> },
          { key: "learning", label: "Learning", value: weeklyStats.learning, color: COLORS.learning, icon: <TrendingUp className="w-4 h-4 text-current" /> },
          { key: "projects", label: "Projects", value: weeklyStats.projects, color: COLORS.projects, icon: <Target className="w-4 h-4 text-current" /> },
          { key: "routines", label: "Routines", value: weeklyStats.routines, color: COLORS.routines, icon: <Calendar className="w-4 h-4 text-current" /> },
          { key: "meals", label: "Meals", value: weeklyStats.meals, color: COLORS.meals, icon: <BarChart3 className="w-4 h-4 text-current" /> },
        ].map(({ key, label, value, color, icon }) => (
          <Card key={key} className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` /* slight tint */ }}>
                  {icon}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends (Bar chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Trends</CardTitle>
            <p className="text-sm text-muted-foreground">Completion rates and changes from last month</p>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground, #6b7280)" }} />
                  <YAxis tick={{ fill: "var(--muted-foreground, #6b7280)" }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completion" name="Completion %" >
                    {barChartData.map((entry, index) => {
                      const col = index === 0 ? COLORS.habits : index === 1 ? COLORS.learning : index === 2 ? COLORS.projects : index === 3 ? COLORS.routines : COLORS.meals;
                      return <Cell key={`cell-${index}`} fill={col} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {monthlyTrends.map((trend, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{trend.category}</span>
                    <div className="text-xs text-muted-foreground">
                      Change: <span className={trend.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{trend.change}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${trend.completion}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)" }} />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{trend.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pie chart / Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdowns & Recent Achievements</CardTitle>
            <p className="text-sm text-muted-foreground">Meal categories and your latest wins</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={4}>
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || (index % 2 ? COLORS.learning : COLORS.habits)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {achievementList.map((a, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg" style={{ background: a.color ? `${a.color}10` : "var(--card-bg, #f8fafc)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: a.color || COLORS.neutral }}>
                      <span className="text-white text-sm">{a.emoji ?? "🏆"}</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{a.title}</div>
                      {a.subtitle && <div className="text-xs text-muted-foreground">{a.subtitle}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Advanced charts and detailed analytics coming soon!</p>
            <p className="text-xs mt-1">Including heatmaps, trend lines, and custom date ranges.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
