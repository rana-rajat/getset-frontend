import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Utility to decode JWT and save to localStorage
function decodeAndSaveToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role || 'RENTER';
    const userName = payload.name || payload.sub || 'User';
    const userId = payload.id || payload.sub || '';
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userId', userId);
    return { role, userName, userId };
  } catch {
    return { role: 'RENTER', userName: 'User', userId: '' };
  }
}

export default function Dashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [role, setRole] = useState(localStorage.getItem('userRole') || 'RENTER');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login'); return; }

        const decoded = decodeAndSaveToken(token);
        setRole(decoded.role);
        setUserName(decoded.userName);

        const headers = { Authorization: `Bearer ${token}` };

        // Parallel fetches with graceful fallbacks
        const [favRes, enqRes, msgRes, notifRes, propsRes] = await Promise.all([
          axios.get('/api/v1/favorites', { headers }).catch(() => ({ data: { content: [] } })),
          axios.get(decoded.role === 'OWNER' ? '/api/v1/enquiries/received' : '/api/v1/enquiries/my-enquiries', { headers }).catch(() => ({ data: { content: [] } })),
          axios.get('/api/v1/messages/unread-count', { headers }).catch(() => ({ data: { count: 0 } })),
          axios.get('/api/v1/notifications/unread/count', { headers }).catch(() => ({ data: { count: 0 } })),
          decoded.role === 'OWNER'
            ? axios.get('/api/v1/properties/owner/my-properties', { headers }).catch(() => ({ data: { content: [] } }))
            : Promise.resolve({ data: { content: [] } }),
        ]);

        const favContent = favRes.data.content || [];

        if (decoded.role === 'OWNER') {
          setProperties(propsRes.data.content || []);
        } else {
          setProperties(favContent.map((f: any) => ({
            id: f.propertyId, title: f.propertyTitle, pricePerMonth: f.price, imageUrls: []
          })));
        }

        setEnquiries(enqRes.data.content || enqRes.data || []);
        setUnreadCount(msgRes.data?.count || 0);
        setNotifCount(notifRes.data?.count || 0);
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
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const updateEnquiryStatus = async (enquiryId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await axios.put(`/api/v1/enquiries/${enquiryId}/status`, { status: newStatus, rejectionReason: '' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const endpoint = role === 'OWNER' ? '/api/v1/enquiries/received' : '/api/v1/enquiries/my-enquiries';
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      setEnquiries(res.data.content || res.data || []);
      toast.success(`Enquiry ${newStatus.toLowerCase()} successfully`);
    } catch { toast.error('Failed to update enquiry status'); }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await axios.delete(`/api/v1/properties/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      toast.success('Property deleted');
    } catch { toast.error('Failed to delete property'); }
  };

  const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
  ];

  const tabs = role === 'OWNER'
    ? ['Overview', 'My Properties', 'Enquiries', 'Settings']
    : ['Overview', 'Saved', 'My Enquiries', 'Settings'];

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col pb-24 md:pb-0">

      {/* Header */}
      <header className="px-4 md:px-8 pt-6 pb-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div className="size-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30">
              {(userName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold leading-tight">Welcome, {userName}!</h1>
              <span className={`text-xs font-black uppercase tracking-widest ${role === 'OWNER' ? 'text-amber-500' : 'text-primary'}`}>
                {role === 'OWNER' ? '🏠 Property Owner' : '🔑 Renter'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-colors" title="Browse">
              <span className="material-symbols-outlined text-xl">explore</span>
            </button>
            <button onClick={() => navigate('/notifications')} className="relative size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
              {notifCount > 0 && <span className="absolute top-0.5 right-0.5 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark" />}
            </button>
            <button onClick={() => navigate('/profile')} className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
            </button>
            <button onClick={handleLogout} className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="px-4 md:px-8 py-3 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-white/10 sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary'}`}>
              {tab}
            </button>
          ))}
          {role === 'OWNER' && (
            <Link to="/add-property" className="shrink-0 ml-auto bg-gradient-to-r from-primary to-primary/70 text-white px-5 py-2 rounded-full text-sm font-black shadow-lg shadow-primary/25 flex items-center gap-1.5 hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-base">add</span> List Property
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 px-4 md:px-8 pt-6 pb-8 max-w-7xl mx-auto w-full space-y-8">

        {/* === OVERVIEW === */}
        {activeTab === 'Overview' && (
          <>
            {/* Stats Grid */}
            <section>
              <h2 className="text-xl font-black mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: 'home', label: role === 'OWNER' ? 'Listings' : 'Saved', value: properties.length, color: 'text-primary bg-primary/10' },
                  { icon: 'mark_email_unread', label: 'Enquiries', value: enquiries.length, color: 'text-blue-500 bg-blue-500/10' },
                  { icon: 'chat_bubble', label: 'Unread Msgs', value: unreadCount, color: 'text-purple-500 bg-purple-500/10' },
                  { icon: 'notifications', label: 'Notifications', value: notifCount, color: 'text-amber-500 bg-amber-500/10' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:-translate-y-1 transition-transform group cursor-pointer">
                    <div className={`size-12 rounded-full flex items-center justify-center mb-3 ${stat.color} group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black">{loading ? '–' : stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Properties Preview */}
            {properties.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black">{role === 'OWNER' ? 'Your Listings' : 'Saved Properties'}</h2>
                  <button onClick={() => setActiveTab(role === 'OWNER' ? 'My Properties' : 'Saved')} className="text-primary text-sm font-bold hover:underline">See All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.slice(0, 3).map((p, idx) => (
                    <div key={p.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex gap-3 p-3 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={p.imageUrls?.[0] || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="font-bold text-sm truncate">{p.title}</p>
                        <p className="text-primary text-xs font-bold mt-0.5">₹{(p.pricePerMonth || p.price)?.toLocaleString('en-IN')}/mo</p>
                        <button onClick={() => navigate(role === 'OWNER' ? `/edit-property/${p.id}` : `/properties/${p.id}`)} className="mt-2 text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                          {role === 'OWNER' ? 'Edit' : 'View'}
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Enquiries Preview */}
            {enquiries.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black">Recent Enquiries</h2>
                  <button onClick={() => setActiveTab(role === 'OWNER' ? 'Enquiries' : 'My Enquiries')} className="text-primary text-sm font-bold hover:underline">See All</button>
                </div>
                <div className="space-y-3">
                  {enquiries.slice(0, 2).map(enq => (
                    <EnquiryCard key={enq.id} enquiry={enq} role={role} onUpdateStatus={updateEnquiryStatus} />
                  ))}
                </div>
              </section>
            )}

            {/* Quick Actions */}
            <section>
              <h2 className="text-xl font-black mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: 'explore', label: 'Browse', action: () => navigate('/'), color: 'text-primary' },
                  { icon: 'chat_bubble', label: 'Messages', action: () => navigate('/messages'), color: 'text-blue-500', badge: unreadCount },
                  { icon: 'notifications', label: 'Notifications', action: () => navigate('/notifications'), color: 'text-amber-500', badge: notifCount },
                  { icon: 'manage_accounts', label: 'Profile', action: () => navigate('/profile'), color: 'text-purple-500' },
                ].map(({ icon, label, action, color, badge }) => (
                  <button key={label} onClick={action}
                    className="relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-1 transition-all text-center">
                    <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
                    <span className="text-xs font-bold">{label}</span>
                    {badge && badge > 0 ? <span className="absolute top-2 right-2 size-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{badge > 99 ? '99+' : badge}</span> : null}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* === MY PROPERTIES / SAVED === */}
        {(activeTab === 'My Properties' || activeTab === 'Saved') && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">{role === 'OWNER' ? 'Your Property Portfolio' : 'Saved Properties'}</h2>
              {role === 'OWNER' && (
                <Link to="/add-property" className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-primary/25">
                  <span className="material-symbols-outlined text-base">add</span>Add New
                </Link>
              )}
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-white/5 rounded-2xl h-32 border border-slate-200 dark:border-white/10" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">{role === 'OWNER' ? 'add_home' : 'favorite'}</span>
                <h3 className="font-bold text-lg mb-2">{role === 'OWNER' ? 'No properties listed yet' : 'No saved properties'}</h3>
                <button onClick={() => navigate(role === 'OWNER' ? '/add-property' : '/')} className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/25">
                  {role === 'OWNER' ? 'List Your First Property' : 'Browse Properties'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {properties.map((p, idx) => (
                  <div key={p.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="h-48 overflow-hidden relative">
                      <img src={p.imageUrls?.[0] || PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-3 right-3">
                        <span className="bg-emerald-500/90 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-base truncate mb-1">{p.title}</h3>
                      <p className="text-primary font-bold text-sm mb-3">₹{(p.pricePerMonth || p.price)?.toLocaleString('en-IN')}/mo</p>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/properties/${p.id}`)} className="flex-1 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:border-primary hover:text-primary transition-colors">View</button>
                        {role === 'OWNER' && (
                          <>
                            <button onClick={() => navigate(`/edit-property/${p.id}`)} className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold">Edit</button>
                            <button onClick={() => deleteProperty(p.id)} className="py-2 px-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* === ENQUIRIES === */}
        {(activeTab === 'Enquiries' || activeTab === 'My Enquiries') && (
          <section>
            <h2 className="text-xl font-black mb-6">{role === 'OWNER' ? 'Received Enquiries' : 'My Enquiries'}</h2>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => <div key={i} className="bg-white dark:bg-white/5 rounded-2xl h-32 border border-slate-200 dark:border-white/10" />)}
              </div>
            ) : enquiries.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">mark_email_read</span>
                <h3 className="font-bold text-lg mb-2">No enquiries yet</h3>
                <p className="text-slate-500 text-sm">{role === 'OWNER' ? 'Enquiries from renters will appear here.' : 'Submit enquiries on properties you are interested in.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enquiries.map(enq => (
                  <EnquiryCard key={enq.id} enquiry={enq} role={role} onUpdateStatus={updateEnquiryStatus} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* === SETTINGS === */}
        {activeTab === 'Settings' && (
          <section>
            <h2 className="text-xl font-black mb-6">Settings</h2>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden max-w-lg">
              {[
                { icon: 'manage_accounts', label: 'Edit Profile', action: () => navigate('/profile') },
                { icon: 'lock_reset', label: 'Change Password', action: () => navigate('/profile') },
                { icon: 'notifications', label: 'Notification Preferences', action: () => navigate('/notifications') },
                { icon: 'help', label: 'Help & Support', action: () => toast('Coming soon!') },
                { icon: 'policy', label: 'Privacy Policy', action: () => toast('Coming soon!') },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 text-left">
                  <span className="material-symbols-outlined text-primary">{icon}</span>
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="material-symbols-outlined text-slate-300 ml-auto text-sm">chevron_right</span>
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="mt-4 flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl font-bold text-sm text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors">
              <span className="material-symbols-outlined">logout</span>Sign Out
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

// ---- Enquiry Card Component ----
function EnquiryCard({ enquiry, role, onUpdateStatus }: {
  enquiry: any; role: string;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const statusStyle: Record<string, string> = {
    ACCEPTED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
    PENDING: 'bg-primary/10 text-primary border-primary/20',
    SENT: 'bg-primary/10 text-primary border-primary/20',
  };
  const status = enquiry.status || 'PENDING';

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shrink-0">
            {(enquiry.senderId || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{enquiry.propertyTitle || 'Property Enquiry'}</p>
            <p className="text-xs text-slate-400">from user · {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : 'recently'}</p>
          </div>
        </div>
        <span className={`shrink-0 ml-2 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${statusStyle[status] || statusStyle.PENDING}`}>
          {status}
        </span>
      </div>

      {enquiry.message && (
        <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 line-clamp-2">
          "{enquiry.message}"
        </p>
      )}

      {role === 'OWNER' && (status === 'PENDING' || status === 'SENT') && (
        <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-white/10">
          <button onClick={() => onUpdateStatus(enquiry.id, 'ACCEPTED')}
            className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-sm shadow-primary/20 hover:scale-[0.98] transition-transform">
            ✓ Accept
          </button>
          <button onClick={() => onUpdateStatus(enquiry.id, 'REJECTED')}
            className="flex-1 py-2 bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-300 dark:border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
            ✗ Decline
          </button>
        </div>
      )}
    </div>
  );
}
