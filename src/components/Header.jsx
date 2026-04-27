import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Globe, ChevronDown, User as UserIcon, LogIn, Menu, Plus, ShieldCheck, LogOut, MessageSquare, DollarSign, Bell, X, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useCurrency } from '../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { currency, setCurrency } = useCurrency();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { pathname } = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminContext = pathname.includes('admin') || searchParams.get('admin') === 'true';

  // --- Notification State ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null;
      setUser(u);
      if (u) loadNotifications(u.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) loadNotifications(u.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifications(data);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotifClick = async (notif) => {
    // Mark as read
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    setShowNotifs(false);
    if (notif.link) navigate(notif.link);
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type) => {
    const icons = {
      order: '🛒',
      comment: '💬',
      reply: '↩️',
      payment: '💳',
      system: '📢',
      seller: '🏷️',
    };
    return icons[type] || '🔔';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d0f17]/90 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            Acc<span className="text-primary"> Zone</span>
          </span>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex flex-1 items-center justify-center px-8">
          <div className="flex w-full max-w-xl bg-card border border-gray-700/50 rounded-full h-10 focus-within:border-primary transition-colors relative z-50">
            <div className="relative group h-full">
              <button className="flex items-center h-full gap-2 px-4 bg-gray-800/50 hover:bg-gray-800 text-sm font-medium border-r border-gray-700/50 rounded-l-full">
                Categories <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-[calc(100%+0.5rem)] left-0 w-48 bg-card border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1 overflow-hidden">
                <Link to="/?platform=games" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-primary/20 transition-colors">🎮 Games</Link>
                <Link to="/?platform=tiktok" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-primary/20 transition-colors">🎵 TikTok</Link>
                <Link to="/?platform=youtube" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-primary/20 transition-colors">▶️ YouTube</Link>
                <Link to="/?platform=facebook" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-primary/20 transition-colors">📘 FB Page</Link>
                <Link to="/?platform=other" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-primary/20 transition-colors">📦 Other Accounts</Link>
              </div>
            </div>
            <div className="flex-1 flex items-center px-3 bg-transparent rounded-r-full overflow-hidden">
              <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
                  }
                }}
                placeholder="Search offers, accounts, items..." 
                className="w-full h-full bg-transparent text-sm focus:outline-none text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-4 text-sm font-medium text-gray-300">
          {/* Currency Switcher */}
          <div className="relative group/curr">
             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700/50">
               <DollarSign className={`w-3.5 h-3.5 ${currency === 'USD' ? 'text-primary' : 'text-gray-500'}`} />
               <span className="text-xs font-bold text-gray-300 uppercase shrink-0">{currency}</span>
               <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
             </button>
             <div className="absolute top-full right-0 mt-2 w-24 bg-[#0d0f17] border border-gray-800 rounded-xl overflow-hidden opacity-0 invisible group-hover/curr:opacity-100 group-hover/curr:visible transition-all z-50 shadow-2xl">
                <button onClick={() => setCurrency('LKR')} className={`w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-gray-800 transition-colors ${currency === 'LKR' ? 'text-primary bg-primary/5' : 'text-gray-400'}`}>LKR</button>
                <button onClick={() => setCurrency('USD')} className={`w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-gray-800 transition-colors ${currency === 'USD' ? 'text-primary bg-primary/5' : 'text-gray-400'}`}>USD</button>
             </div>
          </div>

          {/* Sell Button */}
          {user && user.user_metadata?.role === 'seller' && (
            <Link to="/sell" className="hidden md:flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-md text-sm transition-colors">
              <Plus className="w-4 h-4" /> Sell
            </Link>
          )}

          {/* 🔔 Notification Bell */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(prev => !prev)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-primary/50 hover:bg-gray-800 transition-all"
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-primary animate-pulse' : 'text-gray-400'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-[#0d0f17]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+0.75rem)] w-80 bg-[#0f111a] border border-gray-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-[100]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a0c12]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        <span className="text-sm font-black text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase">{unreadCount} new</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-black text-gray-500 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wide">
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10">
                          <Bell className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                          <p className="text-xs text-gray-600 font-medium">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 group ${!notif.is_read ? 'bg-primary/5' : ''}`}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-relaxed ${notif.is_read ? 'text-gray-400' : 'text-gray-200 font-semibold'}`}>
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-gray-600 mt-1">{formatTimestamp(notif.created_at)}</p>
                            </div>
                            {!notif.is_read && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to={user.user_metadata?.role === 'admin' ? "/admin" : (user.user_metadata?.role === 'seller' ? "/dashboard" : "/profile")} 
                className={`flex items-center gap-3 p-1 pr-4 rounded-full transition-all border border-gray-700/50 hover:border-primary/50 bg-gray-800/20 group`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 group-hover:border-primary/50 transition-colors shadow-lg">
                  <img 
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'U'}&background=0ea5e9&color=fff`} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || 'U'}&background=0ea5e9&color=fff`;
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {user.user_metadata?.full_name || 'My Account'}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${user.user_metadata?.role === 'admin' ? 'text-red-500' : 'text-primary'}`}>
                    {user.user_metadata?.role || 'authorized'}
                  </span>
                </div>
              </Link>
              
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group"
                title="Logout Account"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95">
                Join Now
              </Link>
            </div>
          )}
          
          <button className="md:hidden p-2 text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
