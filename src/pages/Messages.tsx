import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.id || '';
    } catch { return ''; }
  })();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return null; }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers) return;
    axios.get('/api/v1/messages/conversations', { headers })
      .then(res => setConversations(res.data || []))
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false));
  }, []);

  const loadThread = async (conv: any) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    setActiveThread(conv);
    try {
      const res = await axios.get(`/api/v1/messages/thread/${conv.threadId}`, { headers });
      setMessages(res.data || []);
      // Mark as read
      await axios.put('/api/v1/messages/read-all', {}, { headers }).catch(() => {});
      // Update conversations to clear unread
      setConversations(prev => prev.map(c => c.threadId === conv.threadId ? { ...c, unreadCount: 0 } : c));
    } catch { toast.error('Failed to load messages'); }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    setSending(true);
    try {
      const res = await axios.post('/api/v1/messages', {
        recipientId: activeThread.otherUserId,
        content: newMessage.trim(),
        threadId: activeThread.threadId,
        propertyId: activeThread.propertyId,
      }, { headers });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch { toast.error('Failed to send message'); }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`${activeThread ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark shrink-0`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="size-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="font-black text-xl tracking-tight">Messages</h1>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-1 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl animate-pulse">
                  <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700">chat_bubble_outline</span>
              <h3 className="font-bold text-lg">No conversations yet</h3>
              <p className="text-sm text-slate-500">Start a conversation by contacting a property owner</p>
              <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/25">Browse Properties</button>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = activeThread?.threadId === conv.threadId;
              return (
                <button key={conv.threadId} onClick={() => loadThread(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left ${isActive ? 'bg-primary/5 dark:bg-primary/10 border-r-2 border-primary' : ''}`}>
                  <div className="size-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-black text-lg shrink-0 border-2 border-primary/20">
                    {(conv.otherUserName || conv.otherUserId || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-bold text-sm truncate ${isActive ? 'text-primary' : ''}`}>{conv.otherUserName || 'User'}</span>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate">{conv.lastMessage || 'Tap to view conversation'}</p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 shrink-0 size-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">{conv.unreadCount}</span>
                      )}
                    </div>
                    {conv.propertyTitle && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">home</span>{conv.propertyTitle}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread View */}
      <div className={`${!activeThread ? 'hidden md:flex' : 'flex'} flex-col flex-1 min-w-0`}>
        {!activeThread ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-primary">forum</span>
            </div>
            <h2 className="text-xl font-black">Select a conversation</h2>
            <p className="text-slate-500 text-sm">Choose a conversation from the left to start chatting</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-background-dark">
              <button onClick={() => setActiveThread(null)} className="md:hidden size-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-600">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-black text-lg border-2 border-primary/20">
                {(activeThread.otherUserName || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{activeThread.otherUserName || 'User'}</h3>
                {activeThread.propertyTitle && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <span className="material-symbols-outlined text-[10px]">home</span>{activeThread.propertyTitle}
                  </p>
                )}
              </div>
              {activeThread.propertyId && (
                <button onClick={() => navigate(`/properties/${activeThread.propertyId}`)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span className="hidden sm:block">View Property</span>
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-background-dark/50">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">No messages yet. Say hello!</div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isMine
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white dark:bg-white/10 text-slate-900 dark:text-slate-100 rounded-bl-sm'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70 text-right' : 'text-slate-400'}`}>{formatTime(msg.sentAt || msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-white/10">
              <div className="flex items-end gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent outline-none resize-none text-sm font-medium max-h-32 leading-relaxed"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                  className="size-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100">
                  {sending
                    ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-xl">send</span>
                  }
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
