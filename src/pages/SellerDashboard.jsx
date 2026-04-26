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
  Upload
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
  const [activeTab, setActiveTab] = useState('overview'); // overview, listings, orders

  const [fullName, setFullName] = useState('');
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
        setFullName(session.user.user_metadata?.full_name || '');
        setAvatarUrl(session.user.user_metadata?.avatar_url || '');
        
        supabase.from('profiles').select('is_verified, full_name, avatar_url').eq('id', userId).single()
          .then(({ data }) => {
            setIsVerified(data?.is_verified || false);
            // ONLY update if it's not null/empty to avoid overwriting metadata
            if (data?.full_name && data.full_name.trim() !== '') {
              setFullName(data.full_name);
            }
            if (data?.avatar_url && data.avatar_url.trim() !== '') {
              setAvatarUrl(data.avatar_url);
            }
          });
        
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
            console.log("Real-time Profile Update:", payload.new);
            setIsVerified(payload.new.is_verified || false);
            setMessage({ 
              text: payload.new.is_verified ? 'Congratulations! Your account is now verified.' : 'Your account verification is now pending.', 
              type: payload.new.is_verified ? 'success' : 'error' 
            });
            setTimeout(() => setMessage({ text: '', type: '' }), 5000);
            
            if (payload.new.full_name) setFullName(payload.new.full_name);
            if (payload.new.avatar_url) setAvatarUrl(payload.new.avatar_url);
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
      const { data: { user: updatedUser }, error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl }
      });
      if (authError) throw authError;

      await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', user.id);
      setUser(updatedUser);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchDashboardData = async (userId) => {
    try {
      const { data: listings, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        setMyListings([]);
      } else {
        setMyListings(listings || []);
        setStats(prev => ({
          ...prev,
          activeListings: (listings || []).length
        }));
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (!error) {
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      setStats(prev => ({ ...prev, activeListings: prev.activeListings - 1 }));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleSwitchRole = async () => {
    setLoading(true);
    try {
      await supabase.auth.updateUser({ data: { role: 'buyer' } });
      await supabase.from('profiles').update({ role: 'buyer' }).eq('id', user.id);
      window.location.href = '/profile';
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
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
        <div className="w-64 bg-[#0d0f17] border-r border-gray-800 flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Seller Hub</span>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* User Profile Summary */}
            <div className="mb-6 p-4 bg-gray-800/20 rounded-2xl border border-gray-800/50">
               <div className="relative group mx-auto mb-4 w-20 h-20">
            <img 
              src={avatarUrl} 
              className="w-full h-full rounded-full object-cover border-2 border-primary shadow-lg"
              alt="Profile" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${fullName || 'Seller'}&background=0ea5e9&color=fff`;
              }}
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
                    setLoading(true);
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('avatars')
                      .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                    const newUrl = data.publicUrl;

                    const { error: updateError } = await supabase
                      .from('profiles')
                      .update({ avatar_url: newUrl })
                      .eq('id', user.id);

                    if (updateError) throw updateError;
                    setAvatarUrl(newUrl);
                    setMessage({ text: 'Profile picture updated!', type: 'success' });
                  } catch (err) {
                    setMessage({ text: err.message, type: 'error' });
                  } finally {
                    setLoading(false);
                    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
                  }
                }}
              />
            </label>
          </div>
               <p className="text-sm font-bold text-white text-center truncate">{fullName || 'User'}</p>
               <p className="text-[10px] text-gray-500 text-center truncate mb-3">{user?.email}</p>
               
               <form onSubmit={handleUpdateProfile} className="space-y-2">
                 <input 
                   type="text" 
                   value={fullName} 
                   onChange={(e) => setFullName(e.target.value)}
                   placeholder="Your Name"
                   className="w-full bg-[#0a0c10] border border-gray-800 rounded-lg py-1.5 px-3 text-xs text-white focus:border-primary transition-colors"
                 />
                 <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-1.5 rounded-lg text-xs font-bold transition-all">Save Changes</button>
               </form>
            </div>

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
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 rounded-xl text-gray-400 hover:text-white transition-all">
              <MessageCircle className="w-5 h-5" /> Messages
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-800 space-y-2">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl text-red-400 transition-all">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {message.text && (
             <div className={`m-4 p-3 rounded-lg text-xs font-bold text-center ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
               {message.text}
             </div>
          )}
          
          {/* Top Bar */}
          <header className="h-16 border-b border-gray-800 bg-[#0d0f17]/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white capitalize">{activeTab === 'overview' ? 'Dashboard' : activeTab}</h1>
              {isVerified ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Seller</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pending Verification</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/sell')} 
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
                  isVerified ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                }`}
                disabled={!isVerified}
              >
                <Plus className="w-4 h-4" /> Create Listing
              </button>
            </div>
          </header>

          {!isVerified && (
            <div className="bg-orange-500/5 border-b border-orange-500/20 px-8 py-3">
               <div className="flex items-center gap-3 text-orange-400">
                 <AlertCircle className="w-4 h-4" />
                 <p className="text-xs font-bold uppercase tracking-widest">Verification Required: Your account is currently under review by our admin team before you can start selling.</p>
               </div>
            </div>
          )}

          <main className="p-8">
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard icon={<Package className="text-blue-400" />} label="Active Listings" value={stats.activeListings} trend="+2 new today" />
                  <StatCard icon={<ShoppingBag className="text-green-400" />} label="Total Sales" value={stats.totalSales} trend="0% vs last month" />
                  <StatCard icon={<DollarSign className="text-yellow-400" />} label="Revenue" value={`Rs. ${stats.revenue}`} trend="Rs. 0 this week" />
                  <StatCard icon={<Eye className="text-purple-400" />} label="Shop Views" value={stats.views} trend="+15% organic" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Listings Preview */}
                  <div className="lg:col-span-2 glass-panel p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-white uppercase tracking-wider">Active Inventory</h2>
                      <button onClick={() => setActiveTab('listings')} className="text-sm text-primary hover:underline">View All</button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left py-4 text-xs font-bold text-gray-500 uppercase">Account</th>
                            <th className="text-left py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
                            <th className="text-left py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {myListings.slice(0, 5).map(listing => (
                            <tr key={listing.id} className="group hover:bg-gray-800/20 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <img src={listing.thumbnail} className="w-10 h-10 rounded-lg object-cover border border-gray-800" alt="" />
                                  <span className="text-sm font-medium text-white truncate max-w-[150px]">{listing.title}</span>
                                </div>
                              </td>
                              <td className="py-4 text-sm font-bold text-white">Rs. {listing.price}</td>
                              <td className="py-4">
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase border border-green-500/20">Active</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sidebar Activity */}
                  <div className="glass-panel p-6">
                    <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Activity</h2>
                    <div className="space-y-4">
                      <ActivityItem icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} title="Product Verified" time="2 hours ago" desc="Your account listing was approved." />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'listings' && (
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-bold text-white">Manage Listings</h2>
                   <button 
                     onClick={() => {
                        if (isVerified) {
                          navigate('/sell');
                        } else {
                          setMessage({ text: 'Access Denied: Please wait until your account is verified by an admin.', type: 'error' });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                     }} 
                     className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all ${
                        isVerified ? 'bg-primary text-white shadow-primary/20 hover:scale-105' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                     }`}
                   >
                     + Add Listings
                   </button>
                </div>

                {myListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {myListings.map(listing => (
                       <div key={listing.id} className="bg-gray-800/40 border border-gray-800 p-4 rounded-2xl group relative transition-all hover:bg-gray-800/60">
                          <img src={listing.thumbnail} className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-700" alt="" />
                          <h4 className="text-white font-bold truncate mb-1">{listing.title}</h4>
                          <p className="text-primary font-bold text-sm mb-4">Rs. {listing.price}</p>
                          <div className="flex items-center gap-2">
                             <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                               <Edit2 className="w-3 h-3" /> Edit
                             </button>
                             <button 
                               onClick={() => handleDeleteListing(listing.id)} 
                               className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="glass-panel border-gray-800 p-12 text-center bg-gray-800/20">
                    <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-xl">
                      <LayoutDashboard className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Listings Found</h3>
                    <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                      You haven't posted any accounts for sale yet. Your active inventory will appear here. Start selling today!
                    </p>
                    <button 
                      onClick={() => navigate('/sell')}
                      className="px-10 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all flex items-center gap-3 mx-auto active:scale-95"
                    >
                      <Plus className="w-5 h-5" /> Post Your First Listing
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="glass-panel p-12 text-center text-gray-400">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-white mb-2">No Sales Yet</h3>
                <p className="text-sm max-w-sm mx-auto">Your sales and incoming orders will appear here once customers start buying your digital assets.</p>
              </div>
            )}
          </main>
        </div>
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
