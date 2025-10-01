'use client'

import React, { useState } from 'react'
import {
  CheckSquare,
  BookOpen,
  Target,
  Clock,
  Utensils,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Type definitions
export type TabType =
  | 'habits'
  | 'learning'
  | 'projects'
  | 'routines'
  | 'meals'
  | 'analytics'

export interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

interface Tab {
  id: TabType
  label: string
  icon: React.ComponentType<{ size?: number }>
  color: string
}

const tabs: Tab[] = [
  {
    id: 'habits' as TabType,
    label: 'Habit-Forming',
    icon: CheckSquare,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'learning' as TabType,
    label: 'Learning',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'projects' as TabType,
    label: 'Projects',
    icon: Target,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'routines' as TabType,
    label: 'Routines',
    icon: Clock,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'meals' as TabType,
    label: 'Meals',
    icon: Utensils,
    color: 'from-green-500 to-lime-500',
  },
  {
    id: 'analytics' as TabType,
    label: 'Analytics',
    icon: BarChart3,
    color: 'from-cyan-500 to-blue-500',
  },
]

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId)
    setMobileOpen(false) // Close mobile menu when a tab is selected
  }

  return (
    <TooltipProvider>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-background/95 border shadow-lg hover:bg-accent transition-colors"
        aria-label="Toggle mobile menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed top-0 left-0 h-screen bg-background/95 backdrop-blur-xl border-r shadow-lg flex flex-col justify-between transition-all duration-300 ease-in-out z-50',
          // Desktop styles (hover-based)
          'hidden md:flex',
          isHovered ? 'w-64' : 'w-16',
          // Mobile styles (click-based)
          mobileOpen && 'flex md:hidden w-64',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            {isHovered && (
              <h1 className="text-xl font-bold whitespace-nowrap overflow-hidden bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                Momentum Grid
              </h1>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-2 py-4">
          {tabs.map(({ id, label, icon: Icon, color }) => {
            const isActive = activeTab === id
            return (
              <Tooltip key={id} delayDuration={isHovered ? 100 : 300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleTabClick(id)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden',
                      !isHovered && 'justify-center px-2',
                      isActive
                        ? `bg-gradient-to-r ${color} text-white shadow-lg shadow-current/25`
                        : 'hover:bg-accent hover:text-accent-foreground',
                    )}
                    aria-label={label}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-full" />
                    )}

                    <div
                      className={cn(
                        'flex items-center justify-center transition-transform duration-200',
                        isActive && 'scale-110',
                      )}
                    >
                      <Icon size={20} />
                    </div>

                    <span
                      className={cn(
                        'font-medium whitespace-nowrap overflow-hidden transition-all duration-300',
                        isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0',
                      )}
                    >
                      {label}
                    </span>

                    {/* Hover effect for inactive items */}
                    {!isActive && (
                      <div
                        className={cn(
                          'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-xl bg-gradient-to-r',
                          color,
                        )}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                {!isHovered && (
                  <TooltipContent side="right" className="font-medium">
                    {label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          {isHovered ? (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Stay focused, stay productive
              </p>
              <p className="text-xs text-muted-foreground/60">
                © 2025 Momentum Grid
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* Content Spacer for Desktop */}
      <div
        className={cn(
          'hidden md:block transition-all duration-300 ease-in-out flex-shrink-0',
          isHovered ? 'w-64' : 'w-16',
        )}
      />
    </TooltipProvider>
  )
}

export default Sidebar
