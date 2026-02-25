import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Messages() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [selectedThread, setSelectedThread] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };
            const [receivedRes, sentRes] = await Promise.all([
                axios.get('/api/v1/messages/received', { headers }).catch(() => ({ data: { content: [] } })),
                axios.get('/api/v1/messages/sent', { headers }).catch(() => ({ data: { content: [] } }))
            ]);

            const received = receivedRes.data?.content || receivedRes.data || [];
            const sent = sentRes.data?.content || sentRes.data || [];

            const unread = received.filter((m: any) => !m.read && m.id);
            for (const msg of unread) {
                axios.put(`/api/v1/messages/${msg.id}/read`, {}, { headers }).catch(console.warn);
            }

            const mergedMessages = [...received, ...sent];

            // Deduplicate by message ID to prevent showing the same message twice
            const uniqueMessagesMap = new Map();
            mergedMessages.forEach(msg => {
                if (msg.id) {
                    uniqueMessagesMap.set(msg.id, msg);
                } else {
                    // Fallback for mock data without IDs, use a composite key
                    const key = `${msg.content}-${msg.createdAt || msg.timestamp}`;
                    uniqueMessagesMap.set(key, msg);
                }
            });

            const uniqueMessages = Array.from(uniqueMessagesMap.values());

            const allMessages = uniqueMessages.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
                const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
                return dateA - dateB;
            });

            setMessages(allMessages);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedThread]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || !selectedThread) return;

        try {
            const token = localStorage.getItem('accessToken');
            const threadMessages = messages.filter(m => (m.propertyId || 'general') === selectedThread);
            const lastMsg = threadMessages[threadMessages.length - 1];

            let myId = '';
            try {
                const payload = JSON.parse(atob(token!.split('.')[1]));
                myId = payload.sub || payload.id || '';
            } catch (e) { }

            const recipientId = lastMsg.senderId === myId ? lastMsg.recipientId : lastMsg.senderId;

            await axios.post('/api/v1/messages', {
                recipientId: recipientId,
                content: replyContent,
                propertyId: lastMsg.propertyId,
                enquiryId: lastMsg.enquiryId,
                threadId: lastMsg.threadId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReplyContent('');
            fetchMessages();
        } catch (err) {
            toast.error("Failed to send message.");
        }
    };

    const threads = messages.reduce((acc, msg) => {
        const key = msg.propertyId || 'general';
        if (!acc[key]) acc[key] = [];
        acc[key].push(msg);
        return acc;
    }, {} as Record<string, any[]>);

    const threadKeys = Object.keys(threads);

    useEffect(() => {
        if (!selectedThread && threadKeys.length > 0 && window.innerWidth >= 768) {
            setSelectedThread(threadKeys[0]);
        }
    }, [threadKeys, selectedThread]);

    let myId = '';
    try {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            myId = payload.sub || payload.id || '';
        }
    } catch (e) { }

    const avatarMap = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCBn9QzRhmAG_rTgmNfY8Sy5ax2Op96AAWZ1Be-LQuTbHncM7LBgI_8mVrSqEHf1VNatGnOTwgJBqQePoFTfFUfKQjHHtNShV9fhzQxX67CgFSLb40lrKcHJpAX5UF3J7c8N1AsjCNOa3Ss0jqMeRq0uCNnfnyydM7LD0u_VGVMr-OomvlQo0NbKThMDvm5uC97MPdWnN0spHG_l-LFPPoOuDZSYJXGCe4RNTc1orinpsFXAT0zSHTvhh3pnZKqKUnCTYafPIuCYA",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCKuD5l1_vFV2mgrhQKmA8EcGLQoXJwfEndKZVM7PcErmGS1N_zlJaHWdpk8_swPbKYtCoZNN3Zo03hbAl9L5LVjBABGTwz5Hgwsnne0qGSAlGsBxXo9Q1w6asW1AGJ7j_xkpvgWNwps5-edZn4UN9djEb0rfEX6zgPl7EoVHXG5ZVCXellNl61WKVyRw7eTAt_I63fNIg8qPTP7mEe9d8p4ufEcM_kC9vVRnd_cemOySROoXPcJlDn_FxIeicog_fQFbp-h3mj0w",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCOdAfv9FnDLM8s8qtX4wNe75sd9qmiNd0ZthHlCOmvYCIEkCeZESjM2pA7c8MTrziphCxGDRoktW092MeE0hys4JqFEdVxc2oyMd76QdpPMs-pWqS1hn0HsdrgW4UTkkM9ApFRGMrp1c-UkdAo_df7Yok_NMEqdpxnIc9fAIaYXl2Qw4ytjrnoFyAeP2JDh90JerZzpNFB6VvjCmu1gKvTjO3iBNCyKrHLK-DLkYKAhOawOYy-FP50n_S1GGfaqaGCQUCuijmiDQ",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBGHj9hzWO1IoWucK7YoJKUQpPaAFxevbUgwFmFuZC9y0EGRBNrum519IM6R1uDT220JbYsE1EZ_Gg9i-dHIxW2pxkq9wq3QaW-O-9ar0C47nOoLE_rtywOYSShXlOjO_6Aa5YU8aebRZL0M2NuuE2IXk9Tdrn5vDHYAbF77BAWw3S5hPoTeU39d9kLbdLL7Vht-78mAKNF0Ip3tut4T0WstgXL2sA7In8IexJaGEPYL2mg3kr8_HXvetsiX-aoyOK5abIIIzEt-g"
    ];

    return (
        <div className="bg-background-light dark:bg-[#101822] font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">

            {/* Top Navigation Wrapper for Desktop */}
            <div className="hidden md:block fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-[#152a28]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-8 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-black tracking-tight text-primary">GetSet</Link>
                        <div className="flex items-center gap-6">
                            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Explore</Link>
                            <Link to="/saved" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Saved</Link>
                            <Link to="/dashboard" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Dashboard</Link>
                            <Link to="/messages" className="text-sm font-bold text-primary relative">Messages</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row md:pt-24 pb-[72px] md:pb-6 md:px-6 gap-6 h-screen md:h-auto overflow-hidden">

                {/* 1. Chat List View (Variant 1) */}
                <div className={`${selectedThread && window.innerWidth < 768 ? 'hidden' : 'flex'} w-full md:w-96 flex-col bg-white dark:bg-[#162725] md:rounded-[2rem] border-r md:border border-slate-200 dark:border-white/5 shadow-xl h-full overflow-hidden`}>

                    {/* Sticky Glassmorphic Header */}
                    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-white/80 dark:bg-[#162725]/80 border-b border-slate-200 dark:border-white/5 md:pr-4">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Messages</h1>
                        <button className="flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                    </header>

                    {/* Segmented Control / Tabs */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                        <div className="flex gap-6">
                            <button className="pb-2 border-b-2 border-primary text-slate-900 dark:text-white font-bold text-sm">All Chats</button>
                            <button className="pb-2 border-b-2 border-transparent text-slate-400 font-medium text-sm hover:text-slate-300">Unread</button>
                        </div>
                    </div>

                    {/* Chat List */}
                    <main className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                        {loading && threadKeys.length === 0 ? (
                            <div className="px-2 py-4 flex flex-col gap-4 animate-pulse-subtle">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="size-14 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                                        <div className="flex-1 pt-1">
                                            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                                            <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : threadKeys.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 dark:bg-[#101822] rounded-2xl mx-2 mt-4 border border-dashed border-slate-300 dark:border-white/10">No messages yet. Start a conversation by inquiring about a property.</div>
                        ) : (
                            threadKeys.map((key, idx) => {
                                const threadMsgs = threads[key];
                                const lastMsg = threadMsgs[threadMsgs.length - 1];
                                const isUnread = threadMsgs.some((m: any) => !m.read && m.recipientId === myId);
                                const avatar = avatarMap[idx % avatarMap.length];
                                const senderName = lastMsg.senderEmail?.split('@')[0] || lastMsg.senderId?.split('-')[0] || 'User';

                                return (
                                    <div
                                        key={key}
                                        onClick={() => setSelectedThread(key)}
                                        className={`flex items-center gap-4 p-3 rounded-2xl transition-colors cursor-pointer group ${selectedThread === key ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="size-14 rounded-full bg-cover bg-center border border-slate-200 dark:border-white/10 shadow-sm" style={{ backgroundImage: `url('${avatar}')` }}></div>
                                            {isUnread && (
                                                <div className="absolute bottom-0 right-0 size-3.5 bg-primary border-2 border-white dark:border-[#162725] rounded-full shadow-sm"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="flex justify-between items-baseline mb-0.5 mt-1">
                                                <h3 className={`text-base font-bold truncate ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{lastMsg.senderId === myId ? 'Me' : senderName}</h3>
                                                <span className={`text-[10px] uppercase tracking-wider font-bold ${isUnread ? 'text-primary' : 'text-slate-400'}`}>
                                                    {new Date(lastMsg.createdAt || lastMsg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-widest">{lastMsg.propertyTitle || `Property #${key.substring(0, 4)}`}</p>
                                            <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                                                {lastMsg.senderId === myId ? <span className="text-slate-400 mr-1 material-symbols-outlined text-[14px] align-middle">done_all</span> : ''}
                                                {lastMsg.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </main>
                </div>

                {/* 2. Active Chat View (Variant 2) */}
                {selectedThread ? (
                    <div className={`${!selectedThread && window.innerWidth < 768 ? 'hidden' : 'flex'} flex-1 flex-col bg-white dark:bg-[#162725] md:rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl h-full overflow-hidden relative`}>

                        {/* Chat Header */}
                        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-white/5 bg-white/95 dark:bg-[#162725]/95 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <button className="md:hidden flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-primary transition-colors" onClick={() => setSelectedThread(null)}>
                                    <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-slate-200 dark:bg-slate-800 bg-cover bg-center border border-slate-200 dark:border-white/10" style={{ backgroundImage: `url('${avatarMap[Object.keys(threads).indexOf(selectedThread) % avatarMap.length]}')` }}></div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#162725] rounded-full"></div>
                                    </div>
                                    <div>
                                        <h2 className="text-base md:text-lg font-bold leading-tight text-slate-900 dark:text-white">{threads[selectedThread][threads[selectedThread].length - 1]?.propertyTitle || `Property Inquiry`}</h2>
                                        <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Online</p>
                                    </div>
                                </div>
                            </div>
                            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                        </header>

                        {/* Conversation Messages */}
                        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 outline-none">
                            <div className="flex justify-center mb-8">
                                <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-[#101822] text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/5">Conversation Started</span>
                            </div>

                            {threads[selectedThread]?.map((msg: any, i: number) => {
                                const isMe = msg.senderId === myId;
                                const avatar = avatarMap[Object.keys(threads).indexOf(selectedThread) % avatarMap.length];

                                return (
                                    <div key={msg.id || i} className={`flex items-end gap-2 max-w-[85%] md:max-w-[75%] ${isMe ? 'ml-auto justify-end' : ''}`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 bg-cover bg-center shadow-sm" style={{ backgroundImage: `url('${avatar}')` }}></div>
                                        )}
                                        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : ''}`}>
                                            <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm
                                                ${isMe
                                                    ? 'bg-gradient-to-tr from-primary to-[#00c9b7] text-[#102221] font-medium rounded-br-sm shadow-primary/20'
                                                    : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-bl-sm backdrop-blur-md'
                                                }`}>
                                                {msg.content}
                                            </div>
                                            <div className={`flex items-center gap-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                                    {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </main>

                        {/* Sticky Pill-Shaped Input Area */}
                        <footer className="p-4 bg-white dark:bg-[#162725] border-t border-slate-200/50 dark:border-white/5 z-20">
                            <form onSubmit={handleSendReply} className="flex items-center gap-3 bg-slate-100 dark:bg-[#101822] rounded-full p-1.5 pl-4 ring-1 ring-slate-200 dark:ring-white/10 focus-within:ring-primary/50 focus-within:bg-white dark:focus-within:bg-[#152a28] transition-all shadow-inner">
                                <button type="button" className="text-slate-400 hover:text-primary transition-colors flex items-center">
                                    <span className="material-symbols-outlined text-[24px]">add_circle</span>
                                </button>
                                <input
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-200 placeholder-slate-400 text-sm py-2.5 font-medium outline-none"
                                    placeholder="Type your message..."
                                    type="text"
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                />
                                <div className="flex items-center gap-1 pr-1">
                                    <button type="button" className="text-slate-400 hover:text-primary transition-colors flex items-center p-2 rounded-full hidden sm:block">
                                        <span className="material-symbols-outlined text-[22px]">sentiment_satisfied</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim()}
                                        className="flex items-center justify-center w-10 md:w-12 h-10 md:h-12 bg-primary rounded-full text-[#102221] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none bg-gradient-to-tr from-primary to-[#00c9b7]"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                                    </button>
                                </div>
                            </form>
                        </footer>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-transparent border border-dashed border-slate-300 dark:border-white/10 rounded-[2rem]">
                        <div className="bg-primary/10 p-6 rounded-full text-primary mb-6 shadow-xl shadow-primary/5 border border-primary/20">
                            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 0" }}>chat_bubble_outline</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Your Messages</h3>
                        <p className="text-slate-500 font-medium mt-2 max-w-xs text-center">Select a conversation from the sidebar to view details and reply.</p>
                    </div>
                )}
            </div>

            {/* Bottom Nav Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#101822]/95 backdrop-blur-xl px-4 pb-safe pt-2 z-50 md:hidden">
                <div className="flex justify-between items-end py-2">
                    <Link to="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors group">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]">search</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Explore</p>
                    </Link>
                    <Link to="/saved" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors group">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]">favorite</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Saved</p>
                    </Link>
                    <Link to="/messages" className="flex flex-1 flex-col items-center justify-end gap-1 text-primary">
                        <div className="flex h-7 items-center justify-center relative">
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Messages</p>
                    </Link>
                    <Link to="/dashboard" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors group">
                        <div className="flex h-7 items-center justify-center group-hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="material-symbols-outlined text-[24px]">person</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-normal">Profile</p>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
