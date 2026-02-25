import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await axios.get(`/api/v1/properties/${id}`);
                setProperty(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to map property');
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const res = await axios.get(`/api/v1/favorites/check/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsFavorite(res.data?.isFavorite || false);
            } catch (err) {
                console.warn("Could not check favorite status", err);
            }
        };
        checkFavoriteStatus();
    }, [id]);

    const handleEnquiry = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                toast.error("Please login first to chat with the owner");
                navigate('/login');
                return;
            }

            await axios.post('/api/v1/messages', {
                recipientId: property.ownerId,
                propertyId: property.id,
                content: `Hi, I'm interested in your property in ${property.city || 'this area'}!`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/messages');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to start chat');
        }
    };

    const toggleFavorite = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                toast.error("Please login first to save properties");
                navigate('/login');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            if (isFavorite) {
                await axios.delete(`/api/v1/favorites/${property.id}`, { headers });
                setIsFavorite(false);
            } else {
                await axios.post(`/api/v1/favorites/${property.id}`, {}, { headers });
                setIsFavorite(true);
            }
        } catch (err: any) {
            console.error("Failed to toggle favorite", err);
            toast.error("Failed to update saved properties");
        }
    };

    if (loading) {
        return (
            <div className="relative h-screen w-full overflow-y-auto pb-24 bg-white dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 antialiased animate-fade-in animate-pulse-subtle">
                <div className="sticky top-0 left-0 w-full z-20 bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                    <div className="w-full h-[30vh] md:h-[50vh] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse mb-8"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                            <div className="flex gap-4 mt-2">
                                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                            </div>
                            <div className="space-y-3 mt-4">
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="w-full h-80 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-6">
                                <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4"></div>
                                <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                                <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (error || !property) return <div className="text-center p-8 text-red-500">{error || "Property not found"}</div>;

    return (
        <div className="relative h-screen w-full overflow-y-auto pb-24 bg-white dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 antialiased animate-fade-in">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 left-0 w-full z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <span className="font-bold text-lg hidden md:block">Back to Search</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleFavorite} className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isFavorite ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined">ios_share</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                {/* Image Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-8 rounded-2xl overflow-hidden">
                    <div className="w-full h-[30vh] md:h-[50vh] bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDOO1IT3embHiTFGV8NJOjpYdaethGfhq-gMPuJuy-F_ttMM2B-_MjGjxwYbdscWcil9vwCLCycC96bruMMsbsNRC6H8gdhdENo75lUIquD5h4PwMEkO3RbxORJ3JNGEMz8A-BTEb_ZJQhF24l7FG0lwUXWyHKF7LwIdazeyOQc9a9ln7TyQgN5ImCVmZK_d2JIYP2ohivrIAXwHL7qSXz2l8ZR41jUoYAdMP-YWjpXBrhpt5nb8ZHgsxOdEpRHiWgO8n5FYioEH9kQ")' }}></div>
                    <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-4 h-[50vh]">
                        <div className="bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBEkYL4gcpKx9o4BSk-3lwyc9xXlohewMH0b63enSJcMRagkutN0lPm6hyfsCV5INaaj1ZPFKaf_cmpEcjKwpFCsYvfoZu2t7QdnDlLFwhHb-CrYSBqwJg5psprOXKvnJ8_--SsgbFQCNqqoto3qlaMml9XwrcUn_whyIADKWc4U9Hsw8N2lXwSKPIMGW1bW0xNqaJZ6oSbXIin4kI4_JCN_bPWpNYtp515RHYQkH-d6JUDrt4IbnzUkzr7q-z4RinxM7tO4aM9TuG7")' }}></div>
                        <div className="bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAgY9u270A39TVvD-GitIsoXLr5_uhstNjX9KkjmVSWJ_fr-B0727diriUR-Y9VVvXoca5C_2UAZJRnzcW_tlSSFHsfUTudcObcy_8Ubq-YxnSj7Jz7KYJzFpsRtajVcSXc0UyWmosk9Txil3519kFPQCj-aXsu83IrpMhTKd29ksQnSMX-H0KXGOn3rhjWDjVBphL6JbxF4sj57HdEHfsFSCNn18J-YSxVZdFziIGCozbJVDvXW2E1K2hTnTe1RCMq0q4NBkFcM2AH")' }}></div>
                        <div className="bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDeBed7S6pXR_DgFXPDjbmyzyEfuvTCKDG647PC5S0PuJJ0nxTxryfkwcbsIyLKzM2XpGdGPu6yavqMkVSoHKIfA7iNaP_TTO8tRNAxZ4uBmwHXSXi1RDU55VcdQAnq7bGUXcnS9XW14Tge38d4Z0dgwR-2H__v4WSQOcQv_qrD6IrNVGDMLXmgr0gL9VNuPBdyp-noKnYuvh_D4B6Y6ZITaLBoNApeSG_cEM5nEZnXRNcoSjaFOQWKXBohpWT8hcuuQ7KEH2852RrV")' }}></div>
                        <div className="bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAlFiq8l-W6zcTk8oopSfH5vsMADW3eyZkzCwkQ8iNQ5gJ_lUQYXaF9bqsGICPLgSBUPSX7oymQKpexYIb6IQo7D9cjT22qzcEPS7DwimahqG6IkSVTOrFSL5ov7LaXVHyPwjzWKGhOzOwGEp6-1dJ1wHGMAtxRiGdNvFfVki7GW9lGjpkBBEUHks8hmDAX0iXuXFzeBfEiMEOzl0C8ebBDBSxZOmOukCqd3W0x4J_EiW11VLh-zwripf-LdJ0shuK5iNCkuz-v8Yge")' }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2">
                        {/* Title & Price Block */}
                        <div className="flex flex-col gap-1 mb-6">
                            <div className="flex justify-between items-start gap-4">
                                <h1 className="text-2xl md:text-3xl font-bold leading-tight text-slate-900 dark:text-white">{property.title}</h1>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-primary dark:text-primary text-2xl font-extrabold tracking-tight">${property.pricePerMonth || property.price}</span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">/ month</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">location_on</span>
                                {property.address}, {property.city}
                            </p>
                        </div>

                        {/* Key Specs */}
                        <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-700/50">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>bed</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{property.bedrooms || 0} Beds</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-700/50">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>bathtub</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{property.bathrooms || 0} Baths</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-700/50">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>square_foot</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{property.areaSqFt || property.areaSquareFeet || property.area || 0} sqft</span>
                            </div>
                        </div>

                        <div className="h-px bg-slate-200 dark:bg-slate-800 mb-6"></div>

                        {/* Host Profile */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full bg-cover bg-center border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCl1-jbCvmg2XfgzI9LtLgglDkvgwV5VWxlhFNqcVOG0daqEI164n-wPguYpAn9YCjNkpkfxAxvRv6VUoVXUFprn1NSzVUni4o08T5pS2WxozujaCJLkoxzBEDOPSGKrLUTZDBJRQr934UuiFI0HyMKF346Wsk4mqG70dcYEjL0lx8dXhPIhsw2XDcNvVZJWKvtUNX9zeH-4Ci8yUkAF3gqmBLt6EudebhUFOjQQd-5pFl7RvMd2Dnsqt1pRTymIqx6mn73sBk_7yDs")' }}></div>
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-background-light dark:border-background-dark">
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px', display: 'block' }}>verified</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Hosted by {property.ownerEmail?.split('@')[0] || property.ownerId?.split('@')[0] || 'User'}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Superhost · Joined 2021</p>
                                </div>
                            </div>
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-primary hover:bg-primary/10 transition-colors">
                                <span className="material-symbols-outlined">chat_bubble</span>
                            </button>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About this home</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {property.description}
                            </p>
                        </div>

                        {/* Amenities */}
                        {(property.amenities?.length > 0 || property.features?.amenities?.length > 0) && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">What this place offers</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {(property.amenities || property.features.amenities).map((amenity: string) => (
                                        <div key={amenity} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                            <span className="material-symbols-outlined text-primary">check_circle</span>
                                            <span className="text-sm font-medium dark:text-slate-200">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Sidebar CTA Column for Desktop */}
                    <div className="hidden lg:block relative">
                        <div className="sticky top-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">${property.pricePerMonth || property.price} <span className="text-lg font-normal text-slate-500">/mo</span></span>
                            </div>
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 bg-slate-50 dark:bg-slate-950/50">
                                <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">Available from</span>
                                    <span className="text-slate-900 dark:text-white font-bold">Immediately</span>
                                </div>
                                <div className="flex justify-between pt-3">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">Minimum lease</span>
                                    <span className="text-slate-900 dark:text-white font-bold">12 months</span>
                                </div>
                            </div>
                            <button onClick={handleEnquiry} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                                <span>Chat with Owner</span>
                                <span className="material-symbols-outlined text-lg">chat</span>
                            </button>
                            <p className="text-center text-xs text-slate-500 mt-4">You won't be charged yet</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Mobile CTA */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#101822] border-t border-slate-200 dark:border-slate-800 px-4 py-4 pb-safe lg:hidden z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Total price</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">${property.pricePerMonth || property.price} <span className="text-sm font-normal text-slate-500">/mo</span></span>
                    </div>
                    <button onClick={handleEnquiry} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                        <span>Chat with Owner</span>
                    </button>
                </div>
            </div>

        </div>
    );
}
