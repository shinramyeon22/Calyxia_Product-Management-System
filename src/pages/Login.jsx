import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-70">
          <img 
            src="https://i.pinimg.com/736x/9a/5c/e2/9a5ce2ac05544aa4ae130cbde8632890.jpg" 
            alt="Office with city view at dusk" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent via-transparent via-black/40 via-black/70 to-black" />
        </div>
        
        <div className="relative z-10 text-center px-12">
          <h2 className="serif-font text-[180px] leading-none text-[#d4af37] select-none">CX</h2>
          <p className="text-[#d4af37] text-xs tracking-[0.5em] mt-6">THE PRIVATE PRODUCT</p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#050505]">
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

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <input 
              type="email" 
              placeholder="EMAIL ADDRESS" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-white placeholder:text-white/40 focus:border-[#d4af37] outline-none text-sm tracking-widest"
              required
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="PASSWORD" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-4 text-white placeholder:text-white/40 focus:border-[#d4af37] outline-none text-sm tracking-widest pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? (
                  // Open eye — password is visible, click to hide
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12 C6 6, 18 6, 22 12 C18 18, 6 18, 2 12 Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  // Closed eye with lashes — password is hidden, click to show
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 8 C6 14, 18 14, 22 8" />
                    <line x1="12" y1="14" x2="12" y2="17" />
                    <line x1="8"  y1="13" x2="7"  y2="16" />
                    <line x1="16" y1="13" x2="17" y2="16" />
                  </svg>
                )}
              </button>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] text-black py-5 text-xs tracking-[0.125em] font-medium hover:bg-white transition disabled:opacity-70"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-white/40 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-black py-5 rounded-sm flex items-center justify-center gap-3 text-sm tracking-widest hover:bg-zinc-200 transition disabled:opacity-70"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-white/50 mt-12">
            Don't have access?{' '}
            <Link to="/register" className="text-[#d4af37] hover:underline">Register Identity</Link>
          </p>
        </div>
      </div>
    </div>
  );
}