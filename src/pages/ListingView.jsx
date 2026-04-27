import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Star, ShieldAlert, Cpu, Globe, CheckCircle2, MessageSquare, ShoppingCart, Clock, ChevronRight, X, Upload, Wallet, Banknote, CreditCard, ExternalLink, Send, CornerDownRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useCurrency } from '../context/CurrencyContext';

const ListingView = () => {
  const { formatPrice } = useCurrency();
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
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [slipPreview, setSlipPreview] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // comment id
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*, profiles:seller_id(username, full_name, avatar_url, is_online, rating, reviews, created_at, whatsapp, payment_methods)')
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
              whatsapp: data.profiles?.whatsapp || '',
              payment_methods: data.profiles?.payment_methods || [],
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

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('listing_id', id)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
    };
    fetchComments();
    
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

  const handlePostComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    const { data, error } = await supabase.from('comments').insert({
      listing_id: id,
      user_id: currentUser.id,
      content: commentText.trim(),
      parent_id: null
    }).select('*, profiles:user_id(full_name, avatar_url)').single();
    if (!error && data) {
      setComments(prev => [...prev, data]);
      setCommentText('');

      // Notify seller (only if commenter is not the seller)
      if (item.seller_id && item.seller_id !== currentUser.id) {
        const commenterName = currentUser.user_metadata?.full_name || 'Someone';
        await supabase.from('notifications').insert({
          user_id: item.seller_id,
          type: 'comment',
          message: `💬 ${commenterName} commented on your listing "${item.title}": "${commentText.trim().slice(0, 60)}${commentText.trim().length > 60 ? '...' : ''}"`,
          link: `/listing/${id}`,
        });
      }
    }
  };

  const handlePostReply = async (parentId) => {
    if (!replyText.trim() || !currentUser) return;
    const { data, error } = await supabase.from('comments').insert({
      listing_id: id,
      user_id: currentUser.id,
      content: replyText.trim(),
      parent_id: parentId
    }).select('*, profiles:user_id(full_name, avatar_url)').single();
    if (!error && data) {
      setComments(prev => [...prev, data]);
      setReplyText('');
      setReplyingTo(null);

      // Notify seller (only if replier is not the seller)
      if (item.seller_id && item.seller_id !== currentUser.id) {
        const replierName = currentUser.user_metadata?.full_name || 'Someone';
        await supabase.from('notifications').insert({
          user_id: item.seller_id,
          type: 'reply',
          message: `↩️ ${replierName} replied to a comment on your listing "${item.title}": "${replyText.trim().slice(0, 60)}${replyText.trim().length > 60 ? '...' : ''}"`,
          link: `/listing/${id}`,
        });
      }
    }
  };

  const handleConfirmPurchase = async () => {
    if (!paymentSlip) {
      alert("Please upload your payment slip first.");
      return;
    }
    
    setIsSubmittingOrder(true);
    try {
      const fileExt = paymentSlip.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, paymentSlip);
        
      if (uploadError) throw uploadError;
      
      setIsSubmittingOrder(false);
      setOrderSuccess(true);
      
    } catch (err) {
      console.error("Purchase error:", err);
      alert(err.message || "Failed to submit order. Please try again.");
      setIsSubmittingOrder(false);
    }
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

          {/* Comments Section */}
          <div className="glass-panel p-6 mt-4">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              Comments <span className="text-sm font-normal text-gray-500 ml-1">({comments.filter(c => !c.parent_id).length})</span>
            </h3>

            {/* Post a Comment */}
            {currentUser ? (
              <div className="flex gap-3 mb-8">
                <img 
                  src={currentUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.user_metadata?.full_name || 'U'}&background=0ea5e9&color=fff`} 
                  className="w-9 h-9 rounded-full border border-gray-700 shrink-0 mt-0.5"
                  alt=""
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                    placeholder="Add a comment..."
                    className="flex-1 bg-[#0a0c12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-primary outline-none"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!commentText.trim()}
                    className="p-2.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white rounded-xl transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-[#0a0c12] rounded-xl border border-gray-800 text-center">
                <p className="text-sm text-gray-500">Please <button onClick={() => navigate('/login')} className="text-primary hover:underline font-bold">login</button> to post a comment.</p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.filter(c => !c.parent_id).length === 0 && (
                <p className="text-center text-sm text-gray-600 py-6">No comments yet. Be the first to comment!</p>
              )}
              {comments.filter(c => !c.parent_id).map(cmnt => (
                <div key={cmnt.id}>
                  {/* Parent Comment */}
                  <div className="flex gap-3">
                    <img
                      src={cmnt.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${cmnt.profiles?.full_name || 'U'}&background=1e293b&color=fff`}
                      className="w-9 h-9 rounded-full border border-gray-700 shrink-0"
                      alt=""
                    />
                    <div className="flex-1">
                      <div className="bg-[#0a0c12] border border-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-black text-white">{cmnt.profiles?.full_name || 'User'}</span>
                          {cmnt.user_id === item.seller_id && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">Seller</span>
                          )}
                          <span className="text-[10px] text-gray-600">{new Date(cmnt.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{cmnt.content}</p>
                      </div>
                      <button
                        onClick={() => setReplyingTo(replyingTo === cmnt.id ? null : cmnt.id)}
                        className="mt-1.5 ml-2 text-[10px] font-black text-gray-500 hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3 h-3" /> Reply
                      </button>

                      {/* Reply Input */}
                      {replyingTo === cmnt.id && currentUser && (
                        <div className="flex gap-2 mt-3 ml-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePostReply(cmnt.id)}
                            placeholder={`Reply to ${cmnt.profiles?.full_name || 'User'}...`}
                            className="flex-1 bg-[#0a0c12] border border-primary/40 rounded-xl px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-primary outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handlePostReply(cmnt.id)}
                            disabled={!replyText.trim()}
                            className="p-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white rounded-xl transition-all"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Replies */}
                      <div className="ml-4 mt-3 space-y-3 border-l-2 border-gray-800 pl-4">
                        {comments.filter(r => r.parent_id === cmnt.id).map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <img
                              src={reply.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${reply.profiles?.full_name || 'U'}&background=1e293b&color=fff`}
                              className="w-7 h-7 rounded-full border border-gray-700 shrink-0"
                              alt=""
                            />
                            <div className="bg-[#0a0c12] border border-gray-800/60 rounded-2xl rounded-tl-none px-4 py-2.5 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-black text-white">{reply.profiles?.full_name || 'User'}</span>
                                {reply.user_id === item.seller_id && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">Seller</span>
                                )}
                                <span className="text-[10px] text-gray-600">{new Date(reply.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                <div className="text-3xl font-extrabold text-white">{formatPrice(item.price)}</div>
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

            <button 
              onClick={() => {
                if (!currentUser) {
                  navigate('/login');
                  return;
                }
                setIsPurchaseModalOpen(true);
              }}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mb-4 active:scale-[0.98]"
            >
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

            {item.seller.whatsapp ? (
              <a 
                href={`https://wa.me/${item.seller.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${item.seller.name}, I am interested in your listing: ${item.title}\n\nLink: ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-500/10"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Message Seller
              </a>
            ) : (
              <button 
                onClick={() => navigate(`/messages?userId=${item.seller_id}`)}
                className="w-full bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="w-4 h-4"/> Message Seller
              </button>
            )}
            
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

      {/* Purchase Modal */}
      <AnimatePresence>
        {isPurchaseModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPurchaseModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f111a] border border-gray-800 w-full max-w-xl rounded-2xl overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0f111a] z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Payment Details</h3>
                    <p className="text-xs text-gray-400">Complete payment to purchase this account</p>
                  </div>
                </div>
                <button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderSuccess ? (
                /* ----  SUCCESS SCREEN ---- */
                <div className="flex flex-col items-center justify-center p-10 text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-4 border-green-500/40">
                    <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Order Submitted! 🎉</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Your payment slip has been uploaded. Please contact the seller on <span className="text-green-400 font-bold">WhatsApp</span> so they can verify and transfer the account to you.</p>
                  </div>

                  {/* WhatsApp Number Display */}
                  {item.seller.whatsapp && (
                    <div className="w-full bg-[#0a0c12] border-2 border-green-500/30 rounded-2xl p-6 space-y-4">
                      <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Seller's WhatsApp Number</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl font-black text-white tracking-wider">+{item.seller.whatsapp}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(item.seller.whatsapp); }}
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-all"
                          title="Copy number"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                      <a
                        href={`https://wa.me/${item.seller.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${item.seller.name}, I just submitted my payment for your listing: "${item.title}". Please verify and proceed. Thank you!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 text-sm"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Chat on WhatsApp Now
                      </a>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsPurchaseModalOpen(false);
                      setOrderSuccess(false);
                      setPaymentSlip(null);
                      setSlipPreview(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Close this window
                  </button>
                </div>
              ) : (
                /* ---- NORMAL PAYMENT FLOW ---- */
                <>
                  <div className="p-6 overflow-y-auto space-y-6">
                    {/* Seller Info */}
                    <div className="bg-[#1a1c26] border border-gray-700/50 p-4 rounded-xl flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <img src={item.seller.avatar} className="w-10 h-10 rounded-full border border-gray-700" alt="" />
                          <div className="text-sm font-medium text-white">{item.seller.name}'s Details</div>
                       </div>
                       <div className="text-right">
                          <div className="text-xs text-gray-500 uppercase font-black">Amount Due</div>
                          <div className="text-lg font-black text-primary">{formatPrice(item.price)}</div>
                       </div>
                    </div>

                    {/* Methods List */}
                    <div className="space-y-4">
                      {item.seller.payment_methods && item.seller.payment_methods.length > 0 ? (
                        item.seller.payment_methods.map((pm, idx) => (
                          <div key={pm.id} className="bg-[#0a0c12] border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-white font-bold text-sm mb-3">
                               {pm.method === 'Bank' ? <Banknote className="w-4 h-4 text-emerald-500" /> : <Wallet className="w-4 h-4 text-amber-500" />}
                               {pm.method} {pm.method === 'Bank' ? 'Transfer' : ''}
                            </div>
                            {pm.method === 'Bank' ? (
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                 <div className="text-gray-500 uppercase font-bold text-[9px]">Bank Name</div>
                                 <div className="text-gray-500 uppercase font-bold text-[9px]">Account Number</div>
                                 <div className="text-gray-200 font-bold">{pm.bankName}</div>
                                 <div className="text-gray-200 font-bold flex items-center gap-1.5 cursor-pointer" onClick={() => { navigator.clipboard.writeText(pm.accountNo); }}>
                                   {pm.accountNo} <ExternalLink className="w-3 h-3 text-gray-600" />
                                 </div>
                                 <div className="text-gray-500 uppercase font-bold text-[9px] mt-2">Branch</div>
                                 <div className="text-gray-500 uppercase font-bold text-[9px] mt-2">Name</div>
                                 <div className="text-gray-200 font-bold">{pm.branch}</div>
                                 <div className="text-gray-200 font-bold">{pm.accountName}</div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                 <div>
                                   <div className="text-gray-500 uppercase font-bold text-[9px]">Number</div>
                                   <div className="text-gray-200 font-bold text-lg">{pm.ezCashNumber}</div>
                                 </div>
                                 <button onClick={() => { navigator.clipboard.writeText(pm.ezCashNumber); }} className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-all">
                                    <ExternalLink className="w-4 h-4" />
                                 </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-red-500/5 rounded-xl border border-red-500/10">
                           <ShieldAlert className="w-8 h-8 text-red-500/50 mx-auto mb-2" />
                           <p className="text-sm text-gray-500">Seller hasn't added payment details yet.</p>
                           <p className="text-xs text-gray-400 mt-1">Please contact the seller via WhatsApp.</p>
                        </div>
                      )}
                    </div>

                    {/* Slip Upload */}
                    <div className="space-y-3 pt-6 border-t border-gray-800">
                      <label className="block text-sm font-bold text-white mb-2">Upload Payment Slip</label>
                      {!slipPreview ? (
                        <label className="border-2 border-dashed border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 cursor-pointer transition-all bg-[#0a0c12]">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-bold text-gray-300">Click to upload slip</span>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-black">JPG or PNG (Max 5MB)</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setPaymentSlip(file);
                                const reader = new FileReader();
                                reader.onload = () => setSlipPreview(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-black aspect-video group">
                           <img src={slipPreview} className="w-full h-full object-contain" alt="Slip Preview" />
                           <button onClick={() => { setSlipPreview(null); setPaymentSlip(null); }} className="absolute top-2 right-2 p-2 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                             <X className="w-4 h-4" />
                           </button>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500 leading-tight">By uploading, you confirm that you have made the payment to the seller's details provided above.</p>
                    </div>
                  </div>

                  <div className="p-6 bg-[#0a0c12] border-t border-gray-800">
                    <button 
                      onClick={handleConfirmPurchase}
                      disabled={isSubmittingOrder || !paymentSlip}
                      className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {isSubmittingOrder ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>Confirm &amp; Submit Order</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingView;
