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
    const statusCode = params.get('status');
    if (!errorCode && !statusCode) return;

    let message = '';
    if (statusCode === 'pending_approval') {
      message = 'Account created! Your account is inactive pending SuperAdmin approval.';
    } else if (errorCode === 'not_activated') {
      message = 'Your account is inactive. Contact your SuperAdmin to reactivate access.';
    } else if (errorCode === 'auth_failed') {
      message = 'Authentication failed. Please try signing in again.';
    } else if (errorCode) {
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
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (error) {
      setError('Google sign-in failed: ' + error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from('app_user')
        .select('record_status, user_type')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        const userType = String(profile.user_type || '').toUpperCase();
        if (userType !== 'SUPERADMIN') {
          const status = String(profile.record_status || '').toUpperCase();
          if (status !== 'A' && status !== 'ACTIVE') {
            await supabase.auth.signOut();
            setError('Your account is inactive. Contact your SuperAdmin.');
            setLoading(false);
            return;
          }
        }
      }
      navigate('/admin/products');
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8faff] overflow-hidden">

      {/* ── Left: Purple brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#6366f1] to-[#4338ca] items-center justify-center overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10 text-center px-12">
          <h2 className="serif-font text-[160px] leading-none text-white/20 select-none font-bold">CX</h2>
          <div className="mt-2">
            <p className="serif-font text-4xl italic text-white tracking-tight">Calyxia</p>
            <p className="text-white/60 text-xs tracking-[0.5em] mt-2 uppercase">Management Enterprise</p>
          </div>
          <div className="mt-12 flex flex-col gap-3 text-left max-w-xs mx-auto">
            {['Secure product vault', 'Role-based access control', 'Real-time updates'].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white/80 flex-shrink-0" />
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: White form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="serif-font text-5xl italic text-[#1e1b4b] tracking-tighter">Calyxia</h1>
            <p className="text-slate-400 mt-2 text-xs tracking-[0.3em] uppercase">Welcome back — sign in to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-5 py-3.5 text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition text-sm"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#6366f1] hover:text-[#4f46e5] transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-5 py-3.5 text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword
                    ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.88 9.88l-3.29-3.29m14.83 12.83l-3.29-3.29M12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61m-7.39-7.39a3 3 0 1 1 4.24 4.24"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] active:scale-[0.98] text-white py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all shadow-lg shadow-[#6366f1]/25 disabled:opacity-60 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3.5 rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold tracking-wide transition-all disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-slate-400 mt-8">
            No account?{' '}
            <Link to="/register" className="text-[#6366f1] font-semibold hover:text-[#4f46e5] transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
