import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Plus, ArrowLeft, Gamepad2, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';

const subCategoryMap = {
  games: [
    { id: 'freefire', name: 'Free Fire' },
    { id: 'pubg', name: 'PUBG Mobile' },
    { id: 'cod', name: 'CoD Mobile' },
    { id: 'coc', name: 'Clash of Clans' },
    { id: 'mlbb', name: 'Mobile Legends' }
  ],
  tiktok: [
    { id: 'gaming', name: 'Gaming Niche' },
    { id: 'entertainment', name: 'Entertainment' }
  ],
  youtube: [
    { id: 'monetized', name: 'Monetized Channel' },
    { id: 'vlog', name: 'Vlogging Channel' }
  ],
  facebook: [
    { id: 'groups', name: 'FB Groups' },
    { id: 'fanpage', name: 'Fan Pages' }
  ],
  other: [
    { id: 'instagram', name: 'Instagram' },
    { id: 'twitter', name: 'Twitter / X' }
  ]
};

const Sell = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    platform: 'games',
    subcategory: 'freefire',
    server: 'Global',
    type: 'Full Access',
    delivery_time: 'Instant',
    description: '',
    images: [] // Store multiple image URLs
  });

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Fetch profile for verification status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_verified')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'seller' && profile?.role !== 'admin') {
        // Automatically upgrade Buyer to Seller if they try to sell
        await supabase
          .from('profiles')
          .update({ role: 'seller' })
          .eq('id', session.user.id);
        
        // Also update auth metadata
        await supabase.auth.updateUser({
          data: { role: 'seller' }
        });
        
        // Refresh the page to apply changes
        window.location.reload();
        return;
      }

      setUser(session.user);
      setIsVerified(profile?.is_verified || false);
    };

    checkUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-reset subcategory when platform changes
      if (name === 'platform') {
        newData.subcategory = subCategoryMap[value][0].id;
      }
      return newData;
    });
  };

  const uploadImages = async (event) => {
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      const files = Array.from(event.target.files);
      if (files.length === 0) return;

      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('listings').getPublicUrl(fileName);
        return data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      setMessage({ text: `${urls.length} images uploaded successfully!`, type: 'success' });
    } catch (error) {
      setMessage({ text: error.message || 'Error uploading images.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Assuming a 'listings' table exists in Supabase.
      const { error } = await supabase.from('listings').insert([
        {
          seller_id: user.id,
          title: formData.title,
          price: parseFloat(formData.price),
          platform: formData.platform,
          subcategory: formData.subcategory,
          server: formData.server,
          type: formData.type,
          delivery_time: formData.delivery_time,
          description: formData.description,
          thumbnail: formData.images[0] || 'https://picsum.photos/400/225',
          image_urls: formData.images
        }
      ]);

      if (error) throw error;

      setMessage({ text: 'Listing created successfully! Your account is now live.', type: 'success' });
      // Reset form after success
      setFormData({
        title: '', price: '', platform: 'games', subcategory: 'freefire', server: 'Global', type: 'Full Access', delivery_time: 'Instant', description: '', images: []
      });
      
      setTimeout(() => navigate('/'), 2000);
      
    } catch (error) {
      setMessage({ text: error.message || 'Error creating listing. Did you create the "listings" table in Supabase?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-sm font-medium text-gray-400 hover:text-white transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
          <div className="bg-primary/20 p-2 rounded-lg border border-primary/50 text-primary">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Sell an Account</h1>
            <p className="text-sm text-gray-400">Post your digital asset on the marketplace</p>
          </div>
        </div>

         {!isVerified && (
           <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-red-500/20 rounded-xl">
               <ShieldCheck className="w-8 h-8 text-red-500" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white mb-1">Account Verification Required</h3>
               <p className="text-sm text-gray-400">To maintain marketplace security, your account must be verified by an admin before posting. This process usually takes 1-24 hours.</p>
             </div>
           </div>
         )}

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg text-sm text-center font-medium ${
            message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-green-500/20 text-green-300 border border-green-500/50'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-6 ${!isVerified ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* ... existing form items ... */}
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Listing Title</label>
               <input
                 type="text"
                 name="title"
                 required
                 value={formData.title}
                 onChange={handleChange}
                 className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200"
                 placeholder="e.g. Max Level PUBG Account..."
               />
             </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Price (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                      placeholder="5000"
                    />
                  </div>
                </div>
          </div>

          {/* Categorization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Platform</label>
               <select
                 name="platform"
                 value={formData.platform}
                 onChange={handleChange}
                 className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200"
               >
                 <option value="games">Games</option>
                 <option value="tiktok">TikTok</option>
                 <option value="youtube">YouTube</option>
                 <option value="facebook">Facebook Page</option>
                 <option value="other">Other</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Sub-Category</label>
               <select
                 name="subcategory"
                 value={formData.subcategory}
                 onChange={handleChange}
                 className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200"
               >
                 {subCategoryMap[formData.platform].map(sub => (
                   <option key={sub.id} value={sub.id}>{sub.name}</option>
                 ))}
               </select>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Server / Region</label>
               <select
                 name="server"
                 value={formData.server}
                 onChange={handleChange}
                 className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200"
               >
                 <option>Global</option>
                 <option>Singapore</option>
                 <option>Middle East</option>
                 <option>Asia</option>
                 <option>North America (NA)</option>
                 <option>Europe (EU)</option>
                 <option>South America</option>
                 <option>Indonesia</option>
                 <option>India</option>
                 <option>SEA</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Access Type</label>
               <select
                 name="type"
                 value={formData.type}
                 onChange={handleChange}
                 className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200"
               >
                 <option>Full Access</option>
                 <option>Account Only</option>
                 <option>Login Only</option>
                 <option>Verified Page</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Delivery Time</label>
               <select
                 name="delivery_time"
                 value={formData.delivery_time}
                 onChange={handleChange}
                 className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200"
               >
                 <option>Instant</option>
                 <option>1-6 Hours</option>
                 <option>12 Hours</option>
                 <option>24 Hours</option>
                 <option>2-3 Days</option>
               </select>
             </div>
           </div>

          {/* Upload Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-black text-gray-400 uppercase tracking-widest">Account Gallery ({formData.images.length})</label>
              <span className="text-[10px] text-gray-500 font-medium italic">First image will be the primary thumbnail</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Existing Images */}
              {formData.images.map((url, index) => (
                <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                  <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Preview ${index}`} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white rounded-full p-2 shadow-xl hover:scale-110 active:scale-95 transition-all"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-lg border border-white/20">
                      Primary
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-md backdrop-blur-md">
                    #{index + 1}
                  </div>
                </div>
              ))}

              {/* Upload Trigger */}
              <label className="cursor-pointer aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-800 bg-[#0a0c12]/50 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                  <Upload className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest relative z-10 group-hover:text-primary transition-colors">Add Image</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={uploadImages}
                  disabled={loading}
                />
              </label>
            </div>
            
            {loading && (
              <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                 <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                 <span className="text-xs font-bold text-primary italic">Uploading high-quality assets...</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200 resize-none"
              placeholder="Provide a detailed description of what you are selling..."
            ></textarea>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !isVerified}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isVerified ? 'Post Listing' : 'Verification Pending')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Sell;
