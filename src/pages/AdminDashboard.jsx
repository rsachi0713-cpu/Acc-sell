import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Users, Package, AlertTriangle, CheckCircle2, 
  XCircle, Search, Filter, BarChart3, Settings, MoreVertical, 
  Trash2, Eye, TrendingUp, DollarSign, Activity, Bell, 
  ArrowUpRight, ArrowDownRight, LayoutGrid, List, UserCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, listings, users, reports
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

  useEffect(() => {
    const checkAdmin = async () => {
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
    };

    checkAdmin();
  }, [navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: listingCount } = await supabase.from('listings').select('*', { count: 'exact', head: true });
      
      const { data: listings } = await supabase
        .from('listings')
        .select('*, profiles:seller_id(full_name, email)')
        .order('created_at', { ascending: false });

      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setStats({
        totalUsers: userCount || 0,
        totalListings: listingCount || 0,
        pendingReports: users?.filter(u => u.role === 'seller' && !u.is_verified).length || 0,
        totalRevenue: listings?.reduce((acc, curr) => acc + (curr.price || 0), 0) || 0,
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
    if (!window.confirm('Are you sure you want to delete this listing? It will be permanently removed.')) return;
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) {
      setData(prev => ({ ...prev, listings: prev.listings.filter(l => l.id !== id) }));
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
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
      </div>
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
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control Center 4.0</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <SidebarLink icon={<BarChart3 />} label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarLink icon={<Package />} label="Listings" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
            <SidebarLink icon={<Users />} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarLink icon={<AlertTriangle />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} count={stats.pendingReports} />
            
            <div className="pt-6 my-6 border-t border-slate-800/50">
              <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">System</p>
              <SidebarLink icon={<Bell />} label="Notifications" />
              <SidebarLink icon={<Settings />} label="Settings" />
            </div>
          </nav>

          <div className="p-6 border-t border-slate-800/50">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700/50"
            >
              Exit Portal
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-[#07090e] overflow-hidden relative">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-red-500/5 blur-[120px] pointer-events-none"></div>

          <header className="h-20 border-b border-slate-800/50 bg-[#07090e]/50 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">{activeTab}</h2>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <p className="text-xs text-slate-500 font-medium">Monitoring real-time platform activity</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Global Search..." 
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl py-2.5 pl-12 pr-6 text-xs focus:ring-1 focus:ring-primary outline-none w-64 transition-all focus:w-80 placeholder-slate-600" 
                />
              </div>
              <button className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors text-slate-400 hover:text-white">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#07090e]"></span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat, idx) => (
                      <StatCard key={idx} {...stat} />
                    ))}
                  </div>

                  {/* Secondary Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-panel border-slate-800/50 p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-widest">Platform Activity</h3>
                          <p className="text-xs text-slate-500 mt-1">Transaction and listing volume over time</p>
                        </div>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg bg-slate-800 text-white">Week</button>
                          <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg text-slate-500 hover:text-slate-300">Month</button>
                        </div>
                      </div>
                      <div className="h-64 flex items-end gap-3 px-4">
                        {[40, 65, 45, 90, 55, 75, 40, 60, 85, 45, 70, 50].map((h, i) => (
                          <div key={i} className="flex-1 group relative">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              className="w-full bg-gradient-to-t from-primary/20 to-primary/60 rounded-t-lg group-hover:from-primary/40 group-hover:to-primary transition-all duration-300"
                            />
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Value: {h * 12}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-between px-2">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                          <span key={m} className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{m}</span>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel border-slate-800/50 p-8 flex flex-col">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Recent Alerts</h3>
                      <div className="space-y-4 flex-1">
                        {data.reports.map((report, i) => (
                          <div key={i} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4 hover:border-slate-700 transition-all cursor-pointer group">
                            <div className={`p-2 rounded-xl shrink-0 ${report.status === 'Pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{report.type} Report</p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">By {report.user} on {report.target}</p>
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 whitespace-nowrap">2h ago</div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black uppercase tracking-widest rounded-xl transition-all">View All Reports</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'listings' && (
                <motion.div 
                  key="listings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-panel border-slate-800/50 overflow-hidden"
                >
                  <DataTable 
                    title="Active Listings" 
                    columns={['Listing', 'Seller', 'Price', 'Earnings', 'Status', 'Actions']}
                    data={data.listings}
                    renderRow={(listing) => (
                      <tr key={listing.id} className="hover:bg-slate-800/30 transition-all group border-b border-slate-800/50 last:border-0 font-medium">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                              <img src={listing.thumbnail} className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-xl" alt="" />
                              <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                                <Activity className="w-3 h-3 text-primary" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-white block truncate max-w-[240px] group-hover:text-primary transition-colors">{listing.title}</span>
                              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1 block">ID: {listing.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-700">
                              {listing.profiles?.full_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-slate-200">{listing.profiles?.full_name || 'System'}</div>
                               <div className="text-[10px] text-slate-600 truncate max-w-[120px]">{listing.profiles?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-black text-white text-sm">Rs. {listing.price.toLocaleString()}</td>
                        <td className="px-8 py-5 text-emerald-500 font-bold text-sm">Rs. {(listing.price * 0.9).toLocaleString()}</td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-500/20">Active</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Link to={`/listing/${listing.id}`} className="p-2.5 bg-slate-800 rounded-xl hover:bg-primary/20 hover:text-primary transition-all shadow-lg"><Eye className="w-4 h-4" /></Link>
                            <button onClick={() => handleDeleteListing(listing.id)} className="p-2.5 bg-slate-800 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all shadow-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                  />
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div 
                  key="users"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-panel border-slate-800/50 overflow-hidden"
                >
                  <div className="flex items-center gap-4 px-10 py-6 border-b border-slate-800/30">
                    <button 
                      onClick={() => setUserRoleFilter('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${userRoleFilter === 'all' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      All Users
                    </button>
                    <button 
                      onClick={() => setUserRoleFilter('seller')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${userRoleFilter === 'seller' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Sellers Only
                    </button>
                    <button 
                      onClick={() => setUserRoleFilter('buyer')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${userRoleFilter === 'buyer' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Buyers Only
                    </button>
                  </div>
                  <DataTable 
                    title={`${userRoleFilter === 'all' ? 'Total' : userRoleFilter.charAt(0).toUpperCase() + userRoleFilter.slice(1)} Management`} 
                    columns={['Identity', 'Access Level', 'Registration Key', 'Verified', 'Actions']}
                    data={data.users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter)}
                    renderRow={(u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-all group border-b border-slate-800/50 last:border-0">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            {u.role === 'admin' ? (
                              <div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-500 shadow-xl">
                                <ShieldCheck className="w-6 h-6" />
                              </div>
                            ) : (
                              <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name || 'U'}`} className="w-12 h-12 rounded-full border border-slate-700 shadow-xl p-0.5 bg-slate-900" alt="" />
                            )}
                            <div>
                              <span className="text-sm font-bold text-white block">{u.full_name || 'Anonymous Entity'}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{u.email || u.id.substring(0, 20)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${
                            u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            u.role === 'seller' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.role === 'admin' ? 'bg-red-500' : u.role === 'seller' ? 'bg-primary' : 'bg-slate-400'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{u.role || 'buyer'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-mono text-[10px] text-slate-600 font-bold uppercase tracking-widest">{u.id}</td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => handleVerifyUser(u.id, u.is_verified)}
                            className={`p-1.5 rounded-full inline-flex transition-all hover:scale-110 ${
                              u.is_verified 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5'
                            }`}
                            title={u.is_verified ? "Unverify User" : "Verify User"}
                          >
                            {u.is_verified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="p-2.5 bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-all"><MoreVertical className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    )}
                  />
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
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
      active 
      ? 'bg-primary text-white shadow-xl shadow-primary/20' 
      : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </div>
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
        {count}
      </span>
    )}
  </button>
);

const StatCard = ({ label, value, icon, color, bg, trend }) => (
  <div className="glass-panel border-slate-800/50 p-7 group hover:bg-slate-800/20 transition-all duration-300 cursor-default">
    <div className="flex items-start justify-between mb-6">
      <div className={`p-3.5 rounded-2xl border transition-all duration-500 group-hover:scale-110 ${bg} ${color.replace('text', 'border')}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(trend)}%
      </div>
    </div>
    <div>
      <span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span>
      <div className="text-3xl font-black text-white mt-2 group-hover:text-primary transition-colors">{value}</div>
    </div>
  </div>
);

const DataTable = ({ title, columns, data, renderRow }) => (
  <div className="flex flex-col h-full">
    <div className="px-10 py-8 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/10">
      <div>
        <h3 className="text-lg font-black text-white uppercase tracking-[0.1em]">{title}</h3>
        <p className="text-xs text-slate-600 mt-1 font-medium">{data.length} records found in the directory</p>
      </div>
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"><Filter className="w-4 h-4" /> Filter</button>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"><LayoutGrid className="w-4 h-4" /> Views</button>
      </div>
    </div>

    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left">
        <thead className="bg-slate-900/50 text-slate-600 uppercase text-[10px] font-black tracking-[0.15em] sticky top-0 md:relative">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-10 py-5">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {data.length > 0 ? (
            data.map(renderRow)
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-10 py-20 text-center">
                <div className="flex flex-col items-center gap-4 text-slate-600 font-bold uppercase tracking-widest">
                  <XCircle className="w-12 h-12 opacity-20" />
                  No matching data vectors found.
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminDashboard;

