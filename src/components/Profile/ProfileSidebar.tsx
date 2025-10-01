'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  LogOut,
  User as UserIcon,
  Mail,
  CalendarDays,
  ShieldCheck,
  Camera,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Define a type for the user profile for better type safety
interface UserProfile {
  user_id: string
  full_name: string
  avatar_url: string
  is_admin: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at?: string // ✅ added missing field
}

interface ProfileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // State Management
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      setIsFetching(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single<UserProfile>()

        if (error) throw error

        if (data) {
          setUserProfile(data)
          setName(data.full_name || '')
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error)
        toast({
          title: 'Error Loading Profile',
          description: error?.message || 'Could not fetch your profile data.',
          variant: 'destructive',
        })
      } finally {
        setIsFetching(false)
      }
    }

    if (user && open) {
      fetchUserProfile()
    }
  }, [user, open, toast])

  // Effect to create a preview URL for the selected avatar
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  // Reset form state
  const resetForm = () => {
    setName(userProfile?.full_name || '')
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  // Handle sheet open/close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
      setIsEditing(false)
    }
    onOpenChange(newOpen)
  }

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditing) resetForm()
    setIsEditing(!isEditing)
  }

  // Save updated profile
  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast({ title: 'Name is required.', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      let avatar_url = userProfile?.avatar_url

      // Upload new avatar if selected
      if (avatarFile) {
        if (!['image/jpeg', 'image/png'].includes(avatarFile.type)) {
          throw new Error(
            'Invalid file type. Please upload a JPG or PNG image.',
          )
        }
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath)

        avatar_url = publicUrl
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single<UserProfile>()

      if (updateError) throw updateError
      if (!data) throw new Error('Profile update failed.')

      setUserProfile(data)
      setIsEditing(false)
      setAvatarFile(null)

      toast({ title: 'Success', description: 'Your profile has been updated.' })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Update Failed',
        description:
          error?.message || 'There was an issue updating your profile.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Logout
  const handleLogout = async () => {
    try {
      await signOut()
      handleOpenChange(false)
      navigate('/')
      toast({ title: 'You have been logged out.' })
    } catch (error: any) {
      console.error('Logout failed:', error)
      toast({
        title: 'Logout Failed',
        description: error?.message || 'Could not log you out.',
        variant: 'destructive',
      })
    }
  }

  // Handle avatar file input
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
    }
  }

  // Helper for initials
  const getInitials = (fullName?: string) => {
    if (!fullName) return '?'
    return fullName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col h-full sm:max-w-md w-full p-0"
      >
        <SheetHeader className="p-6">
          <SheetTitle>{isEditing ? 'Edit Profile' : 'My Profile'}</SheetTitle>
        </SheetHeader>
        <Separator />

        {isFetching ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4 p-6 bg-secondary/20">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={avatarPreview || userProfile?.avatar_url}
                    alt={userProfile?.full_name}
                  />
                  <AvatarFallback className="text-3xl">
                    {userProfile ? (
                      getInitials(userProfile.full_name)
                    ) : (
                      <UserIcon />
                    )}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/png, image/jpeg"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {isEditing ? (
                <div className="w-full max-w-xs pt-2">
                  <Label htmlFor="name" className="sr-only">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    disabled={isLoading}
                    className="text-center text-lg font-semibold"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-semibold">
                    {userProfile?.full_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-4">
              <ProfileInfoRow icon={ShieldCheck} label="Status">
                <Badge
                  variant={
                    userProfile?.status === 'approved'
                      ? 'default'
                      : userProfile?.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {userProfile?.status
                    ? userProfile.status.charAt(0).toUpperCase() +
                      userProfile.status.slice(1)
                    : 'Unknown'}
                </Badge>
              </ProfileInfoRow>
              <ProfileInfoRow icon={UserIcon} label="Role">
                <Badge variant={userProfile?.is_admin ? 'default' : 'outline'}>
                  {userProfile?.is_admin ? 'Admin' : 'User'}
                </Badge>
              </ProfileInfoRow>
              {!isEditing && (
                <ProfileInfoRow icon={Mail} label="Email">
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                </ProfileInfoRow>
              )}
              <ProfileInfoRow icon={CalendarDays} label="Member Since">
                <span className="text-sm text-muted-foreground">
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </ProfileInfoRow>
            </div>
          </div>
        )}

        <SheetFooter className="p-6 mt-auto bg-background border-t border-border">
          {isEditing ? (
            <div className="flex space-x-2 w-full">
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2 w-full">
              <Button variant="ghost" onClick={handleLogout} className="flex-1">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
              <Button onClick={handleEditToggle} className="flex-1">
                Edit Profile
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// Helper Components
const ProfileInfoRow: React.FC<{
  icon: React.ElementType
  label: string
  children: React.ReactNode
}> = ({ icon: Icon, label, children }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {children}
  </div>
)

const ProfileSkeleton = () => (
  <div className="flex-1">
    <div className="flex flex-col items-center space-y-4 p-6 bg-secondary/20">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2 text-center">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  </div>
)

export default ProfileSidebar
