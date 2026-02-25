import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AddProperty() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        city: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        amenities: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                area: parseFloat(formData.area),
                amenities: formData.amenities.split(',').map(item => item.trim()).filter(Boolean)
            };

            await axios.post('/api/v1/properties', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Property listed successfully!');
            navigate('/dashboard');
        } catch (err: any) {
            console.error("Failed to list property:", err);
            setError(err.response?.data?.message || 'Failed to list property. Ensure you are logged in as an OWNER.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f5f8f8] dark:bg-[#101822] font-display min-h-screen text-slate-900 dark:text-slate-100 pb-32">

            {/* Header Area */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#101822]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-4 px-6 md:px-12 transition-all">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined ml-1.5 text-xl">arrow_back_ios</span>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#1E1B4B] dark:text-white uppercase line-clamp-1">List Property</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stepper (Visual Only) */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-white/5 rounded-full -z-10"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/4 h-1 bg-primary rounded-full -z-10 shadow-lg shadow-primary/20"></div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="size-8 md:size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xl shadow-primary/30 border-4 border-[#f5f8f8] dark:border-[#101822]">1</div>
                        <span className="text-[10px] uppercase font-bold text-primary tracking-widest hidden md:block">Details</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-8 md:size-10 rounded-full bg-white dark:bg-[#152a28] text-slate-400 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-sm">2</div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hidden md:block">Photos</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-8 md:size-10 rounded-full bg-white dark:bg-[#152a28] text-slate-400 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-sm">3</div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hidden md:block">Pricing</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-8 md:size-10 rounded-full bg-white dark:bg-[#152a28] text-slate-400 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-sm">4</div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hidden md:block">Publish</span>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 md:px-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-8 md:gap-12">

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium flex items-start gap-3">
                            <span className="material-symbols-outlined shrink-0 text-red-500">error</span>
                            {error}
                        </div>
                    )}

                    {/* Basic Details Section */}
                    <section className="bg-white dark:bg-[#162725] rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <h2 className="text-xl font-black text-[#1E1B4B] dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                            <span className="material-symbols-outlined text-primary">real_estate_agent</span>
                            Basic Details
                        </h2>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Property Title</label>
                                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-shadow" placeholder="e.g. Minimalist Urban Loft" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                                    <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Address</label>
                                    <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-shadow" placeholder="123 Luxury Ave" />
                                </div>
                                <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                                    <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">City</label>
                                    <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-shadow" placeholder="Metropolis" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Description</label>
                                <textarea name="description" required rows={5} value={formData.description} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-3xl px-6 py-5 text-sm font-medium outline-none transition-shadow leading-relaxed resize-none" placeholder="Describe the ambiance, location, and unique features..." />
                            </div>
                        </div>
                    </section>

                    {/* Pricing & Specs */}
                    <section className="bg-white dark:bg-[#162725] rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100 dark:border-white/5">
                        <h2 className="text-xl font-black text-[#1E1B4B] dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                            <span className="material-symbols-outlined text-primary">sell</span>
                            Pricing & Specs
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5 focus-within:text-emerald-500 transition-colors md:col-span-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Monthly Rate</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-500 dark:text-emerald-400">$</span>
                                    <input type="number" name="price" required min="1" step="0.01" value={formData.price} onChange={handleChange} className="w-full bg-emerald-50/50 dark:bg-emerald-900/10 border-none ring-1 ring-emerald-200 dark:ring-emerald-500/20 focus:ring-2 focus:ring-emerald-500 rounded-2xl pl-11 pr-5 py-4 text-2xl font-black text-slate-900 dark:text-white outline-none transition-shadow" placeholder="3,400" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Bedrooms</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">bed</span>
                                    <input type="number" name="bedrooms" required min="1" value={formData.bedrooms} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none transition-shadow" placeholder="2" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Bathrooms</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">shower</span>
                                    <input type="number" name="bathrooms" required min="1" value={formData.bathrooms} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none transition-shadow" placeholder="2" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors md:col-span-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Total Area (sq ft)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">square_foot</span>
                                    <input type="number" name="area" required min="1" value={formData.area} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none transition-shadow" placeholder="1,200" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Amenities & Media Upload */}
                    <section className="bg-white dark:bg-[#162725] rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100 dark:border-white/5">
                        <h2 className="text-xl font-black text-[#1E1B4B] dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                            <span className="material-symbols-outlined text-primary">add_photo_alternate</span>
                            Amenities & Media
                        </h2>

                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col gap-1.5 focus-within:text-primary transition-colors">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Amenities (comma-separated tags)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">style</span>
                                    <input type="text" name="amenities" value={formData.amenities} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#101822] border-none ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary rounded-2xl pl-12 pr-5 py-4 text-sm font-medium outline-none transition-shadow" placeholder="Wifi, Pool, Gym, Concierge" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest ml-4 text-slate-500">Property Photos</label>
                                <div className="w-full border-2 border-dashed border-primary/40 dark:border-primary/30 rounded-[2rem] bg-primary/5 dark:bg-primary/10 p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/10 transition-colors group">
                                    <div className="size-16 rounded-full bg-white dark:bg-[#152a28] shadow-lg shadow-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
                                        <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 font-bold mb-1">Drag & Drop high-res photos here</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">JPEG, PNG or WEBP (Max 5MB each)</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Fixed Action Footer */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white/95 dark:bg-[#101822]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_30px_rgba(0,0,0,0.3)]">
                        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3 md:gap-4">
                            <button type="button" onClick={() => navigate(-1)} className="px-6 md:px-8 py-3.5 md:py-4 rounded-full font-bold text-sm tracking-widest uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="px-8 md:px-12 py-3.5 md:py-4 bg-gradient-to-tr from-primary to-[#00c9b7] text-[#102221] rounded-full font-black text-sm tracking-widest uppercase shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="size-4 rounded-full border-2 border-[#102221]/30 border-t-[#102221] animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save & Publish'
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </main>
        </div>
    );
}
