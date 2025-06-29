
import React, { useState, useMemo, useEffect } from 'react';
import {
    Habit, LearningGoal, Project, Milestone, Routine, DailyMealLog, AppView,
    SubTask, MilestoneStatus, MealType, MEAL_TYPES, MEAL_CATEGORIES, LearningEntry, TimeBlock, TimeBlockPriority, PRIORITIES
} from '../../types';
import { formatDateISO } from '../../utils/dateUtils';
import { Modal, CalendarView, Button, Input, Select } from '../ui/SharedUI';
import { IconPlus, IconTrash, IconPencil, IconSparkles, IconLearning, IconProjects, IconMeals, IconTimeBlocks, IconCheck } from '../ui/Icons';
import { generateRoutineFromAI } from '../../services/geminiService';
import { useUser } from '../../contexts/UserContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';


// --- Habit Tracker ---
export const HabitTracker: React.FC = () => {
    const { habits, saveHabit, deleteHabit, toggleHabitCompletion } = useUser();
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    const selectedHabit = useMemo(() => habits.find(h => h.id === selectedHabitId) || habits[0] || null, [habits, selectedHabitId]);
    
    // Select first habit if none is selected
    React.useEffect(() => {
        if (!selectedHabitId && habits.length > 0) {
            setSelectedHabitId(habits[0].id);
        } else if (habits.length === 0) {
            setSelectedHabitId(null);
        }
    }, [habits, selectedHabitId]);

    const handleToggleCompletion = (habitId: string, date: Date) => {
        toggleHabitCompletion(habitId, date);
    };

    const handleSaveHabit = (name: string, icon: string, color: string) => {
        saveHabit({ name, icon, color }, editingHabit?.id);
        setIsModalOpen(false);
        setEditingHabit(null);
    };

    const handleDeleteHabit = (id: string) => {
        deleteHabit(id);
        if (selectedHabitId === id) {
            setSelectedHabitId(null);
        }
    };
    
    const calculateStreaks = (completions: { [date: string]: boolean }) => {
        const dates = Object.keys(completions).filter(d => completions[d]).sort().reverse();
        if (dates.length === 0) return { current: 0, longest: 0 };

        let longest = 0;
        let currentStreak = 0;
        let tempStreak = 0;

        // Check current streak from today/yesterday
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const todayStr = formatDateISO(today);
        const yesterdayStr = formatDateISO(yesterday);
        
        let lastDate = new Date(todayStr);

        if(completions[todayStr] || completions[yesterdayStr]){
            if(completions[formatDateISO(lastDate)]) currentStreak++; else lastDate.setDate(lastDate.getDate()-1);

            for (let i = 0; i < dates.length; i++) {
                 const d = new Date(dates[i]);
                 if(formatDateISO(d) === formatDateISO(lastDate) && completions[formatDateISO(d)]){
                     const nextDate = new Date(d);
                     nextDate.setDate(nextDate.getDate() - 1);
                     if(completions[formatDateISO(nextDate)]){
                         currentStreak++;
                         lastDate = nextDate;
                     } else {
                         break;
                     }
                 }
            }
        }

        // Calculate longest streak
        for (let i = 0; i < dates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const currentDate = new Date(dates[i]);
                const prevDate = new Date(dates[i - 1]);
                const diff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);
                if (diff === 1) {
                    tempStreak++;
                } else {
                    longest = Math.max(longest, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        longest = Math.max(longest, tempStreak, currentStreak);
        
        return { current: currentStreak, longest };
    };

    const renderDayContent = (date: Date) => {
        if (!selectedHabit) return null;
        const dateStr = formatDateISO(date);
        const isCompleted = selectedHabit.completions[dateStr];
        return isCompleted ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedHabit.color, opacity: 0.8 }}>
                <span className="text-white font-bold">✓</span>
            </div>
        ) : null;
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="md:w-1/3 lg:w-1/4 bg-card-light dark:bg-card-dark p-4 rounded-lg shadow space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Habits</h2>
                    <Button onClick={() => { setEditingHabit(null); setIsModalOpen(true); }} className="!p-2">
                        <IconPlus className="w-5 h-5" />
                    </Button>
                </div>
                <div className="space-y-2">
                    {habits.map(habit => {
                        const { current, longest } = calculateStreaks(habit.completions);
                        return (
                            <div key={habit.id} onClick={() => setSelectedHabitId(habit.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedHabitId === habit.id ? 'ring-2 ring-primary-500' : 'hover:bg-bkg-light dark:hover:bg-bkg-dark'}`}
                                style={{ borderLeft: `4px solid ${habit.color}` }}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-text-light dark:text-text-dark">{habit.name}</span>
                                    <div>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingHabit(habit); setIsModalOpen(true);}} className="p-1 hover:text-primary-500"><IconPencil className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteHabit(habit.id);}} className="p-1 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                                    <span>Current Streak: {current} 🔥</span> | <span>Longest: {longest}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {habits.length === 0 && <p className="text-center text-text-muted-light dark:text-text-muted-dark p-4">No habits yet. Add one!</p>}
            </div>

            <div className="md:w-2/3 lg:w-3/4 flex flex-col gap-6">
                <CalendarView selectedDate={selectedDate} setSelectedDate={setSelectedDate} renderDayContent={renderDayContent} />
                {selectedHabit && (
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow">
                         <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Log for {selectedDate.toLocaleDateString()}</h3>
                         <div className="flex items-center gap-4">
                             <input
                                 type="checkbox"
                                 id={`habit-check-${selectedHabit.id}`}
                                 className="h-6 w-6 rounded text-primary-600 focus:ring-primary-500"
                                 style={{ accentColor: selectedHabit.color }}
                                 checked={!!selectedHabit.completions[formatDateISO(selectedDate)]}
                                 onChange={() => handleToggleCompletion(selectedHabit.id, selectedDate)}
                             />
                             <label htmlFor={`habit-check-${selectedHabit.id}`} className="font-medium text-text-light dark:text-text-dark">
                                 Mark "{selectedHabit.name}" as completed
                             </label>
                         </div>
                    </div>
                )}
            </div>

            <HabitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveHabit}
                habit={editingHabit}
            />
        </div>
    );
};

const HabitModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (name: string, icon: string, color: string) => void, habit: Habit | null }> =
    ({ isOpen, onClose, onSave, habit }) => {
        const [name, setName] = useState('');
        const [color, setColor] = useState('#3b82f6');

        useEffect(() => {
            if (habit) {
                setName(habit.name);
                setColor(habit.color);
            } else {
                setName('');
                setColor('#3b82f6');
            }
        }, [habit, isOpen]);

        const handleSubmit = () => {
            if (name) {
                onSave(name, '', color);
            }
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title={habit ? "Edit Habit" : "Add New Habit"}
                footer={
                    <>
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit}>Save</Button>
                    </>
                }>
                <div className="space-y-4">
                    <Input label="Habit Name" id="habit-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Exercise for 30 minutes" />
                    <div>
                        <label htmlFor="habit-color" className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">Color</label>
                        <input type="color" id="habit-color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 border-none rounded-md" />
                    </div>
                </div>
            </Modal>
        );
    };


// --- Learning Tracker ---
const LearningGoalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (goalData: Omit<LearningGoal, 'id' | 'entries'>) => void;
    goal: LearningGoal | null;
}> = ({ isOpen, onClose, onSave, goal }) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [targetAmount, setTargetAmount] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen) {
            if (goal) {
                setName(goal.name);
                setUnit(goal.unit);
                setTargetAmount(goal.targetAmount);
            } else {
                setName('');
                setUnit('minutes');
                setTargetAmount('');
            }
        }
    }, [goal, isOpen]);

    const handleSubmit = () => {
        if (name && unit && targetAmount !== '' && targetAmount > 0) {
            onSave({ name, unit, targetAmount });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={goal ? "Edit Learning Goal" : "Add New Learning Goal"}
            footer={<>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Save</Button>
            </>}
        >
            <div className="space-y-4">
                <Input label="Goal Name" id="goal-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Read 'Sapiens'" />
                <Input label="Unit of Measurement" id="goal-unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g., Pages, Minutes, Chapters" />
                <Input label="Target Amount" id="goal-target" type="number" value={targetAmount} onChange={e => setTargetAmount(Number(e.target.value) || '')} placeholder="e.g., 450" />
            </div>
        </Modal>
    );
};

const LogProgressModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: LearningEntry) => void;
    existingEntry: LearningEntry | null;
    goal: LearningGoal | null;
    date: Date | null;
}> = ({ isOpen, onClose, onSave, existingEntry, goal, date }) => {
    const [value, setValue] = useState<number | ''>('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setValue(existingEntry?.value || '');
            setNotes(existingEntry?.notes || '');
        }
    }, [existingEntry, isOpen]);

    const handleSubmit = () => {
        if (typeof value === 'number') {
            onSave({ value, notes });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Log Progress for ${date?.toLocaleDateString()}`}
            footer={<>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Save Log</Button>
            </>}
        >
            <div className="space-y-4">
                <h3 className="font-semibold text-text-light dark:text-text-dark">Goal: {goal?.name}</h3>
                <Input label={`Amount Completed (${goal?.unit})`} id="log-value" type="number" value={value} onChange={e => setValue(Number(e.target.value) || '')} placeholder="e.g., 25" />
                <div>
                    <label htmlFor="log-notes" className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">Notes (Optional)</label>
                    <textarea
                        id="log-notes"
                        rows={4}
                        className="w-full px-3 py-2 bg-bkg-light dark:bg-bkg-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary-500 focus:border-primary-500 text-text-light dark:text-text-dark"
                        placeholder="Any thoughts or key takeaways?"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export const LearningTracker: React.FC = () => {
    const { learningGoals: goals, saveLearningGoal, deleteLearningGoal, logLearningProgress } = useUser();
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
    
    const [isLogModalOpen, setLogModalOpen] = useState(false);
    const [loggingDate, setLoggingDate] = useState<Date | null>(null);

    const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId) || goals[0] || null, [goals, selectedGoalId]);

    useEffect(() => {
        if (!selectedGoalId && goals.length > 0) {
            setSelectedGoalId(goals[0].id);
        } else if (goals.length === 0) {
            setSelectedGoalId(null);
        }
    }, [goals, selectedGoalId]);
    
    const calculateProgress = (goal: LearningGoal) => {
        const total = Object.values(goal.entries).reduce((sum, entry) => sum + (entry.value || 0), 0);
        const percentage = goal.targetAmount > 0 ? (total / goal.targetAmount) * 100 : 0;
        return { total, percentage };
    };

    const handleSaveGoal = (goalData: Omit<LearningGoal, 'id' | 'entries'>) => {
        saveLearningGoal(goalData, editingGoal?.id);
        if (!editingGoal) {
           const newId = goals[goals.length-1]?.id; // A bit of a hack, but context doesn't return the new goal
           // In a real app, save function would return the new object.
        }
        setGoalModalOpen(false);
        setEditingGoal(null);
    };

    const handleDeleteGoal = (id: string) => {
        deleteLearningGoal(id);
    };
    
    const openLogModalForDate = (date: Date) => {
        if (!selectedGoal) return;
        setLoggingDate(date);
        setLogModalOpen(true);
    };

    const handleLogProgress = (entry: LearningEntry) => {
        if (!selectedGoal || !loggingDate) return;
        logLearningProgress(selectedGoal.id, loggingDate, entry);
        setLogModalOpen(false);
        setLoggingDate(null);
    };
    
    const renderDayContent = (date: Date) => {
        if (!selectedGoal) return null;
        const entry = selectedGoal.entries[formatDateISO(date)];
        if (entry && entry.value > 0) {
            return (
                <div className="w-3 h-3 rounded-full bg-primary-400"></div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="md:w-1/3 lg:w-1/4 bg-card-light dark:bg-card-dark p-4 rounded-lg shadow space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Learning Goals</h2>
                    <Button onClick={() => { setEditingGoal(null); setGoalModalOpen(true); }} className="!p-2">
                        <IconPlus className="w-5 h-5" />
                    </Button>
                </div>
                <div className="space-y-3">
                    {goals.map(goal => {
                        const { total, percentage } = calculateProgress(goal);
                        return (
                            <div key={goal.id} onClick={() => setSelectedGoalId(goal.id)} className={`p-3 rounded-lg cursor-pointer transition-all border-l-4 ${selectedGoalId === goal.id ? 'ring-2 ring-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600 hover:bg-bkg-light dark:hover:bg-bkg-dark'}`}>
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-text-light dark:text-text-dark pr-2">{goal.name}</span>
                                    <div>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); setGoalModalOpen(true);}} className="p-1 hover:text-primary-500"><IconPencil className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id);}} className="p-1 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                                        <span>{`${total.toLocaleString()} / ${goal.targetAmount.toLocaleString()} ${goal.unit}`}</span>
                                        <span>{Math.floor(percentage)}%</span>
                                    </div>
                                    <div className="w-full bg-bkg-light dark:bg-bkg-dark rounded-full h-2">
                                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {goals.length === 0 && <p className="text-center text-text-muted-light dark:text-text-muted-dark p-4">No goals yet. Add one!</p>}
            </div>

            <div className="md:w-2/3 lg:w-3/4 flex flex-col gap-6">
                 <CalendarView selectedDate={selectedDate} setSelectedDate={(date) => openLogModalForDate(date)} renderDayContent={renderDayContent} />
                 {selectedGoal && (
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow">
                         <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Log for {new Date(selectedDate).toLocaleDateString()}</h3>
                        {selectedGoal.entries[formatDateISO(selectedDate)] ? (
                            <div className="space-y-1">
                                <p><strong>Progress:</strong> {selectedGoal.entries[formatDateISO(selectedDate)].value} {selectedGoal.unit}</p>
                                {selectedGoal.entries[formatDateISO(selectedDate)].notes && <p><strong>Notes:</strong> {selectedGoal.entries[formatDateISO(selectedDate)].notes}</p>}
                                <Button variant="secondary" className="!py-1 mt-2" onClick={() => openLogModalForDate(selectedDate)}>Edit Log</Button>
                            </div>
                        ) : (
                             <p className="text-text-muted-light dark:text-text-muted-dark">No progress logged for this day. Click the date on the calendar to add a log.</p>
                        )}
                    </div>
                )}
            </div>
            
            <LearningGoalModal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} onSave={handleSaveGoal} goal={editingGoal} />
            <LogProgressModal 
                isOpen={isLogModalOpen}
                onClose={() => setLogModalOpen(false)}
                onSave={handleLogProgress}
                existingEntry={loggingDate && selectedGoal ? selectedGoal.entries[formatDateISO(loggingDate)] : null}
                goal={selectedGoal}
                date={loggingDate}
            />
        </div>
    );
};


// --- Project Tracker ---
export const ProjectTracker: React.FC = () => {
    // Placeholder component
    return (
        <div className="flex items-center justify-center h-full bg-card-light dark:bg-card-dark rounded-lg p-8">
            <div className="text-center">
                <IconProjects className="w-16 h-16 mx-auto text-text-muted-light dark:text-text-muted-dark" />
                <h2 className="mt-4 text-2xl font-bold text-text-light dark:text-text-dark">Project Tracker</h2>
                <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">This feature is under construction. Come back soon to track your project milestones!</p>
            </div>
        </div>
    );
};

// --- Routine Tracker ---
export const RoutineTracker: React.FC = () => {
    const { routines, saveRoutine, deleteRoutine, toggleRoutineSubTask } = useUser();
    const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

    const selectedRoutine = useMemo(() => routines.find(r => r.id === selectedRoutineId) || routines[0] || null, [routines, selectedRoutineId]);

    React.useEffect(() => {
        if (!selectedRoutineId && routines.length > 0) {
            setSelectedRoutineId(routines[0].id);
        } else if (routines.length === 0) {
            setSelectedRoutineId(null);
        }
    }, [routines, selectedRoutineId]);

    const handleSaveRoutine = (name: string, subTasks: SubTask[]) => {
        saveRoutine({ name, subTasks }, editingRoutine?.id);
        setIsModalOpen(false);
        setEditingRoutine(null);
    };
    
    const handleDeleteRoutine = (id: string) => {
        deleteRoutine(id);
        if (selectedRoutineId === id) {
            setSelectedRoutineId(null);
        }
    };

    const handleToggleSubTask = (routineId: string, subTaskId: string, date: Date) => {
        toggleRoutineSubTask(routineId, subTaskId, date);
    };

    const renderDayContent = (date: Date) => {
        if (!selectedRoutine) return null;
        const dateStr = formatDateISO(date);
        const completionData = selectedRoutine.completions[dateStr];
        if (!completionData) return null;
        const completedTasks = Object.values(completionData).filter(Boolean).length;
        const totalTasks = selectedRoutine.subTasks.length;
        if (totalTasks === 0) return null;
        const completionRate = completedTasks / totalTasks;

        if (completionRate > 0) {
            return (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${completionRate * 100}%` }}></div>
                </div>
            );
        }
        return null;
    };
    
    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="md:w-1/3 lg:w-1/4 bg-card-light dark:bg-card-dark p-4 rounded-lg shadow space-y-4">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Routines</h2>
                    <Button onClick={() => { setEditingRoutine(null); setIsModalOpen(true); }} className="!p-2">
                        <IconPlus className="w-5 h-5" />
                    </Button>
                </div>
                <div className="space-y-2">
                    {routines.map(routine => (
                        <div key={routine.id} onClick={() => setSelectedRoutineId(routine.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border-l-4 ${selectedRoutineId === routine.id ? 'ring-2 ring-primary-500 border-primary-500' : 'border-gray-400 hover:bg-bkg-light dark:hover:bg-bkg-dark'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-text-light dark:text-text-dark">{routine.name}</span>
                                <div>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingRoutine(routine); setIsModalOpen(true);}} className="p-1 hover:text-primary-500"><IconPencil className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRoutine(routine.id);}} className="p-1 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {routines.length === 0 && <p className="text-center text-text-muted-light dark:text-text-muted-dark p-4">No routines yet. Create one!</p>}
            </div>

            <div className="md:w-2/3 lg:w-3/4 flex flex-col gap-6">
                <CalendarView selectedDate={selectedDate} setSelectedDate={setSelectedDate} renderDayContent={renderDayContent} />
                {selectedRoutine && (
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow">
                         <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Tasks for {selectedDate.toLocaleDateString()}</h3>
                         <div className="space-y-2">
                            {selectedRoutine.subTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3 bg-bkg-light dark:bg-bkg-dark p-2 rounded-md">
                                    <input
                                        type="checkbox"
                                        id={`task-${task.id}`}
                                        className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                                        checked={!!selectedRoutine.completions[formatDateISO(selectedDate)]?.[task.id]}
                                        onChange={() => handleToggleSubTask(selectedRoutine.id, task.id, selectedDate)}
                                    />
                                    <label htmlFor={`task-${task.id}`} className="text-text-light dark:text-text-dark">{task.name}</label>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
            
            <RoutineModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveRoutine}
                routine={editingRoutine}
            />
        </div>
    );
};

const RoutineModal: React.FC<{isOpen: boolean, onClose: () => void, onSave: (name: string, subTasks: SubTask[]) => void, routine: Routine | null}> = 
({isOpen, onClose, onSave, routine}) => {
    const [name, setName] = useState('');
    const [subTasks, setSubTasks] = useState<SubTask[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        if(routine) {
            setName(routine.name);
            setSubTasks(routine.subTasks);
        } else {
            setName('');
            setSubTasks([]);
            setAiPrompt('');
            setAiError('');
        }
    }, [routine, isOpen]);

    const handleSubTaskChange = (index: number, value: string) => {
        const newTasks = [...subTasks];
        newTasks[index].name = value;
        setSubTasks(newTasks);
    };

    const addSubTask = () => setSubTasks([...subTasks, {id: Date.now().toString(), name: ''}]);
    const removeSubTask = (id: string) => setSubTasks(subTasks.filter(t => t.id !== id));
    
    const handleGenerateAI = async () => {
        if(!aiPrompt) return;
        setIsGenerating(true);
        setAiError('');
        try {
            const result = await generateRoutineFromAI(aiPrompt);
            setName(result.name);
            setSubTasks(result.subTasks);
        } catch(e: any) {
            setAiError(e.message || 'An unknown error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSubmit = () => {
        if (name && subTasks.length > 0) {
            onSave(name, subTasks.filter(t => t.name.trim() !== ''));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={routine ? 'Edit Routine' : 'Create Routine'}
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit}>Save</Button></>}>
            <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                    <h4 className="font-semibold text-primary-800 dark:text-primary-200 flex items-center gap-2"><IconSparkles className="w-5 h-5"/> AI Assistant</h4>
                    <p className="text-sm text-primary-700 dark:text-primary-300 mt-1 mb-2">Describe a goal, and we'll generate a routine for you.</p>
                    <div className="flex gap-2">
                        <Input label="" id="ai-prompt" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., a productive morning" className="flex-grow"/>
                        <Button onClick={handleGenerateAI} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                    {aiError && <p className="text-sm text-red-500 mt-2">{aiError}</p>}
                </div>

                <Input label="Routine Name" id="routine-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Morning Kickstart"/>
                
                <div>
                    <h4 className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">Sub-tasks</h4>
                    <div className="space-y-2">
                    {subTasks.map((task, index) => (
                        <div key={task.id} className="flex items-center gap-2">
                            <Input label="" id={`task-${task.id}`} value={task.name} onChange={e => handleSubTaskChange(index, e.target.value)} className="flex-grow"/>
                            <Button variant="danger" onClick={() => removeSubTask(task.id)} className="!p-2"><IconTrash className="w-5 h-5"/></Button>
                        </div>
                    ))}
                    <Button variant="secondary" onClick={addSubTask} className="w-full">Add Sub-task</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// --- Time Blocks Tracker ---
const TimeBlockModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    block: Partial<TimeBlock> | null;
}> = ({ isOpen, onClose, block }) => {
    const { learningGoals, saveTimeBlock, deleteTimeBlock } = useUser();
    const [taskName, setTaskName] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [color, setColor] = useState('#3b82f6');
    const [priority, setPriority] = useState<TimeBlockPriority>('Medium');
    const [linkedGoalId, setLinkedGoalId] = useState<string | undefined>(undefined);
    const isEditing = useMemo(() => block?.id, [block]);

    useEffect(() => {
        if (isOpen && block) {
            setTaskName(block.taskName || '');
            setStartTime(block.startTime || '09:00');
            setEndTime(block.endTime || '10:00');
            setColor(block.color || '#3b82f6');
            setPriority(block.priority || 'Medium');
            setLinkedGoalId(block.linkedGoalId || undefined);
        }
    }, [isOpen, block]);

    const handleSave = (markCompleted = false) => {
        if (!taskName || !block?.day === undefined) return;
        const savedBlock: TimeBlock = {
            id: block.id || `tb-${Date.now()}`,
            day: block.day!,
            taskName, startTime, endTime, color, priority,
            isCompleted: markCompleted || (block.isCompleted || false),
            linkedGoalId: linkedGoalId || undefined
        };
        saveTimeBlock(savedBlock);
        onClose();
    };

    const handleDelete = () => {
        if (block?.id) {
            deleteTimeBlock(block.id);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Time Block' : 'Create Time Block'}
            footer={
                <div className="flex justify-between w-full">
                    <div>
                        {isEditing && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        {!block?.isCompleted && isEditing && <Button onClick={() => handleSave(true)}>Mark Complete</Button>}
                        <Button onClick={() => handleSave()}>Save</Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <Input label="Task Name" id="tb-task" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="e.g., Work on Project Phoenix" />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Start Time" id="tb-start" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    <Input label="End Time" id="tb-end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
                <Select label="Priority" id="tb-priority" value={priority} onChange={e => setPriority(e.target.value as TimeBlockPriority)}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
                <Select label="Link to Learning Goal (Optional)" id="tb-goal" value={linkedGoalId || ''} onChange={e => setLinkedGoalId(e.target.value || undefined)}>
                    <option value="">None</option>
                    {learningGoals.map(goal => <option key={goal.id} value={goal.id}>{goal.name}</option>)}
                </Select>
                <div>
                    <label htmlFor="tb-color" className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">Color</label>
                    <input type="color" id="tb-color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 border-none rounded-md" />
                </div>
            </div>
        </Modal>
    );
};

export const TimeBlocksTracker: React.FC = () => {
    const { timeBlocks } = useUser();
    const [timeFormat, setTimeFormat] = useLocalStorage<'12h' | '24h'>('timeBlockFormat', '12h');
    const [modalBlock, setModalBlock] = useState<Partial<TimeBlock> | null>(null);

    const minHour = 7;
    const maxHour = 22;
    const hourHeight = 80; // pixels per hour
    
    const formatHour = (hour: number) => {
        if (timeFormat === '24h') return `${hour.toString().padStart(2, '0')}:00`;
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour >= 12 && hour < 24 ? 'PM' : 'AM';
        return `${h12}:00 ${ampm}`;
    };

    const timeToPixels = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return (h + m / 60 - minHour) * hourHeight;
    };
    
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

    const handleGridClick = (dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = (y / hourHeight) + minHour;
        const startHour = Math.floor(hour);
        const startMinutes = Math.floor((hour - startHour) * 4) * 15; // Snap to 15 mins
        
        const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
        const endTime = `${String(startHour + 1).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;

        setModalBlock({ day: dayIndex + 1, startTime, endTime });
    };

    return (
        <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-amber-400/50">
                <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Time Blocks</h2>
                <div>
                    <span className="text-sm font-medium mr-3 text-text-muted-light dark:text-text-muted-dark">Format:</span>
                    <div className="inline-flex rounded-md shadow-sm bg-gray-200 dark:bg-gray-900/50 p-1" role="group">
                        <button type="button" onClick={() => setTimeFormat('12h')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${timeFormat === '12h' ? 'bg-white dark:bg-card-dark shadow' : 'text-text-muted-light dark:text-text-muted-dark'}`}>12h</button>
                        <button type="button" onClick={() => setTimeFormat('24h')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${timeFormat === '24h' ? 'bg-white dark:bg-card-dark shadow' : 'text-text-muted-light dark:text-text-muted-dark'}`}>24h</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="grid" style={{ gridTemplateColumns: 'auto 1fr' }}>
                    {/* Time Gutter */}
                    <div>
                         <div className="h-8"></div> {/* Spacer for weekday header */}
                         {hours.map(hour => (
                            <div key={hour} className="h-20 -mt-px pr-2 text-right font-mono text-xs text-text-muted-light dark:text-text-muted-dark border-t border-transparent">{formatHour(hour)}</div>
                        ))}
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                        {weekdays.map((day, dayIndex) => (
                            <div key={day} className="relative border-l border-border-light dark:border-border-dark" onClick={(e) => handleGridClick(dayIndex, e)}>
                                <div className="sticky top-0 bg-card-light dark:bg-card-dark h-8 text-center font-semibold text-text-muted-light dark:text-text-muted-dark border-b border-border-light dark:border-border-dark z-10">{day}</div>
                                {hours.map(hour => <div key={hour} className="h-20 border-t border-border-light dark:border-border-dark"></div>)}
                                
                                {timeBlocks.filter(b => b.day === dayIndex + 1).map(block => {
                                    const top = timeToPixels(block.startTime);
                                    const height = timeToPixels(block.endTime) - top;
                                    return (
                                        <div
                                            key={block.id}
                                            onClick={(e) => { e.stopPropagation(); setModalBlock(block); }}
                                            className="absolute w-full p-2 rounded-lg cursor-pointer transition-opacity"
                                            style={{ top, height, backgroundColor: block.color, opacity: block.isCompleted ? 0.5 : 1 }}
                                        >
                                            <p className="font-bold text-white text-sm leading-tight">{block.taskName}</p>
                                            <p className="text-white/80 text-xs">{block.startTime} - {block.endTime}</p>
                                            {block.isCompleted && <IconCheck className="absolute bottom-1 right-1 w-5 h-5 text-white" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <TimeBlockModal isOpen={!!modalBlock} onClose={() => setModalBlock(null)} block={modalBlock} />
        </div>
    );
};

// --- Meal Tracker ---
export const MealTracker: React.FC = () => {
     // Placeholder component
     return (
        <div className="flex items-center justify-center h-full bg-card-light dark:bg-card-dark rounded-lg p-8">
            <div className="text-center">
                <IconMeals className="w-16 h-16 mx-auto text-text-muted-light dark:text-text-muted-dark" />
                <h2 className="mt-4 text-2xl font-bold text-text-light dark:text-text-dark">Meal Tracker</h2>
                <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">This feature is under construction. Come back soon to log your meals!</p>
            </div>
        </div>
    );
};