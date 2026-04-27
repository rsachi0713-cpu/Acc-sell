import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Plus, 
  Settings, 
  LogOut,
  ShoppingBag,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const SellerDashboard = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalSales: 0,
    revenue: 0,
    views: 0
  });
  const [myListings, setMyListings] = useState([]);
  const navigate = useNavigate();

  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, listings, orders, profile

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const checkUser = async () => {
      const safetyTimeout = setTimeout(() => setLoading(false), 5000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const userId = session.user.id;
        const metadataRole = session.user.user_metadata?.role || 'buyer';
        
        setUser(session.user);
        setRole(metadataRole);
        
        if (metadataRole === 'buyer') {
          navigate('/profile');
          return;
        }
        
        // Initial setup from metadata
        setFullName(session.user.user_metadata?.full_name || '');
        setAvatarUrl(session.user.user_metadata?.avatar_url || '');
        
        // Fetch full profile info
        const { data: profileData } = await supabase.from('profiles').select('is_verified, full_name, avatar_url, whatsapp').eq('id', userId).single();
        
        if (profileData) {
          setIsVerified(profileData.is_verified || false);
          if (profileData.full_name) setFullName(profileData.full_name);
          if (profileData.whatsapp) setWhatsapp(profileData.whatsapp);
          if (profileData.avatar_url) setAvatarUrl(profileData.avatar_url);
        }
        
        await fetchDashboardData(userId);

        // Real-time listener for verification status
        const profileSubscription = supabase
          .channel(`profile-${userId}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${userId}` 
          }, (payload) => {
            setIsVerified(payload.new.is_verified || false);
            if (payload.new.full_name) setFullName(payload.new.full_name);
            if (payload.new.avatar_url) setAvatarUrl(payload.new.avatar_url);
            if (payload.new.whatsapp) setWhatsapp(payload.new.whatsapp);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(profileSubscription);
        };
      } catch (err) {
        console.error("Dashboard check failed:", err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName, 
          whatsapp: whatsapp,
          avatar_url: avatarUrl 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { data: { user: updatedUser }, error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName, 
          whatsapp: whatsapp,
          avatar_url: avatarUrl 
        }
      });
      
      if (authError) throw authError;
      
      setUser(updatedUser);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (userId) => {
    try {
      const { data: listings, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMyListings(listings || []);
      setStats(prev => ({
        ...prev,
        activeListings: (listings || []).length
      }));
    } catch (err) {
      console.error("Fetch Data Error:", err);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (!error) {
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      setStats(prev => ({ ...prev, activeListings: prev.activeListings - 1 }));
      setMessage({ text: 'Listing deleted successfully', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f17]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0f17] text-gray-300">
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-[#0d0f17] border-r border-gray-800 flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Seller Hub</span>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-800">
             <div className="relative group mx-auto mb-4 w-20 h-20">
               <img 
                 src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName || 'Seller'}&background=0ea5e9&color=fff`} 
                 className="w-full h-full rounded-full object-cover border-2 border-primary shadow-lg"
                 alt="Profile" 
               />
               <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                 <Upload className="w-5 h-5 text-white" />
                 <input 
                   type="file" 
                   className="hidden" 
                   accept="image/*" 
                   onChange={async (e) => {
                     const file = e.target.files[0];
                     if (!file) return;
                     try {
                       setUploading(true);
                       const fileExt = file.name.split('.').pop();
                       const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                       const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
                       if (uploadError) throw uploadError;
                       const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                       const newUrl = data.publicUrl;
                       await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
                       setAvatarUrl(newUrl);
                       setMessage({ text: 'Profile picture updated!', type: 'success' });
                     } catch (err) {
                       setMessage({ text: err.message, type: 'error' });
                     } finally {
                       setUploading(false);
                       setTimeout(() => setMessage({ text: '', type: '' }), 3000);
                     }
                   }} 
                 />
               </label>
             </div>
             <p className="text-sm font-bold text-white text-center truncate">{fullName || 'User'}</p>
             <p className="text-[10px] text-gray-500 text-center truncate">{user?.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'listings' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            >
              <Package className="w-5 h-5" /> My Listings
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            >
              <ShoppingBag className="w-5 h-5" /> Orders
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            >
              <User className="w-5 h-5" /> Profile Settings
            </button>
            <button 
              onClick={() => navigate('/messages')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 rounded-xl text-gray-400 hover:text-white transition-all font-bold"
            >
              <MessageCircle className="w-5 h-5" /> Messages
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-800 space-y-2">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl text-red-400 transition-all">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {message.text && (
             <div className={`m-4 p-3 rounded-lg text-xs font-bold text-center ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
               {message.text}
             </div>
          )}

          {!isVerified && (
            <div className="m-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Verification Required</h4>
                  <p className="text-[11px] text-gray-500">Your account is currently under review. You cannot post new listings until verified.</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-500/20">
                Pending Approval
              </div>
            </div>
          )}
          
          {/* Top Bar */}
          <header className="h-16 border-b border-gray-800 bg-[#0d0f17]/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white capitalize">
                {activeTab === 'overview' ? 'Overview' : activeTab === 'profile' ? 'Profile Settings' : activeTab}
              </h1>
              {isVerified ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Seller</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verification Pending</span>
                </div>
              )}
            </div>
          </header>

          <div className="p-8">
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard icon={<Package className="w-5 h-5 text-primary" />} label="Active Listings" value={stats.activeListings} trend="+0 new" />
                  <StatCard icon={<ShoppingBag className="w-5 h-5 text-emerald-500" />} label="Total Sales" value={stats.totalSales} trend="0%" />
                  <StatCard icon={<DollarSign className="w-5 h-5 text-amber-500" />} label="Revenue" value={`Rs. ${stats.revenue}`} trend="Rs. 0" />
                  <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-500" />} label="Views" value={stats.views} trend="0" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Inventory */}
                  <div className="lg:col-span-2 glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                       <Clock className="w-5 h-5 text-primary" /> Recent Inventory
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800 text-left">
                            <th className="py-4 text-xs font-bold text-gray-500 uppercase">Account</th>
                            <th className="py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
                            <th className="py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {myListings.length > 0 ? myListings.slice(0, 5).map(listing => (
                            <tr key={listing.id} className="group hover:bg-gray-800/20 transition-colors">
                              <td className="py-4 flex items-center gap-3">
                                <img src={listing.thumbnail} className="w-10 h-10 rounded-lg object-cover border border-gray-800" alt="" />
                                <span className="text-sm font-medium text-white">{listing.title}</span>
                              </td>
                              <td className="py-4 text-sm font-bold text-white">Rs. {listing.price}</td>
                              <td className="py-4">
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase border border-green-500/20">Active</span>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="3" className="py-8 text-center text-gray-500 text-sm">No items yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Activity Sidebar */}
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Activity</h3>
                    <div className="space-y-4">
                       <ActivityItem icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} title="Welcome!" time="Just now" desc="Start listing your digital assets." />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'listings' && (
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-bold text-white">My Inventory</h2>
                   <button 
                     onClick={() => isVerified ? navigate('/sell') : alert('Your account must be verified before listing items.')} 
                     className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isVerified ? 'bg-primary text-white hover:scale-105' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}
                   >
                     + New Listing
                   </button>
                </div>
                {myListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myListings.map(listing => (
                      <div key={listing.id} className="bg-gray-800/40 border border-gray-800 p-4 rounded-2xl">
                         <img src={listing.thumbnail} className="w-full h-40 object-cover rounded-xl mb-4" alt="" />
                         <h4 className="text-white font-bold truncate mb-1">{listing.title}</h4>
                         <p className="text-primary font-bold text-sm mb-4">Rs. {listing.price}</p>
                         <div className="flex gap-2">
                            <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-xs font-bold">Edit</button>
                            <button onClick={() => handleDeleteListing(listing.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-50">
                    <Package className="w-16 h-16 mx-auto mb-4" />
                    <p>No listings found. Start selling today!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto">
                <div className="glass-panel p-8">
                  <h2 className="text-2xl font-bold text-white mb-8">Edit Public Profile</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                        <input 
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                        <input 
                          type="tel" 
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary outline-none transition-all"
                          placeholder="94771234567"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email (Read Only)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-800" />
                        <input 
                          type="text" 
                          value={user?.email} 
                          disabled
                          className="w-full bg-[#0a0c10]/50 border border-gray-800/10 rounded-xl py-3 pl-12 pr-4 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/30 active:scale-95 transition-all"
                    >
                      {loading ? 'Saving...' : 'Update Settings'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend }) => (
  <div className="glass-panel p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700/50">{icon}</div>
      <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">{trend}</span>
    </div>
    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

const ActivityItem = ({ icon, title, time, desc }) => (
  <div className="flex gap-3">
    <div className="mt-1">{icon}</div>
    <div>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-white leading-none">{title}</h4>
        <span className="text-[10px] text-gray-500">{time}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default SellerDashboard;
