import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PROPERTY_TYPES = ['All', 'Apartment', 'Villa', 'House', 'PG', 'Studio', 'Plot'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt,desc' },
  { label: 'Price: Low → High', value: 'pricePerMonth,asc' },
  { label: 'Price: High → Low', value: 'pricePerMonth,desc' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Home() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('0');
  const [sortBy, setSortBy] = useState('createdAt,desc');
  const [city, setCity] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);
  const debouncedCity = useDebounce(city, 400);

  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('accessToken');

  const buildParams = useCallback((pageNum: number) => {
    const [sb, sd] = sortBy.split(',');
    const params: Record<string, string> = {
      page: String(pageNum),
      size: '12',
      sortBy: sb,
      sortDir: sd,
    };
    if (debouncedSearch) params.keyword = debouncedSearch;
    if (debouncedCity) params.city = debouncedCity;
    if (selectedType !== 'All') params.propertyType = selectedType.toUpperCase();
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (bedrooms !== '0') params.bedrooms = bedrooms;
    return params;
  }, [debouncedSearch, debouncedCity, selectedType, minPrice, maxPrice, bedrooms, sortBy]);

  const fetchProperties = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true); else { setLoading(true); setError(''); }
    try {
      const res = await axios.get('/api/v1/properties', { params: buildParams(pageNum) });
      const data = res.data;
      if (append) {
        setProperties(prev => [...prev, ...(data.content || [])]);
      } else {
        setProperties(data.content || []);
      }
      setHasMore(data.hasNext || false);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams]);

  // Refetch when filters change
  useEffect(() => {
    setPage(0);
    fetchProperties(0, false);
  }, [debouncedSearch, debouncedCity, selectedType, minPrice, maxPrice, bedrooms, sortBy]);

  // Fetch user data
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('/api/v1/favorites', { headers }).catch(() => ({ data: { content: [] } })),
      axios.get('/api/v1/messages/unread-count', { headers }).catch(() => ({ data: { count: 0 } })),
      axios.get('/api/v1/notifications/unread/count', { headers }).catch(() => ({ data: { count: 0 } })),
    ]).then(([favRes, msgRes, notifRes]) => {
      setFavorites(new Set((favRes.data.content || []).map((f: any) => f.propertyId)));
      setUnreadCount(msgRes.data?.count || 0);
      setNotifCount(notifRes.data?.count || 0);
    });
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProperties(nextPage, true);
  };

  const toggleFavorite = async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('accessToken');
    if (!token) { toast.error('Please login to save properties'); navigate('/login'); return; }
    const headers = { Authorization: `Bearer ${token}` };
    const isFav = favorites.has(propertyId);
    try {
      if (isFav) {
        await axios.delete(`/api/v1/favorites/${propertyId}`, { headers });
        setFavorites(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
      } else {
        await axios.post(`/api/v1/favorites/${propertyId}`, {}, { headers });
        setFavorites(prev => new Set(prev).add(propertyId));
        toast.success('Saved to favorites!');
      }
    } catch { toast.error('Failed to update favorites'); }
  };

  const clearFilters = () => {
    setSearchInput(''); setCity(''); setSelectedType('All');
    setMinPrice(''); setMaxPrice(''); setBedrooms('0'); setSortBy('createdAt,desc');
  };

  const activeFilterCount = [
    selectedType !== 'All', city, minPrice, maxPrice, bedrooms !== '0'
  ].filter(Boolean).length;

  const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased">
      {/* Desktop Navbar */}
      <header className="hidden md:flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4 justify-between border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="text-primary flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded-xl">
            <span className="material-symbols-outlined text-2xl">roofing</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-black tracking-tighter uppercase">GetSet</h2>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5">
            <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="bg-transparent flex-1 outline-none text-sm font-medium placeholder-slate-400"
              placeholder="Search by title, city, type..."
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/saved" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">Saved</Link>
          <Link to="/messages" className="relative text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
            Messages
            {unreadCount > 0 && <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/notifications')} className="relative flex items-center justify-center rounded-full size-10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">notifications</span>
                {notifCount > 0 && <span className="absolute top-0.5 right-0.5 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>}
              </button>
              <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center rounded-full size-10 bg-primary text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">person</span>
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors">Log In</button>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-primary text-2xl">roofing</span>
            <span className="font-black text-lg tracking-tight">GetSet</span>
          </div>
          <div className="flex-1" />
          {isLoggedIn && (
            <button onClick={() => navigate('/notifications')} className="relative size-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
              <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400">notifications</span>
              {notifCount > 0 && <span className="absolute top-0.5 right-0.5 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>}
            </button>
          )}
          <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className="size-9 flex items-center justify-center rounded-full bg-primary text-white">
            <span className="material-symbols-outlined text-xl">person</span>
          </button>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2.5">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm font-medium placeholder-slate-400"
            placeholder="Search properties..."
          />
          <button onClick={() => setShowFilterPanel(true)} className="relative flex items-center gap-1 text-primary font-bold text-xs">
            <span className="material-symbols-outlined text-base">tune</span>
            {activeFilterCount > 0 && <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sticky top-24 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-widest">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary font-bold hover:underline">Clear all</button>
                )}
              </div>

              {/* City */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">City</label>
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Mumbai"
                />
              </div>

              {/* Property Type */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(t => (
                    <button key={t} onClick={() => setSelectedType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedType === t ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Price / Month (₹)</label>
                <div className="flex gap-2">
                  <input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" placeholder="Min"
                    className="w-1/2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" placeholder="Max"
                    className="w-1/2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Min. Bedrooms</label>
                <div className="flex gap-2">
                  {['Any', '1', '2', '3', '4+'].map((b, i) => (
                    <button key={b} onClick={() => setBedrooms(i === 0 ? '0' : i === 4 ? '4' : String(i))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${bedrooms === (i === 0 ? '0' : i === 4 ? '4' : String(i)) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {!loading && (
                  <p className="text-sm text-slate-500 font-medium">
                    {totalElements > 0 ? <><span className="font-black text-slate-900 dark:text-white">{totalElements}</span> properties found</> : 'No properties found'}
                    {debouncedSearch && <> for "<span className="text-primary font-semibold">{debouncedSearch}</span>"</>}
                  </p>
                )}
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Type Chips (Mobile) */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 md:hidden" style={{ scrollbarWidth: 'none' }}>
              {PROPERTY_TYPES.map(t => (
                <button key={t} onClick={() => setSelectedType(t)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors ${selectedType === t ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Loading Skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 animate-pulse">
                    <div className="h-52 bg-slate-200 dark:bg-slate-800" />
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">error_outline</span>
                <p className="text-slate-500 font-medium">{error}</p>
                <button onClick={() => fetchProperties(0, false)} className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold text-sm">Retry</button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && properties.length === 0 && (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4 block">search_off</span>
                <h3 className="text-xl font-bold mb-2">No properties found</h3>
                <p className="text-slate-500 text-sm mb-6">Try adjusting your search filters</p>
                <button onClick={clearFilters} className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/25">Clear Filters</button>
              </div>
            )}

            {/* Property Grid */}
            {!loading && !error && properties.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {properties.map((property, idx) => {
                    const imgUrl = property.imageUrls?.length > 0 ? property.imageUrls[0] : PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
                    const isFav = favorites.has(property.id);
                    return (
                      <div key={property.id}
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300">
                        {/* Image */}
                        <div className="relative h-52 overflow-hidden">
                          <img src={imgUrl} alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          {/* Price badge */}
                          <div className="absolute bottom-3 left-3">
                            <span className="bg-primary/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                              ₹{property.pricePerMonth?.toLocaleString('en-IN')}<span className="font-normal opacity-80">/mo</span>
                            </span>
                          </div>
                          {/* Type badge */}
                          {property.propertyType && (
                            <div className="absolute top-3 left-3">
                              <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                {property.propertyType}
                              </span>
                            </div>
                          )}
                          {/* Fav button */}
                          <button onClick={(e) => toggleFavorite(e, property.id)}
                            className={`absolute top-3 right-3 size-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-colors ${isFav ? 'bg-white text-red-500' : 'bg-white/20 text-white hover:bg-white/40'}`}>
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          </button>
                        </div>

                        {/* Card Body */}
                        <div className="p-4">
                          <h3 className="font-bold text-base leading-tight truncate mb-1">{property.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 mb-3">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {property.city}{property.fullAddress ? `, ${property.fullAddress}` : ''}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3">
                            {property.bedrooms > 0 && (
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">bed</span>{property.bedrooms} Beds</span>
                            )}
                            {property.bathrooms > 0 && (
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">bathtub</span>{property.bathrooms} Baths</span>
                            )}
                            {property.areaSqFt > 0 && (
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">straighten</span>{property.areaSqFt} sqft</span>
                            )}
                            {property.furnished && (
                              <span className="flex items-center gap-1 text-primary font-semibold"><span className="material-symbols-outlined text-xs">chair</span>Furnished</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-10">
                    <button onClick={loadMore} disabled={loadingMore}
                      className="px-10 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full font-bold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 mx-auto">
                      {loadingMore ? (
                        <><div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Loading...</>
                      ) : (
                        <><span className="material-symbols-outlined text-base">expand_more</span> Load More Properties</>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilterPanel(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-background-dark rounded-t-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">Filters</h3>
              <button onClick={() => setShowFilterPanel(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Property Type</label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(t => (
                  <button key={t} onClick={() => setSelectedType(t)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${selectedType === t ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Price Range (₹/mo)</label>
              <div className="flex gap-3">
                <input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" placeholder="Min" className="w-1/2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
                <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" placeholder="Max" className="w-1/2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Min. Bedrooms</label>
              <div className="flex gap-2">
                {['Any', '1', '2', '3', '4+'].map((b, i) => (
                  <button key={b} onClick={() => setBedrooms(i === 0 ? '0' : i === 4 ? '4' : String(i))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${bedrooms === (i === 0 ? '0' : i === 4 ? '4' : String(i)) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none">
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { clearFilters(); setShowFilterPanel(false); }} className="flex-1 py-3 border border-slate-300 dark:border-white/10 rounded-full font-bold text-sm">Clear All</button>
              <button onClick={() => setShowFilterPanel(false)} className="flex-1 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/25">Apply Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 pb-safe pt-3 z-[100]">
        <div className="flex justify-between items-center max-w-md mx-auto mb-1">
          <Link to="/" className="flex flex-col items-center gap-1 text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Explore</p>
          </Link>
          <Link to="/saved" className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined">favorite</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Saved</p>
          </Link>
          <Link to="/messages" className="flex flex-col items-center gap-1 text-slate-400 relative">
            <span className="material-symbols-outlined">chat_bubble</span>
            {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            <p className="text-[10px] font-black uppercase tracking-widest">Messages</p>
          </Link>
          <Link to="/notifications" className="flex flex-col items-center gap-1 text-slate-400 relative">
            <span className="material-symbols-outlined">notifications</span>
            {notifCount > 0 && <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>}
            <p className="text-[10px] font-black uppercase tracking-widest">Alerts</p>
          </Link>
          <div onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer">
            <span className="material-symbols-outlined">person</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Profile</p>
          </div>
        </div>
      </nav>
    </div>
  );
}
