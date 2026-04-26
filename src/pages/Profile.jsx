import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Save, LogOut, Upload, ArrowLeft, Plus, CheckCircle2, Star, MessageSquare, ShieldAlert, Clock, Cpu, Globe, X, AlertCircle, ShoppingBag, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [initialData, setInitialData] = useState({ fullName: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [success, setSuccess] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [editingListing, setEditingListing] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      const fetchedFullName = session.user.user_metadata?.full_name || '';
      const fetchedAvatarUrl = session.user.user_metadata?.avatar_url || '';
      const fetchedRole = session.user.user_metadata?.role || 'buyer';
      
      setFullName(fetchedFullName);
      setAvatarUrl(fetchedAvatarUrl);
      setRole(fetchedRole);
      setInitialData({ fullName: fetchedFullName, avatarUrl: fetchedAvatarUrl });
      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    // Reset success state if values change
    setSuccess(false);
  }, [fullName, avatarUrl]);

  const fetchMyListings = async (userId) => {
    setListingsLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setMyListings(data);
    setListingsLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    const { data, error } = await supabase.auth.updateUser({
      data: { 
        full_name: fullName,
        avatar_url: avatarUrl 
      }
    });

    if (error) {
      console.error('Update Auth Error:', error);
      setMessage({ text: error.message, type: 'error' });
    } else {
      // Also update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq('id', user.id);
      
      if (profileError) console.error('Update Profile Table Error:', profileError);

      setSuccess(true);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setUser(data.user);
      setInitialData({ fullName, avatarUrl });
      setTimeout(() => {
        setSuccess(false);
        setMessage({ text: '', type: '' });
      }, 3000);
    }
    setSaving(false);
  };

  const handleSwitchRole = async () => {
    setSaving(true);
    const newRole = role === 'seller' ? 'buyer' : 'seller';
    
    try {
      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { role: newRole }
      });
      if (authError) throw authError;

      // 2. Update Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);
      if (profileError) throw profileError;

      setMessage({ text: `Switched to ${newRole} mode!`, type: 'success' });
      
      // Force reload to update all components and session
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      setMessage({ text: '', type: '' });
      if (!event.target.files?.[0]) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      setMessage({ text: 'Image uploaded! Please click "Save Changes" to finalize.', type: 'success' });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) {
      setMessage({ text: 'Error deleting listing: ' + error.message, type: 'error' });
    } else {
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      setMessage({ text: 'Listing deleted successfully!', type: 'success' });
    }
  };

  const uploadListingImages = async (event) => {
    try {
      setUploading(true);
      const files = Array.from(event.target.files);
      if (files.length === 0) return;
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('listings').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('listings').getPublicUrl(fileName);
        return data.publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setEditingListing(prev => ({
        ...prev,
        image_urls: [...(prev.image_urls || []), ...urls]
      }));
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const removeListingImage = (indexToRemove) => {
    setEditingListing(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleUpdateListingSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updatedImages = editingListing.image_urls || [];
    const { error } = await supabase.from('listings').update({
      title: editingListing.title,
      price: parseFloat(editingListing.price),
      description: editingListing.description,
      server: editingListing.server,
      type: editingListing.type,
      delivery_time: editingListing.delivery_time,
      image_urls: updatedImages,
      thumbnail: updatedImages[0] || editingListing.thumbnail
    }).eq('id', editingListing.id);

    if (error) {
      console.error('Save Listing Error:', error);
      alert('Error saving: ' + error.message);
      setMessage({ text: 'Error updating: ' + error.message, type: 'error' });
      setSaving(false);
    } else {
      console.log('Listing saved successfully!');
      setSuccess(true);
      setMessage({ text: 'Listing updated successfully!', type: 'success' });
      
      setMyListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, ...editingListing, image_urls: updatedImages, thumbnail: updatedImages[0] || l.thumbnail } : l));
      
      setTimeout(() => {
        setEditingListing(null);
        setSuccess(false);
        setSaving(false);
        setMessage({ text: '', type: '' });
      }, 1500);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading Profile...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Floating Notifications */}
      <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-4 ${
                message.type === 'error' 
                  ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                  : 'bg-green-500/10 border-green-500/50 text-green-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                <p className="text-sm font-bold leading-tight">{message.text}</p>
              </div>
              <button onClick={() => setMessage({ text: '', type: '' })} className="hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar - Profile Settings */}
      <div className="md:col-span-1 border-r border-gray-800 pr-0 md:pr-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="glass-panel p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group mb-4">
              <img src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName || 'U'}&background=1e293b&color=fff`} className="w-24 h-24 rounded-full object-cover border-2 border-primary" alt="avatar" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Upload className="w-6 h-6 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} />
              </label>
            </div>
            <h2 className="text-xl font-bold text-white truncate w-full text-center">{fullName || 'User'}</h2>
            <p className="text-sm text-gray-500 truncate w-full text-center">{user.email}</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#0a0c10] border border-gray-800 rounded-lg p-2.5 text-white" />
            </div>
            <button type="submit" disabled={saving} className="w-full bg-primary py-2.5 rounded-lg text-white font-bold hover:bg-primary-hover transition-all">Save Changes</button>
          </form>
          


          <button type="button" onClick={() => navigate('/messages')} className="w-full mt-6 bg-primary/10 text-primary py-2.5 rounded-lg font-bold hover:bg-primary/20 transition-all flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" /> My Messages
          </button>
          <button type="button" onClick={handleLogout} className="w-full mt-4 bg-gray-800/50 text-red-400 py-2.5 rounded-lg font-medium hover:bg-gray-800">Logout</button>
        </div>
      </div>

      {/* Main Content - Activity/Listings */}
      <div className="md:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6">{role === 'seller' ? 'Seller Dashboard' : 'My Account'}</h2>
        <div className="space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-800 gap-8">
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === 'history' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Purchase History
              {activeTab === 'history' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button 
              onClick={() => setActiveTab('cart')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === 'cart' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Order Cart
              {activeTab === 'cart' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'history' ? (
              <div className="glass-panel p-12 text-center bg-gray-800/10">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-xl">
                   <Clock className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Purchase History</h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  You haven't bought any accounts yet. Once you make a purchase, your order details and account credentials will appear here.
                </p>
                <button 
                  onClick={() => navigate('/')} 
                  className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all flex items-center gap-3 mx-auto active:scale-95"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center bg-gray-800/10">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-xl">
                   <ShoppingBag className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Your Cart is Empty</h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  Looks like you haven't added anything to your cart yet. Find the best gaming and social media accounts at AccMarket.gg
                </p>
                <button 
                  onClick={() => navigate('/')} 
                  className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all flex items-center gap-3 mx-auto active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl p-8 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-bold text-white">Edit Listing</h2>
              <button onClick={() => setEditingListing(null)} className="text-gray-500 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleUpdateListingSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Listing Title</label>
                  <input type="text" value={editingListing.title} onChange={(e) => setEditingListing({...editingListing, title: e.target.value})} className="w-full bg-[#0a0c10] border border-gray-800 rounded-lg p-3 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Price (Rs.)</label>
                  <input type="number" value={editingListing.price} onChange={(e) => setEditingListing({...editingListing, price: e.target.value})} className="w-full bg-[#0a0c10] border border-gray-800 rounded-lg p-3 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Delivery Time</label>
                  <select value={editingListing.delivery_time} onChange={(e) => setEditingListing({...editingListing, delivery_time: e.target.value})} className="w-full bg-[#0a0c10] border border-gray-800 rounded-lg p-3 text-white">
                    <option>Instant</option><option>1-6 Hours</option><option>12 Hours</option><option>24 Hours</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea value={editingListing.description} rows="4" onChange={(e) => setEditingListing({...editingListing, description: e.target.value})} className="w-full bg-[#0a0c10] border border-gray-800 rounded-lg p-3 text-white resize-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Manage Images</label>
                <div className="grid grid-cols-4 gap-3">
                  {(editingListing.image_urls || []).map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={url} className="w-full h-full object-cover rounded-xl border border-gray-800" alt="" />
                      <button type="button" onClick={() => removeListingImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         <Plus className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-gray-500 hover:text-primary">
                    <Upload className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1 uppercase">Add</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={uploadListingImages} />
                  </label>
                </div>
                {uploading && <p className="text-xs text-primary mt-2 animate-pulse">Uploading...</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className={`flex-1 py-4 rounded-xl text-white font-bold shadow-lg transition-all ${
                    success ? 'bg-green-600' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
                  }`}
                >
                  {saving ? (success ? 'Saved ✅' : 'Updating...') : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingListing(null)} className="px-8 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 font-bold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
