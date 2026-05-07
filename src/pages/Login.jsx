import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (error) {
      setError("Google Auth Error: " + error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Login Error: " + error.message);
      setLoading(false);
    } else {
      navigate('/products');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#050505] overflow-hidden">
      {/* Left Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] items-center justify-center overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 opacity-70">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" 
            alt="Luxury Showroom" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-12">
          <h2 className="serif-font text-[180px] leading-none text-white/10 select-none">CX</h2>
          <p className="text-[#d4af37] text-xs tracking-[0.5em] mt-6">THE PRIVATE PRODUCT</p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-16">
            <h1 className="serif-font text-6xl italic tracking-tighter">Calyxia</h1>
            <p className="text-white/50 mt-3 text-sm tracking-widest">MANAGEMENT ENTERPRISE</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 text-sm tracking-widest">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-black py-5 rounded-sm flex items-center justify-center gap-3 text-sm tracking-widest hover:bg-zinc-200 transition disabled:opacity-70"
          >
            Continue with Google
          </button>

          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-white/40 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <input 
              type="email" 
              placeholder="EMAIL ADDRESS" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-white placeholder:text-white/40 focus:border-[#d4af37] outline-none text-sm tracking-widest"
              required
            />
            <input 
              type="password" 
              placeholder="PASSWORD" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-white placeholder:text-white/40 focus:border-[#d4af37] outline-none text-sm tracking-widest"
              required
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] text-black py-5 text-xs tracking-[0.125em] font-medium hover:bg-white transition disabled:opacity-70"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <p className="text-center text-xs text-white/50 mt-12">
            Don't have access?{' '}
            <Link to="/register" className="text-[#d4af37] hover:underline">Register Identity</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
