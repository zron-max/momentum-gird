import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Trash2, Edit3, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
}

interface UserManagementProps {
  onStatsUpdate: () => void;
}

function UserManagement({ onStatsUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  // REF: Update user_roles table using is_admin boolean
  const updateUserRole = async (userId: string, isAdmin: boolean) => {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, is_admin: isAdmin }, { onConflict: 'user_id' });
    if (error) throw error;
  };

  const deleteFromProfiles = async (id: string) => {
    const res = await fetch('/api/admin/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'profiles', id }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete from profiles');
    }
  };

  const deleteUser = async (profileId: string, userId: string) => {
    try {
      setIsDeleting(true);
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
      await deleteFromProfiles(profileId);
      setUsers(prev => prev.filter(u => u.id !== profileId));
      toast({ title: 'Success', description: 'User deleted successfully' });
      onStatsUpdate();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    } finally { setIsDeleting(false); }
  };

  const approveUser = (u: User) => handleRoleStatusUpdate(u, USER_STATUS.APPROVED);
  const rejectUser = (u: User) => handleRoleStatusUpdate(u, USER_STATUS.REJECTED);

  const handleRoleStatusUpdate = async (u: User, status: UserStatus) => {
    try {
      setIsUpdating(true);
      await updateUser(u.id, { status });
      setUsers(prev => prev.map(user => user.id === u.id ? { ...user, status } : user));
      toast({ title: 'Success', description: 'User status updated' });
      onStatsUpdate();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally { setIsUpdating(false); }
  };

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.email.toLowerCase().includes(s) || (u.full_name?.toLowerCase().includes(s) ?? false);
  });

  const getStatusBadge = (status: UserStatus) => {
    const map = {
      [USER_STATUS.PENDING]: { variant: 'secondary', text: 'Pending' },
      [USER_STATUS.APPROVED]: { variant: 'default', text: 'Approved' },
      [USER_STATUS.REJECTED]: { variant: 'destructive', text: 'Rejected' },
    };
    const cfg = map[status] || map[USER_STATUS.PENDING];
    return <Badge variant={cfg.variant as any}>{cfg.text}</Badge>;
  };

  const handleEditUser = (u: User) => setEditingUser({ ...u });
  const handleCancelEdit = () => setEditingUser(null);

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      // Update profiles table
      await updateUser(editingUser.id, { status: editingUser.status, is_admin: editingUser.is_admin });
      // Update user_roles table
      await updateUserRole(editingUser.user_id, editingUser.is_admin);

      toast({ title: 'Success', description: 'User updated successfully' });
      setEditingUser(null);
      onStatsUpdate();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save user changes', variant: 'destructive' });
    } finally { setIsUpdating(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{searchTerm ? 'No users found.' : 'No users.'}</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.full_name || 'N/A'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getStatusBadge(u.status)}</TableCell>
                    <TableCell>
                      <Badge variant={u.is_admin ? 'default' : 'outline'}>{u.is_admin ? 'Admin' : 'User'}</Badge>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {u.status === USER_STATUS.PENDING && <>
                          <Button variant="outline" size="sm" onClick={() => approveUser(u)} disabled={isUpdating}><UserCheck className="h-4 w-4 text-green-600" /></Button>
                          <Button variant="outline" size="sm" onClick={() => rejectUser(u)} disabled={isUpdating}><UserX className="h-4 w-4 text-red-600" /></Button>
                        </>}
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(u)} disabled={isUpdating}><Edit3 className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete <strong>{u.email}</strong>?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(u.id, u.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && handleCancelEdit()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input value={editingUser.email} disabled className="bg-muted" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={editingUser.status} onValueChange={(val: UserStatus) => setEditingUser({ ...editingUser, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={USER_STATUS.PENDING}>Pending</SelectItem>
                      <SelectItem value={USER_STATUS.APPROVED}>Approved</SelectItem>
                      <SelectItem value={USER_STATUS.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={editingUser.is_admin ? 'admin' : 'user'} onValueChange={(val) => setEditingUser({ ...editingUser, is_admin: val === 'admin' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  <Button onClick={handleSaveEdit} disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default UserManagement;
