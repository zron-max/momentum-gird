
import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Button, Input } from '../ui/SharedUI';
import { IconSun, IconMoon, IconBookOpen, IconTimeBlocks, IconCalendarDays, IconChartBar, IconCheck } from '../ui/Icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const AuthHeader: React.FC<{ onLoginClick: () => void; onToggleTheme: () => void; isDarkMode: boolean; }> = 
({ onLoginClick, onToggleTheme, isDarkMode }) => (
    <header className="absolute top-0 left-0 right-0 z-20 py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="bg-primary-500 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </div>
                <h1 className="text-xl font-bold text-text-light dark:text-text-dark">Momentum Grid</h1>
            </div>
            <div className="flex items-center gap-2">
                 <button
                    onClick={onToggleTheme}
                    className="p-2 rounded-full text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle dark mode"
                >
                    {isDarkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
                </button>
                <Button onClick={onLoginClick} variant="secondary" className="!py-2 !px-4 hidden sm:block">Log In / Sign Up</Button>
            </div>
        </div>
    </header>
);

const LearningMockup: React.FC = () => (
    <div className="p-3 bg-white/10 rounded-lg w-full">
        <p className="text-sm font-medium mb-2 text-white/90">Reading 'Sapiens'</p>
        <div className="w-full bg-black/20 rounded-full h-2.5">
            <div className="bg-green-400 h-2.5 rounded-full" style={{ width: '75%' }}></div>
        </div>
        <p className="text-xs text-right mt-1 text-white/70">337/450 pages</p>
    </div>
);

const TimeBlockMockup: React.FC = () => (
    <div className="p-2 bg-white/10 rounded-lg w-full text-xs">
        <div className="p-1.5 mb-1 rounded bg-indigo-500/80 text-white">09:00 - Focus Work</div>
        <div className="p-1.5 rounded bg-pink-500/80 text-white">12:00 - Lunch Break</div>
    </div>
);

const CalendarMockup: React.FC = () => (
    <div className="p-2 bg-white/10 rounded-lg w-full grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`aspect-square rounded flex items-center justify-center ${[1,2,4,5,7].includes(i) ? 'bg-green-400/80' : 'bg-black/20'}`}>
                {[1,2,4,5,7].includes(i) && <IconCheck className="w-3.5 h-3.5 text-white" />}
            </div>
        ))}
    </div>
);

const AnalyticsMockup: React.FC = () => (
     <div className="p-3 bg-white/10 rounded-lg w-full flex items-end justify-between h-[68px]">
        <div className="w-1/4 bg-green-400/80 rounded-t-sm" style={{ height: '40%' }}></div>
        <div className="w-1/4 bg-green-400/80 rounded-t-sm" style={{ height: '60%' }}></div>
        <div className="w-1/4 bg-green-400/80 rounded-t-sm" style={{ height: '50%' }}></div>
        <div className="w-1/4 bg-green-400/80 rounded-t-sm" style={{ height: '80%' }}></div>
    </div>
);


const features = [
    {
        Icon: IconBookOpen,
        title: "Learning Goal Tracker",
        description: "Track your reading, courses, or skill-building goals. See your progress in real-time and stay on top of your educational journey.",
        Mockup: LearningMockup,
        color: "from-blue-500 to-cyan-500",
    },
    {
        Icon: IconTimeBlocks,
        title: "Time Blocking",
        description: "Organize your day into focused work sessions. Stay productive by managing your time effectively and dedicating time to what matters.",
        Mockup: TimeBlockMockup,
        color: "from-purple-500 to-indigo-500",
    },
    {
        Icon: IconCalendarDays,
        title: "Calendar Sync",
        description: "Click any date to log your progress. Visualize your achievements and plan ahead with a comprehensive calendar view.",
        Mockup: CalendarMockup,
        color: "from-pink-500 to-red-500",
    },
    {
        Icon: IconChartBar,
        title: "Activity & Analytics",
        description: "Track your activities and see detailed reports. Gain insights from your data, analyze your growth, and keep improving.",
        Mockup: AnalyticsMockup,
        color: "from-amber-500 to-orange-500",
    },
];


export const AuthView: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('darkMode', false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    const handleToggleTheme = () => setIsDarkMode(prev => !prev);
    
    const handleScrollToAuth = () => {
        document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="bg-bkg-light dark:bg-gray-900 transition-colors duration-300">
            <AuthHeader onLoginClick={handleScrollToAuth} onToggleTheme={handleToggleTheme} isDarkMode={isDarkMode} />
            <main>
                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden px-4 pt-20 pb-10">
                    <div className="absolute inset-0 bg-bkg-light dark:bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(39,39,245,0.2),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 w-full max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-text-light dark:text-gray-100 tracking-tight mb-6">
                            Build <span className="text-primary-500">Momentum</span>. Master Your Goals.
                        </h1>
                        <p className="text-lg md:text-xl text-text-muted-light dark:text-gray-300 max-w-2xl mx-auto mb-10">
                           Momentum Grid is your all-in-one productivity and learning tool designed to keep you focused, organized, and motivated every single day.
                        </p>
                        <Button onClick={handleScrollToAuth} className="!py-3 !px-8 !text-lg !font-bold transform hover:scale-105 transition-transform">
                            Start Building Momentum
                        </Button>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 sm:py-32 px-4 bg-bkg-light dark:bg-gray-900">
                    <div className="container mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-text-light dark:text-gray-100">Everything You Need to Succeed</h2>
                            <p className="mt-4 text-lg text-text-muted-light dark:text-gray-400 max-w-2xl mx-auto">One tool to track your habits, learning, schedule, and more.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature) => (
                                <div key={feature.title} className={`relative p-6 rounded-2xl text-white overflow-hidden bg-gradient-to-br ${feature.color} group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
                                    <feature.Icon className="w-10 h-10 mb-4 opacity-80" />
                                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-white/80 mb-6">{feature.description}</p>
                                    <div className="mt-auto">
                                      <feature.Mockup />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Auth Section */}
                <section id="auth-section" className="py-20 sm:py-32 px-4 bg-gray-100 dark:bg-card-dark">
                    <div className="w-full max-w-md mx-auto">
                        <div className="text-center mb-8">
                             <h2 className="text-3xl md:text-4xl font-extrabold text-text-light dark:text-gray-100">Ready to build some momentum?</h2>
                             <p className="mt-3 text-lg text-text-muted-light dark:text-gray-400">Log in or sign up to get started!</p>
                        </div>
                        <div className="bg-card-light dark:bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-8">
                           {isLoginView ? <LoginForm /> : <RegisterForm />}
                           <div className="text-center mt-6">
                                <button 
                                    onClick={() => setIsLoginView(!isLoginView)}
                                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                   {isLoginView ? "Need an account? Sign up" : "Already have an account? Log in"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

const LoginForm: React.FC = () => {
    const { login } = useUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <h2 className="text-2xl font-bold text-center text-text-light dark:text-text-dark">Welcome Back!</h2>
            <Input label="Username" id="login-username" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
            <Input label="Password" id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full !py-3 !font-bold" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
        </form>
    );
};

const RegisterForm: React.FC = () => {
    const { register } = useUser();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await register(name, username, password);
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-text-light dark:text-text-dark">Create Your Account</h2>
            <Input label="Name" id="register-name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name"/>
            <Input label="Username" id="register-username" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"/>
            <Input label="Password" id="register-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"/>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full !py-3 !font-bold" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
        </form>
    );
};
