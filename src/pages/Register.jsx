import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    role: 'buyer' // default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setRole = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
          role: formData.role,
          whatsapp: formData.whatsapp
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Create profile record if user created
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { id: data.user.id, full_name: formData.name, email: formData.email, role: formData.role, whatsapp: formData.whatsapp }
          ]);
        
        if (profileError) console.error('Profile creation error:', profileError);
      }

      setSuccess("Account created successfully! Redirecting to your dashboard...");
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer' });
      setTimeout(() => {
        if (formData.role === 'seller') {
          navigate('/dashboard');
        } else {
          navigate('/profile');
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join the ultimate digital marketplace</p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-gray-500">Register with email</span>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm text-center">{success}</div>}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3 text-center">Account Type</label>
            <div className="flex p-1 bg-[#0f111a] rounded-xl border border-gray-700/50">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  formData.role === 'buyer' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  formData.role === 'seller' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Seller
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2 uppercase tracking-widest font-bold">
              {formData.role === 'buyer' ? 'I want to browse and buy accounts' : 'I want to list and sell accounts'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary focus:border-primary text-gray-200 placeholder-gray-500 transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary focus:border-primary text-gray-200 placeholder-gray-500 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary focus:border-primary text-gray-200 placeholder-gray-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary focus:border-primary text-gray-200 placeholder-gray-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold text-xs">+</span>
                </div>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f111a] border border-gray-700/50 rounded-lg focus:ring-primary focus:border-primary text-gray-200 placeholder-gray-500 transition-colors"
                  placeholder="94771234567"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">International format (e.g. 94771234567)</p>
            </div>

            <div className="flex items-start mt-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 mt-0.5 rounded border-gray-700/50 bg-[#0f111a] text-primary focus:ring-primary focus:ring-offset-gray-900"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-900 transition-all active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Create Account'} {!loading && <UserPlus className="ml-2 w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
