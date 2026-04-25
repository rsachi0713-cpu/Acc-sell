import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Save, LogOut, Upload, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [initialData, setInitialData] = useState({ fullName: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
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
      
      setFullName(fetchedFullName);
      setAvatarUrl(fetchedAvatarUrl);
      setInitialData({ fullName: fetchedFullName, avatarUrl: fetchedAvatarUrl });
      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

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
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setUser(data.user);
      setInitialData({ fullName, avatarUrl });
    }
    setSaving(false);
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      setMessage({ text: '', type: '' });

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      setMessage({ text: 'Image uploaded! Please click "Save Changes" to finalize.', type: 'success' });
    } catch (error) {
      setMessage({ text: error.message || 'Error uploading image, please ensure you created the "avatars" storage bucket.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const hasChanges = fullName !== initialData.fullName || avatarUrl !== initialData.avatarUrl;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading Profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-sm font-medium text-gray-400 hover:text-white transition-colors w-fit group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Marketplace
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-gray-400">Manage your account settings</p>
          </div>
          {avatarUrl ? (
             <img 
               src={avatarUrl} 
               alt="User Avatar" 
               className="w-16 h-16 rounded-full object-cover shadow-xl border-2 border-primary/50"
             />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50 text-2xl font-bold text-white uppercase shadow-xl">
              {fullName ? fullName.charAt(0) : user.email.charAt(0)}
            </div>
          )}
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg text-sm text-center font-medium ${
            message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-green-500/20 text-green-300 border border-green-500/50'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address (Read-only)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={user.email || ''}
                readOnly
                className="block w-full pl-10 pr-3 py-3 bg-[#0a0c10] border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary focus:border-primary text-gray-200 placeholder-gray-500 transition-colors"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Image</label>
            <div className="flex items-center gap-4">
              <label 
                className={`cursor-pointer flex items-center justify-center gap-2 py-2 px-4 border border-gray-700 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-800/80 hover:bg-gray-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </label>
              {(avatarUrl || uploading) && (
                 <span className="text-xs text-gray-400">
                    {uploading ? 'Uploading to server...' : 'Image loaded! Click "Save Changes" Below'}
                 </span>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'} {!saving && <Save className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex justify-center items-center gap-2 py-3 px-6 border border-gray-700 rounded-lg shadow-sm text-sm font-medium text-red-400 bg-gray-800/50 hover:bg-gray-800 hover:text-red-300 focus:outline-none transition-all"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
