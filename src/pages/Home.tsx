import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Home() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const isLoggedIn = !!localStorage.getItem('accessToken');

    useEffect(() => {
        const fetchPropertiesAndFavorites = async () => {
            try {
                const res = await axios.get('/api/v1/properties');
                setProperties(res.data.content || []);

                const token = localStorage.getItem('accessToken');
                if (token) {
                    try {
                        const headers = { Authorization: `Bearer ${token}` };

                        const [favRes, countRes] = await Promise.all([
                            axios.get('/api/v1/favorites', { headers }),
                            axios.get('/api/v1/messages/unread-count', { headers }).catch(() => ({ data: { count: 0 } }))
                        ]);

                        const favIds = new Set(favRes.data.content?.map((f: any) => f.propertyId) || []);
                        setFavorites(favIds as Set<string>);
                        setUnreadCount(countRes.data?.count || 0);
                    } catch (e) {
                        console.warn("Could not fetch user data", e);
                    }
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch properties');
            } finally {
                setLoading(false);
            }
        };
        fetchPropertiesAndFavorites();
    }, []);

    const toggleFavorite = async (e: React.MouseEvent, propertyId: string) => {
        e.stopPropagation();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            toast.error("Please login first to save properties");
            navigate('/login');
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const isFav = favorites.has(propertyId);

        try {
            if (isFav) {
                await axios.delete(`/api/v1/favorites/${propertyId}`, { headers });
                setFavorites(prev => {
                    const newFavs = new Set(prev);
                    newFavs.delete(propertyId);
                    return newFavs;
                });
            } else {
                await axios.post(`/api/v1/favorites/${propertyId}`, {}, { headers });
                setFavorites(prev => {
                    const newFavs = new Set(prev);
                    newFavs.add(propertyId);
                    return newFavs;
                });
            }
        } catch (err) {
            console.error("Failed to toggle favorite", err);
            toast.error("Failed to update saved properties");
        }
    };

    const categories = ['All', 'Villas', 'Lofts', 'Beach', 'Cabin'];
    const categoryIcons: Record<string, string> = {
        'All': 'apps',
        'Villas': 'villa',
        'Lofts': 'apartment',
        'Beach': 'beach_access',
        'Cabin': 'landscape'
    };

    const filteredProperties = activeCategory === 'All'
        ? properties
        : properties.filter(p => p.propertyType?.toLowerCase() === activeCategory.toLowerCase() || p.title.toLowerCase().includes(activeCategory.toLowerCase()));

    return (
        <div className="relative font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen pb-24 md:pb-0">

            {/* Desktop Navbar */}
            <header className="hidden md:flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50 p-4 justify-between border-b border-primary/10">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="text-primary flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded">
                        <span className="material-symbols-outlined text-2xl">roofing</span>
                    </div>
                    <h2 className="text-slate-900 dark:text-slate-100 text-xl font-black leading-tight tracking-tighter uppercase">GetSet</h2>
                </div>

                <div className="flex items-center gap-6">
                    <Link to="/" className="text-sm font-semibold text-primary uppercase tracking-widest">Explore</Link>
                    <Link to="/saved" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest">Saved</Link>
                    <Link to="/messages" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors relative uppercase tracking-widest">
                        Messages
                        {unreadCount > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center justify-center rounded-full size-10 bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    {isLoggedIn ? (
                        <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center rounded-full size-10 bg-primary text-white shadow-lg shadow-primary/20 transition-transform active:scale-95">
                            <span className="material-symbols-outlined">person</span>
                        </button>
                    ) : (
                        <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-bold flex items-center justify-center transition-colors">
                            Log In
                        </button>
                    )}
                </div>
            </header>

            {/* Mobile Header/Search Navigation */}
            <div className="md:hidden absolute top-6 left-6 right-6 z-20">
                <div className="bg-white/15 dark:bg-background-dark/60 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center p-2 rounded-full shadow-lg">
                    <div className="flex-1 flex items-center px-4 gap-3">
                        <span className="material-symbols-outlined text-white">search</span>
                        <input className="bg-transparent border-none focus:ring-0 text-white placeholder-white/80 text-sm w-full outline-none" placeholder="Where to next?" type="text" />
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-white p-2 rounded-full flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative h-[85vh] md:h-[70vh] w-full flex flex-col justify-end p-6 md:p-12 bg-cover bg-center"
                style={{ backgroundImage: "linear-gradient(to bottom, rgba(30, 27, 75, 0.2), rgba(30, 27, 75, 0.9)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZj6m-pRdIpt8GkV_Z2XHWawyBzGyXHSfvwN5yDKOO-aIgbj8nk5kPXuADneA0KuYpmvfdGs6p-78NQTynwnATIKdGbQSDf-p5dG9Kw7m6UAVgo1ZDOBMP3ymlbY0CC9tT6XRf938Ifwop_2N_OSOP6o1ZdsSxfEKa5DTic2dq4W7FPAdRT0YxeYTmCGT0UtEkDN3UrB3KnhRRvl7fPSm-DO9_HZGoCGh-3EM_atA8RLfTOEGfPR1xaIvvLwsLVSu63mq8Z4gQ2g')" }}>

                <div className="relative z-10 mb-8 max-w-4xl mx-auto w-full">
                    <span className="inline-block px-4 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold text-xs mb-4 uppercase tracking-widest">Premium Rentals</span>
                    <h1 className="text-white text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-4 uppercase">
                        Find Your Place <br className="md:hidden" /> in the World
                    </h1>
                    <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed max-w-[90%] md:max-w-[60%]">
                        Experience breathtaking homes curated for your lifestyle.
                    </p>

                    <div className="flex gap-4 mt-8 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <button onClick={() => window.scrollTo({ top: document.getElementById('featured')?.offsetTop, behavior: 'smooth' })} className="flex-none bg-primary text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-transform active:scale-95">
                            Explore Homes
                        </button>
                        <button className="flex-none bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white/20 transition-colors">
                            <span className="material-symbols-outlined">play_circle</span>
                            Virtual Tour
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Section */}
            <div className="px-6 md:px-12 -mt-6 relative z-30 max-w-6xl mx-auto">
                <div className="bg-background-dark/80 dark:bg-background-dark backdrop-blur-xl rounded-xl p-4 md:px-10 md:py-6 flex justify-between md:justify-around items-center shadow-2xl border border-white/10 overflow-x-auto gap-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {categories.map(cat => (
                        <div key={cat} onClick={() => setActiveCategory(cat)} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0">
                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors shadow-inner ${activeCategory === cat ? 'bg-primary/20 text-primary' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700'}`}>
                                <span className="material-symbols-outlined md:text-3xl">{categoryIcons[cat]}</span>
                            </div>
                            <span className={`text-[10px] md:text-sm font-bold uppercase tracking-widest ${activeCategory === cat ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'}`}>{cat}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Featured Properties Grid */}
            <section id="featured" className="mt-16 md:mt-24 px-6 md:px-12 max-w-6xl mx-auto min-h-[40vh]">
                <div className="flex justify-between items-end mb-8 md:mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 uppercase">Featured Homes</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium mt-1">Hand-picked premium stays</p>
                    </div>
                </div>

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse-subtle">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-background-dark p-2 border border-slate-100 dark:border-white/5">
                                <div className="aspect-[4/3] w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
                            </div>
                        ))}
                    </div>
                )}

                {error && <div className="text-center py-8 text-red-500 font-bold">{error}</div>}

                {!loading && !error && filteredProperties.length === 0 && (
                    <div className="text-center py-16 text-slate-500 font-medium text-lg">No breathtaking homes found. Be the first to add one!</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProperties.map((property, idx) => {
                        const images = [
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuBtVtQqkDQEEvbTHZDJPOl6MQyZDnUFGNI7He59bQN7UaV9bj0UYs3VSAsPlNVqGprpBoYEQ-iw4nR4kixdi6HatpflUVsdlIuUC6_jTDRXo0pF3kA0UEBqnzYjgs7ZEsbfCV0fac4fwMuWKQvyVOR--Ywv45mt16U7iJfqflM0Xk0Lv5O7FJh4_WnOmw_P6zbdIF9XKawok3nsVilsB70M55IOT2168XYnsnLW8ydlLHpARC8sqFyt5YP1LtNLPPjSfMfrrPQjFw",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuDfD6lFufrSwASL8Z4wb0hs5Iubjt5b1pcJJg0ir0D7qW8l7mCTWCtqmIPWFpvKsTX6ddf9AnG13xIzYedhEmel_hm3pKWAOL1Qpv6jJ1XNMZYeoK8KeqAaA3z84-87Kufg029r9r34qYocB3NBex0owESw6hUb76L4JzaUkjrOZP6oBOgFawU2D3RhjNE03rqkRSsL2s90yi1eNVE0A0jcyYnbNvWxZrvP8LjzP61silYXXqwBtOcRxct9uzI74iL5fik4Ky4vrw",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuAX0LngODOTzMGwNmR6naBPODQBHQOJ308ndJhIU0tKKSIGNCEiZ8qJKvJk1rFbJaC5pTrIakjFi_R76ANXNzDuScbUV9isCp-J3S3cl6h41ln-jUdUPsrdvTbdjGZKJ4cff_UUB8Wt6d9OhGibUYL1Oq4XT15ZqL11cX1psPlWyC5lExqtgSwImpLGFf3i8YaFZCv6cImEhkV2rKh01UN5ZbZYMx1CjkynG2rRgesZLrFfunzHNHWpzGhqWXDet5BcbnjtJUi6wQ"
                        ];
                        const imgUrl = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls[0] : images[idx % images.length];

                        return (
                            <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} className="relative group cursor-pointer transition-transform duration-300 hover:-translate-y-2">
                                <div className="relative h-64 md:h-72 w-full rounded-xl overflow-hidden shadow-xl border border-slate-100 dark:border-white/5">
                                    <img alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={imgUrl} />
                                    <div className="absolute top-4 right-4">
                                        <button onClick={(e) => toggleFavorite(e, property.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-md shadow-lg ${favorites.has(property.id) ? 'bg-white text-primary' : 'bg-white/20 text-white hover:bg-white/40'}`}>
                                            <span className="material-symbols-outlined !text-[20px]" style={{ fontVariationSettings: favorites.has(property.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-primary/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                            ${property.pricePerMonth}<span className="font-normal opacity-80"> /mo</span>
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-background-dark/80 backdrop-blur-md text-white px-2 py-1 rounded shadow-lg">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{property.propertyType || 'Villa'}</span>
                                    </div>
                                </div>
                                <div className="mt-5 flex justify-between items-start px-1">
                                    <div className="truncate pr-4">
                                        <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 tracking-tight truncate">{property.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1 font-medium truncate">
                                            <span className="material-symbols-outlined text-xs">location_on</span>
                                            {property.location?.address || 'Premium Location'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                                        <span className="material-symbols-outlined text-primary !text-[18px] fill-current">star</span>
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">4.9</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Value Proposition Layer */}
            <section className="mt-24 px-6 md:px-12 py-16 md:py-24 bg-slate-900 dark:bg-black rounded-t-[3rem] md:rounded-[3rem] max-w-7xl mx-auto shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 relative z-10">
                    <span className="text-primary font-bold text-xs md:text-sm tracking-widest uppercase mb-4 block">Premium Rental Process</span>
                    <h2 className="text-white text-4xl md:text-5xl font-black leading-tight uppercase tracking-tighter">
                        The GetSet Advantage
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed mt-4 max-w-2xl mx-auto">
                        Experience a breathtaking rental process with our verified, high-end platform built for modern living.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto relative z-10">
                    <div className="flex md:flex-col gap-5 md:gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 md:p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 group">
                        <div className="text-primary bg-primary/20 size-14 md:size-16 rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-3xl md:text-4xl">shield</span>
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <h3 className="text-white text-xl md:text-2xl font-extrabold leading-tight uppercase tracking-tight">Secure</h3>
                            <p className="text-slate-400 text-sm md:text-base leading-normal font-medium">End-to-end encrypted transactions for your absolute peace of mind.</p>
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-5 md:gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 md:p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 group">
                        <div className="text-primary bg-primary/20 size-14 md:size-16 rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-3xl md:text-4xl">bolt</span>
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <h3 className="text-white text-xl md:text-2xl font-extrabold leading-tight uppercase tracking-tight">Fast</h3>
                            <p className="text-slate-400 text-sm md:text-base leading-normal font-medium">Find and book your next breathtaking home in minutes, not days.</p>
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-5 md:gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 md:p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 group">
                        <div className="text-primary bg-primary/20 size-14 md:size-16 rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-3xl md:text-4xl">verified_user</span>
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <h3 className="text-white text-xl md:text-2xl font-extrabold leading-tight uppercase tracking-tight">Verified</h3>
                            <p className="text-slate-400 text-sm md:text-base leading-normal font-medium">Every premium listing is manually checked for quality and authenticity.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background-light dark:bg-background-dark px-6 md:px-12 pt-24 pb-32 md:pb-24 mt-12 border-t border-slate-200 dark:border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:justify-between">
                    <div className="flex flex-col gap-6 md:max-w-xs">
                        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                            <div className="text-primary bg-primary/10 p-2 rounded group-hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-2xl">roofing</span>
                            </div>
                            <h3 className="text-slate-900 dark:text-slate-100 text-2xl font-black uppercase tracking-tighter group-hover:text-primary transition-colors">GetSet</h3>
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                            Redefining the way you find your next breathtaking home with security and style.
                        </p>
                        <div className="flex gap-4">
                            <a className="text-slate-400 hover:text-primary transition-colors bg-white dark:bg-white/5 p-2 rounded-full shadow-sm" href="#">
                                <span className="material-symbols-outlined">public</span>
                            </a>
                            <a className="text-slate-400 hover:text-primary transition-colors bg-white dark:bg-white/5 p-2 rounded-full shadow-sm" href="#">
                                <span className="material-symbols-outlined">alternate_email</span>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-slate-900 dark:text-slate-100 text-xs font-black uppercase tracking-widest">Platform</h4>
                            <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                                <li><a className="hover:text-primary transition-colors" href="#">Listings</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Locations</a></li>
                            </ul>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="text-slate-900 dark:text-slate-100 text-xs font-black uppercase tracking-widest">Support</h4>
                            <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                                <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto pt-10 mt-12 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                        © 2024 GetSet Global. Built for the modern nomad.
                    </p>
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                        Made with <span className="material-symbols-outlined text-[14px] text-red-500 fill-current">favorite</span> by Stitch
                    </p>
                </div>
            </footer>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 pb-safe pt-3 z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center max-w-md mx-auto mb-2">
                    <Link to="/" className="flex flex-col items-center gap-1 text-primary">
                        <span className="material-symbols-outlined fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Explore</p>
                    </Link>
                    <Link to="/saved" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <span className="material-symbols-outlined">favorite</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Saved</p>
                    </Link>
                    <Link to="/messages" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors relative">
                        <span className="material-symbols-outlined">chat_bubble</span>
                        {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                        <p className="text-[10px] font-black uppercase tracking-widest">Messages</p>
                    </Link>
                    <div onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">
                        <span className="material-symbols-outlined">person</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Profile</p>
                    </div>
                </div>
            </nav>

        </div>
    );
}
