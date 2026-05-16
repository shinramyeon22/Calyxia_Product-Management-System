import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!firstName || !lastName || !username || !email || !password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const fullName = `${firstName} ${lastName}`;
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            username: username 
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      alert('Verification link sent! Please check your email to activate your account.');
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
      <div className="w-full max-w-md border border-white/10 bg-black/50 backdrop-blur-xl p-12">
        <h2 className="serif-font text-5xl italic text-center mb-12">Establish Identity</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 text-sm tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="FIRST NAME"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-sm tracking-widest focus:border-[#d4af37] outline-none"
              required
            />
            <input
              type="text"
              placeholder="LAST NAME"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-sm tracking-widest focus:border-[#d4af37] outline-none"
              required
            />
          </div>

          <input
            type="text"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-transparent border-b border-white/20 pb-4 text-sm tracking-widest focus:border-[#d4af37] outline-none"
            required
          />

          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b border-white/20 pb-4 text-sm tracking-widest focus:border-[#d4af37] outline-none"
            required
          />

          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b border-white/20 pb-4 text-sm tracking-widest focus:border-[#d4af37] outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#d4af37] text-black text-xs tracking-[0.125em] font-medium hover:bg-white transition disabled:opacity-70"
          >
            {loading ? 'ESTABLISHING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center text-xs text-white/50 mt-10">
          Already have access?{' '}
          <Link to="/login" className="text-[#d4af37] hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
