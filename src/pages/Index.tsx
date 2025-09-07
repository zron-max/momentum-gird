
import { useState } from 'react';
import { Calendar, CheckSquare, BookOpen, Target, Clock, Utensils, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import HomePage from './HomePage';
import { ThemeProvider } from 'next-themes';
import CalendarView from '@/components/CalendarView';
import HabitsTab from '@/components/HabitsTab';
import LearningTab from '@/components/LearningTab';
import ProjectsTab from '@/components/ProjectsTab';
import RoutinesTab from '@/components/RoutinesTab';
import MealsTab from '@/components/MealsTab';
import AnalyticsTab from '@/components/AnalyticsTab';
import Header from '@/components/Layout/Header';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import FeedbackForm from '@/components/Feedback/FeedbackForm';
import AuthForm from '@/components/Auth/AuthForm';

export type TabType = 'habits' | 'learning' | 'projects' | 'routines' | 'meals' | 'analytics';

const Index = () => {
  const { user, isLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('habits');
  const [showingAdminDashboard, setShowingAdminDashboard] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow animate-float mx-auto">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <HomePage />;
  }

  const tabs = [
    { id: 'habits' as TabType, label: 'Habit-Forming', icon: CheckSquare, color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
    { id: 'learning' as TabType, label: 'Learning', icon: BookOpen, color: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
    { id: 'projects' as TabType, label: 'Projects', icon: Target, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'routines' as TabType, label: 'Routines', icon: Clock, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { id: 'meals' as TabType, label: 'Meals', icon: Utensils, color: 'bg-gradient-to-r from-green-500 to-lime-500' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3, color: 'bg-gradient-to-r from-cyan-500 to-blue-500' }
  ];

  const renderContent = () => {
    if (showingAdminDashboard && isAdmin) {
      return <AdminDashboard />;
    }

    switch (activeTab) {
      case 'habits':
        return <HabitsTab />;
      case 'learning':
        return <LearningTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'routines':
        return <RoutinesTab />;
      case 'meals':
        return <MealsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return <HabitsTab />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 transition-all">
        {/* Header */}
        <Header 
          onAdminDashboard={() => setShowingAdminDashboard(!showingAdminDashboard)}
          showingAdminDashboard={showingAdminDashboard}
        />

        {/* Navigation Tabs - Hide when showing admin dashboard */}
        {!showingAdminDashboard && (
          <nav className="bg-card/60 backdrop-blur-sm border-b border-border transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-3">
                <div className="flex space-x-1 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap animate-fade-in ${
                          isActive
                            ? `${tab.color} text-white shadow-lg transform scale-105`
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Feedback Button */}
                <div className="ml-4">
                  <FeedbackForm />
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Index;
