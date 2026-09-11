import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return null; }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const headers = getHeaders();
    if (!headers) return;
    axios.get('/api/v1/notifications', { headers })
      .then(res => setNotifications(res.data.content || res.data || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    const headers = getHeaders();
    if (!headers) return;
    try {
      await axios.put('/api/v1/notifications/read-all', {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark as read'); }
  };

  const markRead = async (id: string) => {
    const headers = getHeaders();
    if (!headers) return;
    await axios.put(`/api/v1/notifications/${id}/read`, {}, { headers }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = getHeaders();
    if (!headers) return;
    await axios.delete(`/api/v1/notifications/${id}`, { headers }).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotifIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('enquiry') && t.includes('received')) return { icon: 'mark_email_unread', color: 'text-blue-500 bg-blue-500/10' };
    if (t.includes('accepted')) return { icon: 'check_circle', color: 'text-emerald-500 bg-emerald-500/10' };
    if (t.includes('rejected')) return { icon: 'cancel', color: 'text-red-500 bg-red-500/10' };
    if (t.includes('message')) return { icon: 'chat_bubble', color: 'text-purple-500 bg-purple-500/10' };
    return { icon: 'notifications', color: 'text-primary bg-primary/10' };
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filtered = activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 py-4 md:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div>
              <h1 className="font-black text-xl tracking-tight">Notifications</h1>
              {unreadCount > 0 && <p className="text-xs text-slate-500">{unreadCount} unread</p>}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">done_all</span>
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([['all', 'All'], ['unread', 'Unread']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === val ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>
              {label} {val === 'unread' && unreadCount > 0 && <span className="ml-1 bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-white/5 rounded-2xl animate-pulse">
                <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4 block">notifications_none</span>
            <h3 className="text-lg font-bold mb-2">{activeTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}</h3>
            <p className="text-slate-500 text-sm">
              {activeTab === 'unread' ? 'No unread notifications.' : 'Notifications about enquiries and messages will appear here.'}
            </p>
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(notif => {
              const { icon, color } = getNotifIcon(notif.type);
              return (
                <div key={notif.id}
                  onClick={() => { markRead(notif.id); }}
                  className={`relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md group
                    ${!notif.read ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}>
                  {/* Unread dot */}
                  {!notif.read && <span className="absolute top-4 right-4 size-2.5 bg-primary rounded-full" />}

                  <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className={`text-sm leading-relaxed ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                      {notif.body || notif.message || 'You have a new notification'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {formatTime(notif.createdAt)}
                      {notif.type && <><span className="mx-1">·</span><span className="capitalize">{notif.type.toLowerCase().replace(/_/g, ' ')}</span></>}
                    </p>
                  </div>
                  {/* Delete button */}
                  <button onClick={(e) => deleteNotification(notif.id, e)}
                    className="absolute top-4 right-6 size-7 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
