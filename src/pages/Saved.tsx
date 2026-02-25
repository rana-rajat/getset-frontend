import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Saved() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

                // Map the favorite dto to property object for display
                const savedProps = res.data.content?.map((f: any) => ({
                    id: f.propertyId,
                    title: f.propertyTitle,
                    pricePerMonth: f.price,
                    city: f.city,
                    imageUrls: [] // Fallback images will be used
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
        } catch (err) {
            console.error("Failed to remove favorite", err);
            toast.error("Failed to remove saved property");
        }
    };
    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-white dark:bg-slate-950 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">GetSet</h1>
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Explore</Link>
                        <Link to="/saved" className="text-sm font-semibold text-primary">Saved</Link>
                        <Link to="/messages" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Messages</Link>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-24">
                <div className="max-w-7xl mx-auto w-full">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Saved Properties</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Properties you have favorited will appear here.</p>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse-subtle">
                            {[...Array(4)].map((_, i) => (
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
                    ) : properties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {properties.map((property, idx) => {
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
                                            <button onClick={(e) => removeFavorite(e, property.id)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary hover:bg-white transition-colors">
                                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                            </button>
                                            <div className="absolute bottom-3 left-3 rounded-lg bg-slate-900/60 px-2 py-1 backdrop-blur-sm">
                                                <span className="text-xs font-semibold text-white">{property.city || 'Property'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 px-1">
                                            <div className="flex items-center justify-between mt-1">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">${property.pricePerMonth} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ mo</span></h3>
                                            </div>
                                            <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">{property.title}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">favorite_border</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No saved properties yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">Start exploring and tap the heart icon on properties you like to save them here.</p>
                            <Link to="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">Start Exploring</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Nav Mobile */}
            <div className="fixed bottom-0 z-20 w-full border-t border-slate-200 bg-white px-4 pb-safe pt-2 dark:border-slate-800 dark:bg-slate-950 md:hidden">
                <div className="flex items-center justify-around py-2">
                    <Link to="/" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
                        <span className="text-[10px] font-medium">Explore</span>
                    </Link>
                    <Link to="/saved" className="flex flex-col items-center justify-center gap-1 text-primary">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        <span className="text-[10px] font-bold">Saved</span>
                    </Link>
                    <Link to="/messages" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">chat_bubble</span>
                        <span className="text-[10px] font-medium">Messages</span>
                    </Link>
                    <Link to="/login" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
