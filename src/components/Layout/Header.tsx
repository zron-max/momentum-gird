'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Moon, Sun, Settings, LogOut, User, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeaderProps {
  onAdminDashboard?: () => void;
  showingAdminDashboard?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAdminDashboard, showingAdminDashboard }) => {
  const { user, signOut, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();

  // Default to 12hr; hydrate from localStorage on mount (SSR-safe)
  const [timeFormat, setTimeFormat] = useState<'12hr' | '24hr'>('12hr');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = (window.localStorage.getItem('timeFormat') as '12hr' | '24hr' | null);
      if (saved) setTimeFormat(saved);
    }
  }, []);

  // Persist preference whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('timeFormat', timeFormat);
    }
  }, [timeFormat]);

  // Robust formatter that forces 24-hour using en-GB (fixes Safari/locale quirks) with manual fallback
  const formatTime = useCallback(
    (date: Date) => {
      if (timeFormat === '24hr') {
        try {
          return new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(date);
        } catch (e) {}
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      } else {
        try {
          return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(date);
        } catch (e) {}
        const hours = date.getHours();
        const suffix = hours >= 12 ? 'PM' : 'AM';
        const h = String(((hours + 11) % 12) + 1);
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m} ${suffix}`;
      }
    },
    [timeFormat]
  );

  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    // Initialize immediately and then tick every second
    setCurrentTime(formatTime(new Date()));
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, [formatTime]);

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          <div className="flex items-center space-x-4">
            {/* Time Display with Toggle */}
            <div className="hidden sm:flex items-center space-x-3 bg-secondary/50 rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium" aria-live="polite" aria-atomic="true">
                {currentTime}
              </span>
              <div className="flex items-center space-x-2">
                <Label htmlFor="time-format" className="text-xs text-muted-foreground cursor-pointer">
                  {timeFormat}
                </Label>
                <Switch
                  id="time-format"
                  checked={timeFormat === '24hr'}
                  onCheckedChange={(checked) => setTimeFormat(checked ? '24hr' : '12hr')}
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
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-white text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </p>
                    <p className="w-[200px] truncate text-xs text-muted-foreground">{user?.email}</p>
                    {isAdmin && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />

                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={onAdminDashboard} className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      {showingAdminDashboard ? 'User Dashboard' : 'Admin Dashboard'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
