import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Users, Package, AlertTriangle, CheckCircle2, 
  XCircle, Search, Filter, BarChart3, Settings, MoreVertical, 
  Trash2, Eye, TrendingUp, DollarSign, Activity, Bell, 
  ArrowUpRight, ArrowDownRight, LayoutGrid, List, UserCheck, Link2, MousePointer2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { turso } from '../lib/turso';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, listings, users, reports, ads
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingReports: 0,
    totalRevenue: 0,
    growth: 12.5
  });
  
  const [data, setData] = useState({
    listings: [],
    users: [],
    reports: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // all, seller, buyer
  const navigate = useNavigate();

  const [adLinks, setAdLinks] = useState({
    buynow: '',
    whatsapp: '',
    search: ''
  });

  useEffect(() => {
    const checkAdmin = async () => {
      // Check for Master Admin Bypass first
      const isMaster = localStorage.getItem('isMasterAdmin');
      if (isMaster === 'true') {
        fetchAdminData();
        fetchAdSettings();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin/login');
        return;
      }

      // Check role from database for security
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        navigate('/');
        return;
      }

      fetchAdminData();
      fetchAdSettings();
    };

    checkAdmin();
  }, [navigate]);

  const fetchAdSettings = async () => {
    try {
      const { rows } = await turso.execute("SELECT * FROM platform_settings");
      const links = { buynow: '', whatsapp: '', search: '' };
      rows.forEach(row => {
        if (row.key === 'ad_link_buynow') links.buynow = row.value;
        if (row.key === 'ad_link_whatsapp') links.whatsapp = row.value;
        if (row.key === 'ad_link_search') links.search = row.value;
      });
      setAdLinks(links);
    } catch (err) {
      console.error("Error fetching ad settings:", err);
    }
  };

  const handleUpdateAdLink = async (key, value) => {
    try {
      // Use INSERT OR REPLACE to ensure it works even if row is missing
      await turso.execute({
        sql: "INSERT OR REPLACE INTO platform_settings (key, value) VALUES (?, ?)",
        args: [`ad_link_${key}`, value]
      });
      alert(`${key.toUpperCase()} link updated successfully!`);
      fetchAdSettings();
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // Fetching listings from Turso
      const { rows: listingsRows } = await turso.execute("SELECT * FROM listings ORDER BY created_at DESC");
      const listingCount = listingsRows.length;
      
      // Fetch profiles from Supabase to join with listings
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const listings = (listingsRows || []).map(listing => {
        const sellerProfile = users?.find(u => u.id === listing.seller_id);
        return {
          ...listing,
          profiles: sellerProfile ? {
            full_name: sellerProfile.full_name,
            email: sellerProfile.email
          } : null
        };
      });

      setStats({
        totalUsers: userCount || 0,
        totalListings: listingCount || 0,
        pendingReports: (users || []).filter(u => u.role === 'seller' && !u.is_verified).length || 0,
        totalRevenue: (listingsRows || []).reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0) || 0,
        growth: 15.8
      });

      setData({
        listings: listings || [],
        users: users || [],
        reports: [
          { id: 1, type: 'Scam', user: 'UserX', target: 'Acc#123', status: 'Pending', date: '2024-04-26' },
          { id: 2, type: 'Fake Info', user: 'Gamer99', target: 'Acc#456', status: 'Resolved', date: '2024-04-25' }
        ]
      });
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;

      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === id ? { ...u, is_verified: !currentStatus } : u)
      }));
    } catch (err) {
      alert("Verification failed: " + err.message);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await turso.execute({
        sql: "DELETE FROM listings WHERE id = ?",
        args: [id]
      });
      setData(prev => ({ ...prev, listings: prev.listings.filter(l => l.id !== id) }));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const statsCards = [
    { label: 'Total Revenue', value: stats.totalRevenue.toLocaleString(), icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: 12 },
    { label: 'Total Users', value: stats.totalUsers, icon: <Users />, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 8 },
    { label: 'Active Listings', value: stats.totalListings, icon: <Package />, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: -3 },
    { label: 'Platform Growth', value: `${stats.growth}%`, icon: <TrendingUp />, color: 'text-orange-500', bg: 'bg-orange-500/10', trend: 5 }
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07090e]">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-300 font-sans">
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-72 bg-[#0a0c14] border-r border-slate-800/50 flex flex-col z-20">
          <div className="p-8 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2.5 rounded-xl border border-red-500/20 shadow-lg shadow-red-500/10">
                <ShieldCheck className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-widest uppercase">Admin<span className="text-red-500">HQ</span></h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control Center 5.0 (Final)</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <SidebarLink icon={<BarChart3 />} label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarLink icon={<Package />} label="Listings" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
            <SidebarLink icon={<Users />} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarLink icon={<AlertTriangle />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} count={stats.pendingReports} />
            <SidebarLink icon={<Link2 />} label="Ads Management" active={activeTab === 'ads'} onClick={() => setActiveTab('ads')} />
            
            <div className="pt-6 my-6 border-t border-slate-800/50">
              <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">System</p>
              <SidebarLink icon={<Bell />} label="Notifications" />
              <SidebarLink icon={<Settings />} label="Settings" />
            </div>
          </nav>

          <div className="p-6 border-t border-slate-800/50">
            <button onClick={() => window.location.href = '/'} className="w-full py-3 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700/50">Exit Portal</button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-[#07090e] overflow-hidden relative">
          <header className="h-20 border-b border-slate-800/50 bg-[#07090e]/50 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">{activeTab}</h2>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <p className="text-xs text-slate-500 font-medium">Monitoring real-time platform activity</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat, idx) => <StatCard key={idx} {...stat} />)}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-panel border-slate-800/50 p-8 h-80 flex items-center justify-center text-slate-600 font-bold uppercase tracking-widest">Activity Chart Area</div>
                    <div className="glass-panel border-slate-800/50 p-8 flex flex-col">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Recent Alerts</h3>
                      <div className="space-y-4 flex-1">
                        {data.reports.map((report, i) => (
                          <div key={i} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            <div><p className="text-sm font-bold text-white">{report.type} Report</p><p className="text-[10px] text-slate-500">By {report.user}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'listings' && (
                <motion.div key="listings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel border-slate-800/50 overflow-hidden">
                  <DataTable 
                    title="Active Listings" 
                    columns={['Listing', 'Seller', 'Price', 'Actions']}
                    data={data.listings}
                    renderRow={(listing) => (
                      <tr key={listing.id} className="hover:bg-slate-800/30 transition-all border-b border-slate-800/50 last:border-0 font-medium">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <img src={listing.thumbnail} className="w-14 h-14 rounded-2xl object-cover border border-slate-700" alt="" />
                            <div><span className="text-sm font-bold text-white block">{listing.title}</span><span className="text-[10px] text-slate-600 block">ID: {String(listing.id).substring(0, 8)}</span></div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-slate-200">{listing.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-[10px] text-slate-500">{listing.profiles?.email}</div>
                        </td>
                        <td className="px-8 py-5 font-black text-white text-sm">Rs. {parseFloat(listing.price).toLocaleString()}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/listing/${listing.id}`} target="_blank" className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-primary"><Eye className="w-4 h-4" /></Link>
                            <button onClick={() => handleDeleteListing(listing.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                  />
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  {/* Role Filter Tabs */}
                  <div className="flex gap-2 p-1.5 bg-slate-900/50 border border-slate-800/50 rounded-2xl w-fit">
                    <button 
                      onClick={() => setUserRoleFilter('all')}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userRoleFilter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      All Users
                    </button>
                    <button 
                      onClick={() => setUserRoleFilter('seller')}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userRoleFilter === 'seller' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Sellers
                    </button>
                    <button 
                      onClick={() => setUserRoleFilter('buyer')}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userRoleFilter === 'buyer' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Buyers
                    </button>
                  </div>

                  <div className="glass-panel border-slate-800/50 overflow-hidden">
                    <DataTable 
                      title={`${userRoleFilter === 'all' ? 'All' : (userRoleFilter === 'seller' ? 'Seller' : 'Buyer')} Management`}
                      columns={['Identity', 'Role', 'Status', 'Actions']}
                      data={data.users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)}
                      renderRow={(u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-all border-b border-slate-800/50 last:border-0">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name || 'U'}`} className="w-10 h-10 rounded-full" alt="" />
                              <div><p className="text-sm font-bold text-white">{u.full_name || 'Anonymous'}</p><p className="text-[10px] text-slate-500">{u.email}</p></div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${u.role === 'seller' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <button onClick={() => handleVerifyUser(u.id, u.is_verified)} className={`p-1.5 rounded-full ${u.is_verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {u.is_verified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-8 py-5 text-right"><button className="p-2.5 bg-slate-800 rounded-xl"><MoreVertical className="w-4 h-4" /></button></td>
                        </tr>
                      )}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div key="reports" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel border-slate-800/50 p-10">
                   <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4">Platform Reports</h3>
                   <p className="text-sm text-slate-500">System reports and user complaints will appear here.</p>
                </motion.div>
              )}

              {activeTab === 'ads' && (
                <motion.div key="ads" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                  <div className="glass-panel border-slate-800/50 p-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20"><Link2 className="w-6 h-6 text-primary" /></div>
                      <div><h3 className="text-xl font-black text-white uppercase tracking-wider">Ads Management</h3><p className="text-sm text-slate-500">Configure separate ad links for each placement</p></div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 max-w-3xl">
                      {/* Buy Now Link */}
                      <div className="space-y-4 p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                          <MousePointer2 className="w-4 h-4 text-primary" />
                          <label className="text-xs font-black text-white uppercase tracking-widest">Buy Now Button Link</label>
                        </div>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Buy Now Ad Link..." 
                            value={adLinks.buynow} 
                            onChange={(e) => setAdLinks(prev => ({ ...prev, buynow: e.target.value }))}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary transition-all" 
                          />
                          <button onClick={() => handleUpdateAdLink('buynow', adLinks.buynow)} className="px-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Update</button>
                        </div>
                      </div>

                      {/* WhatsApp Link */}
                      <div className="space-y-4 p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                          <MousePointer2 className="w-4 h-4 text-emerald-500" />
                          <label className="text-xs font-black text-white uppercase tracking-widest">WhatsApp Button Link</label>
                        </div>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            placeholder="WhatsApp Ad Link..." 
                            value={adLinks.whatsapp} 
                            onChange={(e) => setAdLinks(prev => ({ ...prev, whatsapp: e.target.value }))}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary transition-all" 
                          />
                          <button onClick={() => handleUpdateAdLink('whatsapp', adLinks.whatsapp)} className="px-6 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Update</button>
                        </div>
                      </div>

                      {/* Search Link */}
                      <div className="space-y-4 p-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Search className="w-4 h-4 text-blue-500" />
                          <label className="text-xs font-black text-white uppercase tracking-widest">Global Search Link</label>
                        </div>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Search Ad Link..." 
                            value={adLinks.search} 
                            onChange={(e) => setAdLinks(prev => ({ ...prev, search: e.target.value }))}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary transition-all" 
                          />
                          <button onClick={() => handleUpdateAdLink('search', adLinks.search)} className="px-6 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Update</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick, count }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'}`}>
    <div className="flex items-center gap-4">{React.cloneElement(icon, { className: 'w-5 h-5' })}<span className="text-sm font-bold">{label}</span></div>
    {count !== undefined && <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>{count}</span>}
  </button>
);

const StatCard = ({ label, value, icon, color, bg, trend }) => (
  <div className="glass-panel border-slate-800/50 p-7 hover:bg-slate-800/20 transition-all cursor-default">
    <div className="flex items-start justify-between mb-6">
      <div className={`p-3.5 rounded-2xl border ${bg} ${color.replace('text', 'border')}`}>{React.cloneElement(icon, { className: 'w-6 h-6' })}</div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(trend)}%</div>
    </div>
    <div><span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span><div className="text-3xl font-black text-white mt-2">{value}</div></div>
  </div>
);

const DataTable = ({ title, columns, data, renderRow }) => (
  <div className="flex flex-col h-full">
    <div className="px-10 py-8 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/10">
      <div><h3 className="text-lg font-black text-white uppercase tracking-[0.1em]">{title}</h3><p className="text-xs text-slate-600 mt-1">{data.length} records found</p></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-900/50 text-slate-600 uppercase text-[10px] font-black tracking-[0.15em]"><tr>{columns.map((col, i) => <th key={i} className="px-10 py-5">{col}</th>)}</tr></thead><tbody className="divide-y divide-slate-800/50">{data.length > 0 ? data.map(renderRow) : <tr><td colSpan={columns.length} className="px-10 py-20 text-center text-slate-600 uppercase font-black tracking-widest">No matching data found.</td></tr>}</tbody></table></div>
  </div>
);

const AdPlacementCard = ({ icon, label, location }) => (
  <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl group hover:border-primary/30 transition-all">
    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors mb-4">{React.cloneElement(icon, { className: 'w-5 h-5' })}</div>
    <div className="text-xs font-black text-white uppercase tracking-widest mb-1">{label}</div>
    <div className="text-[10px] text-primary font-bold">{location}</div>
  </div>
);

export default AdminDashboard;
