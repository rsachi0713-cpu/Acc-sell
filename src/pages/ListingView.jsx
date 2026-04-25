import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Star, ShieldAlert, Cpu, Globe, CheckCircle2, MessageSquare, ShoppingCart, Clock, ChevronRight } from 'lucide-react';

const ListingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Parse details from seed ID if possible (e.g. games-pubg-1), otherwise use defaults
  const platformStr = id?.split('-')[0] || 'Asset';
  const capPlatform = platformStr.charAt(0).toUpperCase() + platformStr.slice(1);
  const subCategoryStr = id?.split('-')[1] || 'Premium';
  const capSubCategory = subCategoryStr.charAt(0).toUpperCase() + subCategoryStr.slice(1);

  // Generate a mock gallery of images based on the ID
  const gallery = Array(6).fill(0).map((_, i) => `https://picsum.photos/seed/${id}${i}/800/450`);
  const [activeImage, setActiveImage] = useState(gallery[0]);

  // Mock data simulation based on ID, wrapped in useMemo so it doesn't change on re-render
  const item = useMemo(() => {
    return {
      id,
      title: `${capPlatform} Premium Account | Max Level | Exclusive Access`,
      price: (Math.random() * 450 + 15).toFixed(2),
      type: 'Full Access',
      server: 'Global',
      description: `This is a highly sought-after digital asset. It comes fully equipped with all verified credentials. You will receive full original email access, completely unlinked from any social networks.\n\n• Instant Delivery via Email\n• Lifetime warranty against pullbacks\n• 100% clean history, no bans or shadowbans\n\nTake advantage of this limited-time offer. Once bought, details are transferred directly to you.`,
      thumbnail: `https://picsum.photos/seed/${id}/800/450`,
      seller: {
        name: 'PremiumAccs',
        rating: 4.8,
        reviews: 429,
        joined: '2023',
        online: true,
        avatar: `https://ui-avatars.com/api/?name=PremiumAccs&background=1e293b&color=fff`
      }
    };
  }, [id, capPlatform]);

  useEffect(() => {
    // Simulate network fetch
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-10 max-w-7xl">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to listings
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
          <span className="hover:text-gray-300 cursor-pointer transition-colors">Marketplace</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-gray-300 cursor-pointer transition-colors">{capPlatform}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-300">{capSubCategory}</span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
          {item.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
        
        {/* Left Column - Gallery & Description */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Image View */}
          <div className="bg-black aspect-video rounded-xl overflow-hidden relative border border-gray-800 shadow-2xl">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Available
            </div>
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={activeImage} 
                alt="Main preview" 
                className="w-full h-full object-contain bg-black"
              />
            </AnimatePresence>
          </div>

          {/* Thumbnails Row */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {gallery.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`flex-shrink-0 w-32 md:w-40 aspect-video rounded-md overflow-hidden relative border-2 transition-all ${
                  activeImage === img ? 'border-primary ring-2 ring-primary/30 opacity-100 scale-[1.02]' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Description Block */}
          <div className="glass-panel p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Description</h3>
            <div className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {item.description}
            </div>
          </div>
        </div>

        {/* Right Column - Buy Box & Seller Info */}
        <div className="space-y-6">
          <div
            className="glass-panel p-6 border-t-4 border-t-primary relative overflow-hidden sticky top-24"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <ShoppingCart className="w-32 h-32" />
            </div>
            
            <div className="flex items-end gap-2 mb-6 border-b border-gray-800 pb-6">
              <span className="text-4xl font-extrabold text-white">${item.price}</span>
              <span className="text-gray-400 mb-1">USD</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-[#0f111a] p-3 rounded-xl border border-gray-700/50">
                <span className="text-gray-500 text-xs flex items-center gap-1.5 mb-1"><Globe className="w-3.5 h-3.5"/> Server</span>
                <span className="text-gray-200 font-semibold">{item.server}</span>
              </div>
              <div className="bg-[#0f111a] p-3 rounded-xl border border-gray-700/50">
                <span className="text-gray-500 text-xs flex items-center gap-1.5 mb-1"><Cpu className="w-3.5 h-3.5"/> Access</span>
                <span className="text-gray-200 font-semibold">{item.type}</span>
              </div>
              <div className="col-span-2 bg-[#0f111a] p-3 rounded-xl border border-gray-700/50 flex items-center justify-between">
                <span className="text-gray-500 text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Delivery Time</span>
                <span className="text-green-400 font-semibold text-xs bg-green-400/10 px-2 py-0.5 rounded">Instant</span>
              </div>
            </div>

            <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mb-3 active:scale-[0.98]">
               <ShoppingCart className="w-5 h-5"/> Buy Now
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-green-400">
               <ShieldCheck className="w-4 h-4"/> 100% Safe Checkout Guaranteed
            </div>
          </div>

          <div
            className="glass-panel p-6"
          >
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">About the Seller</h3>
            <div className="flex items-start gap-4 mb-5">
              <div className="relative">
                <img src={item.seller.avatar} alt={item.seller.name} className="w-12 h-12 rounded-full border-2 border-gray-700" />
                {item.seller.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#12141d] rounded-full"></div>
                )}
              </div>
              <div>
                <h4 className="text-white font-bold flex items-center gap-1">{item.seller.name} <CheckCircle2 className="w-4 h-4 text-primary" /></h4>
                <div className="flex items-center gap-1.5 text-sm text-yellow-500 font-medium">
                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                  {item.seller.rating} <span className="text-gray-500 font-normal">({item.seller.reviews} sales)</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Joined {item.seller.joined}</div>
              </div>
            </div>

            <button className="w-full bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
               <MessageSquare className="w-4 h-4"/> Message Seller
            </button>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
              <button className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                <ShieldAlert className="w-3.5 h-3.5" /> Report this listing
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ListingView;
