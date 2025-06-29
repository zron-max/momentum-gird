
export enum AppView {
  Habits = 'Habits',
  Learning = 'Learning',
  Projects = 'Projects',
  Routines = 'Routines',
  TimeBlocks = 'Time Blocks',
  Meals = 'Meals',
}

// --- Auth ---
export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // This is for simulation, would be hashed in production
  hasCompletedTour: boolean;
  role: 'admin' | 'user';
}

// --- Activity & Feedback ---
export type ActivityAction = 'login' | 'setting_change_dark_mode' | 'feedback_submission';

export interface ActivityLog {
    id: string;
    userId: string;
    username: string;
    action: ActivityAction;
    timestamp: string; // ISO string
}

export interface Feedback {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: string; // ISO string
}


// --- Habit Tracker ---
export interface Habit {
  id:string;
  name: string;
  icon: string;
  color: string;
  completions: { [date: string]: boolean };
}

// --- Learning Tracker ---
export interface LearningEntry {
  value: number;
  notes?: string;
}

export interface LearningGoal {
  id: string;
  name: string;
  unit: string;
  targetAmount: number;
  entries: { [date: string]: LearningEntry };
}

// --- Project Tracker ---
export type MilestoneStatus = 'To Do' | 'In Progress' | 'Completed' | 'Delayed';

export interface Project {
  id: string;
  name: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: MilestoneStatus;
}

// --- Routine Tracker ---
export interface SubTask {
  id: string;
  name: string;
}

export interface Routine {
  id: string;
  name: string;
  subTasks: SubTask[];
  completions: { [date: string]: { [subTaskId: string]: boolean } };
}

// --- Time Blocks ---
export type TimeBlockPriority = 'Low' | 'Medium' | 'High';
export const PRIORITIES: TimeBlockPriority[] = ['Low', 'Medium', 'High'];

export interface TimeBlock {
  id: string;
  day: number; // 0 for Sun, 1 for Mon, etc.
  startTime: string; // "HH:mm" format, e.g., "09:00"
  endTime: string; // "HH:mm" format, e.g., "10:30"
  taskName: string;
  color: string;
  priority: TimeBlockPriority;
  isCompleted: boolean;
  linkedGoalId?: string;
}


// --- Meal Tracker ---
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const MEAL_CATEGORIES = ['Healthy', 'Restaurant', 'Cheat Meal', 'Homemade', 'Other'];

export interface MealLogEntry {
  logged: boolean;
  details?: string;
  category?: string;
}

export interface DailyMealLog {
  [date: string]: {
    [key in MealType]?: MealLogEntry;
  };
}