'use client'

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  Fragment,
} from 'react'
import {
  Calendar,
  Moon,
  Sun,
  Settings,
  LogOut,
  User,
  Shield,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import ProfileSidebar from '@/components/Profile/ProfileSidebar'

interface HeaderProps {
  onAdminDashboard?: () => void
  showingAdminDashboard?: boolean
}

const Header: React.FC<HeaderProps> = ({
  onAdminDashboard,
  showingAdminDashboard,
}) => {
  const { user, signOut, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()

  const [timeFormat, setTimeFormat] = useState<'12hr' | '24hr'>('12hr')
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Controlled state for dropdown open on hover
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // hydrate timeFormat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('timeFormat') as
        | '12hr'
        | '24hr'
        | null
      if (saved) setTimeFormat(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('timeFormat', timeFormat)
    }
  }, [timeFormat])

  const formatTime = useCallback(
    (date: Date) => {
      if (timeFormat === '24hr') {
        return new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date)
      }
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date)
    },
    [timeFormat],
  )

  useEffect(() => {
    setCurrentTime(formatTime(new Date()))
    const timer = setInterval(
      () => setCurrentTime(formatTime(new Date())),
      1000,
    )
    return () => clearInterval(timer)
  }, [formatTime])

  // helpers to manage the close-delay (prevents flicker)
  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const startCloseTimer = (delay = 150) => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setIsDropdownOpen(false)
      closeTimerRef.current = null
    }, delay)
  }

  // clean up on unmount
  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow animate-float">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Momentum Grid
              </h1>
              {showingAdminDashboard && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin Dashboard
                </Badge>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Time Display */}
            <div className="hidden sm:flex items-center space-x-3 bg-secondary/50 rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">
                {currentTime}
              </span>
              <div className="flex items-center space-x-2">
                <Label className="text-xs text-muted-foreground cursor-pointer">
                  {timeFormat}
                </Label>
                <Switch
                  checked={timeFormat === '24hr'}
                  onCheckedChange={(checked) =>
                    setTimeFormat(checked ? '24hr' : '12hr')
                  }
                  className="scale-75"
                />
              </div>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="transition-all hover:scale-105"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* User Menu (hover to expand) */}
            <div
              // Wrap both trigger and content so we can listen to enter/leave.
              onMouseEnter={() => {
                clearCloseTimer()
                setIsDropdownOpen(true)
              }}
              onMouseLeave={() => {
                // small delay to make pointer transitions easier
                startCloseTimer(150)
              }}
              className="relative"
            >
              {/* Use DropdownMenu controlled via open/onOpenChange */}
              <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={(v) => setIsDropdownOpen(v)}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full transition-all duration-200 hover:scale-110"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-white text-sm">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                {/* Attach mouse handlers on the content too (content may be portalled) */}
                <DropdownMenuContent
                  className="w-56 mt-2 transition-opacity duration-150 ease-out"
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  forceMount
                  onMouseEnter={() => {
                    // If content receives pointer, keep menu open
                    clearCloseTimer()
                    setIsDropdownOpen(true)
                  }}
                  onMouseLeave={() => {
                    // start the same close timer from content
                    startCloseTimer(150)
                  }}
                >
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col leading-none">
                      <p className="font-medium text-sm">
                        {user?.user_metadata?.full_name ||
                          user?.email?.split('@')[0]}
                      </p>
                      <p className="w-[200px] truncate text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {isAdmin && (
                    <Fragment>
                      <DropdownMenuItem
                        onClick={onAdminDashboard}
                        className="cursor-pointer"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {showingAdminDashboard
                          ? 'User Dashboard'
                          : 'Admin Dashboard'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </Fragment>
                  )}

                  <DropdownMenuItem
                    onClick={() => {
                      setIsProfileOpen(true)
                      setIsDropdownOpen(false) // close menu when opening sidebar
                    }}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      signOut()
                    }}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sidebar Drawer */}
      <ProfileSidebar open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </header>
  )
}

export default Header
