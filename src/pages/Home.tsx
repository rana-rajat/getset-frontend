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

                // Fetch favorites and unread count if logged in
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

    const categories = ['All', 'House', 'Apartment', 'Loft', 'Condo'];

    const filteredProperties = activeCategory === 'All'
        ? properties
        : properties.filter(p => p.propertyType?.toLowerCase() === activeCategory.toLowerCase() || p.title.toLowerCase().includes(activeCategory.toLowerCase()));

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-white dark:bg-slate-950 shadow-2xl animate-fade-in">

            {/* Mobile Header Section */}
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pb-2 md:mt-20">
                {/* Status Bar Placeholder (iOS Safe Area) */}
                <div className="h-4 w-full md:hidden"></div>

                {/* Greeting & Notification */}
                <div className="flex items-center justify-between px-4 md:px-8 pb-2">
                    <div className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined filled">location_on</span>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">San Francisco, CA</span>
                    </div>
                    <button className="relative flex items-center justify-center text-slate-900 dark:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-slate-950"></span>
                    </button>
                    <div className="hidden md:block">
                        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Discover your <span className="text-primary">perfect home.</span></h1>
                    </div>
                </div>

                {/* Main Headline (Mobile) */}
                <div className="px-4 pb-4 md:hidden">
                    <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Discover your <br /><span className="text-primary">perfect home.</span></h1>
                </div>

                {/* Search Bar (Mobile) */}
                <div className="px-4 md:hidden">
                    <div className="flex w-full items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 px-3 py-3 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                        <span className="material-symbols-outlined text-slate-400">search</span>
                        <input className="w-full bg-transparent border-none p-0 text-base font-medium placeholder-slate-400 focus:ring-0 text-slate-900 dark:text-white outline-none" placeholder="Search city, neighborhood..." type="text" />
                        <button className="flex items-center justify-center rounded-lg bg-primary p-2 text-white shadow-md shadow-primary/30 transition-transform active:scale-95">
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="mt-4 flex w-full gap-3 overflow-x-auto px-4 md:px-8 pb-2 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 transition-colors ${activeCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                        >
                            <span className={`text-sm ${activeCategory === cat ? 'font-semibold' : 'font-medium'}`}>{cat}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Property List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24">
                {/* Featured Section Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Near you</h2>
                    <span className="text-sm font-semibold text-primary cursor-pointer hover:underline">See all</span>
                </div>

                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse-subtle">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-3 rounded-2xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 p-2">
                                <div className="aspect-[4/3] w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                <div className="flex flex-col gap-2 px-1 mt-1">
                                    <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                        <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {error && <div className="text-center py-8 text-red-500">{error}</div>}

                {!loading && !error && filteredProperties.length === 0 && (
                    <div className="text-center py-8 text-slate-500">No properties found.</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Real Estate Cards mapped from API array */}
                    {filteredProperties.map((property, idx) => {
                        // Providing fallback images just for visual mapping since backend might not have URLs yet
                        const images = [
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuAcNIiYrYxyxtWEglvqku-ayJmdxEotu4mrMXVWb29MsjTwF2be--fjdCpUkW-_MRGiOnu7UgHYPsSlJCfESxsN0QCxxgXRso9VLjCpyMW-j7hxKVqdVQuluzr-paRI1iC7ntrHiDF4c0Mt2WNctYzBUSGqKVWbfCc9MFUvcV8bbwC6k7you7-R2i6GGEjNx79EvpUF6QgAN-IXR4-rqkQRrQUOyqYbCwSGr7Ky2nGh5-adaGJN6UTfthaTigxlS_W0qkjbZYlwEAL0",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuAL20REhLqQQPgkhgUXTYNzfeaQS5Ok8cdZb6vxk1bHS0Uf7T8zAQFLgXExRUmL3y1l93n78QPPvSYyvBOsF4mTjsJQG4tyHLOM6rRNi53SyhmxsnZqPtHcO-zuBPOl-VFi1HY0r0G5SGckmaZFrilYKFif-Ans14UpDlggRSnh-D8RvprriIGWPJiWPloYOtyQBsJV7LYQvVB8Jl7XxQNU-mmeajUszGt5Xb2aP6dw0q-D_zsSCq4bRUFtLhtodQvXvOFeK-0slanR",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuAlFiq8l-W6zcTk8oopSfH5vsMADW3eyZkzCwkQ8iNQ5gJ_lUQYXaF9bqsGICPLgSBUPSX7oymQKpexYIb6IQo7D9cjT22qzcEPS7DwimahqG6IkSVTOrFSL5ov7LaXVHyPwjzWKGhOzOwGEp6-1dJ1wHGMAtxRiGdNvFfVki7GW9lGjpkBBEUHks8hmDAX0iXuXFzeBfEiMEOzl0C8ebBDBSxZOmOukCqd3W0x4J_EiW11VLh-zwripf-LdJ0shuK5iNCkuz-v8Yge"
                        ];
                        const imgUrl = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls[0] : images[idx % images.length];

                        return (
                            <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} className="group relative flex flex-col gap-3 rounded-2xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-shadow p-2">
                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                                    <img alt={property.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={imgUrl} />
                                    <button onClick={(e) => toggleFavorite(e, property.id)} className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${favorites.has(property.id) ? 'bg-white/90 text-primary hover:bg-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/40'}`}>
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: favorites.has(property.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                    </button>
                                    <div className="absolute bottom-3 left-3 rounded-lg bg-slate-900/60 px-2 py-1 backdrop-blur-sm">
                                        <span className="text-xs font-semibold text-white">{property.propertyType || 'Property'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 px-1">
                                    <div className="flex items-center justify-between mt-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">${property.pricePerMonth} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ mo</span></h3>
                                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                            <span className="material-symbols-outlined text-[18px] text-yellow-500 fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">4.8</span>
                                        </div>
                                    </div>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">{property.title}</p>
                                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1">
                                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                                        <span className="text-sm truncate w-full">{property.location?.address || 'San Francisco'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Web Header Navigation */}
            <div className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 hidden md:flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">GetSet</h1>
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-sm font-semibold text-primary">Explore</Link>
                        <Link to="/saved" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Saved</Link>
                        <Link to="/messages" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors relative">
                            Messages
                            {unreadCount > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex w-64 items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-900 px-4 py-2 ring-1 ring-slate-200 dark:ring-slate-800">
                        <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                        <input className="w-full bg-transparent border-none p-0 text-sm font-medium placeholder-slate-400 focus:ring-0 text-slate-900 dark:text-white outline-none" placeholder="Search..." type="text" />
                    </div>
                    {isLoggedIn ? (
                        <div className="flex items-center gap-2 group cursor-pointer ml-4" onClick={() => navigate('/dashboard')}>
                            <div className="bg-center bg-no-repeat bg-cover rounded-full h-8 w-8 ring-2 ring-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0bven8Gj-y_gDHCU9S7cz2hhOKY-7LbnyluD0InI58nuqjisUp0fG7N1l_RD30KbbfJwnahqw9xtfpi6Eu9MxyG4XHno8Jas20r9KF5rWWtauuuHWHjsTr4Fa2wI6FdMekYd6G-_M5rlqsAWEMQH0kBz2gOsbSeskJOKprz9Fq03DzvGChCph2CmbWAdQg7uUTuVN708-RM3l04EhKH7sosnYD1mGrBkgmIalL3ZU0xsZOFURsqffAPGPZj_T7NYMWt2QfDX11j_J")' }}></div>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">{(window as any).currentUserName || 'Profile'}</span>
                        </div>
                    ) : (
                        <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 transition-colors">
                            <span className="material-symbols-outlined text-sm">person</span>
                            Log In
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Navigation (Mobile Only) */}
            <div className="fixed bottom-0 z-20 w-full border-t border-slate-200 bg-white px-4 pb-safe pt-2 dark:border-slate-800 dark:bg-slate-950 md:hidden">
                <div className="flex items-center justify-around py-2">
                    <Link to="/" className="flex flex-col items-center justify-center gap-1 text-primary">
                        <span className="material-symbols-outlined fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                        <span className="text-[10px] font-medium">Explore</span>
                    </Link>
                    <Link to="/saved" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer">
                        <span className="material-symbols-outlined">favorite</span>
                        <span className="text-[10px] font-medium">Saved</span>
                    </Link>
                    <Link to="/messages" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer relative">
                        <div className="relative">
                            <span className="material-symbols-outlined">chat_bubble</span>
                            {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                        </div>
                        <span className="text-[10px] font-medium">Messages</span>
                    </Link>
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}>
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
