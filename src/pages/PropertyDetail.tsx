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
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [sendingEnquiry, setSendingEnquiry] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [nearbyProperties, setNearbyProperties] = useState<any[]>([]);

  const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  ];

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await axios.get(`/api/v1/properties/${id}`);
        setProperty(res.data);
        setEnquiryMessage(`Hi, I'm interested in "${res.data.title}". Is it available for a viewing?`);

        // Fetch nearby properties (same city)
        if (res.data.city) {
          axios.get('/api/v1/properties', { params: { city: res.data.city, size: 4 } })
            .then(r => setNearbyProperties((r.data.content || []).filter((p: any) => p.id !== id).slice(0, 3)))
            .catch(() => {});
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !id) return;
    axios.get(`/api/v1/favorites/check/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setIsFavorite(res.data?.isFavorite || false))
      .catch(() => {});
  }, [id]);

  const toggleFavorite = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { toast.error('Please login to save properties'); navigate('/login'); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (isFavorite) {
        await axios.delete(`/api/v1/favorites/${property.id}`, { headers });
        setIsFavorite(false);
        toast.success('Removed from saved');
      } else {
        await axios.post(`/api/v1/favorites/${property.id}`, {}, { headers });
        setIsFavorite(true);
        toast.success('Saved to favorites!');
      }
    } catch { toast.error('Failed to update favorites'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleEnquiry = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { toast.error('Please login first'); navigate('/login'); return; }
    setSendingEnquiry(true);
    try {
      await axios.post('/api/v1/enquiries', {
        propertyId: property.id,
        message: enquiryMessage,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEnquiryModal(false);
      toast.success('Enquiry sent! The owner will respond soon.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send enquiry');
    }
    setSendingEnquiry(false);
  };

  const handleStartChat = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { toast.error('Please login first'); navigate('/login'); return; }
    try {
      await axios.post('/api/v1/messages', {
        recipientId: property.ownerId,
        propertyId: property.id,
        content: `Hi, I'm interested in "${property.title}". Is it available?`,
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/messages');
    } catch { toast.error('Failed to start chat'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="size-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span className="material-symbols-outlined text-5xl text-slate-300">error_outline</span>
        <p className="text-slate-500">{error || 'Property not found'}</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary text-white rounded-full font-bold">Go Home</button>
      </div>
    );
  }

  const images = property.imageUrls?.length > 0 ? property.imageUrls : PLACEHOLDER_IMAGES;
  const mainImage = images[activeImageIdx] || images[0];

  const amenityIcons: Record<string, string> = {
    'pool': 'pool', 'gym': 'fitness_center', 'wifi': 'wifi', 'parking': 'local_parking',
    'kitchen': 'kitchen', 'workspace': 'desk', 'security': 'security', 'garden': 'yard',
    'ac': 'ac_unit', 'elevator': 'elevator', 'concierge': 'concierge',
  };
  const getAmenityIcon = (a: string) => {
    const lower = a.toLowerCase();
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (lower.includes(key)) return icon;
    }
    return 'check_circle';
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen pb-28 md:pb-0">
      {/* Top Nav */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-2">
          <button onClick={handleShare} className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button onClick={toggleFavorite} className={`size-10 rounded-full flex items-center justify-center transition-colors ${isFavorite ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-slate-100 dark:bg-white/5 text-slate-600 hover:bg-red-50 hover:text-red-500'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden cursor-pointer" onClick={() => setShowGallery(true)}>
                <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {images.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setActiveImageIdx(i => Math.max(0, i - 1)); }}
                      disabled={activeImageIdx === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors disabled:opacity-30">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setActiveImageIdx(i => Math.min(images.length - 1, i + 1)); }}
                      disabled={activeImageIdx === images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors disabled:opacity-30">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_: string, i: number) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setActiveImageIdx(i); }}
                      className={`rounded-full transition-all ${i === activeImageIdx ? 'w-5 h-2 bg-white' : 'size-2 bg-white/50'}`} />
                  ))}
                </div>
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                    {activeImageIdx + 1}/{images.length}
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {images.map((img: string, i: number) => (
                    <button key={i} onClick={() => setActiveImageIdx(i)}
                      className={`shrink-0 size-16 rounded-xl overflow-hidden border-2 transition-colors ${i === activeImageIdx ? 'border-primary' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Header */}
            <div>
              {property.propertyType && (
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3">
                  {property.propertyType}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{property.title}</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>{property.fullAddress || property.address}{property.city ? `, ${property.city}` : ''}{property.state ? `, ${property.state}` : ''}</span>
              </div>
              {property.pincode && <p className="text-xs text-slate-400 ml-5 mt-0.5">PIN: {property.pincode}</p>}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: 'bed', label: 'Bedrooms', value: property.bedrooms || 'N/A' },
                { icon: 'bathtub', label: 'Bathrooms', value: property.bathrooms || 'N/A' },
                { icon: 'straighten', label: 'Area', value: property.areaSqFt ? `${property.areaSqFt} sqft` : 'N/A' },
                { icon: 'chair', label: 'Furnished', value: property.furnished ? 'Yes' : 'No' },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
                  <span className="material-symbols-outlined text-primary text-2xl">{stat.icon}</span>
                  <span className="font-black text-base">{stat.value}</span>
                  <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <h3 className="font-black text-lg mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                About this property
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                {property.description || 'A beautiful property in a prime location. Contact the owner for more details.'}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">star</span>
                  Amenities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-sm">{getAmenityIcon(amenity)}</span>
                      </div>
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Properties */}
            {nearbyProperties.length > 0 && (
              <div>
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">location_city</span>
                  More in {property.city}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {nearbyProperties.map((p: any, idx: number) => (
                    <div key={p.id} onClick={() => navigate(`/properties/${p.id}`)}
                      className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all">
                      <div className="h-32 overflow-hidden">
                        <img src={p.imageUrls?.[0] || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length]} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-sm truncate">{p.title}</p>
                        <p className="text-primary text-xs font-bold mt-1">₹{p.pricePerMonth?.toLocaleString('en-IN')}/mo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Sticky Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Price Card */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">Monthly Rent</span>
                    <span className="text-4xl font-black text-slate-900 dark:text-white">
                      ₹{property.pricePerMonth?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">flash_on</span>
                    Available
                  </span>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/10 w-full mb-5" />

                {/* Owner Info */}
                <div className="mb-5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Listed By</h4>
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-black text-lg border-2 border-primary/20">
                      {(property.ownerEmail?.split('@')[0] || property.ownerId || 'O')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{property.ownerEmail?.split('@')[0] || 'Property Owner'}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">verified</span>
                        Verified Owner
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowEnquiryModal(true)}
                    className="w-full py-3.5 bg-primary text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">send</span>
                    Send Enquiry
                  </button>
                  <button onClick={handleStartChat}
                    className="w-full py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">chat</span>
                    Message Owner
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-3">No payment required at this stage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 p-4 flex items-center gap-3">
        <div className="flex-1">
          <span className="text-xs text-slate-500 font-medium">Monthly Rent</span>
          <p className="font-black text-xl">₹{property.pricePerMonth?.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={handleStartChat} className="py-3 px-5 border border-primary text-primary rounded-2xl font-bold text-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">chat</span>
          Chat
        </button>
        <button onClick={() => setShowEnquiryModal(true)} className="py-3 px-5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/25 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">send</span>
          Enquire
        </button>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEnquiryModal(false)} />
          <div className="relative w-full md:max-w-lg bg-white dark:bg-background-dark rounded-t-3xl md:rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl">Send Enquiry</h3>
              <button onClick={() => setShowEnquiryModal(false)} className="size-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="size-12 rounded-xl overflow-hidden shrink-0">
                <img src={images[0]} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm">{property.title}</p>
                <p className="text-xs text-primary font-bold">₹{property.pricePerMonth?.toLocaleString('en-IN')}/mo</p>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Your Message</label>
              <textarea value={enquiryMessage} onChange={e => setEnquiryMessage(e.target.value)} rows={4}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <button onClick={handleEnquiry} disabled={sendingEnquiry || !enquiryMessage.trim()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {sendingEnquiry ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><span className="material-symbols-outlined">send</span>Send Enquiry</>}
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Gallery */}
      {showGallery && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setShowGallery(false)} className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center">
              <span className="material-symbols-outlined">close</span>
            </button>
            <span className="text-white text-sm font-bold">{activeImageIdx + 1} / {images.length}</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={images[activeImageIdx]} alt="" className="max-w-full max-h-full object-contain rounded-2xl" />
          </div>
          <div className="flex justify-center gap-3 p-4 overflow-x-auto">
            {images.map((img: string, i: number) => (
              <button key={i} onClick={() => setActiveImageIdx(i)}
                className={`shrink-0 size-16 rounded-xl overflow-hidden border-2 transition-colors ${i === activeImageIdx ? 'border-primary' : 'border-transparent opacity-60'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
