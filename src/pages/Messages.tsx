import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Messages() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [selectedThread, setSelectedThread] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchMessages = async () => {
        setLoading(true);
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

            // Mark fetched received messages as read
            const unread = received.filter((m: any) => !m.read && m.id);
            for (const msg of unread) {
                axios.put(`/api/v1/messages/${msg.id}/read`, {}, { headers }).catch(console.warn);
            }

            const allMessages = [...received, ...sent].sort((a, b) => {
                const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
                const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
                return dateA - dateB; // Ascending
            });

            setMessages(allMessages);
        } catch (err) {
            console.error("Failed to fetch messages", err);
            setError("Could not load messages.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || !selectedThread) return;

        try {
            const token = localStorage.getItem('accessToken');
            const threadMessages = messages.filter(m => (m.propertyId || 'general') === selectedThread);
            // Find who to reply to: if I am the sender of the last msg, I reply to its recipient. else I reply to its sender.
            const lastMsg = threadMessages[threadMessages.length - 1];

            // We need to figure out my user id.
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
            fetchMessages(); // refresh
        } catch (err) {
            console.error("Failed to send message", err);
            toast.error("Failed to send message.");
        }
    };

    // Group messages by propertyId or a generic thread
    const threads = messages.reduce((acc, msg) => {
        const key = msg.propertyId || 'general';
        if (!acc[key]) acc[key] = [];
        acc[key].push(msg);
        return acc;
    }, {} as Record<string, any[]>);

    const threadKeys = Object.keys(threads);

    // Auto-select first thread if none selected
    useEffect(() => {
        if (!selectedThread && threadKeys.length > 0) {
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

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-white dark:bg-slate-950 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">GetSet</h1>
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Explore</Link>
                        <Link to="/saved" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Saved</Link>
                        <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Dashboard</Link>
                        <Link to="/messages" className="text-sm font-semibold text-primary">Messages</Link>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-0 md:px-8 py-20 md:py-24">
                <div className="max-w-7xl mx-auto w-full h-[calc(100vh-140px)] flex bg-slate-50 dark:bg-slate-900 rounded-none md:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    {/* Sidebar / Threads List */}
                    <div className={`${selectedThread && window.innerWidth < 768 ? 'hidden' : 'block'} w-full md:w-1/3 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2027] flex flex-col`}>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Conversations</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading && threadKeys.length === 0 ? (
                                <div className="p-4 flex flex-col gap-4 animate-pulse-subtle">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex flex-col gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="flex justify-between items-center">
                                                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                                <div className="h-3 w-1/5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                            </div>
                                            <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : threadKeys.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No messages yet.</div>
                            ) : (
                                threadKeys.map(key => {
                                    const threadMsgs = threads[key];
                                    const lastMsg = threadMsgs[threadMsgs.length - 1];
                                    const isUnread = threadMsgs.some((m: any) => !m.read && m.recipientId === myId);

                                    return (
                                        <div
                                            key={key}
                                            onClick={() => setSelectedThread(key)}
                                            className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${selectedThread === key ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`font-semibold truncate pr-2 ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>Property #{key.substring(0, 8)}</h3>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                    {new Date(lastMsg.createdAt || lastMsg.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate ${isUnread ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {lastMsg.senderId === myId ? 'You: ' : ''}{lastMsg.content}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    {selectedThread ? (
                        <div className={`${!selectedThread && window.innerWidth < 768 ? 'hidden' : 'flex'} flex-1 flex-col bg-slate-50 dark:bg-slate-950/50`}>
                            {/* Chat Header */}
                            <div className="p-4 bg-white dark:bg-[#1c2027] border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm z-10">
                                <button className="md:hidden text-slate-500" onClick={() => setSelectedThread(null)}>
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDbm1mjiGK-x4or6tl-FBZFZLkg3reh90FPR19WI22cVbOBmCNj1N0zWHqmEQKq2yEn0b0nxU7wpXLW2V18eaCL90QSqsKsnzWdBlWCxbNHbBmmFytNOhAiiS4f8URhD7MJ7b2ulpT4TYQ7QuU5F2Nc9sJAIq4cJPcOtomtBySJoVaXaDcTG3AwnvhAvOhsJ3hI5NqVYkBAVq4HXBftXrnAUqjdaC_z_Q8ALXogfige7Pl0vb321NtEx-XfMUBUpikCrpzxNpPlvgst")' }}></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Property #{selectedThread.substring(0, 8)}</h3>
                                    <p className="text-xs text-emerald-500">Active</p>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                                {threads[selectedThread]?.map((msg: any, i: number) => {
                                    const isMe = msg.senderId === myId;
                                    return (
                                        <div key={msg.id || i} className={`flex max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                                            <div className={`p-3 rounded-2xl ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white dark:bg-[#1c2027] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-sm shadow-sm'}`}>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-100/70' : 'text-slate-400'} text-right`}>
                                                    {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white dark:bg-[#1c2027] border-t border-slate-200 dark:border-slate-800">
                                <form onSubmit={handleSendReply} className="flex gap-2 relative">
                                    <input
                                        type="text"
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim()}
                                        className="absolute right-1 top-1 bottom-1 aspect-square flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[20px] ml-1">send</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50">
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">chat</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select a conversation</h3>
                            <p className="text-slate-500 dark:text-slate-400">Choose a thread from the left to view messages.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Nav Mobile */}
            <div className="fixed bottom-0 z-20 w-full border-t border-slate-200 bg-white px-4 pb-safe pt-2 dark:border-slate-800 dark:bg-[#1c2027] md:hidden">
                <div className="flex items-center justify-around py-2">
                    <Link to="/" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
                        <span className="text-[10px] font-medium">Explore</span>
                    </Link>
                    <Link to="/saved" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
                        <span className="text-[10px] font-medium">Saved</span>
                    </Link>
                    <Link to="/messages" className="flex flex-col items-center justify-center gap-1 text-primary cursor-pointer">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                        <span className="text-[10px] font-bold">Messages</span>
                    </Link>
                    <Link to="/dashboard" className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
