// src/pages/Login.jsx 
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      alert(error.message); // You can replace this with a better toast later
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-3xl font-bold">C</span>
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Calyxia
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            Product Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Sign in to continue to your workspace
            </p>
          </div>

          {/* Google Button - The Star of the Show */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 
                       border border-gray-300 dark:border-gray-700 rounded-2xl
                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200
                       font-medium text-gray-700 dark:text-gray-200
                       disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <img
                  src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
                  alt="Google"
                  className="h-5"
                />
                Continue with Google
              </>
            )}
          </button>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
            <span className="text-xs uppercase tracking-widest text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
          </div>

          {/* Email/Password Form (kept minimal as per your request) */}
          <form className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-5 py-4 border border-gray-300 dark:border-gray-700 rounded-2xl 
                           focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-5 py-4 border border-gray-300 dark:border-gray-700 rounded-2xl 
                           focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-900"
              />
            </div>

            <button
              type="button"
              className="w-full py-4 bg-[#aa3bff] hover:bg-[#9a2be8] text-white font-medium rounded-2xl transition"
            >
              Sign in with Email
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Secure login powered by Supabase
        </p>
      </div>
    </div>
  );
}