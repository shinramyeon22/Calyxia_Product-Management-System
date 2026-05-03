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
    <div className="min-h-screen flex bg-[#0a0c10] text-white overflow-hidden">

      {/* LEFT SIDE - Background Image */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Store"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/60 to-[#0a0c10]" />

        <div className="relative z-10 text-center">
          <h1 className="text-[11rem] serif-font italic bg-gradient-to-b from-[#e8d9a8] to-[#a67c00] bg-clip-text text-transparent drop-shadow-2xl">
            CX
          </h1>
          <p className="text-[#d4af37] tracking-[0.7em] text-sm mt-[-10px]">
            THE PRIVATE COLLECTION
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-0 relative">

        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#f3d995] opacity-10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl px-8 lg:px-16 py-20 relative z-10">   {/* Increased width & padding */}

          {/* Brand */}
          <div className="text-center mb-16">
            <h1 className="text-7xl md:text-8xl serif-font italic text-[#f3d995] drop-shadow-[0_0_35px_rgba(243,217,149,0.5)]">
              Calyxia
            </h1>
            <p className="text-xs tracking-[0.6em] text-white/40 mt-4">
              MANAGEMENT ENTERPRISE
            </p>
          </div>

          {error && (
            <div className="mb-8 text-red-400 text-center text-sm bg-red-500/10 border border-red-500/30 py-3 rounded">
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-black py-5 text-lg font-medium rounded-xl flex items-center justify-center gap-4 transition-all duration-300 shadow-xl shadow-black/50"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-6 h-6"
              alt="Google"
            />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-6 my-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-sm text-white/40 tracking-[3px] uppercase">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-10">
            <div>
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/30 pb-5 text-lg tracking-widest placeholder:text-white/40 focus:border-[#f3d995] outline-none transition-all"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/30 pb-5 text-lg tracking-widest placeholder:text-white/40 focus:border-[#f3d995] outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 text-lg font-semibold tracking-[2px] bg-gradient-to-r from-[#d4af37] via-[#f3d995] to-[#c9a22f] text-black rounded-xl shadow-2xl shadow-black/60 hover:brightness-110 active:scale-[0.985] transition-all duration-200"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-white/50 mt-14 text-sm">
            Don’t have access?{" "}
            <Link to="/register" className="text-[#d4af37] hover:text-[#f3d995] transition">
              Request Identity
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}