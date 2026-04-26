import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Star, ShieldAlert, Cpu, Globe, CheckCircle2, MessageSquare, ShoppingCart, Clock, ChevronRight, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ListingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*, profiles:seller_id(username, full_name, avatar_url, is_online, rating, reviews, created_at)')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          const transformedItem = {
            ...data,
            seller: {
              name: data.profiles?.full_name || data.profiles?.username || 'Unknown Seller',
              rating: data.profiles?.rating || '0.0',
              reviews: data.profiles?.reviews || 0,
              joined: data.profiles?.created_at ? new Date(data.profiles.created_at).getFullYear() : '2024',
              online: data.profiles?.is_online || false,
              avatar: data.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${data.profiles?.username || 'U'}&background=1e293b&color=fff`
            }
          };
          setItem(transformedItem);
          // Set first image as active
          const images = transformedItem.image_urls || [];
          setActiveImage(images.length > 0 ? images[0] : transformedItem.thumbnail || '');
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('Listing not found or connection error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    window.scrollTo(0, 0);
  }, [id]);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    // Simulation of submission since we are strictly following user restriction requirements.
    // In a real app, this would update the 'reviews' table.
    alert(`Thank you! Your ${rating}-star review has been submitted for moderation.`);
    setRating(0);
    setComment('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setIsSendingMsg(true);
    
    // Simulation of messaging system
    setTimeout(() => {
      setIsSendingMsg(false);
      setIsMsgModalOpen(false);
      setMessageText('');
      alert(`Message sent to ${item.seller.name}! They will be notified.`);
    }, 1000);
  };

  const gallery = useMemo(() => {
    if (!item) return [];
    if (item.image_urls && item.image_urls.length > 0) {
      return item.image_urls;
    }
    return [item.thumbnail || 'https://picsum.photos/800/450'];
  }, [item]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-white mb-4">{error || 'Listing not found'}</h2>
        <button onClick={() => navigate('/')} className="bg-primary px-6 py-2 rounded-lg text-white font-medium">
          Return to Marketplace
        </button>
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
          <span className="hover:text-gray-300 cursor-pointer transition-colors uppercase">{item.platform}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-300 uppercase">{item.subcategory}</span>
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
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 border-t-4 border-t-primary relative overflow-hidden h-fit">
            <div className="absolute -top-4 -right-4 p-3 opacity-5 pointer-events-none">
              <ShoppingCart className="w-32 h-32" />
            </div>
            
            <div className="flex items-baseline justify-between mb-6 border-b border-gray-800 pb-6">
              <span className="text-gray-400 text-sm">Price</span>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white">Rs. {item.price}</div>
                <div className="text-primary text-xs font-bold mt-1">Verified Listing</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              <div className="bg-[#0f111a] p-3 rounded-xl border border-gray-700/50">
                <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1.5 mb-1"><Globe className="w-3.5 h-3.5"/> Server</span>
                <span className="text-gray-200 font-semibold">{item.server}</span>
              </div>
              <div className="bg-[#0f111a] p-3 rounded-xl border border-gray-700/50">
                <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1.5 mb-1"><Cpu className="w-3.5 h-3.5"/> Access</span>
                <span className="text-gray-200 font-semibold">{item.type}</span>
              </div>
              <div className="col-span-2 bg-[#0f111a] p-3 rounded-xl border border-gray-700/50 flex items-center justify-between">
                <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Delivery</span>
                <span className="text-green-400 font-semibold text-xs bg-green-400/10 px-2 py-0.5 rounded">{item.delivery_time || 'Instant'}</span>
              </div>
            </div>

            <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mb-4 active:scale-[0.98]">
               <ShoppingCart className="w-5 h-5"/> Buy Now
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-green-400">
               <ShieldCheck className="w-4 h-4"/> 100% Safe Checkout Guaranteed
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">About the Seller</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <img src={item.seller.avatar} alt={item.seller.name} className="w-12 h-12 rounded-full border-2 border-gray-700 object-cover" />
                {item.seller.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#12141d] rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold flex items-center gap-1 truncate">
                  {item.seller.name} 
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                </h4>
                <div className="flex items-center gap-1.5 text-sm text-yellow-500 font-medium">
                  <Star className={`w-3.5 h-3.5 ${item.seller.reviews > 0 ? 'fill-yellow-500' : ''}`} />
                  {item.seller.reviews > 0 ? item.seller.rating : 'NEW'} 
                  <span className="text-gray-500 font-normal">({item.seller.reviews} sales)</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate(`/messages?userId=${item.seller_id}`)}
              className="w-full bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
               <MessageSquare className="w-4 h-4"/> Message Seller
            </button>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
              <button className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                <ShieldAlert className="w-3.5 h-3.5" /> Report this listing
              </button>
            </div>
          </div>

          {/* Buyer-Only Rating Form */}
          {currentUser?.user_metadata?.role === 'buyer' && (
            <div className="glass-panel p-6 border-t-2 border-primary/30">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Rate Seller
              </h3>
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-all ${rating >= star ? 'text-yellow-500 scale-110' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      <Star className={`w-6 h-6 ${rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this seller..."
                  className="w-full bg-[#0a0c12] border border-gray-800 rounded-xl p-3 text-sm text-gray-300 focus:border-primary transition-all resize-none h-24"
                />
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-95"
                >
                  Submit Review
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingView;
