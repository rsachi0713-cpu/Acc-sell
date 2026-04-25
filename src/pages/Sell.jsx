import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Plus, ArrowLeft, Gamepad2 } from 'lucide-react';
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
    description: '',
    thumbnail: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
      }
    });
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

  const uploadThumbnail = async (event) => {
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });

      const file = event.target.files[0];
      if (!file) return;

      // Make sure the user has a "listings" bucket created in Supabase!
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('listings').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, thumbnail: data.publicUrl }));
      setMessage({ text: 'Thumbnail uploaded successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: error.message || 'Error uploading. Make sure you created a "listings" storage bucket!', type: 'error' });
    } finally {
      setLoading(false);
    }
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
          description: formData.description,
          thumbnail: formData.thumbnail || 'https://picsum.photos/400/225'
        }
      ]);

      if (error) throw error;

      setMessage({ text: 'Listing created successfully! Your account is now live.', type: 'success' });
      // Reset form after success
      setFormData({
        title: '', price: '', platform: 'games', subcategory: 'freefire', server: 'Global', type: 'Full Access', description: '', thumbnail: ''
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

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg text-sm text-center font-medium ${
            message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-green-500/20 text-green-300 border border-green-500/50'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
               <label className="block text-sm font-medium text-gray-300 mb-1">Price (USD)</label>
               <input
                 type="number"
                 name="price"
                 step="0.01"
                 required
                 value={formData.price}
                 onChange={handleChange}
                 className="block w-full px-4 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary text-gray-200"
                 placeholder="0.00"
               />
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
                 <option>US</option>
                 <option>Asia</option>
                 <option>Europe</option>
                 <option>Indonesia</option>
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
                 <option>Account</option>
                 <option>Verified Page</option>
               </select>
             </div>
          </div>

          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image (Thumbnail)</label>
            <div className="flex items-center gap-4">
              {formData.thumbnail && (
                <img src={formData.thumbnail} className="w-24 h-16 object-cover rounded-md border border-gray-700" alt="Preview" />
              )}
              <label className="cursor-pointer flex items-center justify-center gap-2 py-2 px-4 border border-gray-700 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-800/80 hover:bg-gray-700 transition-colors">
                <Upload className="w-4 h-4" />
                Upload Image
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={uploadThumbnail}
                  disabled={loading}
                />
              </label>
            </div>
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
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Post Listing'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Sell;
