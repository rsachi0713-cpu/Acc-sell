import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ChevronRight, AlertCircle, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Fetch role from profiles table (Source of Truth)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access Denied: Your account does not have administrator privileges in the database.');
      }

      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080c] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4 shadow-2xl shadow-red-500/10">
            <ShieldCheck className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Admin Authentication</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Secured Internal Management Gateway</p>
        </div>

        <div className="bg-[#0d0f17] border border-gray-800 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {error && (
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg flex gap-3 items-center"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-200 text-xs font-semibold leading-tight">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Admin Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 h-4 text-gray-600 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-black border border-gray-800 rounded-xl focus:border-red-500/50 focus:ring-0 text-white placeholder-gray-700 text-sm transition-all outline-none"
                  placeholder="admin@accmarket.gg"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Access Key</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 h-4 text-gray-600 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-black border border-gray-800 rounded-xl focus:border-red-500/50 focus:ring-0 text-white placeholder-gray-700 text-sm transition-all outline-none"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-600/20 text-white text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 group overflow-hidden relative"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="relative z-10">Authorize Access</span>
                  <ChevronRight className="ml-2 w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <button 
            onClick={() => navigate('/')}
            className="w-full mt-8 text-center text-xs text-gray-600 hover:text-gray-400 font-bold uppercase tracking-tighter transition-colors"
          >
            ← Return to Main Portal
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-6 text-[10px] text-gray-700 font-bold uppercase tracking-[0.2em]">
          <span>Security Protocol 4.0</span>
          <span>•</span>
          <span>Encrypted Session</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
