
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppView, User, ActivityAction } from './types';
import { IconHabits, IconLearning, IconProjects, IconRoutines, IconTimeBlocks, IconMeals, IconSun, IconMoon, IconLogout, IconHelpCircle, IconMessageSquare } from './components/ui/Icons';
import { HabitTracker, LearningTracker, ProjectTracker, RoutineTracker, TimeBlocksTracker, MealTracker } from './components/trackers/TrackerComponents';
import { useUser } from './contexts/UserContext';
import { AuthView } from './components/auth/AuthView';
import AdminDashboard from './components/admin/AdminDashboard';
import { HelloPanel, TourModal, FeedbackModal, OnboardingModal } from './components/ui/SharedUI';

const NAV_ITEMS = [
    { view: AppView.Habits, label: 'Habits', icon: IconHabits },
    { view: AppView.Learning, label: 'Learning', icon: IconLearning },
    { view: AppView.Projects, label: 'Projects', icon: IconProjects },
    { view: AppView.Routines, label: 'Routines', icon: IconRoutines },
    { view: AppView.TimeBlocks, label: 'Time Blocks', icon: IconTimeBlocks },
    { view: AppView.Meals, label: 'Meals', icon: IconMeals },
];

const App: React.FC = () => {
    const { currentUser, updateUser, submitFeedback } = useUser();
    const [isTourOpen, setTourOpen] = useState(false);
    const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [isOnboardingModalOpen, setOnboardingModalOpen] = useState(false);
    
    useEffect(() => {
        if (currentUser) {
            // Onboarding is the first priority for a new user
            if (!currentUser.hasSetupExamples) {
                setOnboardingModalOpen(true);
            } 
            // Tour is the second priority, after onboarding is done
            else if (!currentUser.hasCompletedTour) {
                const timer = setTimeout(() => setTourOpen(true), 500);
                return () => clearTimeout(timer);
            }
        }
    }, [currentUser]);

    const handleTourComplete = () => {
        setTourOpen(false);
        if (currentUser) {
            updateUser({ ...currentUser, hasCompletedTour: true });
        }
    };
    
    const handleStartTour = () => setTourOpen(true);
    
    const handleOnboardingFinish = () => {
        setOnboardingModalOpen(false);
        if (currentUser) {
            updateUser({ ...currentUser, hasSetupExamples: true });
        }
    };

    const handleFeedbackSubmit = async (content: string) => {
        await submitFeedback(content);
        setFeedbackModalOpen(false);
    };

    if (!currentUser) {
        return <AuthView />;
    }
    
    if (currentUser.role === 'admin') {
        return <AdminDashboard />;
    }

    return (
        <>
            <MainLayout 
                currentUser={currentUser} 
                onStartTour={handleStartTour}
                onOpenFeedback={() => setFeedbackModalOpen(true)}
            />
            <OnboardingModal isOpen={isOnboardingModalOpen} onFinish={handleOnboardingFinish} />
            <TourModal isOpen={isTourOpen} onClose={handleTourComplete} />
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} onSubmit={handleFeedbackSubmit} />
        </>
    );
};

interface MainLayoutProps {
    currentUser: User;
    onStartTour: () => void;
    onOpenFeedback: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ currentUser, onStartTour, onOpenFeedback }) => {
    const [activeView, setActiveView] = useState<AppView>(AppView.Habits);
    
    const renderActiveView = () => {
        switch (activeView) {
            case AppView.Habits: return <HabitTracker />;
            case AppView.Learning: return <LearningTracker />;
            case AppView.Projects: return <ProjectTracker />;
            case AppView.Routines: return <RoutineTracker />;
            case AppView.TimeBlocks: return <TimeBlocksTracker />;
            case AppView.Meals: return <MealTracker />;
            default: return <HabitTracker />;
        }
    };

    return (
        <div className="flex h-screen bg-bkg-light dark:bg-bkg-dark text-text-light dark:text-text-dark">
            <Sidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                onStartTour={onStartTour}
                onOpenFeedback={onOpenFeedback}
            />
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                <HelloPanel userName={currentUser.name} onStartTour={onStartTour} />
                {renderActiveView()}
            </main>
        </div>
    );
};

interface SidebarProps {
    activeView: AppView;
    setActiveView: (view: AppView) => void;
    onStartTour: () => void;
    onOpenFeedback: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onStartTour, onOpenFeedback }) => {
    const { logout, logActivity } = useUser();
    const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('darkMode', false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);
    
    const handleToggleTheme = () => {
        setIsDarkMode(prev => !prev);
        logActivity('setting_change_dark_mode');
    };
    
    return (
        <aside className="w-20 md:w-64 bg-card-light dark:bg-card-dark flex flex-col justify-between p-4 border-r border-border-light dark:border-border-dark transition-all duration-300">
            <div>
                <div className="flex items-center gap-2 mb-10">
                    <div className="bg-primary-500 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </div>
                    <h1 className="hidden md:block text-2xl font-bold text-text-light dark:text-text-dark">Momentum</h1>
                </div>

                <nav className="space-y-2">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.view}
                            onClick={() => setActiveView(item.view)}
                            className={`w-full flex items-center p-3 rounded-lg transition-colors
                                ${activeView === item.view
                                    ? 'bg-primary-500 text-white'
                                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-bkg-light dark:hover:bg-bkg-dark'
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="hidden md:block ml-4 font-semibold">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="space-y-2">
                 <button
                    onClick={handleToggleTheme}
                    className="w-full flex items-center p-3 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-bkg-light dark:hover:bg-bkg-dark"
                >
                    {isDarkMode ? <IconSun className="w-6 h-6" /> : <IconMoon className="w-6 h-6" />}
                    <span className="hidden md:block ml-4 font-semibold">
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </span>
                 </button>
                 <button
                    onClick={onOpenFeedback}
                    className="w-full flex items-center p-3 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-bkg-light dark:hover:bg-bkg-dark"
                >
                    <IconMessageSquare className="w-6 h-6" />
                    <span className="hidden md:block ml-4 font-semibold">
                       Feedback
                    </span>
                 </button>
                 <button
                    onClick={onStartTour}
                    className="w-full flex items-center p-3 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-bkg-light dark:hover:bg-bkg-dark"
                >
                    <IconHelpCircle className="w-6 h-6" />
                    <span className="hidden md:block ml-4 font-semibold">
                       App Tour
                    </span>
                 </button>
                 <button
                    onClick={logout}
                    className="w-full flex items-center p-3 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-bkg-light dark:hover:bg-bkg-dark"
                >
                    <IconLogout className="w-6 h-6" />
                    <span className="hidden md:block ml-4 font-semibold">
                       Logout
                    </span>
                 </button>
            </div>
        </aside>
    );
};

export default App;