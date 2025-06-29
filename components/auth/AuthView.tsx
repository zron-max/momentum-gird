import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Button, Input } from '../ui/SharedUI';
import { IconUser, IconSun, IconMoon } from '../ui/Icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const AuthView: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('darkMode', false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <div className="relative w-full h-screen flex items-center justify-center bg-bkg-light dark:bg-bkg-dark p-4 transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setIsDarkMode(prev => !prev)}
                    className="p-2 rounded-full text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle dark mode"
                >
                    {isDarkMode ? <IconSun className="w-6 h-6" /> : <IconMoon className="w-6 h-6" />}
                </button>
            </div>
            
            <div className="w-full max-w-sm mx-auto">
                <div className="flex justify-center mb-6">
                     <div className="bg-primary-500 p-3 rounded-full">
                        <IconUser className="h-8 w-8 text-white" />
                    </div>
                </div>
                <div className="bg-card-light dark:bg-card-dark shadow-2xl rounded-lg p-6 md:p-8">
                   {isLoginView ? <LoginForm /> : <RegisterForm />}
                   <div className="text-center mt-4">
                        <button 
                            onClick={() => setIsLoginView(!isLoginView)}
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                           {isLoginView ? "Need an account? Sign up" : "Already have an account? Log in"}
                        </button>
                    </div>
                </div>
            </div>
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
            // On success, the main app will render automatically
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
            <Button type="submit" className="w-full" disabled={isLoading}>
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
             // On success, the main app will render automatically
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-text-light dark:text-text-dark">Create Account</h2>
            <Input label="Name" id="register-name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name"/>
            <Input label="Username" id="register-username" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"/>
            <Input label="Password" id="register-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"/>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
        </form>
    );
};