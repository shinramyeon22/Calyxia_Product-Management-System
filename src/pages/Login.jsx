import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
   
  const { error } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) alert(authError.message);
    setLoading(false);
  };

  const params = new URLSearchParams(window.location.search);
  const errorParam = params.get('error'); 
  // If errorParam === 'not_activated', show "Account not yet active."

  return (
    <div className="auth-container p-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      {/* Login Guard Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Professor's Button Layout (Tailwind) */}
      <div className="flex flex-col gap-3">
        {/* Email/Password form */}
        <input 
          type="email" 
          placeholder="Email" 
          className="border p-2 rounded"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="border p-2 rounded"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button 
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          onClick={handleEmailLogin}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Sign In'}
        </button>

        <div className="divider text-center my-2 text-gray-500">OR</div>

        {/* Google OAuth button */}
        <button 
          className="flex items-center justify-center gap-2 border p-2 rounded hover:bg-gray-50"
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` }
            })
          }
        >
          <img src="/google-icon.svg" alt="" className="w-5 h-5" /> 
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;