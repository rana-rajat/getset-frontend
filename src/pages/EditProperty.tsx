import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function EditProperty() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
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

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await axios.get(`/api/v1/properties/${id}`);
                const data = res.data;
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    address: data.address || '',
                    city: data.city || '',
                    price: data.pricePerMonth?.toString() || data.price?.toString() || '',
                    bedrooms: data.bedrooms?.toString() || '',
                    bathrooms: data.bathrooms?.toString() || '',
                    area: data.areaSquareFeet?.toString() || data.area?.toString() || '',
                    amenities: data.amenities?.join(', ') || ''
                });
            } catch (err: any) {
                toast.error("Failed to load property details");
                setError(err.response?.data?.message || 'Failed to map property');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

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
                pricePerMonth: parseFloat(formData.price),
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                areaSqFt: parseFloat(formData.area),
                amenities: formData.amenities.split(',').map(item => item.trim()).filter(Boolean)
            };

            await axios.put(`/api/v1/properties/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Property updated successfully!');
            navigate('/dashboard');
        } catch (err: any) {
            console.error("Failed to update property:", err);
            setError(err.response?.data?.message || 'Failed to update property. Ensure you are logged in as the OWNER.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4 animate-pulse-subtle">
                    <div className="h-10 w-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Loading property details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 animate-fade-in">
            <div className="max-w-5xl mx-auto bg-white dark:bg-[#1c2027] lg:p-10 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 my-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Edit Property</h1>
                </div>

                {error && <div className="mb-4 p-4 text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <label className="block space-y-1.5 md:col-span-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Property Title</span>
                            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Cozy 2BHK in Downtown" />
                        </label>

                        <label className="block space-y-1.5 md:col-span-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</span>
                            <textarea name="description" required rows={4} value={formData.description} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Describe your property..."></textarea>
                        </label>

                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</span>
                            <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="123 Main St" />
                        </label>

                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">City</span>
                            <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Metropolis" />
                        </label>

                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Monthly Rent ($)</span>
                            <input type="number" name="price" required min="0" step="0.01" value={formData.price} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="1500" />
                        </label>

                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Area (sq ft)</span>
                            <input type="number" name="area" required min="1" value={formData.area} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="1200" />
                        </label>

                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bedrooms</span>
                            <input type="number" name="bedrooms" required min="0" max="20" value={formData.bedrooms} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="2" />
                        </label>

                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bathrooms</span>
                            <input type="number" name="bathrooms" required min="0" max="10" value={formData.bathrooms} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="1" />
                        </label>

                        <label className="block space-y-1.5 md:col-span-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Amenities (comma-separated)</span>
                            <input type="text" name="amenities" value={formData.amenities} onChange={handleChange} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Wifi, Pool, Gym" />
                        </label>
                    </div>

                    <button type="submit" disabled={loading} className="mt-8 flex w-full md:w-auto md:ml-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                        {loading && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                        {!loading && <span className="material-symbols-outlined text-[18px]">save</span>}
                    </button>
                </form>
            </div>
        </div>
    );
}
