import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', role: '', phone: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return null; }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    // Decode token for basic info
    const token = localStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setProfile(p => ({
        ...p,
        name: payload.name || payload.sub || '',
        email: payload.email || payload.sub || '',
        role: payload.role || 'RENTER',
      }));
    } catch {}

    const headers = { Authorization: `Bearer ${token}` };
    axios.get('/api/v1/auth/me', { headers })
      .then(res => setProfile({
        name: res.data.name || '',
        email: res.data.email || '',
        role: res.data.role || 'RENTER',
        phone: res.data.phone || '',
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getHeaders();
    if (!headers) return;
    setSaving(true);
    try {
      await axios.put('/api/v1/users/me', { name: profile.name, phone: profile.phone }, { headers });
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { toast.error("Passwords don't match!"); return; }
    if (passwords.newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const headers = getHeaders();
    if (!headers) return;
    setSaving(true);
    try {
      await axios.put('/api/v1/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.newPass }, { headers });
      toast.success('Password changed successfully!');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const avatarLetter = (profile.name || 'U')[0].toUpperCase();
  const isOwner = profile.role === 'OWNER';

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 py-4 md:px-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="font-black text-xl tracking-tight">My Profile</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Avatar & Role Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 border border-primary/20 rounded-3xl p-6 flex items-center gap-5">
          <div className="relative">
            <div className="size-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary/30">
              {avatarLetter}
            </div>
            <div className="absolute -bottom-1 -right-1 size-6 bg-primary rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center">
              <span className="material-symbols-outlined text-xs text-white" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          <div>
            <h2 className="font-black text-2xl">{profile.name || 'User'}</h2>
            <p className="text-slate-500 text-sm">{profile.email}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${isOwner ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-primary/15 text-primary border border-primary/30'}`}>
              <span className="material-symbols-outlined text-sm">{isOwner ? 'real_estate_agent' : 'person'}</span>
              {isOwner ? 'Property Owner' : 'Renter'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([['profile', 'Profile Info', 'person'], ['security', 'Security', 'lock']] as const).map(([val, label, icon]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${activeTab === val ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>
              <span className="material-symbols-outlined text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Profile Form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-5">
            <h3 className="font-black text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_edit</span>
              Personal Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Full Name</label>
                <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Email Address</label>
                <input value={profile.email} disabled
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none opacity-60 cursor-not-allowed" />
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Phone Number</label>
                <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} type="tel"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  placeholder="+91 98765 43210" />
              </div>
            </div>

            <button type="submit" disabled={saving || loading}
              className="w-full py-3.5 bg-primary text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Security Form */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-5">
            <h3 className="font-black text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lock_reset</span>
              Change Password
            </h3>

            <div className="space-y-4">
              {[
                { label: 'Current Password', key: 'current', val: passwords.current },
                { label: 'New Password', key: 'newPass', val: passwords.newPass },
                { label: 'Confirm New Password', key: 'confirm', val: passwords.confirm },
              ].map(({ label, key, val }) => (
                <div key={key}>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">{label}</label>
                  <input type="password" value={val} required minLength={key !== 'current' ? 6 : 1}
                    onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="••••••••" />
                </div>
              ))}
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-3.5 bg-primary text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Change Password'}
            </button>
          </form>
        )}

        {/* Quick Links */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
          {[
            { icon: 'home', label: 'Browse Properties', action: () => navigate('/'), color: 'text-primary' },
            { icon: 'favorite', label: 'Saved Properties', action: () => navigate('/saved'), color: 'text-red-500' },
            { icon: 'chat_bubble', label: 'Messages', action: () => navigate('/messages'), color: 'text-blue-500' },
            { icon: 'notifications', label: 'Notifications', action: () => navigate('/notifications'), color: 'text-amber-500' },
            { icon: 'dashboard', label: 'Dashboard', action: () => navigate('/dashboard'), color: 'text-primary' },
          ].map(({ icon, label, action, color }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 text-left">
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
              <span className="font-semibold text-sm">{label}</span>
              <span className="material-symbols-outlined text-slate-300 ml-auto text-sm">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl font-bold text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
