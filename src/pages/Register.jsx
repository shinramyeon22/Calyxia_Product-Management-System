import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // FIX: Added the missing state for success messages
  const [successMsg, setSuccessMsg] = useState('');
 
  // FIX: This function MUST be defined inside the component
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error.message);
      alert(error.message);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });

    if (error) {
      alert(error.message);
    } else {
      setSuccessMsg('Registration successful! Access is pending Admin activation.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container" style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Create Account</h2>
      
      {successMsg ? (
        <div className="success-banner" style={{ color: 'green', marginBottom: '15px' }}>
          {successMsg}
        </div>
      ) : (
        <>
          <form onSubmit={handleEmailRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Register'}
            </button>
          </form>

          <div style={{ margin: '20px 0', textAlign: 'center', color: '#666' }}>OR</div>

          {/* FIX: onClick name now matches handleGoogleSignIn exactly */}
          <button 
            onClick={handleGoogleSignIn}
            className="google-auth-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              width: '100%',
              cursor: 'pointer',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
          >
            <img src="https://authjs.dev/img/providers/google.svg" width="20" alt="Google" />
            Continue with Google
          </button>
        </>
      )}
    </div>
  );
};

export default Register;