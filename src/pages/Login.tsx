import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [userType, setUserType] = useState('RENTER'); // RENTER or OWNER
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                const res = await axios.post('/api/v1/auth/login', { email, password });
                localStorage.setItem('accessToken', res.data.accessToken);
                navigate('/dashboard');
            } else {
                const res = await axios.post('/api/v1/auth/register', {
                    name,
                    email,
                    password,
                    role: userType
                });
                localStorage.setItem('accessToken', res.data.accessToken);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 relative w-full min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Subtle Background Gradient for Modern Feel */}
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 dark:from-primary/10 dark:to-transparent pointer-events-none"></div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-md flex flex-col gap-6 bg-white dark:bg-[#1c2027] p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">

                {/* Header Section */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center size-14 rounded-xl bg-primary/10 mb-2">
                        <span className="material-symbols-outlined text-primary text-3xl">real_estate_agent</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Home</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your rentals with ease.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                    {error && <div className="text-red-500 text-sm text-center font-semibold">{error}</div>}

                    {/* Auth Toggle (Login / Sign Up) */}
                    <div className="w-full">
                        <div className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-200 dark:bg-[#1e293b] p-1 relative">
                            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-[#101822] has-[:checked]:shadow-sm has-[:checked]:text-primary dark:has-[:checked]:text-white text-slate-500 dark:text-[#9da8b9] text-sm font-bold leading-normal transition-all duration-200">
                                <span className="truncate">Log In</span>
                                <input
                                    type="radio"
                                    name="auth_mode"
                                    value="Login"
                                    className="hidden"
                                    checked={isLogin}
                                    onChange={() => setIsLogin(true)}
                                />
                            </label>
                            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-[#101822] has-[:checked]:shadow-sm has-[:checked]:text-primary dark:has-[:checked]:text-white text-slate-500 dark:text-[#9da8b9] text-sm font-bold leading-normal transition-all duration-200">
                                <span className="truncate">Sign Up</span>
                                <input
                                    type="radio"
                                    name="auth_mode"
                                    value="Sign Up"
                                    className="hidden"
                                    checked={!isLogin}
                                    onChange={() => setIsLogin(false)}
                                />
                            </label>
                        </div>
                    </div>

                    {/* User Type Selector (Renter vs Owner) */}
                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-3">
                            <label className="relative group cursor-pointer">
                                <input
                                    type="radio"
                                    name="user_type"
                                    className="peer sr-only"
                                    checked={userType === 'RENTER'}
                                    onChange={() => setUserType('RENTER')}
                                />
                                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1c2027] p-4 text-center transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 peer-checked:ring-1 peer-checked:ring-primary">
                                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 peer-checked:text-primary transition-colors text-3xl">cottage</span>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 peer-checked:text-primary dark:peer-checked:text-white">I'm a Renter</span>
                                </div>
                            </label>
                            <label className="relative group cursor-pointer">
                                <input
                                    type="radio"
                                    name="user_type"
                                    className="peer sr-only"
                                    checked={userType === 'OWNER'}
                                    onChange={() => setUserType('OWNER')}
                                />
                                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1c2027] p-4 text-center transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 peer-checked:ring-1 peer-checked:ring-primary">
                                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 peer-checked:text-primary transition-colors text-3xl">key</span>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 peer-checked:text-primary dark:peer-checked:text-white">I'm an Owner</span>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Name Input (Sign Up Only) */}
                        {!isLogin && (
                            <label className="block space-y-1.5">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</span>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1c2027] px-4 py-3.5 pl-11 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                    />
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                    </div>
                                </div>
                            </label>
                        )}

                        {/* Email Input */}
                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</span>
                            <div className="relative flex items-center">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1c2027] px-4 py-3.5 pl-11 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                />
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                            </div>
                        </label>

                        {/* Password Input */}
                        <label className="block space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                                {isLogin && <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Forgot Password?</a>}
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1c2027] px-4 py-3.5 pl-11 pr-11 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                />
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">visibility_off</span>
                                </button>
                            </div>
                        </label>
                    </div>

                    {/* Primary Action */}
                    <button type="submit" className="w-full rounded-xl bg-primary py-3.5 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-blue-600 active:scale-[0.98] transition-all">
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-500 dark:text-slate-400">Or continue with</span>
                    <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                </div>

                {/* Social Auth */}
                <div className="flex items-center justify-center gap-4">
                    <button className="flex h-12 w-16 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1c2027] text-slate-600 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-[#282f39]">
                        {/* Custom Apple Icon SVG */}
                        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.48-1.23 3.61-1.14 1.37.08 2.73.74 3.37 1.87-.72.69-1.57 1.62-1.22 3.19.34 1.29 1.51 2.09 1.95 2.29-.46 1.43-1.12 2.87-2.79 6.02zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"></path></svg>
                    </button>
                    <button className="flex h-12 w-16 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1c2027] text-slate-600 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-[#282f39]">
                        {/* Custom Google Icon SVG */}
                        <svg className="h-6 w-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
                    </button>
                </div>

                {/* Footer Links */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    By continuing, you agree to our
                    <a className="text-primary hover:underline" href="#">Terms of Service</a>
                    and
                    <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}
