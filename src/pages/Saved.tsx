import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Saved() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const res = await axios.get('/api/v1/favorites', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const savedProps = res.data.content?.map((f: any) => ({
                    id: f.propertyId,
                    title: f.propertyTitle,
                    pricePerMonth: f.price,
                    city: f.city,
                    imageUrls: []
                })) || [];
                setProperties(savedProps);
            } catch (err: any) {
                console.error("Failed to fetch favorites", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, [navigate]);

    const removeFavorite = async (e: React.MouseEvent, propertyId: string) => {
        e.stopPropagation();

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            await axios.delete(`/api/v1/favorites/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            toast.success("Removed from favorites");
        } catch (err) {
            toast.error("Failed to remove saved property");
        }
    };

    const filters = ['All', 'Beachfront', 'Villas', 'City Lofts', 'Cabins'];

    return (
        <div className="bg-background-light dark:bg-[#101822] font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col pt-20 md:pt-28 pb-20 md:pb-8">

            {/* Desktop Navigation Wrapper */}
            <div className="hidden md:block fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-[#101822]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-8 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-black tracking-tight text-primary">GetSet</Link>
                        <div className="flex items-center gap-6">
                            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Explore</Link>
                            <Link to="/saved" className="text-sm font-bold text-primary relative">Saved</Link>
                            <Link to="/dashboard" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Dashboard</Link>
                            <Link to="/messages" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Messages</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col">

                {/* Header Section */}
                <div className="mb-6 md:mb-10 lg:w-2/3">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Saved Homes</h1>

                    {/* Horizontal Filter Pills */}
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border
                                    ${activeFilter === filter
                                        ? 'bg-primary text-[#102221] border-primary shadow-lg shadow-primary/20 scale-105 origin-left'
                                        : 'bg-white dark:bg-[#152a28] text-slate-500 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Property Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-4 animate-pulse-subtle">
                                <div className="aspect-[4/3] md:aspect-[3/2] w-full rounded-3xl bg-slate-200 dark:bg-slate-800"></div>
                                <div className="px-2">
                                    <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8">
                        {properties.map((property, idx) => {
                            const images = [
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuAcNIiYrYxyxtWEglvqku-ayJmdxEotu4mrMXVWb29MsjTwF2be--fjdCpUkW-_MRGiOnu7UgHYPsSlJCfESxsN0QCxxgXRso9VLjCpyMW-j7hxKVqdVQuluzr-paRI1iC7ntrHiDF4c0Mt2WNctYzBUSGqKVWbfCc9MFUvcV8bbwC6k7you7-R2i6GGEjNx79EvpUF6QgAN-IXR4-rqkQRrQUOyqYbCwSGr7Ky2nGh5-adaGJN6UTfthaTigxlS_W0qkjbZYlwEAL0",
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuAL20REhLqQQPgkhgUXTYNzfeaQS5Ok8cdZb6vxk1bHS0Uf7T8zAQFLgXExRUmL3y1l93n78QPPvSYyvBOsF4mTjsJQG4tyHLOM6rRNi53SyhmxsnZqPtHcO-zuBPOl-VFi1HY0r0G5SGckmaZFrilYKFif-Ans14UpDlggRSnh-D8RvprriIGWPJiWPloYOtyQBsJV7LYQvVB8Jl7XxQNU-mmeajUszGt5Xb2aP6dw0q-D_zsSCq4bRUFtLhtodQvXvOFeK-0slanR",
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuAlFiq8l-W6zcTk8oopSfH5vsMADW3eyZkzCwkQ8iNQ5gJ_lUQYXaF9bqsGICPLgSBUPSX7oymQKpexYIb6IQo7D9cjT22qzcEPS7DwimahqG6IkSVTOrFSL5ov7LaXVHyPwjzWKGhOzOwGEp6-1dJ1wHGMAtxRiGdNvFfVki7GW9lGjpkBBEUHks8hmDAX0iXuXFzeBfEiMEOzl0C8ebBDBSxZOmOukCqd3W0x4J_EiW11VLh-zwripf-LdJ0shuK5iNCkuz-v8Yge",
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuBGHj9hzWO1IoWucK7YoJKUQpPaAFxevbUgwFmFuZC9y0EGRBNrum519IM6R1uDT220JbYsE1EZ_Gg9i-dHIxW2pxkq9wq3QaW-O-9ar0C47nOoLE_rtywOYSShXlOjO_6Aa5YU8aebRZL0M2NuuE2IXk9Tdrn5vDHYAbF77BAWw3S5hPoTeU39d9kLbdLL7Vht-78mAKNF0Ip3tut4T0WstgXL2sA7In8IexJaGEPYL2mg3kr8_HXvetsiX-aoyOK5abIIIzEt-g"
                            ];
                            const imgUrl = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls[0] : images[idx % images.length];

                            return (
                                <div key={property.id} className="group flex flex-col gap-4">
                                    <div
                                        onClick={() => navigate(`/properties/${property.id}`)}
                                        className="relative aspect-[4/3] md:aspect-[3/2] w-full overflow-hidden rounded-3xl cursor-pointer shadow-sm group-hover:shadow-xl transition-shadow"
                                    >
                                        <img alt={property.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" src={imgUrl} />

                                        {/* Floating Glassmorphic Overlay for Location */}
                                        <div className="absolute bottom-4 left-4 rounded-xl bg-white/20 dark:bg-black/40 px-3 py-1.5 backdrop-blur-md border border-white/30">
                                            <span className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                {property.city || 'Exclusive Area'}
                                            </span>
                                        </div>

                                        {/* Floating Glassmorphic Heart Button */}
                                        <button
                                            onClick={(e) => removeFavorite(e, property.id)}
                                            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md text-primary border border-white/40 hover:bg-white hover:text-red-500 hover:scale-110 transition-all z-10"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2 px-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl md:text-2xl font-black text-[#1E1B4B] dark:text-white line-clamp-1">{property.title}</h3>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                                                <span className="text-primary">${property.pricePerMonth}</span> <span className="text-sm font-medium">/ month</span>
                                            </p>
                                        </div>

                                        {/* Pill-shaped View Details Button */}
                                        <button
                                            onClick={() => navigate(`/properties/${property.id}`)}
                                            className="mt-4 w-full md:w-max px-8 py-3.5 bg-gradient-to-tr from-primary to-[#00c9b7] text-[#102221] font-bold uppercase tracking-widest text-sm rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            View Details
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-[#152a28]/30 rounded-[3rem] border border-dashed border-slate-300 dark:border-primary/20 mt-4 px-6 text-center">
                        <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 shadow-xl shadow-primary/10 border border-primary/20">
                            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 0" }}>favorite_border</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">No Saved Homes Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed">Collect the luxury properties you love by tapping the heart icon on any listing.</p>
                        <Link to="/" className="px-8 py-4 bg-primary text-[#102221] font-black uppercase tracking-widest text-sm rounded-full shadow-xl shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2">
                            Explore Collection <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Bottom Nav Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#101822]/95 backdrop-blur-xl px-4 pb-safe pt-2 z-50 md:hidden">
                <div className="flex justify-between items-end py-2">
                    <Link to="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors group">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Explore</p>
                    </Link>
                    <Link to="/saved" className="flex flex-1 flex-col items-center justify-end gap-1 text-primary relative">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Saved</p>
                    </Link>
                    <Link to="/messages" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors group">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Messages</p>
                    </Link>
                    <Link to="/dashboard" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors group">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]">person</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Profile</p>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
