import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { User, Feedback, ActivityLog } from '../../types';
import { Button, Modal } from '../ui/SharedUI';
import { IconTrash, IconLogout, IconUsers, IconEye, IconEyeOff, IconChartBar, IconMessageSquare, IconSun, IconMoon } from '../ui/Icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type AdminView = 'users' | 'activity' | 'feedback';

const AdminDashboard: React.FC = () => {
    const { currentUser, logout, logActivity } = useUser();
    const [view, setView] = useState<AdminView>('users');
    const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('darkMode', false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    const handleToggleTheme = () => {
        setIsDarkMode(prev => !prev);
        logActivity('setting_change_dark_mode');
    };

    const renderView = () => {
        switch (view) {
            case 'users': return <UserManagement />;
            case 'activity': return <ActivityMonitor />;
            case 'feedback': return <FeedbackViewer />;
            default: return <UserManagement />;
        }
    };

    return (
        <div className="flex h-screen bg-bkg-light dark:bg-bkg-dark text-text-light dark:text-text-dark">
            <aside className="w-64 bg-card-light dark:bg-card-dark flex flex-col justify-between p-4 border-r border-border-light dark:border-border-dark">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-primary-500 p-2 rounded-lg"><IconUsers className="h-6 w-6 text-white" /></div>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                    </div>
                    <div className="text-sm p-3 bg-bkg-light dark:bg-bkg-dark rounded-lg mb-6">
                        <p className="font-semibold">{currentUser?.name}</p>
                        <p className="text-text-muted-light dark:text-text-muted-dark">{currentUser?.username}</p>
                    </div>
                    <nav className="space-y-1">
                        <AdminNavButton icon={<IconUsers className="w-5 h-5" />} label="User Management" isActive={view === 'users'} onClick={() => setView('users')} />
                        <AdminNavButton icon={<IconChartBar className="w-5 h-5" />} label="Activity & Analytics" isActive={view === 'activity'} onClick={() => setView('activity')} />
                        <AdminNavButton icon={<IconMessageSquare className="w-5 h-5" />} label="User Feedback" isActive={view === 'feedback'} onClick={() => setView('feedback')} />
                    </nav>
                </div>
                <div className="space-y-2">
                    <button
                        onClick={handleToggleTheme}
                        className="w-full flex items-center p-3 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-bkg-light dark:hover:bg-bkg-dark"
                    >
                        {isDarkMode ? <IconSun className="w-6 h-6" /> : <IconMoon className="w-6 h-6" />}
                        <span className="ml-4 font-semibold">
                            {isDarkMode ? "Light Mode" : "Dark Mode"}
                        </span>
                    </button>
                    <button onClick={logout} className="w-full flex items-center p-3 rounded-lg text-text-muted-light dark:text-text-muted-dark hover:bg-bkg-light dark:hover:bg-bkg-dark transition-colors">
                        <IconLogout className="w-6 h-6" /><span className="ml-4 font-semibold">Logout</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">{renderView()}</main>
        </div>
    );
};

const AdminNavButton: React.FC<{icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void}> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200' : 'hover:bg-bkg-light dark:hover:bg-bkg-dark'}`}>
        {icon} <span className="ml-3 font-medium">{label}</span>
    </button>
);

const UserManagement = () => {
    const { currentUser, users, deleteUser } = useUser();
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string>('');
    
    const managedUsers = users.filter(u => u.id !== currentUser?.id);

    const togglePasswordVisibility = (userId: string) => {
        setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    const handleDeleteClick = (user: User) => {
        setError('');
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteUser(userToDelete.id);
                setUserToDelete(null);
            } catch (e: any) {
                setError(e.message || 'Failed to delete user.');
                setUserToDelete(null);
            }
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
            <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-border-light dark:border-border-dark text-left text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Name</th>
                                <th className="px-5 py-3 border-b-2 border-border-light dark:border-border-dark text-left text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Username</th>
                                <th className="px-5 py-3 border-b-2 border-border-light dark:border-border-dark text-left text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Password</th>
                                <th className="px-5 py-3 border-b-2 border-border-light dark:border-border-dark text-left text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {managedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-bkg-light dark:hover:bg-bkg-dark">
                                    <td className="px-5 py-4 border-b border-border-light dark:border-border-dark">
                                        <p className="text-sm text-text-light dark:text-text-dark">{user.name}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-border-light dark:border-border-dark">
                                        <p className="text-sm text-text-light dark:text-text-dark">{user.username}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-border-light dark:border-border-dark">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs text-text-light dark:text-text-dark">{visiblePasswords[user.id] ? user.password : '••••••••••'}</span>
                                            <button onClick={() => togglePasswordVisibility(user.id)} className="p-1 text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark">
                                                {visiblePasswords[user.id] ? <IconEyeOff className="w-5 h-5"/> : <IconEye className="w-5 h-5"/>}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 border-b border-border-light dark:border-border-dark text-sm">
                                        <Button variant="danger" className="!py-1 !px-3" onClick={() => handleDeleteClick(user)}>
                                            <IconTrash className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {managedUsers.length === 0 && (
                                 <tr><td colSpan={4} className="text-center py-10 text-text-muted-light dark:text-text-muted-dark">No other users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Confirm Deletion"
                footer={<><Button variant="secondary" onClick={() => setUserToDelete(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete User</Button></>}>
                <p className="text-text-light dark:text-text-dark">Are you sure you want to delete <span className="font-bold">{userToDelete?.name}</span> ({userToDelete?.username})? This cannot be undone.</p>
            </Modal>
        </>
    );
};

const ActivityMonitor = () => {
    const { activityLogs, users } = useUser();
    const [userFilter, setUserFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const filteredLogs = useMemo(() => {
        return activityLogs.filter(log => 
            (userFilter ? log.userId === userFilter : true) &&
            (actionFilter ? log.action === actionFilter : true)
        );
    }, [activityLogs, userFilter, actionFilter]);

    const summaryStats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const loginsToday = activityLogs.filter(log => log.action === 'login' && log.timestamp.startsWith(todayStr)).length;
        const uniqueUserIds = [...new Set(activityLogs.map(l => l.userId))];
        return {
            totalUsers: users.filter(u => u.role !== 'admin').length,
            totalLogs: activityLogs.length,
            loginsToday,
            activeUsers: uniqueUserIds.length,
        };
    }, [activityLogs, users]);
    
    const allActions = [...new Set(activityLogs.map(l => l.action))];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Activity & Analytics</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow"><p className="text-sm text-text-muted-light dark:text-text-muted-dark">Total Users</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{summaryStats.totalUsers}</p></div>
                <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow"><p className="text-sm text-text-muted-light dark:text-text-muted-dark">Active Users</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{summaryStats.activeUsers}</p></div>
                <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow"><p className="text-sm text-text-muted-light dark:text-text-muted-dark">Logins Today</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{summaryStats.loginsToday}</p></div>
                <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow"><p className="text-sm text-text-muted-light dark:text-text-muted-dark">Total Events</p><p className="text-2xl font-bold text-text-light dark:text-text-dark">{summaryStats.totalLogs}</p></div>
            </div>
            
            <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow mb-6 flex gap-4 items-center">
                <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full px-3 py-2 bg-bkg-light dark:bg-bkg-dark border border-border-light dark:border-border-dark rounded-md">
                    <option value="">All Users</option>
                    {users.filter(u => u.role === 'user').map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
                <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full px-3 py-2 bg-bkg-light dark:bg-bkg-dark border border-border-light dark:border-border-dark rounded-md">
                    <option value="">All Actions</option>
                    {allActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
            </div>
            
            <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                    <thead><tr>
                        <th className="px-5 py-3 border-b-2 border-border-light dark:border-border-dark text-left text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase">Timestamp</th>
                        <th className="px-5 py-3 border-b-2 border-border-light dark:border-border-dark text-left text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase">User</th>
                        <th className="px-5 py-3 border-b-2 border-border-light dark:border-border-dark text-left text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase">Action</th>
                    </tr></thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-bkg-light dark:hover:bg-bkg-dark">
                                <td className="px-5 py-4 border-b border-border-light dark:border-border-dark text-sm text-text-light dark:text-text-dark">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-5 py-4 border-b border-border-light dark:border-border-dark text-sm text-text-light dark:text-text-dark">{log.username}</td>
                                <td className="px-5 py-4 border-b border-border-light dark:border-border-dark text-sm capitalize text-text-light dark:text-text-dark">{log.action.replace(/_/g, ' ')}</td>
                            </tr>
                        ))}
                         {filteredLogs.length === 0 && (
                            <tr><td colSpan={3} className="text-center py-10 text-text-muted-light dark:text-text-muted-dark">No logs match the current filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FeedbackViewer = () => {
    const { feedback } = useUser();
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">User Feedback</h1>
            <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg">
                {feedback.length > 0 ? (
                    <ul className="divide-y divide-border-light dark:divide-border-dark">
                        {feedback.map(fb => (
                            <li key={fb.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-semibold text-text-light dark:text-text-dark">{fb.username}</p>
                                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{new Date(fb.timestamp).toLocaleString()}</p>
                                </div>
                                <p className="text-text-light dark:text-text-dark whitespace-pre-wrap">{fb.content}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-10 text-center text-text-muted-light dark:text-text-muted-dark">No feedback has been submitted yet.</p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;