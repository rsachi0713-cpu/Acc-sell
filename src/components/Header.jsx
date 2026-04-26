import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, ChevronDown, User as UserIcon, LogIn, Menu, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Header = () => {
  const [user, setUser] = useState(null);

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
          
          <Link to="/sell" className="hidden md:flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-md text-sm transition-colors">
            <Plus className="w-4 h-4" /> Sell
          </Link>

          {user ? (
            <Link to="/profile" className="hidden md:flex items-center gap-2 hover:bg-gray-800/50 p-1.5 pr-4 rounded-full transition-colors border border-gray-700/50 ml-2">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-primary/50"
                  onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + (user.user_metadata?.full_name || 'User') + "&background=2563eb&color=fff"}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-white font-bold uppercase text-xs">
                  {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : user.email.charAt(0)}
                </div>
              )}
              <span className="text-gray-200 text-sm hidden lg:block">
                {user.user_metadata?.full_name || 'My Profile'}
              </span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden md:flex hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-gray-800/50">
                Login
              </Link>
              <Link to="/register" className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-md flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
                Register
              </Link>
            </>
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
