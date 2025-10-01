'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import HomePage from './HomePage'
import { ThemeProvider } from 'next-themes'
import HabitsTab from '../components/HabitsTab'
import LearningTab from '../components/LearningTab'
import ProjectsTab from '../components/projects/ProjectsTab'
import RoutinesTab from '../components/RoutinesTab'
import MealsTab from '../components/MealsTab'
import AnalyticsTab from '../components/AnalyticsTab'
import Header from '../components/Layout/Header'
import AdminDashboard from '../components/Admin/AdminDashboard'
import FeedbackForm from '../components/Feedback/FeedbackForm'
import Sidebar from '../components/Sidebar'

export type TabType =
  | 'habits'
  | 'learning'
  | 'projects'
  | 'routines'
  | 'meals'
  | 'analytics'

const Index = () => {
  const { user, isLoading, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('habits')
  const [showingAdminDashboard, setShowingAdminDashboard] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

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
    )
  }

  if (!user) {
    return <HomePage />
  }

  const renderContent = () => {
    if (showingAdminDashboard && isAdmin) {
      return <AdminDashboard />
    }

    switch (activeTab) {
      case 'habits':
        return <HabitsTab />
      case 'learning':
        return <LearningTab />
      case 'projects':
        return <ProjectsTab />
      case 'routines':
        return <RoutinesTab />
      case 'meals':
        return <MealsTab />
      case 'analytics':
        return <AnalyticsTab />
      default:
        return <HabitsTab />
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="relative min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 transition-all flex">
        {/*
          Sidebar is now completely fixed, and its width is managed
          entirely by its own component's state. The parent container no
          longer needs to manage its hover state. The fixed sidebar
          will not affect the document flow.
        */}
        {!showingAdminDashboard && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            // `isHovered` is now managed internally by Sidebar.tsx
          />
        )}

        {/* This is the main content wrapper. It is positioned absolutely
          and its left offset is dynamically set based on the sidebar's
          current width. This correctly aligns the main content area with the
          sidebar, eliminating the extra space.
        */}
        <div
          className={`
            absolute top-0 right-0 bottom-0
            flex-1 flex flex-col transition-all duration-300
            ${!showingAdminDashboard ? (isSidebarHovered ? 'left-64' : 'left-16') : 'left-0'}
          `}
        >
          <Header
            onAdminDashboard={() =>
              setShowingAdminDashboard(!showingAdminDashboard)
            }
            showingAdminDashboard={showingAdminDashboard}
          />

          {!showingAdminDashboard && (
            <div className="px-4 sm:px-6 lg:px-8 mt-4">
              <FeedbackForm />
            </div>
          )}

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default Index
