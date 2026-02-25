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
    const [activeTab, setActiveTab] = useState('Overview');

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
                    (window as any).currentUserRole = role;
                    (window as any).currentUserName = userName;
                } catch (decodeErr) {
                    console.warn("Could not decode token", decodeErr);
                }

                try {
                    // Fetch user's favorites
                    const favRes = await axios.get('/api/v1/favorites', { headers }).catch(() => ({ data: { content: [] } }));
                    const savedProperties = favRes.data.content?.map((f: any) => ({
                        id: f.propertyId,
                        title: f.propertyTitle,
                        pricePerMonth: f.price,
                        imageUrls: []
                    })) || [];

                    setFavorites(new Set(savedProperties.map((p: any) => p.id)));

                    if (role === 'OWNER') {
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

            const role = (window as any).currentUserRole || 'RENTER';
            const endpoint = role === 'OWNER' ? '/api/v1/enquiries/received' : '/api/v1/enquiries/my';
            const enqRes = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            setEnquiries(enqRes.data.content || enqRes.data || []);
            toast.success("Enquiry status updated");
        } catch (err) {
            toast.error("Failed to update enquiry status");
        }
    };

    const roleDisplayName = (window as any).currentUserRole === 'OWNER' ? 'Owner Premium' : 'Renter Gold';
    const avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuD0bven8Gj-y_gDHCU9S7cz2hhOKY-7LbnyluD0InI58nuqjisUp0fG7N1l_RD30KbbfJwnahqw9xtfpi6Eu9MxyG4XHno8Jas20r9KF5rWWtauuuHWHjsTr4Fa2wI6FdMekYd6G-_M5rlqsAWEMQH0kBz2gOsbSeskJOKprz9Fq03DzvGChCph2CmbWAdQg7uUTuVN708-RM3l04EhKH7sosnYD1mGrBkgmIalL3ZU0xsZOFURsqffAPGPZj_T7NYMWt2QfDX11j_J";

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">

            {/* Header Section */}
            <header className="pt-8 md:pt-12 px-6 md:px-12 max-w-7xl mx-auto w-full pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full bg-white dark:bg-[#183432] border border-slate-200 dark:border-[#224946] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1a3a37] hover:text-primary transition-all shadow-sm">
                            <span className="material-symbols-outlined ml-1 text-lg">arrow_back_ios</span>
                        </button>
                        <div className="relative">
                            <div className="size-14 md:size-16 rounded-full border-2 border-primary overflow-hidden bg-slate-800">
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 size-5 bg-primary rounded-full border-2 border-background-light dark:border-background-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-[#102221] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Welcome back, {(window as any).currentUserName || 'User'}</h1>
                            <span className="text-primary text-xs md:text-sm font-bold tracking-widest uppercase">{roleDisplayName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="size-12 rounded-full bg-white dark:bg-[#183432] flex items-center justify-center border border-slate-200 dark:border-[#224946] text-slate-400 hover:text-primary transition-colors shadow-sm cursor-pointer" title="Go to Home">
                            <span className="material-symbols-outlined text-[20px]">home</span>
                        </button>
                        <button className="hidden md:flex bg-primary/10 text-primary px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-full hover:bg-primary/20 transition-colors">
                            Upgrade
                        </button>
                        <button onClick={handleLogout} className="size-12 rounded-full bg-white dark:bg-[#183432] flex items-center justify-center border border-slate-200 dark:border-[#224946] text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="px-6 md:px-12 py-4 max-w-7xl mx-auto w-full">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {['Overview', (window as any).currentUserRole === 'OWNER' ? 'My Properties' : 'My Trips', 'Enquiries', 'Settings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm
                                ${activeTab === tab
                                    ? 'bg-primary text-slate-900 border border-primary'
                                    : 'bg-white dark:bg-[#183432] text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-[#224946] hover:bg-slate-50 dark:hover:bg-[#1a3a37]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                    {(window as any).currentUserRole === 'OWNER' && (
                        <Link to="/add-property" className="ml-auto bg-gradient-to-r from-primary to-[#00c9b7] text-[#102221] px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">add</span> Add
                        </Link>
                    )}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 px-6 md:px-12 pt-4 pb-24 max-w-7xl mx-auto w-full space-y-10">

                {/* Properties Section */}
                {(activeTab === 'Overview' || activeTab === 'My Properties' || activeTab === 'My Trips') && (
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold">{(window as any).currentUserRole === 'OWNER' ? 'Your Portfolio' : 'Saved & Upcoming'}</h2>
                            <button className="text-primary text-sm font-bold hover:underline">See All</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-slate-100 dark:bg-[#183432]/50 backdrop-blur-md border border-slate-200 dark:border-[#224946] p-4 rounded-2xl flex gap-4 animate-pulse-subtle">
                                        <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0"></div>
                                        <div className="flex-1 py-1">
                                            <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                                            <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                        </div>
                                    </div>
                                ))
                            ) : properties.length > 0 ? properties.map((property, idx) => {
                                const images = [
                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCHUbbTZISep_tO4nUuHpPaPnDnBGy8NyHLkvA73JjlqyIzfDOynuJ0FRkq54WzzDWIgDVSMpeFEALnUHgEX5ra1yCBQn9luir7Q8DaFCaiyWWC8Nmh5Tyr9zRjRrVrf2rjVLWmkBuj6Pd8WJYqRxaKyjyvkVaT7gPNS0otonsCyIEVYRlvXVGB14ers0XTWc9YvXsa_t4O5uriUiV5pDvBUhw64moPgUfX237PwfHyk7OPtdPfosQfmoYVdtdZyh0RlWL5-yWn_Q",
                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuA2_E_8O8rchKJy-qpok9ORuD5Fy7vopTQg195c9olOXCReIuKPYnZmQGI7HsOKeE_eBRUPsWqHGI4qHa07ITwDGw59Bp0PouVomySimAWxAcGwdKBq_5BTvPW2Kc4sYi6fraaLDHJ1_pN2cb4jjd7qeXcYe2z-9vW0eXRgbaSPjFUmMKUuNQdE6CyoJsGSH7-ir7NOkPoxkfZ2LY2wnUWkMQa0ow31ld8JfT5hbgqXbvHHqS9J-HaGC_0KUaWHJ5gIwMfQG76YSA"
                                ];
                                const imgUrl = property.imageUrls?.length > 0 ? property.imageUrls[0] : images[idx % images.length];

                                return (
                                    <div key={property.id} className="bg-white dark:bg-[#183432]/50 backdrop-blur-md border border-slate-200 dark:border-[#224946] p-4 rounded-2xl flex gap-4 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative">
                                            <img src={imgUrl} alt="Property" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-base leading-snug line-clamp-1">{property.title}</h3>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">${property.pricePerMonth || property.price}<span className="text-[10px]">/mo</span></p>
                                                    <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">Active</span>
                                                </div>
                                            </div>
                                            <button onClick={() => navigate((window as any).currentUserRole === 'OWNER' ? `/edit-property/${property.id}` : `/properties/${property.id}`)} className="mt-2 flex items-center gap-1 text-primary text-sm font-bold hover:text-teal-400 transition-colors w-max">
                                                {(window as any).currentUserRole === 'OWNER' ? 'Edit Listing' : 'View Details'}
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-dashed border-slate-300 dark:border-white/10">No properties found.</div>
                            )}
                        </div>
                    </section>
                )}

                {/* Enquiries Section */}
                {(activeTab === 'Overview' || activeTab === 'Enquiries') && (
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold">Recent Enquiries</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loading ? (
                                <div className="text-slate-400 animate-pulse">Loading enquiries...</div>
                            ) : enquiries.length > 0 ? enquiries.map(enquiry => (
                                <div key={enquiry.id || Math.random()} className="bg-white dark:bg-[#183432]/50 backdrop-blur-md border border-slate-200 dark:border-[#224946] p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-200 dark:bg-[#102221] flex items-center justify-center text-primary font-bold border border-primary/20">
                                                {(enquiry.senderId || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm line-clamp-1">{enquiry.propertyTitle || 'Property Inquiry'}</p>
                                                <p className="text-xs text-slate-400">Message from user</p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${enquiry.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : enquiry.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>{enquiry.status || 'PENDING'}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#102221] p-3 rounded-xl border border-slate-100 dark:border-white/5">"{enquiry.message || 'I am interested in this listing.'}"</p>

                                    {(window as any).currentUserRole === 'OWNER' && (enquiry.status === 'PENDING' || !enquiry.status || enquiry.status === 'SENT') && (
                                        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-[#224946]">
                                            <button onClick={() => updateEnquiryStatus(enquiry.id, 'ACCEPTED')} className="flex-1 bg-primary text-slate-900 py-2 rounded-xl text-sm font-bold shadow-sm shadow-primary/20 hover:scale-[0.98] transition-transform">Accept</button>
                                            <button onClick={() => updateEnquiryStatus(enquiry.id, 'REJECTED')} className="flex-1 bg-white dark:bg-[#102221] text-red-500 border border-red-500/30 py-2 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Decline</button>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="col-span-full py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-dashed border-slate-300 dark:border-white/10">No pending enquiries at this time.</div>
                            )}
                        </div>
                    </section>
                )}

                {/* Quick Stats Horizontal Scroll (Overview only) */}
                {activeTab === 'Overview' && (
                    <section className="pt-4">
                        <h2 className="text-xl md:text-2xl font-bold mb-6">Quick Stats</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-[#183432] rounded-2xl p-5 border border-slate-200 dark:border-[#224946] shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                                <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:bg-primary group-hover:text-[#102221] transition-colors">
                                    <span className="material-symbols-outlined">favorite</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Total Saved</p>
                                <p className="text-2xl font-black">{favorites.size || 0}</p>
                            </div>
                            <div className="bg-white dark:bg-[#183432] rounded-2xl p-5 border border-slate-200 dark:border-[#224946] shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                                <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:bg-primary group-hover:text-[#102221] transition-colors">
                                    <span className="material-symbols-outlined">event_upcoming</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Upcoming</p>
                                <p className="text-2xl font-black">{enquiries.length}</p>
                            </div>
                            <div className="bg-white dark:bg-[#183432] rounded-2xl p-5 border border-slate-200 dark:border-[#224946] shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                                <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:bg-primary group-hover:text-[#102221] transition-colors">
                                    <span className="material-symbols-outlined">visibility</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Profile Views</p>
                                <p className="text-2xl font-black">1.2k</p>
                            </div>
                            <div className="bg-white dark:bg-[#183432] rounded-2xl p-5 border border-slate-200 dark:border-[#224946] shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                                <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:bg-primary group-hover:text-[#102221] transition-colors">
                                    <span className="material-symbols-outlined">stars</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Reward Points</p>
                                <p className="text-2xl font-black">850</p>
                            </div>
                        </div>
                    </section>
                )}

            </main>

            {/* Bottom Navigation Bar */}
            <footer className="mt-auto border-t border-slate-200 dark:border-[#224946] bg-white dark:bg-[#183432] px-6 py-3 pb-safe fixed bottom-0 w-full z-50 md:hidden">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">house</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest">Home</span>
                    </Link>
                    <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary relative -top-3">
                        <div className="bg-primary text-[#102221] p-3 rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Panel</span>
                    </Link>
                    <Link to="/saved" className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">favorite</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest">Saved</span>
                    </Link>
                    <Link to="/messages" className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-400 hover:text-primary transition-colors relative">
                        <span className="material-symbols-outlined">chat</span>
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary border-2 border-white dark:border-[#183432]"></span>}
                        <span className="text-[10px] font-medium uppercase tracking-widest">Chat</span>
                    </Link>
                </div>
            </footer>
        </div>
    );
}
