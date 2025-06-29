
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Feedback, ActivityLog, ActivityAction, LearningGoal, TimeBlock, LearningEntry, Habit, Routine, SubTask } from '../types';
import { formatDateISO, getDateForDayOfWeek } from '../utils/dateUtils';


interface UserContextType {
    currentUser: User | null;
    users: User[];
    login: (username: string, password: string) => Promise<User>;
    logout: () => void;
    register: (name: string, username: string, password: string) => Promise<User>;
    updateUser: (updatedUser: User) => void;
    deleteUser: (userId: string) => Promise<void>;
    
    feedback: Feedback[];
    submitFeedback: (content: string) => Promise<void>;
    
    activityLogs: ActivityLog[];
    logActivity: (action: ActivityAction, user?: User | null) => void;

    // Onboarding
    setupExampleData: () => void;

    // Tracker Data
    habits: Habit[];
    saveHabit: (habitData: Omit<Habit, 'id' | 'completions'>, existingId?: string) => void;
    deleteHabit: (habitId: string) => void;
    toggleHabitCompletion: (habitId: string, date: Date) => void;

    learningGoals: LearningGoal[];
    saveLearningGoal: (goalData: Omit<LearningGoal, 'id' | 'entries'>, existingId?: string) => void;
    deleteLearningGoal: (goalId: string) => void;
    logLearningProgress: (goalId: string, date: Date, entry: LearningEntry) => void;

    timeBlocks: TimeBlock[];
    saveTimeBlock: (blockData: TimeBlock) => void;
    deleteTimeBlock: (blockId: string) => void;

    routines: Routine[];
    saveRoutine: (routineData: Omit<Routine, 'id' | 'completions'>, existingId?: string) => void;
    deleteRoutine: (routineId: string) => void;
    toggleRoutineSubTask: (routineId: string, subTaskId: string, date: Date) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function to safely get data from localStorage
const getStoredValue = <T,>(key: string, initialValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return initialValue;
    }
};

const setStoredValue = <T,>(key: string, value: T) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
    }
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- Auth & Admin State ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(() => getStoredValue('users', []));
    const [feedback, setFeedback] = useState<Feedback[]>(() => getStoredValue('feedback', []));
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => getStoredValue('activityLogs', []));

    // --- Tracker State ---
    const [habits, setHabits] = useState<Habit[]>([]);
    const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
    const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
    const [routines, setRoutines] = useState<Routine[]>([]);

    // --- Persistence Effects ---
    useEffect(() => { setStoredValue('users', users); }, [users]);
    useEffect(() => { setStoredValue('feedback', feedback); }, [feedback]);
    useEffect(() => { setStoredValue('activityLogs', activityLogs); }, [activityLogs]);

    useEffect(() => { if (currentUser) { setStoredValue(`habits-${currentUser.id}`, habits); } }, [habits, currentUser]);
    useEffect(() => { if (currentUser) { setStoredValue(`learningGoals-${currentUser.id}`, learningGoals); } }, [learningGoals, currentUser]);
    useEffect(() => { if (currentUser) { setStoredValue(`timeBlocks-${currentUser.id}`, timeBlocks); } }, [timeBlocks, currentUser]);
    useEffect(() => { if (currentUser) { setStoredValue(`routines-${currentUser.id}`, routines); } }, [routines, currentUser]);


    // --- Auth & User Management ---
    useEffect(() => {
        const loggedInUserId = sessionStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            const user = users.find(u => u.id === loggedInUserId);
            if (user) {
                const { password, ...userWithoutPassword } = user;
                setCurrentUser(userWithoutPassword as User);
            } else {
                sessionStorage.removeItem('loggedInUserId');
                setCurrentUser(null);
            }
        } else {
             setCurrentUser(null);
        }
    }, [users]);
    
    // Effect to load user-specific data on login
    useEffect(() => {
        if (currentUser) {
            setHabits(getStoredValue(`habits-${currentUser.id}`, []));
            setLearningGoals(getStoredValue(`learningGoals-${currentUser.id}`, []));
            setTimeBlocks(getStoredValue(`timeBlocks-${currentUser.id}`, []));
            setRoutines(getStoredValue(`routines-${currentUser.id}`, []));
        } else {
            // Clear data on logout
            setHabits([]);
            setLearningGoals([]);
            setTimeBlocks([]);
            setRoutines([]);
        }
    }, [currentUser]);

    const logActivity = (action: ActivityAction, user: User | null = currentUser) => {
        if (!user) return;
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            userId: user.id,
            username: user.username,
            action,
            timestamp: new Date().toISOString()
        };
        setActivityLogs(prev => [newLog, ...prev]);
    };

    const login = (username: string, password: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

            if (username.toLowerCase() === 'zron' && password === 'devminkhant') {
                if (!user) {
                    const adminUser = {
                        id: `admin-${Date.now()}`, name: 'Admin', username: 'zron',
                        password: 'devminkhant', hasCompletedTour: true, hasSetupExamples: true, role: 'admin' as const,
                    };
                    setUsers(prev => [...prev, adminUser]);
                    user = adminUser;
                } else if (user.role !== 'admin' || !user.password) {
                     setUsers(prev => prev.map(u => u.id === user!.id ? {...u, role: 'admin' as const, password: 'devminkhant'} : u));
                     user = {...user, role: 'admin' as const, password: 'devminkhant'};
                }
            }
            
            if (user && user.password === password) {
                const { password: userPassword, ...userWithoutPassword } = user;
                sessionStorage.setItem('loggedInUserId', user.id);
                setCurrentUser(userWithoutPassword as User);
                logActivity('login', user);
                resolve(userWithoutPassword as User);
            } else {
                reject(new Error('Invalid username or password.'));
            }
        });
    };
    
    const register = (name: string, username: string, password: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            if (username.toLowerCase() === 'zron') {
                return reject(new Error('This username is reserved. Please choose another.'));
            }
            if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                reject(new Error('Username already exists.'));
                return;
            }
            const newUser: User = {
                id: `user-${Date.now()}`, name, username, password,
                hasCompletedTour: false, 
                hasSetupExamples: false,
                role: 'user',
            };
            setUsers(prev => [...prev, newUser]);
            
            // Now, log the user in. The data loading effect will pick up the new data.
            const { password: newPassword, ...userWithoutPassword } = newUser;
            sessionStorage.setItem('loggedInUserId', newUser.id);
            setCurrentUser(userWithoutPassword as User);
            logActivity('login', newUser);
            resolve(userWithoutPassword as User);
        });
    };

    const logout = () => {
        sessionStorage.removeItem('loggedInUserId');
        setCurrentUser(null);
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prevUsers => {
            const userIndex = prevUsers.findIndex(u => u.id === updatedUser.id);
            if (userIndex !== -1) {
                const originalUser = prevUsers[userIndex];
                const userWithPass = { ...updatedUser, password: originalUser.password };
                const newUsers = [...prevUsers];
                newUsers[userIndex] = userWithPass;
                return newUsers;
            }
            return prevUsers;
        });
         const { password, ...userWithoutPassword } = updatedUser;
        setCurrentUser(userWithoutPassword as User);
    };
    
    const deleteUser = (userId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (currentUser?.role !== 'admin') {
                return reject(new Error("Permission denied."));
            }
            if (userId === currentUser?.id) {
                return reject(new Error("Admin cannot delete their own account."));
            }
            setUsers(prev => prev.filter(u => u.id !== userId));
            resolve();
        });
    };
    
    const submitFeedback = (content: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!currentUser) {
                return reject(new Error("You must be logged in to submit feedback."));
            }
            const newFeedbackItem: Feedback = {
                id: `fb-${Date.now()}`,
                userId: currentUser.id,
                username: currentUser.username,
                content,
                timestamp: new Date().toISOString(),
            };
            setFeedback(prev => [newFeedbackItem, ...prev]);
            logActivity('feedback_submission');
            resolve();
        });
    };

    // --- Onboarding ---
    const setupExampleData = () => {
        if (!currentUser) return;

        const userId = currentUser.id;
        const today = new Date();
        const getDateStr = (offset: number): string => {
            const date = new Date(today);
            date.setDate(today.getDate() - offset);
            return formatDateISO(date);
        };
        
        const exampleHabits: Habit[] = [
            { id: `habit-${userId}-1`, name: 'Drink 8 Glasses of Water', icon: '', color: '#0ea5e9', completions: { [getDateStr(1)]: true, [getDateStr(2)]: true, [getDateStr(4)]: true } },
            { id: `habit-${userId}-2`, name: 'Exercise for 30 Minutes', icon: '', color: '#22c55e', completions: { [getDateStr(1)]: true, [getDateStr(3)]: true } },
            { id: `habit-${userId}-3`, name: 'Read for 30 Minutes', icon: '', color: '#f97316', completions: { [getDateStr(2)]: true, [getDateStr(5)]: true, [getDateStr(6)]: true } },
        ];

        const morningSubtasks = [
            { id: `st-${userId}-m-1`, name: 'Wake up (6:00 AM)' },
            { id: `st-${userId}-m-2`, name: 'Stretching (10 minutes)' },
            { id: `st-${userId}-m-3`, name: 'Meditation (5 minutes)' },
            { id: `st-${userId}-m-4`, name: 'Healthy Breakfast (20 minutes)' },
        ];
        const eveningSubtasks = [
            { id: `st-${userId}-e-1`, name: 'Tidy up living space' },
            { id: `st-${userId}-e-2`, name: 'Prepare for tomorrow' },
            { id: `st-${userId}-e-3`, name: 'Read a book (no screens)' },
        ];

        const exampleRoutines: Routine[] = [
            {
                id: `routine-${userId}-1`,
                name: 'Morning Routine',
                subTasks: morningSubtasks,
                completions: {
                    [getDateStr(1)]: { [morningSubtasks[0].id]: true, [morningSubtasks[1].id]: true, [morningSubtasks[2].id]: true, [morningSubtasks[3].id]: true },
                    [getDateStr(3)]: { [morningSubtasks[0].id]: true, [morningSubtasks[1].id]: true },
                },
            },
            {
                id: `routine-${userId}-2`,
                name: 'Evening Wind-down',
                subTasks: eveningSubtasks,
                completions: { [getDateStr(2)]: { [eveningSubtasks[0].id]: true, [eveningSubtasks[2].id]: true } },
            }
        ];

        const exampleLearningGoalId = `lg-${userId}-1`;
        const exampleLearningGoals: LearningGoal[] = [
            {
                id: exampleLearningGoalId, name: 'Learn React Hooks', unit: 'hours', targetAmount: 20,
                entries: { [getDateStr(2)]: { value: 1, notes: 'Completed tutorial on useState.' }, [getDateStr(5)]: { value: 1.5, notes: 'Practiced with useEffect.' } },
            },
        ];
        
        const exampleTimeBlocks: TimeBlock[] = [
            { id: `tb-${userId}-1`, day: 1, startTime: '09:00', endTime: '11:00', taskName: 'Deep Work Session', color: '#6366f1', priority: 'High', isCompleted: false, linkedGoalId: undefined },
            { id: `tb-${userId}-2`, day: 3, startTime: '19:00', endTime: '20:00', taskName: 'React Study', color: '#3b82f6', priority: 'Medium', isCompleted: true, linkedGoalId: exampleLearningGoalId },
        ];

        setHabits(exampleHabits);
        setRoutines(exampleRoutines);
        setLearningGoals(exampleLearningGoals);
        setTimeBlocks(exampleTimeBlocks);
    };

    // --- Tracker Functions ---
    const saveHabit = (habitData: Omit<Habit, 'id' | 'completions'>, existingId?: string) => {
        if (existingId) {
            setHabits(prev => prev.map(h => h.id === existingId ? { ...h, ...habitData } : h));
        } else {
            const newHabit: Habit = { id: Date.now().toString(), ...habitData, completions: {} };
            setHabits(prev => [...prev, newHabit]);
        }
    };
    
    const deleteHabit = (habitId: string) => {
        setHabits(prev => prev.filter(h => h.id !== habitId));
    };
    
    const toggleHabitCompletion = (habitId: string, date: Date) => {
        const dateStr = formatDateISO(date);
        setHabits(prev => prev.map(h => {
            if (h.id === habitId) {
                const newCompletions = { ...h.completions };
                newCompletions[dateStr] = !newCompletions[dateStr];
                return { ...h, completions: newCompletions };
            }
            return h;
        }));
    };
    
    const saveLearningGoal = (goalData: Omit<LearningGoal, 'id' | 'entries'>, existingId?: string) => {
        if (existingId) {
            setLearningGoals(prev => prev.map(g => g.id === existingId ? { ...g, ...goalData } : g));
        } else {
            const newGoal: LearningGoal = { id: Date.now().toString(), ...goalData, entries: {} };
            setLearningGoals(prev => [...prev, newGoal]);
        }
    };

    const deleteLearningGoal = (goalId: string) => {
        setLearningGoals(prev => prev.filter(g => g.id !== goalId));
    };

    const logLearningProgress = (goalId: string, date: Date, entry: LearningEntry) => {
        const dateStr = formatDateISO(date);
        setLearningGoals(prevGoals => prevGoals.map(g => {
            if (g.id === goalId) {
                const newEntries = { ...g.entries };
                 if (entry.value > 0 || (entry.notes && entry.notes.trim() !== '')) {
                    newEntries[dateStr] = entry;
                } else {
                    delete newEntries[dateStr];
                }
                return { ...g, entries: newEntries };
            }
            return g;
        }));
    };

    const saveTimeBlock = (blockData: TimeBlock) => {
        setTimeBlocks(prev => {
            const index = prev.findIndex(b => b.id === blockData.id);
            if (index > -1) {
                const newBlocks = [...prev];
                newBlocks[index] = blockData;
                return newBlocks;
            }
            return [...prev, blockData];
        });

        // Integration: Sync with Learning Goals
        if (blockData.isCompleted && blockData.linkedGoalId) {
            const startTime = new Date(`1970-01-01T${blockData.startTime}:00`);
            const endTime = new Date(`1970-01-01T${blockData.endTime}:00`);
            
            if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime()) && endTime > startTime) {
                const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                
                const goal = learningGoals.find(g => g.id === blockData.linkedGoalId);
                const timeBasedUnits = ['minute', 'minutes', 'hour', 'hours'];
                if (goal && timeBasedUnits.some(unit => goal.unit.toLowerCase().includes(unit))) {
                    const logDate = getDateForDayOfWeek(blockData.day, 1);
                    const dateStr = formatDateISO(logDate);
                    
                    const existingEntry = goal.entries[dateStr] || { value: 0, notes: '' };
                    
                    const newEntry: LearningEntry = {
                        value: (existingEntry.value || 0) + durationMinutes,
                        notes: (existingEntry.notes ? existingEntry.notes + '\n' : '') + `+${durationMinutes}min from time block: ${blockData.taskName}`
                    };
                    logLearningProgress(goal.id, logDate, newEntry);
                }
            }
        }
    };

    const deleteTimeBlock = (blockId: string) => {
        setTimeBlocks(prev => prev.filter(b => b.id !== blockId));
    };

    const saveRoutine = (routineData: Omit<Routine, 'id' | 'completions'>, existingId?: string) => {
        if (existingId) {
            setRoutines(prev => prev.map(r => r.id === existingId ? { ...r, ...routineData } : r));
        } else {
            const newRoutine: Routine = { id: Date.now().toString(), ...routineData, completions: {} };
            setRoutines(prev => [...prev, newRoutine]);
        }
    };

    const deleteRoutine = (routineId: string) => {
        setRoutines(prev => prev.filter(r => r.id !== routineId));
    };

    const toggleRoutineSubTask = (routineId: string, subTaskId: string, date: Date) => {
        const dateStr = formatDateISO(date);
        setRoutines(prev => prev.map(r => {
            if (r.id === routineId) {
                const newCompletions = { ...r.completions };
                if (!newCompletions[dateStr]) newCompletions[dateStr] = {};
                newCompletions[dateStr][subTaskId] = !newCompletions[dateStr][subTaskId];
                return { ...r, completions: newCompletions };
            }
            return r;
        }));
    };

    const value: UserContextType = {
        currentUser, users, login, logout, register, updateUser, deleteUser,
        feedback, submitFeedback, activityLogs, logActivity,
        setupExampleData,
        habits, saveHabit, deleteHabit, toggleHabitCompletion,
        learningGoals, saveLearningGoal, deleteLearningGoal, logLearningProgress,
        timeBlocks, saveTimeBlock, deleteTimeBlock,
        routines, saveRoutine, deleteRoutine, toggleRoutineSubTask,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};