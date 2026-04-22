// src/pages/Login.jsx 
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert("Google Auth Error: " + error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login Error: " + error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <span className="text-white text-2xl font-bold">C</span>
          </div>

          <h1 className="mt-6 text-3xl font-semibold text-white tracking-tight">
            Calyxia
          </h1>

          <p className="text-gray-400 mt-2 text-sm">
            Product Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-2xl p-8 shadow-2xl">

          <div className="mb-6">
            <h2 className="text-xl text-white font-medium">
              Sign in
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Access your workspace
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4
                       bg-white text-black rounded-lg font-medium
                       hover:bg-gray-200 transition duration-200
                       disabled:opacity-60"
          >
            {/* Google Icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.72 1.22 9.21 3.6l6.85-6.85C35.9 2.36 30.41 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.11 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.43-4.55H24v9.02h12.94c-.56 2.98-2.24 5.52-4.77 7.22l7.3 5.66c4.27-3.92 6.51-9.72 6.51-17.35z"
              />
              <path
                fill="#FBBC05"
                d="M10.54 28.43a14.5 14.5 0 0 1 0-9.25l-7.98-6.2A24 24 0 0 0 0 24c0 3.84.91 7.47 2.56 10.22l7.98-5.79z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.41 0 11.8-2.12 15.73-5.77l-7.3-5.66c-2.03 1.36-4.63 2.17-8.43 2.17-6.26 0-11.57-3.61-13.46-8.77l-7.98 5.79C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            {loading ? "Connecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#1f1f23]" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-[#1f1f23]" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black border border-[#1f1f23]
                         text-white placeholder-gray-500
                         focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black border border-[#1f1f23]
                         text-white placeholder-gray-500
                         focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700
                         text-white font-medium transition duration-200
                         shadow-lg shadow-purple-900/20 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don’t have an account?{" "}
            <a href="/register" className="text-purple-400 hover:text-purple-300">
              Register
            </a>
          </p>

        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Secure login powered by Supabase
        </p>

      </div>
    </div>
  );
}