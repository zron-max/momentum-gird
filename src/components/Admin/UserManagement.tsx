'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Edit3,
  UserCheck,
  UserX,
  MoreHorizontal,
  RefreshCw,
  Users,
  Shield,
  Clock,
  Download,
  Filter,
  SortAsc,
  SortDesc,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle, // Import the warning icon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// User status constants with display configuration
const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const
type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS]
type SortField = 'name' | 'email' | 'status' | 'role' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface User {
  id: string
  user_id: string | null
  email: string
  full_name: string | null
  is_admin: boolean
  status: UserStatus
  created_at: string
  updated_at?: string | null
  last_login?: string | null
}

interface UserManagementProps {
  onStatsUpdate: () => void
}

interface UserStats {
  total: number
  pending: number
  approved: number
  rejected: number
  admins: number
  newThisWeek: number
}

interface BulkAction {
  type: 'approve' | 'reject' | 'make_admin' | 'remove_admin'
  userIds: string[]
}

// New interface for role change confirmation
interface RoleChangeConfirmation {
  user: User
  newAdminState: boolean
}

// Status configuration for consistent styling and behavior
const STATUS_CONFIG = {
  [USER_STATUS.PENDING]: {
    label: 'Pending',
    icon: Clock,
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    color: 'text-yellow-600',
  },
  [USER_STATUS.APPROVED]: {
    label: 'Approved',
    icon: CheckCircle,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    color: 'text-green-600',
  },
  [USER_STATUS.REJECTED]: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    color: 'text-red-600',
  },
}
function UserManagement({ onStatsUpdate }: UserManagementProps) {
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  // New state for role change confirmation
  const [roleChangeConfirmation, setRoleChangeConfirmation] =
    useState<RoleChangeConfirmation | null>(null)

  const { toast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])
  // Compute user statistics with more insights
  const userStats = useMemo((): UserStats => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return {
      total: users.length,
      pending: users.filter((u) => u.status === USER_STATUS.PENDING).length,
      approved: users.filter((u) => u.status === USER_STATUS.APPROVED).length,
      rejected: users.filter((u) => u.status === USER_STATUS.REJECTED).length,
      admins: users.filter((u) => u.is_admin).length,
      newThisWeek: users.filter((u) => new Date(u.created_at) > oneWeekAgo)
        .length,
    }
  }, [users])

  // Enhanced fetch users with better error handling
  const fetchUsers = useCallback(
    async (showRefreshing = false) => {
      try {
        setError(null)
        if (showRefreshing) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        interface ProfileRow {
          id: string
          user_id: string | null
          email: string
          full_name: string | null
          is_admin: boolean
          status: UserStatus
          created_at: string
          updated_at: string | null
          last_login: string | null
        }

        const mapped: User[] = (data || []).map((row: ProfileRow) => ({
          id: String(row.id),
          user_id: row.user_id ?? null,
          email: String(row.email ?? '').toLowerCase(),
          full_name: row.full_name ?? null,
          is_admin: !!row.is_admin,
          status: (row.status as UserStatus) ?? USER_STATUS.PENDING,
          created_at: row.created_at ?? new Date().toISOString(),
          updated_at: row.updated_at ?? null,
          last_login: row.last_login ?? null,
        }))

        setUsers(mapped)
        setSelectedUsers(new Set()) // Clear selections on refresh
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        console.error('Error fetching users:', err)
        toast({
          title: 'Error',
          description: 'Failed to fetch users. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [toast],
  )
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  // Enhanced update user with optimistic updates and rollback
  const updateUser = async (
    userId: string,
    updates: Partial<User>,
    notes?: string,
  ) => {
    try {
      setIsUpdating(true)
      const originalUsers = [...users]

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
      )
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        ...(notes && { notes }),
      }
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
      if (error) {
        // Rollback on error
        setUsers(originalUsers)
        throw error
      }

      toast({
        title: 'Success',
        description: `User ${updates.status ? 'status' : 'role'} updated successfully`,
      })
      onStatsUpdate()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update user'
      console.error('Error updating user:', err)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }
  // Bulk update functionality
  const handleBulkAction = async (action: BulkAction) => {
    try {
      setIsUpdating(true)
      const originalUsers = [...users]

      let updates: Partial<User> = {}
      let description = ''
      switch (action.type) {
        case 'approve':
          updates = { status: USER_STATUS.APPROVED }
          description = `Approved ${action.userIds.length} users`
          break
        case 'reject':
          updates = { status: USER_STATUS.REJECTED }
          description = `Rejected ${action.userIds.length} users`
          break
        case 'make_admin':
          updates = { is_admin: true }
          description = `Granted admin access to ${action.userIds.length} users`
          break
        case 'remove_admin':
          updates = { is_admin: false }
          description = `Removed admin access from ${action.userIds.length} users`
          break
      }

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          action.userIds.includes(u.id) ? { ...u, ...updates } : u,
        ),
      )
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in('id', action.userIds)
      if (error) {
        setUsers(originalUsers)
        throw error
      }

      toast({
        title: 'Success',
        description,
      })
      setSelectedUsers(new Set())
      setBulkAction(null)
      onStatsUpdate()
    } catch (err) {
      console.error('Error performing bulk action:', err)
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }
  // Enhanced sorting and filtering
  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      const searchMatch =
        !debouncedSearchTerm ||
        u.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (u.full_name
          ?.toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ??
          false)

      const statusMatch = statusFilter === 'all' || u.status === statusFilter
      const roleMatch =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && u.is_admin) ||
        (roleFilter === 'user' && !u.is_admin)

      return searchMatch && statusMatch && roleMatch
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue: string | Date | boolean, bValue: string | Date | boolean

      switch (sortField) {
        case 'name':
          aValue = a.full_name || ''
          bValue = b.full_name || ''
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'role':
          aValue = a.is_admin ? 'admin' : 'user'
          bValue = b.is_admin ? 'admin' : 'user'
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [
    users,
    debouncedSearchTerm,
    statusFilter,
    roleFilter,
    sortField,
    sortDirection,
  ])

  // Status badge is now a dropdown menu for a cleaner UI
  const getStatusBadge = (u: User) => {
    const config = STATUS_CONFIG[u.status]
    const StatusIcon = config.icon

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-[130px] h-8 p-0 border-none justify-start"
            disabled={isUpdating}
          >
            <Badge
              className={`${config.className} flex items-center gap-1 w-full`}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const Icon = cfg.icon
            return (
              <DropdownMenuItem
                key={status}
                onClick={() =>
                  updateUser(u.id, { status: status as UserStatus })
                }
                disabled={u.status === status}
              >
                <span className={`flex items-center gap-2 ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Function to initiate and confirm a role change
  const handleRoleChange = (user: User, newAdminState: boolean) => {
    setRoleChangeConfirmation({ user, newAdminState })
  }

  const executeRoleChange = () => {
    if (!roleChangeConfirmation) return
    const { user, newAdminState } = roleChangeConfirmation
    updateUser(user.id, { is_admin: newAdminState })
    setRoleChangeConfirmation(null)
  }

  // Sort header component
  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => {
        if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
          setSortField(field)
          setSortDirection('asc')
        }
      }}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field &&
          (sortDirection === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  )
  // User selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(sortedAndFilteredUsers.map((u) => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }
  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  // Export functionality
  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Role', 'Created At', 'Last Updated'],
      ...sortedAndFilteredUsers.map((u) => [
        u.full_name || 'N/A',
        u.email,
        u.status,
        u.is_admin ? 'Admin' : 'User',
        new Date(u.created_at).toLocaleDateString(),
        u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'Never',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Enhanced edit dialog handlers
  const handleEditUser = (u: User) => {
    setEditingUser({
      ...u,
      status: u.status ?? USER_STATUS.PENDING,
      is_admin: !!u.is_admin,
    })
    setEditNotes('')
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    // Check if the role is being changed to trigger confirmation
    const originalUser = users.find((u) => u.id === editingUser.id)
    if (originalUser && originalUser.is_admin !== editingUser.is_admin) {
      handleRoleChange(editingUser, editingUser.is_admin)
    }

    // Update status directly
    if (originalUser && originalUser.status !== editingUser.status) {
      await updateUser(
        editingUser.id,
        {
          status: editingUser.status,
        },
        editNotes,
      )
    } else if (
      !originalUser ||
      originalUser.is_admin === editingUser.is_admin
    ) {
      // If only notes are added, save them
      await updateUser(editingUser.id, {}, editNotes)
    }

    setEditingUser(null)
    setEditNotes('')
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditNotes('')
  }
  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setRoleFilter('all')
    setSortField('created_at')
    setSortDirection('desc')
    searchInputRef.current?.focus()
  }
  const hasActiveFilters =
    searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
  const hasSelectedUsers = selectedUsers.size > 0
  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
            {hasSelectedUsers && (
              <Badge variant="secondary" className="ml-2">
                {selectedUsers.size} selected
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasSelectedUsers && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Bulk Actions
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportUsers}
              disabled={sortedAndFilteredUsers.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-blue-600 dark:text-blue-400 text-xs font-medium uppercase tracking-wide">
              Total
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {userStats.total}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-yellow-600 dark:text-yellow-400 text-xs font-medium uppercase tracking-wide">
              Pending
            </div>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {userStats.pending}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-green-600 dark:text-green-400 text-xs font-medium uppercase tracking-wide">
              Approved
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {userStats.approved}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400 text-xs font-medium uppercase tracking-wide">
              Rejected
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {userStats.rejected}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-purple-600 dark:text-purple-400 text-xs font-medium uppercase tracking-wide">
              Admins
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {userStats.admins}
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wide">
              New (7d)
            </div>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {userStats.newThisWeek}
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={(value: typeof statusFilter) =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    <span className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={roleFilter}
              onValueChange={(value: typeof roleFilter) => setRoleFilter(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User
                  </span>
                </SelectItem>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto h-6 w-6 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          </div>
        ) : sortedAndFilteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? 'No users match your current filters. Try adjusting your search criteria.'
                : 'No users have been registered yet. They will appear here once users start signing up.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedUsers.size === sortedAndFilteredUsers.length &&
                        sortedAndFilteredUsers.length > 0
                      }
                      indeterminate={
                        selectedUsers.size > 0 &&
                        selectedUsers.size < sortedAndFilteredUsers.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all users"
                    />
                  </TableHead>
                  <SortableHeader field="name">User</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="role">Role</SortableHeader>
                  <SortableHeader field="created_at">Created</SortableHeader>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredUsers.map((u) => (
                  <TableRow
                    key={u.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      selectedUsers.has(u.id)
                        ? 'bg-blue-50 dark:bg-blue-950'
                        : ''
                    }`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(u.id)}
                        onCheckedChange={(checked) =>
                          handleSelectUser(u.id, !!checked)
                        }
                        aria-label={`Select ${u.full_name || u.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {u.full_name || 'No name provided'}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(u)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.is_admin ? 'default' : 'outline'}
                        className={
                          u.is_admin
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                            : ''
                        }
                      >
                        {u.is_admin ? (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            User
                          </div>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(u.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {u.last_login ? (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full" />
                            {new Date(u.last_login).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-gray-400 rounded-full" />
                            Never
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            disabled={isUpdating}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open user menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditUser(u)}
                            className="flex items-center gap-2"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              updateUser(u.id, { status: USER_STATUS.APPROVED })
                            }
                            disabled={u.status === USER_STATUS.APPROVED}
                            className="flex items-center gap-2 text-green-600"
                          >
                            <UserCheck className="h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateUser(u.id, { status: USER_STATUS.REJECTED })
                            }
                            disabled={u.status === USER_STATUS.REJECTED}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <UserX className="h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(u, !u.is_admin)}
                            className="flex items-center gap-2 text-purple-600"
                          >
                            <Shield className="h-4 w-4" />
                            {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Enhanced Edit User Dialog */}
        <Dialog
          open={!!editingUser}
          onOpenChange={(open) => !open && handleCancelEdit()}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update user status, role, and add notes about the changes.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-6">
                {/* User Info Display */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg">
                        {editingUser.full_name || 'No name provided'}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {editingUser.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Member since{' '}
                        {new Date(editingUser.created_at).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select
                      value={editingUser.status}
                      onValueChange={(val: UserStatus) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, status: val } : prev,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(
                          ([status, config]) => {
                            const Icon = config.icon
                            return (
                              <SelectItem key={status} value={status}>
                                <span
                                  className={`flex items-center gap-2 ${config.color}`}
                                >
                                  <Icon className="h-4 w-4" />
                                  {config.label}
                                </span>
                              </SelectItem>
                            )
                          },
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Role</Label>
                    <Select
                      value={editingUser.is_admin ? 'admin' : 'user'}
                      onValueChange={(val) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, is_admin: val === 'admin' } : prev,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            User
                          </span>
                        </SelectItem>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-2 text-purple-600">
                            <Shield className="h-4 w-4" />
                            Admin
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    placeholder="Add notes about this change (e.g., reason for approval/rejection)..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isUpdating}
                    className="min-w-24"
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Actions Dialog */}
        <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bulk Actions
              </DialogTitle>
              <DialogDescription>
                Perform actions on {selectedUsers.size} selected users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setBulkAction({
                      type: 'approve',
                      userIds: Array.from(selectedUsers),
                    })
                  }
                  className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <UserCheck className="h-4 w-4" />
                  Approve All
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setBulkAction({
                      type: 'reject',
                      userIds: Array.from(selectedUsers),
                    })
                  }
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <UserX className="h-4 w-4" />
                  Reject All
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setBulkAction({
                      type: 'make_admin',
                      userIds: Array.from(selectedUsers),
                    })
                  }
                  className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Shield className="h-4 w-4" />
                  Make Admins
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setBulkAction({
                      type: 'remove_admin',
                      userIds: Array.from(selectedUsers),
                    })
                  }
                  className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Users className="h-4 w-4" />
                  Remove Admins
                </Button>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkActions(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog
          open={!!bulkAction}
          onOpenChange={(open) => !open && setBulkAction(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
              <AlertDialogDescription>
                {bulkAction && (
                  <>
                    Are you sure you want to{' '}
                    <strong>
                      {bulkAction.type === 'approve' && 'approve'}
                      {bulkAction.type === 'reject' && 'reject'}
                      {bulkAction.type === 'make_admin' &&
                        'grant admin access to'}
                      {bulkAction.type === 'remove_admin' &&
                        'remove admin access from'}
                    </strong>{' '}
                    <strong>{bulkAction.userIds.length}</strong> selected user
                    {bulkAction.userIds.length !== 1 ? 's' : ''}?
                  </>
                )}
                <br />
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBulkAction(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => bulkAction && handleBulkAction(bulkAction)}
                disabled={isUpdating}
                className="min-w-24"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Confirm'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* **MODIFIED**: More intimidating Role Change Confirmation Dialog */}
        <AlertDialog
          open={!!roleChangeConfirmation}
          onOpenChange={(open) => !open && setRoleChangeConfirmation(null)}
        >
          <AlertDialogContent className="border-t-8 border-yellow-400">
            <AlertDialogHeader>
              <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
              <AlertDialogTitle className="text-center text-2xl font-bold">
                Confirm Role Change
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-muted-foreground">
                {roleChangeConfirmation && (
                  <>
                    You are about to{' '}
                    {roleChangeConfirmation.newAdminState ? (
                      <strong>promote</strong>
                    ) : (
                      <strong>demote</strong>
                    )}{' '}
                    the user
                    <br />
                    <strong className="text-foreground">
                      {roleChangeConfirmation.user.email}
                    </strong>
                    <br />
                    to the role of{' '}
                    <strong>
                      {roleChangeConfirmation.newAdminState ? 'Admin' : 'User'}
                    </strong>
                    .
                    <br />
                    <br />
                    This action has security implications. Are you sure?
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeRoleChange}
                disabled={isUpdating}
                className={`min-w-24 ${
                  roleChangeConfirmation?.newAdminState === false
                    ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' // Demotion (Red)
                    : 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700' // Promotion (Yellow)
                }`}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming...
                  </div>
                ) : (
                  'Yes, I am sure'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

export default UserManagement
