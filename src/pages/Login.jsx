import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import neuLogo from '../assets/neu-logo.png'; 
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); setLoading(false); }
    else { navigate('/dashboard'); }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert(error.message);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="logo-wrapper">
          <img src={neuLogo} alt="NEU Logo" className="main-logo" />
        </div>

        <div className="auth-box">
          <h1 className="system-title">CALYXIA</h1>
          <p className="system-subtitle">Product Management System</p>

          <form onSubmit={handleEmailLogin}>
            <input 
              type="email" 
              placeholder="EMAIL ADDRESS" 
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <input 
              type="password" 
              placeholder="PASSWORD" 
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </button>
          </form>

          <div className="divider"><span>OR</span></div>

          {/* THE GOOGLE BUTTON */}
          <button type="button" onClick={handleGoogleLogin} className="btn-google">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
            CONTINUE WITH GOOGLE
          </button>

          <p style={{ marginTop: '40px', color: '#94a3b8' }}>
            NEW TO THE SYSTEM? <Link to="/register" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold' }}>REGISTER NOW</Link>
          </p>
        </div>
      </div>
    </div>
  );
}