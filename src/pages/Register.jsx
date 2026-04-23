import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // MUST match your Login.jsx and App.jsx route
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
  e.preventDefault();
  setLoading(true);
  setSuccessMsg(''); // Clear previous messages

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: `${window.location.origin}/auth/callback` 
    }
  });

  if (error) {
    // This handles "User already registered" or "Password too short"
    alert("Registration Error: " + error.message);
  } else if (data.user && data.session === null) {
    // This happens if email confirmation is ON
    setSuccessMsg('Success! Please check your email to confirm your account.');
  } else {
    // This happens if email confirmation is OFF
    setSuccessMsg('Account created! Redirecting to login...');
    setTimeout(() => navigate('/login'), 2000);
  }
  setLoading(false);
};

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-white tracking-tight">Calyxia</h1>
          <p className="text-gray-400 mt-2 text-sm">Join the workspace</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-2xl p-8 shadow-2xl">
          {successMsg ? (
            <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-center">
              {successMsg}
            </div>
          ) : (
            <>
              <h2 className="text-xl text-white font-medium mb-6">Create account</h2>
              
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition duration-200 disabled:opacity-60"
              >
                <img src="https://authjs.dev/img/providers/google.svg" width="18" alt="Google" />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#1f1f23]" />
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 h-px bg-[#1f1f23]" />
              </div>

              <form onSubmit={handleEmailRegister} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-[#1f1f23] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-[#1f1f23] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition duration-200 disabled:opacity-60"
                >
                  {loading ? "Processing..." : "Register"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;