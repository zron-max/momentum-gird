import { useEffect, useState, useCallback } from "react";
import { Utensils, Check, Trash2 } from "lucide-react";
import CalendarView from "./CalendarView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

type MealCategoryValue = "healthy" | "restaurant" | "cheat" | "homemade";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealInfo {
  logged: boolean;
  description: string;
  category: MealCategoryValue;
}

interface MealForm {
  breakfast: MealInfo;
  lunch: MealInfo;
  dinner: MealInfo;
  snack: MealInfo;
}

interface MealEntry {
  id?: string | number;
  date: string; // YYYY-MM-DD
  user_id: string;
  meals: MealForm;
}

const NON_SNACK_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

const initialMealForm: MealForm = {
  breakfast: { logged: false, description: "", category: "healthy" },
  lunch: { logged: false, description: "", category: "healthy" },
  dinner: { logged: false, description: "", category: "healthy" },
  snack: { logged: false, description: "", category: "healthy" },
};

function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MealsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mealForm, setMealForm] = useState<MealForm>(initialMealForm);

  const mealCategories: { value: MealCategoryValue; label: string; color: string }[] = [
    { value: "healthy", label: "Healthy", color: "bg-green-500" },
    { value: "restaurant", label: "Restaurant", color: "bg-blue-500" },
    { value: "cheat", label: "Cheat Meal", color: "bg-red-500" },
    { value: "homemade", label: "Homemade", color: "bg-purple-500" },
  ];

  const mealTypes: { key: MealType; label: string; icon: string }[] = [
    { key: "breakfast", label: "Breakfast", icon: "🌅" },
    { key: "lunch", label: "Lunch", icon: "☀️" },
    { key: "dinner", label: "Dinner", icon: "🌙" },
    { key: "snack", label: "Snack", icon: "🍎" },
  ];

  // Fetch meals from Supabase
  useEffect(() => {
    if (!user?.id) return;

    const fetchMeals = async () => {
      const { data, error } = await supabase
        .from("meal_entries")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching meals:", error);
        toast({
          title: "Error",
          description: "Failed to fetch meals.",
          variant: "destructive",
        });
        return;
      }

      setMealEntries((data as MealEntry[]) ?? []);
    };

    fetchMeals();
  }, [user?.id, toast]);

  const handleDayClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const dateString = formatDateToYMD(date);
      const existingEntry = mealEntries.find((e) => e.date === dateString);

      if (existingEntry) {
        setMealForm(existingEntry.meals);
      } else {
        setMealForm(initialMealForm);
      }
    },
    [mealEntries]
  );

  const saveMealEntry = async () => {
    if (!selectedDate || !user?.id) return;

    const dateString = formatDateToYMD(selectedDate);
    const existingEntry = mealEntries.find((e) => e.date === dateString);

    try {
      if (existingEntry?.id != null) {
        // Update existing entry
        const { data, error } = await supabase
          .from("meal_entries")
          .update({ meals: mealForm })
          .eq("id", existingEntry.id)
          .select()
          .single();

        if (error) throw error;

        setMealEntries((prev) =>
          prev.map((e) => (e.id === existingEntry.id ? ((data as MealEntry) ?? e) : e))
        );
      } else {
        // Insert new entry
        const { data, error } = await supabase
          .from("meal_entries")
          .insert({
            user_id: user.id,
            date: dateString,
            meals: mealForm,
          })
          .select()
          .single();

        if (error) throw error;

        setMealEntries((prev) => [...prev, data as MealEntry]);
      }

      toast({
        title: "Success",
        description: "Meals saved successfully",
      });
    } catch (error) {
      console.error("Error saving meal entry:", error);
      toast({
        title: "Error",
        description: "Failed to save meals",
        variant: "destructive",
      });
    }

    setSelectedDate(null);
  };

  const deleteMealEntry = async () => {
    if (!selectedDate || !user?.id) return;

    const dateString = formatDateToYMD(selectedDate);
    const existingEntry = mealEntries.find((e) => e.date === dateString);

    if (!existingEntry || existingEntry.id == null) {
      toast({
        title: "Info",
        description: "No meals to delete for this day.",
      });
      return;
    }

    try {
      const { error } = await supabase.from("meal_entries").delete().eq("id", existingEntry.id);

      if (error) throw error;

      setMealEntries((prev) => prev.filter((e) => e.id !== existingEntry.id));
      toast({
        title: "Success",
        description: "Meals for this day have been deleted.",
      });
    } catch (error) {
      console.error("Error deleting meal entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete meals.",
        variant: "destructive",
      });
    }
    setSelectedDate(null);
  };

  const toggleMeal = (mealType: MealType) => {
    setMealForm((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        logged: !prev[mealType].logged,
      },
    }));
  };

  const updateMealDescription = (mealType: MealType, description: string) => {
    setMealForm((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        description,
      },
    }));
  };

  const updateMealCategory = (mealType: MealType, category: MealCategoryValue) => {
    setMealForm((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        category,
      },
    }));
  };

  const getDayStatus = (date: Date) => {
    const dateString = formatDateToYMD(date);
    const entry = mealEntries.find((e) => e.date === dateString);
    if (!entry) return undefined;

    const loggedMeals = NON_SNACK_MEAL_TYPES.filter((type) => entry.meals[type].logged).length;
    const totalMeals = NON_SNACK_MEAL_TYPES.length;

    if (loggedMeals >= totalMeals) return "complete";
    if (loggedMeals > 0) return "partial";
    return "incomplete";
  };

  // Today's overview (local date)
  const today = formatDateToYMD(new Date());
  const todayEntry = mealEntries.find((e) => e.date === today);
  const loggedMealsToday = todayEntry
    ? NON_SNACK_MEAL_TYPES.filter((t) => todayEntry.meals[t].logged).length
    : 0;
  const totalMealsToday = NON_SNACK_MEAL_TYPES.length;
  const todayCategories = todayEntry
    ? Object.values(todayEntry.meals)
        .filter((m) => m.logged)
        .map((m) => m.category)
    : [];
  const uniqueCategories = [...new Set(todayCategories)];

  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Meal Tracking</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              Log your daily meals and track your eating habits
            </p>
          </div>
        </div>
      </div>

      {/* Main content - Scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Quick Stats */}
          <div className="lg:col-span-1">
            <Card className="dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base lg:text-lg dark:text-gray-100">Today&apos;s Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Utensils className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium dark:text-gray-100">Meals Logged</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {loggedMealsToday} / {totalMealsToday}
                    </Badge>
                  </div>

                  <div className="border-t dark:border-gray-700 pt-3">
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">Categories Used</div>
                    <div className="flex flex-wrap gap-1">
                      {uniqueCategories.length > 0 ? (
                        uniqueCategories.map((catValue) => {
                          const category = mealCategories.find((c) => c.value === catValue);
                          return category ? (
                            <Badge key={category.value} className={`text-xs ${category.color} text-white`}>
                              {category.label}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-xs italic text-gray-400">No categories logged yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-base lg:text-lg dark:text-gray-100">Meal Calendar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Click on any date to log your meals.{" "}
                  <span className="font-bold text-green-500">Green</span> for complete days,{" "}
                  <span className="font-bold text-yellow-500">Yellow</span> for partial days.
                </p>
                <CalendarView
                  onDayClick={handleDayClick}
                  getDayStatus={getDayStatus}
                  statusColors={{
                    complete: "bg-green-500",
                    incomplete: "bg-gray-300 dark:bg-gray-700",
                    partial: "bg-yellow-500",
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Meal Entry Dialog - Optimized for scrolling */}
      {selectedDate && (
        <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] dark:bg-gray-900 dark:border-gray-700 flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="dark:text-gray-100 text-lg">
                Log Meals - {selectedDate.toLocaleDateString()}
              </DialogTitle>
            </DialogHeader>
            
            {/* Scrollable meal content */}
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-4">
                {mealTypes.map((meal) => (
                  <div
                    key={meal.key}
                    className="border rounded-lg p-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{meal.icon}</span>
                        <h4 className="font-medium dark:text-gray-100 text-sm">{meal.label}</h4>
                      </div>
                      <button
                        onClick={() => toggleMeal(meal.key)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          mealForm[meal.key].logged
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400"
                        }`}
                      >
                        {mealForm[meal.key].logged && <Check className="w-3 h-3" />}
                      </button>
                    </div>

                    {mealForm[meal.key].logged && (
                      <div className="space-y-2">
                        <Input
                          placeholder={`Describe your ${meal.label.toLowerCase()}...`}
                          value={mealForm[meal.key].description}
                          onChange={(e) => updateMealDescription(meal.key, e.target.value)}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 text-sm"
                        />

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Category
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {mealCategories.map((category) => (
                              <button
                                key={category.value}
                                onClick={() => updateMealCategory(meal.key, category.value)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  mealForm[meal.key].category === category.value
                                    ? `${category.color} text-white`
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                                }`}
                              >
                                {category.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed action buttons */}
            <div className="flex-shrink-0 border-t dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center space-x-2">
                <Button variant="destructive" onClick={deleteMealEntry} className="flex items-center text-sm">
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSelectedDate(null)} className="text-sm">
                    Cancel
                  </Button>
                  <Button onClick={saveMealEntry} className="text-sm">Save Meals</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MealsTab;