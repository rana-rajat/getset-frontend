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
            <div className="relative h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark font-display">
                <div className="size-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
            </div>
        );
    }
    if (error || !property) return <div className="text-center p-8 text-red-500">{error || "Property not found"}</div>;

    const mainImageUrl = (property.imageUrls && property.imageUrls.length > 0) ? property.imageUrls[0] : "https://lh3.googleusercontent.com/aida-public/AB6AXuAc9E7zg-5BmFJ97Z7aoRUqEw1EgS9zDFtKnWTJGjYBRFW3r4u8SdlvzD-iPWVUXQ__zOwsZyBsB0a8zz1zTLubOi5qBHc7aO3IyXEqB8hu6-vco5oiRwYXPnYeFfR_oYcIY2QpKG70flckfZS-IK3VJ2n67tYA9EZQ8laYV1yIH4Ldj8ctg51gZ9zoKf5yxyPzmzva27aZBcm1PTh6r41ci1zt7Bd6cxcG61NHQd9fUx34FsrkeaoRgcex_ZL8cj6l37qC8inpeQ";

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-32">

                {/* Hero Gallery Section */}
                <div className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${mainImageUrl}')` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-transparent to-transparent"></div>
                    </div>

                    {/* Top Navigation */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                        <button onClick={() => navigate(-1)} className="bg-white/10 backdrop-blur-md border border-white/20 size-12 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex gap-3">
                            <button className="bg-white/10 backdrop-blur-md border border-white/20 size-12 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                <span className="material-symbols-outlined">share</span>
                            </button>
                            <button onClick={toggleFavorite} className="bg-white/10 backdrop-blur-md border border-white/20 size-12 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                <span className={`material-symbols-outlined ${isFavorite ? 'text-primary' : ''}`} style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                            </button>
                        </div>
                    </div>

                    {/* Thumbnail Preview Overlay */}
                    <div className="absolute bottom-6 right-6 flex gap-2">
                        {(property.imageUrls || []).slice(1, 3).map((img: string, idx: number) => (
                            <div key={idx} className={`size-16 rounded-xl overflow-hidden shadow-xl ${idx === 0 ? 'border-2 border-primary' : 'border border-white/20 opacity-80'}`}>
                                <img src={img} alt="Property view" className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {property.imageUrls && property.imageUrls.length > 3 && (
                            <div className="size-16 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white shadow-xl cursor-pointer hover:bg-white/20 transition-colors">
                                +{property.imageUrls.length - 3}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-6 md:px-12 lg:px-24 pt-8 max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        <div className="lg:col-span-2">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">{property.title}</h1>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium">{property.location?.address || property.address}, {property.city}</p>
                                    <span className="text-slate-300 dark:text-slate-600 mx-1">•</span>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-yellow-400 text-sm fill-current">star</span>
                                        <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">4.9</p>
                                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">({Math.floor(Math.random() * 50) + 12} reviews)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Info Grid */}
                            <div className="grid grid-cols-3 gap-4 mt-10">
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">bed</span>
                                    <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-300">{property.bedrooms || 1} Beds</span>
                                </div>
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">bathtub</span>
                                    <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-300">{property.bathrooms || 1} Baths</span>
                                </div>
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">straighten</span>
                                    <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-300">{property.areaSqFt || property.areaSquareFeet || Math.floor(Math.random() * 1000) + 500} sqft</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-12">
                                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Description</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base md:text-lg">
                                    {property.description || "Experience the pinnacle of luxury. This breathtaking property offers unparalleled design and state-of-the-art amenities designed for the ultimate getaway."}
                                </p>
                            </div>

                            {/* Amenities Grid */}
                            <div className="mt-12">
                                <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Amenities</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {['Infinity Pool', 'High-speed Wifi', 'Private Gym', 'Free Parking', 'Kitchen', 'Workspace'].map(amenity => (
                                        <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <span className="material-symbols-outlined">
                                                    {amenity.includes('Pool') ? 'pool' : amenity.includes('Wifi') ? 'wifi' : amenity.includes('Gym') ? 'fitness_center' : amenity.includes('Parking') ? 'local_parking' : amenity.includes('Kitchen') ? 'kitchen' : 'desk'}
                                                </span>
                                            </div>
                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full md:w-auto mt-6 px-8 py-3 rounded-full border border-primary/30 text-primary font-bold shadow-sm hover:bg-primary/5 transition-colors">View All Amenities</button>
                            </div>

                            {/* Map Preview */}
                            <div className="mt-12 mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Location</h3>
                                    <button className="text-primary font-bold hover:underline transition-all">Show on map</button>
                                </div>
                                <div className="w-full h-64 rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative shadow-inner border border-slate-100 dark:border-white/5">
                                    <img className="w-full h-full object-cover grayscale opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc0RGaWPjLPDgOr_feQx4svnXx-0hyEr69APsTqvOcTJe74ezHztTWjngKmfaVVQ6AxM9Tk3bxQKXbUpQoHcAKsm97_Nuto9DgMo6cAqc5ZhCGcB2snoKfy7wYru94c570j8x2C9M7GgSoNeTiCIFCPJTLjqQV67LAfggOofaPdobp8RFS-qBxQGMQCbE-DnG5y3fuZkDyeblOaHnRUaJhB_Tgg6d4DW3mhUOLGvi6MxuzvLzUc3RG5UYNSzFHZiJa98sMfD3qsA" alt="Map" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm">
                                            <div className="size-5 rounded-full bg-primary shadow-lg shadow-primary/50"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Host / Desktop Booking Sidebar */}
                        <div className="hidden lg:block">
                            <div className="sticky top-8 bg-white dark:bg-[#152a28] rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-white/5 flex flex-col gap-8">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Monthly Cost</span>
                                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">${property.pricePerMonth || property.price}</span>
                                    </div>
                                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">flash_on</span>
                                        Available
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200 dark:bg-white/10 w-full"></div>

                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-xs">Host Information</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full bg-slate-200 bg-cover bg-center border-2 border-white dark:border-[#152a28] shadow-md" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCl1-jbCvmg2XfgzI9LtLgglDkvgwV5VWxlhFNqcVOG0daqEI164n-wPguYpAn9YCjNkpkfxAxvRv6VUoVXUFprn1NSzVUni4o08T5pS2WxozujaCJLkoxzBEDOPSGKrLUTZDBJRQr934UuiFI0HyMKF346Wsk4mqG70dcYEjL0lx8dXhPIhsw2XDcNvVZJWKvtUNX9zeH-4Ci8yUkAF3gqmBLt6EudebhUFOjQQd-5pFl7RvMd2Dnsqt1pRTymIqx6mn73sBk_7yDs")' }}></div>
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-[#152a28] rounded-full p-0.5 shadow-sm">
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px', display: 'block', fontVariationSettings: "'FILL' 1" }}>verified</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{property.ownerEmail?.split('@')[0] || property.ownerId?.split('-')[0] || 'Julianne S.'}</h3>
                                            <p className="text-xs text-slate-500 font-medium">Superhost · Rating 4.9</p>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleEnquiry} className="w-full bg-gradient-to-r from-primary to-[#0ea5e9] text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">chat</span>
                                    Contact Property
                                </button>
                                <p className="text-center text-xs font-medium text-slate-400 -mt-4">You won't be charged yet</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Sticky Bottom Bar (Mobile/Tablet Only) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-[#102221]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 flex items-center justify-between z-40 pb-safe">
                    <div className="flex flex-col">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">${property.pricePerMonth || property.price}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">per month</span>
                    </div>
                    <button onClick={handleEnquiry} className="bg-gradient-to-r from-primary to-[#0ea5e9] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-transform">
                        Contact Property
                    </button>
                </div>

            </div>
        </div>
    );
}
