import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const [properties, setProperties] = useState<any[]>([]);
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                // Primitive JWT decoding to check role (payload is 2nd part of JWT)
                let role = 'RENTER';
                let userName = 'User';
                try {
                    const payloadBase64 = token.split('.')[1];
                    const decodedJson = atob(payloadBase64);
                    const decoded = JSON.parse(decodedJson);
                    role = decoded.role || 'RENTER';
                    userName = decoded.name || decoded.sub || 'User';
                    // Also set a mock variable for the UI if needed
                    (window as any).currentUserRole = role;
                    (window as any).currentUserName = userName;
                } catch (decodeErr) {
                    console.warn("Could not decode token, defaulting to RENTER", decodeErr);
                }

                try {
                    // Fetch user's favorites for the heart toggle state
                    const favRes = await axios.get('/api/v1/favorites', { headers }).catch(() => ({ data: { content: [] } }));
                    const savedProperties = favRes.data.content?.map((f: any) => ({
                        id: f.propertyId,
                        title: f.propertyTitle,
                        pricePerMonth: f.price,
                        imageUrls: []
                    })) || [];

                    setFavorites(new Set(savedProperties.map((p: any) => p.id)));

                    if (role === 'OWNER') {
                        // Fetch properties owned by this user
                        const propsRes = await axios.get('/api/v1/properties/owner/my-properties', { headers }).catch(() => ({ data: { content: [] } }));
                        setProperties(propsRes.data.content || []);
                    } else {
                        setProperties(savedProperties);
                    }
                } catch (e) {
                    console.warn("Could not fetch properties or favorites", e);
                }

                try {
                    const enqEndpoint = role === 'OWNER' ? '/api/v1/enquiries/received' : '/api/v1/enquiries/my';

                    const [enqRes, countRes] = await Promise.all([
                        axios.get(enqEndpoint, { headers }).catch(() => ({ data: { content: [] } })),
                        axios.get('/api/v1/messages/unread-count', { headers }).catch(() => ({ data: { count: 0 } }))
                    ]);

                    setEnquiries(enqRes.data.content || enqRes.data || []);
                    setUnreadCount(countRes.data?.count || 0);
                } catch (e) {
                    console.warn("Could not fetch enquiries", e);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const toggleFavorite = async (e: React.MouseEvent, propertyId: string) => {
        e.stopPropagation();

        const token = localStorage.getItem('accessToken');
        if (!token) return;

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
                // Remove from the displayed list as well
                setProperties(prev => prev.filter(p => p.id !== propertyId));
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

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/login');
    };

    const updateEnquiryStatus = async (enquiryId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            await axios.put(`/api/v1/enquiries/${enquiryId}/status`, {
                status: newStatus,
                rejectionReason: ""
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh enquiries
            const role = (window as any).currentUserRole || 'RENTER';
            const endpoint = role === 'OWNER' ? '/api/v1/enquiries/received' : '/api/v1/enquiries/my';
            const enqRes = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setEnquiries(enqRes.data.content || enqRes.data || []);

        } catch (err) {
            console.error("Failed to update enquiry status", err);
            toast.error("Failed to update enquiry status");
        }
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased shadow-2xl animate-fade-in">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
                {/* Header (Mobile Only) */}
                <header className="flex flex-col gap-2 pt-6 pb-2 md:mt-20 md:hidden">
                    <div className="flex items-center h-12 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-center bg-no-repeat bg-cover rounded-full h-12 w-12 ring-2 ring-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0bven8Gj-y_gDHCU9S7cz2hhOKY-7LbnyluD0InI58nuqjisUp0fG7N1l_RD30KbbfJwnahqw9xtfpi6Eu9MxyG4XHno8Jas20r9KF5rWWtauuuHWHjsTr4Fa2wI6FdMekYd6G-_M5rlqsAWEMQH0kBz2gOsbSeskJOKprz9Fq03DzvGChCph2CmbWAdQg7uUTuVN708-RM3l04EhKH7sosnYD1mGrBkgmIalL3ZU0xsZOFURsqffAPGPZj_T7NYMWt2QfDX11j_J")' }}></div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Welcome back</p>
                                <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">{(window as any).currentUserName || 'User'}</h1>
                            </div>
                        </div>
                        <div className="flex items-center justify-end">
                            <button className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white relative hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">notifications</span>
                                <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#101822]"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Desktop Header */}
                <div className="hidden md:flex items-center justify-between pt-24 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your properties and enquiries.</p>
                    </div>
                </div>

                {/* Section 1: Properties (Owned or Favorited) */}
                <section className="mt-4">
                    <div className="flex items-center justify-between pb-4">
                        <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">
                            {(window as any).currentUserRole === 'OWNER' ? 'My Properties' : 'Favorite Properties'}
                        </h3>
                        {(window as any).currentUserRole === 'OWNER' ? (
                            <Link to="/add-property" className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Add Property
                            </Link>
                        ) : (
                            <span className="text-primary text-sm font-semibold hover:underline transition-colors cursor-pointer">See All</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse-subtle">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex flex-col gap-3 rounded-2xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 p-2">
                                        <div className="aspect-[4/3] w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                        <div className="absolute inset-x-0 bottom-0 p-3 pt-12">
                                            <div className="h-5 w-1/3 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                                            <div className="h-4 w-2/3 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : properties.length > 0 ? properties.map((property, idx) => {
                            // Fallback images
                            const images = [
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuDeBed7S6pXR_DgFXPDjbmyzyEfuvTCKDG647PC5S0PuJJ0nxTxryfkwcbsIyLKzM2XpGdGPu6yavqMkVSoHKIfA7iNaP_TTO8tRNAxZ4uBmwHXSXi1RDU55VcdQAnq7bGUXcnS9XW14Tge38d4Z0dgwR-2H__v4WSQOcQv_qrD6IrNVGDMLXmgr0gL9VNuPBdyp-noKnYuvh_D4B6Y6ZITaLBoNApeSG_cEM5nEZnXRNcoSjaFOQWKXBohpWT8hcuuQ7KEH2852RrV",
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuB5IbXCRlHjdi7ZNXplqmEa4EJR1eXSGyVuFF1w5aihxAAydkzgKBlXuJJKryAZg9uOmhlZMm2Y4ghBfk6eYiwm6Zn3eAEgO8Mze5ASKx4_bBaAXpNmlMUBrh-VmvjcCdovPmCcuKWfJgCkICP2JZoEzHlWaihRtWaDIEwRLDwmp5aF-4dlntql57pSZt78XA5Xo206-MmqMLz1O9UmOp3O99Fr-zqIMUu-bPVMxsAACLXXi1sNOly7OPeGYBGeztp9tht21qodWr7p",
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuCRBO7jV8KQg3jv6bgxkJN8eEvwjNCzYG0ZMfZgsnzWrNZZJCaLnbOgemopEIb3geaWYYT7f2dWzzgh3-7wn516Ok_-4ZabPh9gj_mqjLOj9RWq910S85urTv9Q3u801YGSR-d_W68-IcPsVcM7H-0oDDpjTy7Mz6VSsDxZ9uu_DmlgcOjE_JOD8ZdTL1CDh5v2vZ8W8OiCp7jb3kTiGDIrHf4nTe_KL8bmR-9ffNxdTzpHVdtho9OtSNQ2W7BXkaMe0hacf_RRVfvg"
                            ];
                            const imgUrl = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls[0] : images[idx % images.length];

                            return (
                                <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} className="group relative flex flex-col gap-3 rounded-2xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-shadow p-2">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${imgUrl}")` }}></div>
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            {(window as any).currentUserRole === 'OWNER' && (
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-property/${property.id}`); }} className="flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors bg-white/90 text-slate-700 hover:bg-white hover:text-primary shadow-sm" title="Edit Property">
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                </button>
                                            )}
                                            {(window as any).currentUserRole !== 'OWNER' && (
                                                <button onClick={(e) => toggleFavorite(e, property.id)} className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${favorites.has(property.id) ? 'bg-white/90 text-primary hover:bg-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: favorites.has(property.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12">
                                            <p className="text-white text-lg font-bold leading-tight">${property.pricePerMonth}<span className="text-sm font-normal text-slate-300">/mo</span></p>
                                            <p className="text-slate-200 text-sm truncate">{property.title}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-8 text-slate-500">No favorite properties found.</div>
                        )}
                    </div>
                </section>

                {/* Section 2: Pending Enquiries (Grid List) */}
                <section className="mt-8">
                    <div className="flex items-center justify-between pb-4">
                        <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">Pending Enquiries</h3>
                        <div className="flex gap-1">
                            <button className="p-1 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><span className="material-symbols-outlined text-[18px]">filter_list</span> Filter</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enquiries.length > 0 ? enquiries.map(enquiry => (
                            <div key={enquiry.id || enquiry._id || Math.random()} className="group flex items-center gap-4 p-4 bg-white dark:bg-[#1c2027] rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 dark:border-slate-800/50">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDbm1mjiGK-x4or6tl-FBZFZLkg3reh90FPR19WI22cVbOBmCNj1N0zWHqmEQKq2yEn0b0nxU7wpXLW2V18eaCL90QSqsKsnzWdBlWCxbNHbBmmFytNOhAiiS4f8URhD7MJ7b2ulpT4TYQ7QuU5F2Nc9sJAIq4cJPcOtomtBySJoVaXaDcTG3AwnvhAvOhsJ3hI5NqVYkBAVq4HXBftXrnAUqjdaC_z_Q8ALXogfige7Pl0vb321NtEx-XfMUBUpikCrpzxNpPlvgst")' }}></div>
                                </div>
                                <div className="flex flex-1 flex-col justify-center">
                                    <div className="flex items-start justify-between">
                                        <p className="text-slate-900 dark:text-white text-base font-bold leading-tight line-clamp-1">{enquiry.propertyTitle || `Property #${(enquiry.propertyId || '').substring(0, 6)}`}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${enquiry.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{enquiry.status || 'SENT'}</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-normal mt-1 line-clamp-1">{enquiry.message || 'Waiting for reply'}</p>
                                </div>
                                {(window as any).currentUserRole === 'OWNER' && (enquiry.status === 'PENDING' || !enquiry.status || enquiry.status === 'SENT') ? (
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); updateEnquiryStatus(enquiry.id || enquiry._id, 'ACCEPTED'); }} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30 rounded-lg text-[13px] font-bold transition-colors">Accept</button>
                                        <button onClick={(e) => { e.stopPropagation(); updateEnquiryStatus(enquiry.id || enquiry._id, 'REJECTED'); }} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30 rounded-lg text-[13px] font-bold transition-colors">Reject</button>
                                    </div>
                                ) : (
                                    <div className="text-slate-400 dark:text-slate-600">
                                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="py-8 text-slate-500 col-span-full">No pending enquiries found.</div>
                        )}
                    </div>
                </section>
                <div className="h-24"></div> {/* Spacer for bottom nav */}
            </main>

            {/* Web Header Navigation */}
            <div className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 hidden md:flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">GetSet</h1>
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Explore</Link>
                        <Link to="/saved" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Saved</Link>
                        <Link to="/messages" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors relative">
                            Messages
                            {unreadCount > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-sm font-semibold text-primary">Dashboard</Link>
                    <div className="flex items-center gap-2 group cursor-pointer ml-4">
                        <div className="bg-center bg-no-repeat bg-cover rounded-full h-8 w-8 ring-2 ring-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0bven8Gj-y_gDHCU9S7cz2hhOKY-7LbnyluD0InI58nuqjisUp0fG7N1l_RD30KbbfJwnahqw9xtfpi6Eu9MxyG4XHno8Jas20r9KF5rWWtauuuHWHjsTr4Fa2wI6FdMekYd6G-_M5rlqsAWEMQH0kBz2gOsbSeskJOKprz9Fq03DzvGChCph2CmbWAdQg7uUTuVN708-RM3l04EhKH7sosnYD1mGrBkgmIalL3ZU0xsZOFURsqffAPGPZj_T7NYMWt2QfDX11j_J")' }}></div>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{(window as any).currentUserName || 'User'}</span>
                    </div>
                    <button onClick={handleLogout} className="ml-2 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors" title="Logout">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </div>

            {/* Bottom Navigation Bar (Mobile Only) */}
            <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#1c2027]/90 backdrop-blur-md px-4 pb-safe pt-2 z-50 md:hidden">
                <div className="flex justify-between items-end py-2">
                    <Link to="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-[#9da8b9] hover:text-primary dark:hover:text-primary transition-colors group">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]">home</span>
                        </div>
                        <p className="text-[10px] font-medium leading-normal tracking-[0.015em]">Home</p>
                    </Link>
                    <Link to="/saved" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-[#9da8b9] hover:text-primary dark:hover:text-primary transition-colors group cursor-pointer">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]">favorite</span>
                        </div>
                        <p className="text-[10px] font-medium leading-normal tracking-[0.015em]">Saved</p>
                    </Link>
                    {/* Active Item */}
                    <Link to="/dashboard" className="flex flex-1 flex-col items-center justify-end gap-1 text-primary">
                        <div className="flex h-7 items-center justify-center">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                        </div>
                        <p className="text-[10px] font-bold leading-normal tracking-[0.015em]">Dashboard</p>
                    </Link>
                    <Link to="/messages" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-[#9da8b9] hover:text-primary dark:hover:text-primary transition-colors group cursor-pointer relative">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200 relative">
                            <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
                            {/* @ts-ignore */}
                            {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                        </div>
                        <p className="text-[10px] font-medium leading-normal tracking-[0.015em]">Messages</p>
                    </Link>
                    <button onClick={handleLogout} className="flex flex-1 flex-col items-center justify-end gap-1 text-red-400 hover:text-red-600 dark:hover:text-red-500 transition-colors group border-none bg-transparent p-0">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200 text-red-500 font-bold">
                            <span className="material-symbols-outlined text-[24px]">logout</span>
                        </div>
                        <p className="text-[10px] font-medium leading-normal tracking-[0.015em] text-red-500">Logout</p>
                    </button>
                </div>
            </nav>
        </div>
    );
}
