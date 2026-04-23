import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import neuLogo from "../assets/neu-logo.png";
import './Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/AuthCallbackPage' },
      });
      if (error) throw error;
    } catch (error) { alert(error.message); }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/AuthCallbackPage` }
    });
    if (error) { alert(error.message); } 
    else { setSuccessMsg('Registration successful! Access is pending Admin activation.'); }
    setLoading(false);
  };  

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="logo-wrapper">
          <img src={neuLogo} alt="NEU Logo" className="main-logo" />
        </div>

        <div className="auth-box">
          <h1 className="system-title">Create Account</h1>
          <span className="system-subtitle">Join the Calyxia Network</span>

          {successMsg ? (
            <div className="success-banner" style={{color: '#d4af37', fontWeight: 'bold'}}>{successMsg}</div>
          ) : (
            <>
              <button onClick={handleGoogleSignIn} className="btn-google">
                <img src="https://authjs.dev/img/providers/google.svg" width="20" alt="G" />
                Sign up with Google
              </button>

              <div className="divider"><span>OR</span></div>

              <form onSubmit={handleEmailRegister}>
                <div className="input-group">
                  <input type="email" placeholder="Email" value={email} 
                    onChange={e => setEmail(e.target.value)} className="auth-input" required />
                </div>
                <div className="input-group">
                  <input type="password" placeholder="Password" value={password}
                    onChange={e => setPassword(e.target.value)} className="auth-input" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Processing...' : 'Register'}
                </button>
              </form>
            </>
          )}
          <p className="mt-6 text-sm text-gray-500">
            Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;