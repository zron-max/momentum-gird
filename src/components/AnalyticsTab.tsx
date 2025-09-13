// AnalyticsTab.tsx (refactored)
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
  neutral: "#94a3b8",
};

/**
 * Helpers
 */
function isTruthyBool(v: any) {
  if (v === true) return true;
  if (v === false) return false;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "t" || s === "yes" || s === "y";
  }
  return Boolean(v);
}
function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function formatYMD(d: Date) {
  return d.toISOString().split("T")[0];
}
function daysAgoDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * A safe wrapper for basic selects (keeps your original safeSelect idea)
 */
async function safeSelect(table: string, cols = "*", filters: any[] = []) {
  try {
    let q = supabase.from(table).select(cols).limit(5000);
    for (const f of filters) {
      const [method, column, value] = f;
      // @ts-ignore dynamic
      q = (q as any)[method](column, value);
    }
    const { data, error } = await q;
    if (error) {
      console.warn(`safeSelect: error selecting from ${table}:`, error.message || error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error("safeSelect unexpected error:", err);
    return { data: null, error: err };
  }
}

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
  const [pieData, setPieData] = useState<{ name: string; value: number; color?: string }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // ---- MEALS (existing approach) ----
        const mealsRes = await safeSelect(
          "meal_entries",
          "id,user_id,date,meals",
          [["eq", "user_id", user.id]]
        );
        let mealsPercent = 0;
        let mealCategoryCounts: Record<string, number> = {};
        let mealsArr: any[] = [];
        if (!mealsRes.error && Array.isArray(mealsRes.data)) {
          mealsArr = mealsRes.data as any[];
          // compute last 7 days completeness properly by date
          const last7Start = daysAgoDate(6); // include today + 6 previous days = 7 days
          // filter entries by date >= last7Start
          const last7 = mealsArr.filter((e) => {
            try {
              const d = new Date(e.date);
              d.setHours(0, 0, 0, 0);
              return d >= last7Start;
            } catch {
              return false;
            }
          });
          if (last7.length > 0) {
            const completeDays = last7.filter((e) => {
              try {
                const meals = e.meals || {};
                const completedCount =
                  (meals.breakfast?.logged ? 1 : 0) +
                  (meals.lunch?.logged ? 1 : 0) +
                  (meals.dinner?.logged ? 1 : 0);
                return completedCount >= 3;
              } catch {
                return false;
              }
            }).length;
            mealsPercent = Math.round((completeDays / Math.max(1, last7.length)) * 100);
          } else {
            mealsPercent = 0;
          }

          // categories pie
          for (const e of mealsArr) {
            try {
              const meals = e.meals || {};
              for (const mKey of Object.keys(meals)) {
                const cat = meals[mKey]?.category;
                if (cat) mealCategoryCounts[cat] = (mealCategoryCounts[cat] || 0) + 1;
              }
            } catch {}
          }
        } else {
          console.info("meal_entries missing or empty - fallback to 0");
        }

        // ---- PROJECTS (existing approach, kept) ----
        const projectsRes = await safeSelect("projects", "id,user_id", [["eq", "user_id", user.id]]);
        const milestonesRes = await safeSelect(
          "project_milestones",
          "id,project_id,status,user_id",
          [["eq", "user_id", user.id]]
        );
        let projectsPercent = 0;
        if (
          !projectsRes.error &&
          Array.isArray(projectsRes.data) &&
          !milestonesRes.error &&
          Array.isArray(milestonesRes.data)
        ) {
          const projectsArr = projectsRes.data as any[];
          const msArr = milestonesRes.data as any[];
          if (projectsArr.length === 0) {
            projectsPercent = 0;
          } else {
            const perProject = projectsArr.map((p) => {
              const ms = msArr.filter((m) => m.project_id === p.id);
              if (ms.length === 0) return 0;
              const completed = ms.filter((m) => String(m.status) === "completed").length;
              return (completed / ms.length) * 100;
            });
            projectsPercent = perProject.length
              ? Math.round(perProject.reduce((s, x) => s + x, 0) / perProject.length)
              : 0;
          }
        } else {
          console.info("projects or project_milestones missing, fallback to 0");
        }

        // ---- HABITS: compute completion% from habit_entries (robust) ----
        // approach: calculate completion over the last 7 days:
        // completionRate = (completed_count_in_window) / (distinct_habit_count * daysWindow) * 100
        const habitsRes = await safeSelect("habits", "id,user_id", [["eq", "user_id", user.id]]);
        const habitEntriesRes = await safeSelect(
          "habit_entries",
          "id,habit_id,user_id,date,completed",
          [["eq", "user_id", user.id]]
        );
        let habitsPercent = 0;
        if (
          !habitsRes.error &&
          Array.isArray(habitsRes.data) &&
          !habitEntriesRes.error &&
          Array.isArray(habitEntriesRes.data)
        ) {
          const habitsArr = habitsRes.data as any[];
          const habitEntriesArr = habitEntriesRes.data as any[];

          const distinctHabits = [...new Set(habitsArr.map((h) => h.id))];
          const daysWindow = 7;
          const windowStart = daysAgoDate(daysWindow - 1); // include today

          // count completed entries in window
          let completedCount = 0;
          let possibleCount = distinctHabits.length * daysWindow;
          if (possibleCount === 0) {
            habitsPercent = 0;
          } else {
            for (const e of habitEntriesArr) {
              try {
                const d = new Date(e.date);
                d.setHours(0, 0, 0, 0);
                if (d >= windowStart && distinctHabits.includes(e.habit_id)) {
                  if (isTruthyBool(e.completed)) completedCount++;
                }
              } catch {
                // skip bad date
              }
            }
            habitsPercent = Math.round((completedCount / Math.max(1, possibleCount)) * 100);
          }
        } else {
          console.info("habits or habit_entries missing - fallback to 0");
        }

        // ---- LEARNING: use learning_goals + learning_entries to compute average progress ----
        // For each goal: progress = sum(entries.values) / target_value (cap 100). Then average across goals.
        const learningGoalsRes = await safeSelect("learning_goals", "id,user_id,target_value", [
          ["eq", "user_id", user.id],
        ]);
        const learningEntriesRes = await safeSelect("learning_entries", "id,goal_id,user_id,value", [
          ["eq", "user_id", user.id],
        ]);
        let learningCompletion = 0;
        if (
          !learningGoalsRes.error &&
          Array.isArray(learningGoalsRes.data) &&
          !learningEntriesRes.error &&
          Array.isArray(learningEntriesRes.data)
        ) {
          const goals = (learningGoalsRes.data || []) as any[];
          const entries = (learningEntriesRes.data || []) as any[];

          if (goals.length === 0) {
            learningCompletion = 0;
          } else {
            const perGoal = goals.map((g) => {
              const target = toNumber(g.target_value, 0);
              if (target <= 0) {
                return 0;
              }
              const sumForGoal = entries
                .filter((r) => String(r.goal_id) === String(g.id))
                .reduce((s, r) => s + toNumber(r.value, 0), 0);
              return Math.min(100, Math.round((sumForGoal / target) * 100));
            });
            learningCompletion = Math.round(perGoal.reduce((s, x) => s + x, 0) / perGoal.length);
          }
        } else {
          console.info("learning_goals or learning_entries missing - fallback to 0");
        }

        // ---- ROUTINES: compute percent of days where all tasks completed over last 7 days ----
        // approach: find routines count, for each day in window compute how many routines had all tasks done; compute percent
        const routinesRes = await safeSelect("routines", "id,user_id,tasks", [["eq", "user_id", user.id]]);
        const routineEntriesRes = await safeSelect(
          "routine_entries",
          "id,routine_id,user_id,date,completed_tasks",
          [["eq", "user_id", user.id]]
        );
        let routinesPercent = 0;
        if (
          !routinesRes.error &&
          Array.isArray(routinesRes.data) &&
          !routineEntriesRes.error &&
          Array.isArray(routineEntriesRes.data)
        ) {
          const routinesArr = routinesRes.data as any[];
          const routineEntriesArr = routineEntriesRes.data as any[];

          const routineIds = routinesArr.map((r) => r.id);
          const daysWindow = 7;
          const windowStart = daysAgoDate(daysWindow - 1);

          if (routineIds.length === 0) {
            routinesPercent = 0;
          } else {
            // For each date in window, compute fraction of routines fully done
            let daysCounts: number[] = []; // fraction per day
            for (let i = 0; i < daysWindow; i++) {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              d.setDate(d.getDate() - i);
              const dateStr = formatYMD(d);
              let completedRoutines = 0;
              for (const r of routinesArr) {
                const rTasks = Array.isArray(r.tasks) ? r.tasks : [];
                const re = routineEntriesArr.find((e: any) => String(e.routine_id) === String(r.id) && String(e.date) === dateStr);
                if (re && Array.isArray(re.completed_tasks) && re.completed_tasks.length >= rTasks.length && rTasks.length > 0) {
                  completedRoutines++;
                }
              }
              daysCounts.push((completedRoutines / Math.max(1, routineIds.length)) * 100);
            }
            // average across days
            routinesPercent = Math.round(daysCounts.reduce((s, x) => s + x, 0) / Math.max(1, daysCounts.length));
          }
        } else {
          console.info("routines or routine_entries missing - fallback to 0");
        }

        // ---- Build monthly trends and achievements and pie data ----
        const trends = [
          { category: "Daily Tasks", completion: habitsPercent, change: "+0%" },
          { category: "Learning", completion: learningCompletion, change: "+0%" },
          { category: "Projects", completion: projectsPercent, change: "+0%" },
          { category: "Routines", completion: routinesPercent, change: "+0%" },
          { category: "Meals", completion: mealsPercent, change: "+0%" },
        ];

        const achievements: { title: string; subtitle?: string; color?: string; emoji?: string }[] = [];
        if (habitsPercent >= 70) achievements.push({ title: `Consistent: ${habitsPercent}% habits`, subtitle: "Good job!", color: COLORS.habits, emoji: "🔥" });
        if (learningCompletion >= 50) achievements.push({ title: `${learningCompletion}% learning goal`, subtitle: "Keep going!", color: COLORS.learning, emoji: "📚" });
        if (projectsPercent >= 50) achievements.push({ title: "Project momentum", subtitle: "Milestones being completed", color: COLORS.projects, emoji: "🎯" });
        if (routinesPercent >= 80) achievements.push({ title: "Routine adherence", subtitle: `${routinesPercent}%`, color: COLORS.routines, emoji: "⏰" });
        if (mealsPercent >= 70) achievements.push({ title: "Healthy days", subtitle: `${mealsPercent}% complete`, color: COLORS.meals, emoji: "🥗" });

        const pie = Object.entries(mealCategoryCounts).map(([k, v]) => ({
          name: k,
          value: v,
          color: k === "healthy" ? "#10b981" : k === "restaurant" ? "#2563eb" : k === "cheat" ? "#ef4444" : "#7c3aed",
        }));

        // final set state
        setWeeklyStats({
          habits: habitsPercent || 0,
          learning: learningCompletion || 0,
          projects: projectsPercent || 0,
          routines: routinesPercent || 0,
          meals: mealsPercent || 0,
        });
        setMonthlyTrends(trends);
        setAchievementList(achievements.length ? achievements : [{ title: "No recent achievements", subtitle: "Start logging to see achievements", color: COLORS.neutral, emoji: "✨" }]);
        setPieData(pie.length ? pie : [{ name: "No data", value: 1, color: COLORS.neutral }]);

        // debug logs (remove in prod)
        console.debug("Analytics fetched:", {
          habitsPercent,
          learningCompletion,
          projectsPercent,
          routinesPercent,
          mealsPercent,
          mealsCount: (mealsArr || []).length,
        });
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast?.({
          title: "Analytics error",
          description: "Failed to load analytics. Check console for details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user?.id, toast]);

  const pieChartData = useMemo(() => pieData.map((d) => ({ name: d.name, value: toNumber(d.value, 0), color: d.color })), [pieData]);
  const barChartData = useMemo(() => monthlyTrends.map((t) => ({ name: t.category, completion: toNumber(t.completion, 0) })), [monthlyTrends]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Analytics & Insights</h2>
        <p className="text-muted-foreground mt-1">Track your progress and identify trends across all areas</p>
      </div>

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
                <span className="text-2xl font-bold" style={{ color }}>{toNumber(value, 0)}%</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
                  {icon}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Bar dataKey="completion" name="Completion %">
                    {barChartData.map((entry, index) => {
                      const col =
                        index === 0 ? COLORS.habits :
                        index === 1 ? COLORS.learning :
                        index === 2 ? COLORS.projects :
                        index === 3 ? COLORS.routines : COLORS.meals;
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
                    <div className="text-xs text-muted-foreground">Change: <span className={trend.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{trend.change}</span></div>
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
