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
        <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-x-hidden md:overflow-hidden">

                {/* Architectural Hero (Top Half on Mobile, Left Half on Desktop) */}
                <div className="relative h-[40vh] md:h-screen w-full md:w-1/2 lg:w-[55%] overflow-hidden bg-slate-900">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(180deg, rgba(16,34,32,0.1) 0%, rgba(16,34,32,0.8) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzfGoKCJrnUg29vW4pH4FVh2sTwHv8UzoWrRnZAawqGYj4b1g-2gRCAtEpRmRFY1SirmR96n-7jeSzw0VGB6Xqvy9g1_NMuuux_vkONI81L1vh0BVfMCz8hu3hOjyUODKCe_gUgWaLvLnlyLtl_YfVM_g9gTXzM8-Ib8OEVmi-eETZ2yNGn6_VF1ntpbvi38Z8SDZJh643yCgc61ylFQXB_hBiHXNlSjh7NLgGWk6cbuRkTxWaFFZbP166J82ueICh7QOugBTEvg')" }}></div>
                    <div className="relative z-10 flex h-full flex-col justify-end p-8 pb-16 md:p-16 md:pb-24">
                        <div className="mb-4">
                            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-white border border-white/20">GetSet Premium</span>
                        </div>
                        <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-none tracking-tighter">
                            Finding the<br />perfect space<br />to call home.
                        </h2>
                    </div>
                </div>

                {/* Login Form (Bottom Half on Mobile, Right Half on Desktop) */}
                <div className="flex-1 w-full md:w-1/2 lg:w-[45%] bg-background-light dark:bg-background-dark -mt-8 md:mt-0 relative z-20 rounded-t-3xl md:rounded-none px-6 md:px-12 pt-10 pb-16 flex flex-col justify-center overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                    {/* Floating Home Button */}
                    <button onClick={() => navigate('/')} className="hidden md:flex absolute top-8 right-8 items-center justify-center w-12 h-12 rounded-full bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">close</span>
                    </button>

                    <div className="max-w-md w-full mx-auto md:mx-0">
                        <header className="mb-8">
                            <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-widest uppercase">
                                {isLogin ? 'Login' : 'Sign Up'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                {isLogin ? 'Welcome back to your sanctuary.' : 'Join the most premium rental network.'}
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold text-center">{error}</div>}

                            {/* Auth Toggle (Login / Sign Up) */}
                            <div className="flex bg-slate-200/50 dark:bg-white/5 p-1 rounded-xl backdrop-blur-md border border-slate-300/50 dark:border-white/10 mb-6 relative">
                                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#102220] rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${isLogin ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}></div>
                                <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-sm font-bold tracking-wide transition-colors relative z-10 ${isLogin ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>Log In</button>
                                <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-sm font-bold tracking-wide transition-colors relative z-10 ${!isLogin ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>Sign Up</button>
                            </div>

                            {/* User Type Selector (Sign Up Only) */}
                            {!isLogin && (
                                <div className="grid grid-cols-2 gap-4 pb-2">
                                    <label className="relative group cursor-pointer">
                                        <input type="radio" name="user_type" className="peer sr-only" checked={userType === 'RENTER'} onChange={() => setUserType('RENTER')} />
                                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-300/50 dark:border-white/10 bg-slate-200/30 dark:bg-white/5 py-4 text-center transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/10">
                                            <span className="material-symbols-outlined text-slate-400 peer-checked:text-primary transition-colors text-3xl">cottage</span>
                                            <span className="text-xs font-bold text-slate-500 peer-checked:text-slate-900 dark:peer-checked:text-white tracking-widest uppercase">Renter</span>
                                        </div>
                                    </label>
                                    <label className="relative group cursor-pointer">
                                        <input type="radio" name="user_type" className="peer sr-only" checked={userType === 'OWNER'} onChange={() => setUserType('OWNER')} />
                                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-300/50 dark:border-white/10 bg-slate-200/30 dark:bg-white/5 py-4 text-center transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/10">
                                            <span className="material-symbols-outlined text-slate-400 peer-checked:text-primary transition-colors text-3xl">key</span>
                                            <span className="text-xs font-bold text-slate-500 peer-checked:text-slate-900 dark:peer-checked:text-white tracking-widest uppercase">Owner</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Name Input (Sign Up Only) */}
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                                    <div className="relative flex items-center group">
                                        <span className="material-symbols-outlined absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                                        <input required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 backdrop-blur-md rounded-xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" placeholder="Enter your full name" type="text" />
                                    </div>
                                </div>
                            )}

                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email</label>
                                <div className="relative flex items-center group">
                                    <span className="material-symbols-outlined absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                                    <input required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 backdrop-blur-md rounded-xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" placeholder="Enter your email" type="email" />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
                                </div>
                                <div className="relative flex items-center group">
                                    <span className="material-symbols-outlined absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                                    <input required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 backdrop-blur-md rounded-xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" placeholder="Enter your password" type="password" />
                                </div>
                            </div>

                            {/* Forgot Password */}
                            {isLogin && (
                                <div className="flex justify-end pt-1">
                                    <a className="text-sm font-semibold text-primary hover:text-teal-600 transition-colors" href="#">Forgot password?</a>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button className="w-full h-14 bg-gradient-to-r from-primary to-[#00c9b7] text-white font-extrabold text-lg uppercase tracking-widest rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 active:scale-[0.98] transition-all" type="submit">
                                    {isLogin ? 'Login' : 'Create Account'}
                                </button>
                            </div>
                        </form>

                        {/* Social Logins */}
                        <div className="mt-10">
                            <div className="relative flex items-center justify-center mb-8">
                                <div className="w-full border-t border-slate-300 dark:border-white/10"></div>
                                <span className="absolute bg-background-light dark:bg-background-dark px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or connect with</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                    </svg>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Google</span>
                                </button>
                                <button type="button" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm">
                                    <svg className="w-5 h-5 fill-current text-slate-900 dark:text-white" viewBox="0 0 24 24">
                                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.039 2.48-4.5 2.597-4.571-1.428-2.09-3.623-2.324-4.4-2.363-1.883-.156-3.003.896-3.96.896zm.543-1.61c.844-1.026 1.403-2.454 1.247-3.87-1.221.051-2.701.818-3.584 1.844-.793.922-1.481 2.377-1.299 3.766 1.363.104 2.733-.715 3.636-1.74z"></path>
                                    </svg>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Apple</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
