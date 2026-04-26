import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, CheckCircle2, ShieldCheck, Gamepad2, Star, Search } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { supabase } from '../supabaseClient';

const subCategoriesConfig = {
  games: [
    { id: 'all_games', name: 'All Games' },
    { id: 'freefire', name: 'Free Fire' },
    { id: 'pubg', name: 'PUBG Mobile' },
    { id: 'cod', name: 'CoD Mobile' },
    { id: 'coc', name: 'Clash of Clans' },
    { id: 'mlbb', name: 'Mobile Legends' },
  ],
  tiktok: [
    { id: 'all_tiktok', name: 'All TikTok' },
    { id: 'gaming', name: 'Gaming Niche' },
    { id: 'entertainment', name: 'Entertainment' },
  ],
  youtube: [
    { id: 'all_yt', name: 'All Channels' },
    { id: 'monetized', name: 'Monetized' },
    { id: 'vlog', name: 'Vlogging' },
  ],
  facebook: [
    { id: 'all_fb', name: 'All Pages' },
    { id: 'groups', name: 'Groups' },
    { id: 'fanpage', name: 'Fan Pages' },
  ],
  other: [
    { id: 'all_other', name: 'All Others' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'twitter', name: 'Twitter/X' },
  ]
};

const mainPlatforms = [
  { id: 'games', name: 'Games', icon: '🎮', color: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-pink-600/20 text-pink-400 border-pink-500/30' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'bg-red-600/20 text-red-400 border-red-500/30' },
  { id: 'facebook', name: 'FB Page', icon: '📘', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' },
  { id: 'other', name: 'Others', icon: '📦', color: 'bg-gray-600/20 text-gray-400 border-gray-500/30' },
];

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redirect Sellers to their dashboard
  useEffect(() => {
    const checkRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'seller') {
          navigate('/dashboard');
        }
      }
    };
    checkRedirect();
  }, [navigate]);
  const urlPlatform = searchParams.get('platform') || 'games';

  const [activePlatform, setActivePlatform] = useState(urlPlatform);
  const [activeTab, setActiveTab] = useState(subCategoriesConfig[urlPlatform]?.[0]?.id || 'all_games');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real listings from Supabase
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*, profiles:seller_id(username, full_name, avatar_url, is_online, rating, reviews)');

        if (error) throw error;

        const transformedData = (data || []).map(item => ({
          ...item,
          id: item.id || item.listing_id,
          seller: {
            name: item.profiles?.full_name || item.profiles?.username || 'Unknown Seller',
            avatar: item.profiles?.avatar_url,
            rating: item.profiles?.rating || '0.0',
            reviews: item.profiles?.reviews || 0,
            online: item.profiles?.is_online || false
          }
        }));

        setListings(transformedData);
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Sync state when URL changes from Header dropdown
  useEffect(() => {
    if (urlPlatform !== activePlatform) {
      setActivePlatform(urlPlatform);
      setActiveTab(subCategoriesConfig[urlPlatform]?.[0]?.id || 'all_games');
    }
  }, [urlPlatform, activePlatform]);

  // Handle platform change
  const handlePlatformChange = (id) => {
    setSearchParams({ platform: id });
  };

  // Calculate counts for subcategories based on current listings
  const currentSubTabs = useMemo(() => {
    const config = subCategoriesConfig[activePlatform] || subCategoriesConfig['games'];
    const platformListings = listings.filter(l => l.platform === activePlatform);
    
    return config.map(tab => {
      let count = 0;
      if (tab.id.startsWith('all_')) {
        count = platformListings.length;
      } else {
        count = platformListings.filter(l => l.subcategory === tab.id).length;
      }
      return { ...tab, count };
    });
  }, [listings, activePlatform]);

  const displayedAccounts = useMemo(() => {
    const searchQuery = searchParams.get('search')?.toLowerCase() || '';

    return listings.filter(acc => {
      // Search filter
      const searchMatch = searchQuery ? (
        acc.title?.toLowerCase().includes(searchQuery) ||
        acc.description?.toLowerCase().includes(searchQuery) ||
        acc.platform?.toLowerCase().includes(searchQuery) ||
        acc.subcategory?.toLowerCase().includes(searchQuery)
      ) : true;

      // Platform filter
      const platformMatch = acc.platform === activePlatform;
      
      // Tab/Subcategory filter
      let subMatch = true;
      if (!activeTab.startsWith('all_')) {
        subMatch = acc.subcategory === activeTab;
      }
      
      // Online filter
      const onlineMatch = onlineOnly ? acc.seller.online : true;
      
      return searchMatch && platformMatch && subMatch && onlineMatch;
    });
  }, [listings, activePlatform, activeTab, onlineOnly, searchParams]);

  return (
    <div className="pb-20">
      {/* Banner Section */}
      <div className="relative h-[250px] sm:h-[300px] w-full bg-[#0d1117] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 mix-blend-multiply border-b border-gray-800"></div>
        {/* Optimized Game Banner */}
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=60" 
          alt="Game Banner" 
          className="w-full h-full object-cover opacity-50 transition-opacity duration-1000"
          onLoad={(e) => e.target.style.opacity = 0.6}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 lg:p-10 container mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-2xl">
            Premium Digital <span className="text-primary">Assets</span>
          </h1>
          <p className="text-gray-200 text-base md:text-lg max-w-2xl mx-auto drop-shadow-md font-medium">
            The safest marketplace to buy and sell premium Games, TikTok, YouTube, Facebook, and other social accounts.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 mt-6">
        
        {/* Main Platform Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {mainPlatforms.map((platform) => (
            <button 
              key={platform.id}
              onClick={() => handlePlatformChange(platform.id)}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                activePlatform === platform.id 
                  ? `${platform.color} border-opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.2)] scale-[1.02]` 
                  : 'bg-card border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              }`}
            >
              <span className="text-xl">{platform.icon}</span>
              <span className="font-semibold">{platform.name}</span>
            </button>
          ))}
        </div>
        
        {/* Category Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-card/60 p-2 rounded-xl border border-gray-800">
          {currentSubTabs.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === cat.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {cat.name} 
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === cat.id ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${onlineOnly ? 'bg-primary' : 'bg-gray-700'}`}>
              <div className={`absolute left-1 top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${onlineOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Online seller</span>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={onlineOnly}
              onChange={() => setOnlineOnly(!onlineOnly)}
            />
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <button className="w-full sm:w-48 flex items-center justify-between bg-card border border-gray-700/50 px-4 py-2 text-sm rounded-lg hover:border-gray-600 transition-colors">
                <span>Newest</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            </div>
            <button className="flex items-center gap-2 bg-card border border-gray-700/50 px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Search Results Indicator */}
        {searchParams.get('search') && (
          <div className="mb-6 flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-xl">
             <div className="flex items-center gap-2">
               <Search className="w-4 h-4 text-primary" />
               <span className="text-sm font-bold text-white">
                 Search results for: <span className="text-primary italic">"{searchParams.get('search')}"</span>
               </span>
             </div>
             <button 
               onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('search');
                  setSearchParams(newParams);
               }}
               className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
             >
               Clear Search
             </button>
          </div>
        )}

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {displayedAccounts.length > 0 ? displayedAccounts.map((account, index) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              key={account.id}
            >
              <AccountCard account={account} />
            </motion.div>
          )) : (
            <div className="col-span-full py-12 flex justify-center items-center text-gray-500">
              No accounts match the current filters.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home;
