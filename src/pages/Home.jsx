import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, CheckCircle2, ShieldCheck, Gamepad2, Star } from 'lucide-react';
import AccountCard from '../components/AccountCard';

const subCategoriesConfig = {
  games: [
    { id: 'all_games', name: 'All Games', count: 420 },
    { id: 'freefire', name: 'Free Fire', count: 124 },
    { id: 'pubg', name: 'PUBG Mobile', count: 85 },
    { id: 'cod', name: 'CoD Mobile', count: 62 },
    { id: 'coc', name: 'Clash of Clans', count: 45 },
    { id: 'mlbb', name: 'Mobile Legends', count: 38 },
  ],
  tiktok: [
    { id: 'all_tiktok', name: 'All TikTok', count: 156 },
    { id: 'gaming', name: 'Gaming Niche', count: 45 },
    { id: 'entertainment', name: 'Entertainment', count: 82 },
  ],
  youtube: [
    { id: 'all_yt', name: 'All Channels', count: 98 },
    { id: 'monetized', name: 'Monetized', count: 41 },
    { id: 'vlog', name: 'Vlogging', count: 39 },
  ],
  facebook: [
    { id: 'all_fb', name: 'All Pages', count: 87 },
    { id: 'groups', name: 'Groups', count: 32 },
    { id: 'fanpage', name: 'Fan Pages', count: 55 },
  ],
  other: [
    { id: 'all_other', name: 'All Others', count: 45 },
    { id: 'instagram', name: 'Instagram', count: 22 },
    { id: 'twitter', name: 'Twitter/X', count: 14 },
  ]
};

const mainPlatforms = [
  { id: 'games', name: 'Games', icon: '🎮', color: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-pink-600/20 text-pink-400 border-pink-500/30' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'bg-red-600/20 text-red-400 border-red-500/30' },
  { id: 'facebook', name: 'FB Page', icon: '📘', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' },
  { id: 'other', name: 'Others', icon: '📦', color: 'bg-gray-600/20 text-gray-400 border-gray-500/30' },
];

const generateMockData = (platform, tab, onlineFilter) => {
  const titles = {
    games: {
      freefire: ["Free Fire | Max Level | Rare Bundles + 15k Diamonds", "FF Account | Cobra MP40 | V Badge", "Free Fire Indonesia | Vault 200+"],
      pubg: ["PUBG Mobile | Conqueror Rank | Glacier M4 Max", "PUBG Global | Mythic Fashion | 60+ Suits", "PUBG Mobile | Rare X-Suits | Level 80"],
      cod: ["CoD Mobile | Damascus Camo | Mythic DLQ", "CODM | Legendary Characters | 15+ Legendaries"],
      coc: ["Clash of Clans | TH15 Max | 10k Gems", "CoC | TH14 | High Hero Levels | Built Base"],
      mlbb: ["Mobile Legends | Mythic Glory | 250 Skins", "MLBB | All Assassins | Collector Skins Max"],
      all_games: []
    },
    tiktok: {
      gaming: ["TikTok | 150k Followers | Gaming Niche | Highly Active", "TikTok | 50k Subs | eSports Highlight"],
      entertainment: ["TikTok | 1M Followers | Comedy/Entertainment", "TikTok Viral Account | 20M+ Likes"],
      all_tiktok: []
    },
    youtube: {
      monetized: ["YouTube | Monetized | 10k Subs | No Strikes", "Monetized YT Channel | Organic 50k Subs"],
      vlog: ["YouTube | 100k Subs | Daily Vlogs | Silver Play Button", "Vlogging Channel | Travel Niche 20k"],
      all_yt: []
    },
    facebook: {
      groups: ["FB Group | 500k Members | Anime Niche", "Active Facebook Group | 1M+ Members"],
      fanpage: ["FB Page | 1M Likes | Entertainment & Media", "Verified FB Page | Blue Badge Status"],
      all_fb: []
    },
    other: {
      instagram: ["Instagram | 500k Followers | Verified Blue Tick", "IG Account | 100k Organic | Fashion Niche"],
      twitter: ["Twitter/X | Premium | 50k Followers | Active", "X Account | Crypto Niche | 100k Followers"],
      all_other: []
    }
  };

  let availableTitles = [];
  if (tab.startsWith('all_') && titles[platform]) {
    Object.keys(titles[platform]).forEach(key => {
      availableTitles.push(...titles[platform][key]);
    });
  } else if (titles[platform] && titles[platform][tab]) {
    availableTitles = titles[platform][tab];
  }
  
  if (availableTitles.length === 0) {
     availableTitles = [`Premium ${platform} Asset | High Value`];
  }

  return Array(12).fill(0).map((_, i) => {
    const isOnline = Math.random() > 0.4;
    return {
      id: `${platform}-${tab}-${i}`,
      title: availableTitles[Math.floor(Math.random() * availableTitles.length)],
      price: (Math.random() * 450 + 15).toFixed(2),
      type: ['Full Access', 'Account', 'Verified Page'][Math.floor(Math.random() * 3)],
      server: ['Global', 'US', 'Asia', 'Europe', 'Indonesia'][Math.floor(Math.random() * 5)],
      seller: {
        name: ['GameNews', 'SocialKing', 'PremiumAccs', 'VerifiedSeller'][Math.floor(Math.random() * 4)],
        rating: (Math.random() * 0.5 + 4.5).toFixed(1),
        reviews: Math.floor(Math.random() * 1000) + 10,
        online: isOnline
      },
      thumbnail: `https://picsum.photos/seed/${platform}${tab}${i}/400/225`
    };
  }).filter(acc => onlineFilter ? acc.seller.online : true);
};

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPlatform = searchParams.get('platform') || 'games';

  const [activePlatform, setActivePlatform] = useState(urlPlatform);
  const [activeTab, setActiveTab] = useState(subCategoriesConfig[urlPlatform]?.[0]?.id || 'all_games');
  const [onlineOnly, setOnlineOnly] = useState(false);

  // Sync state when URL changes from Header dropdown
  useEffect(() => {
    if (urlPlatform !== activePlatform) {
      setActivePlatform(urlPlatform);
      setActiveTab(subCategoriesConfig[urlPlatform]?.[0]?.id || 'all_games');
    }
  }, [urlPlatform, activePlatform]);

  // When platform changes, we should ideally reset the active tab. For simplicity in render:
  const currentSubTabs = subCategoriesConfig[activePlatform] || subCategoriesConfig['games'];

  // Handle platform change
  const handlePlatformChange = (id) => {
    setSearchParams({ platform: id });
    // URL change triggers the useEffect
  };

  const displayedAccounts = useMemo(() => {
    return generateMockData(activePlatform, activeTab, onlineOnly);
  }, [activePlatform, activeTab, onlineOnly]);

  return (
    <div className="pb-20">
      {/* Banner Section */}
      <div className="relative h-[250px] sm:h-[300px] w-full bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 mix-blend-multiply"></div>
        {/* Placeholder for Game Banner */}
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
          alt="Game Banner" 
          className="w-full h-full object-cover opacity-60"
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
