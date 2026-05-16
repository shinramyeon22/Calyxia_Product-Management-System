import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('error');
    if (!errorCode) return;

    let message = '';
    if (errorCode === 'not_activated') {
      message = 'Your account is INACTIVE and blocked from signing in. Contact your administrator to reactivate access.';
    } else if (errorCode === 'auth_failed') {
      message = 'Authentication failed. Please try signing in again or contact support.';
    } else {
      message = `Login failed: ${errorCode}`;
    }

    setTimeout(() => setError(message), 0);
  }, [location.search]);

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

    try {
      // 1. Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // 2. Fetch the profile to check status
      const { data: profile, error: profileError } = await supabase
        .from('app_user')
        .select('record_status')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. 🛡️ THE GATEKEEPER CHECK
      // This allows 'A' or 'ACTIVE' and blocks everything else (like 'I' or 'INACTIVE')
      const status = profile?.record_status;
      if (status !== 'A' && status !== 'ACTIVE') {
        await supabase.auth.signOut(); 
        setError("Access Denied: Your account is pending admin approval.");
        setLoading(false);
        return; 
      }

      // 4. Success!
      navigate('/products');

    } catch (err) {
      setError("Login Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom styles to remove the yellow autofill background
  const inputStyles = {
    WebkitBoxShadow: '0 0 0 1000px #050505 inset',
    WebkitTextFillColor: 'white',
    transition: 'background-color 5000s ease-in-out 0s',
  };

  return (
    <div className="min-h-screen w-full flex bg-[#050505] overflow-hidden">
      {/* Left Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-70">
          <img 
            src="https://i.pinimg.com/736x/9a/5c/e2/9a5ce2ac05544aa4ae130cbde8632890.jpg" 
            alt="Office View" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/80" />
        </div>
        
        <div className="relative z-10 text-center px-12">
          <h2 className="serif-font text-[180px] leading-none text-[#d4af37] select-none">CX</h2>
          <p className="text-[#d4af37] text-xs tracking-[0.5em] mt-6">THE PRIVATE PRODUCT</p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#050505]">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="serif-font text-6xl italic tracking-tighter">Calyxia</h1>
            <p className="text-white/50 mt-3 text-xs tracking-[0.3em]">MANAGEMENT ENTERPRISE</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-500/50 text-red-400 text-xs tracking-widest rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] tracking-[0.2em] text-white/40 mb-3 ml-1 uppercase">Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyles}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 outline-none text-sm transition-all"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Password</label>
                <Link to="/forgot-password" size="xs" className="text-[10px] tracking-widest text-[#d4af37]/60 hover:text-[#d4af37]">Forgot password?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyles}
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 outline-none text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.88 9.88l-3.29-3.29m14.83 12.83l-3.29-3.29M12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61m-7.39-7.39a3 3 0 1 1 4.24 4.24"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] text-black py-4 rounded-2xl text-xs tracking-[0.2em] font-bold hover:bg-[#c4a030] active:scale-[0.98] transition-all disabled:opacity-70 mt-4 shadow-lg shadow-[#d4af37]/10"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-white/5"></div>
            <span className="text-[10px] text-white/20 tracking-[0.3em]">OR</span>
            <div className="flex-1 h-[1px] bg-white/5"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold tracking-widest hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[10px] text-white/30 mt-10 tracking-widest">
            No account?{' '}
            <Link to="/register" className="text-[#d4af37] font-bold hover:text-white transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}