import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Globe, ChevronDown, User as UserIcon, LogIn, Menu, Plus, ShieldCheck, LogOut, MessageSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { pathname } = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminContext = pathname.includes('admin') || searchParams.get('admin') === 'true';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0d0f17]/90 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            AccMarket<span className="text-primary">.gg</span>
          </span>
        </div>

        {/* Global Search and Category */}
        <div className="hidden md:flex flex-1 items-center justify-center px-8">
          <div className="flex w-full max-w-xl bg-card border border-gray-700/50 rounded-full h-10 focus-within:border-primary transition-colors relative z-50">
            <div className="relative group h-full">
              <button className="flex items-center h-full gap-2 px-4 bg-gray-800/50 hover:bg-gray-800 text-sm font-medium border-r border-gray-700/50 rounded-l-full">
                Categories <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </button>
              
              {/* Dropdown Menu */}
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-xs font-bold text-gray-300">LKR</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>
          
          {user && user.user_metadata?.role === 'seller' && (
            <Link to="/sell" className="hidden md:flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-md text-sm transition-colors">
              <Plus className="w-4 h-4" /> Sell
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/messages" 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all relative group"
                title="Messages"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-[#0a0c12] opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
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
