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

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="logo-wrapper">
          <img src={neuLogo} alt="NEU Logo" className="main-logo" />
        </div>
        <div className="auth-box">
          <h1 className="system-title">CALYXIA</h1>
          <p className="system-subtitle">Management Enterprise</p>
          <form onSubmit={handleEmailLogin}>
            <input type="email" placeholder="IDENTITY / EMAIL" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="ACCESS KEY / PASSWORD" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary" disabled={loading}>ENTER SYSTEM</button>
          </form>
          <div className="divider"><span>OR</span></div>
          <button type="button" onClick={() => supabase.auth.signInWithOAuth({provider: 'google'})} className="btn-google">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="24" alt="G" />
            CONTINUE WITH GOOGLE
          </button>
          <p style={{ marginTop: '50px', color: '#94a3b8' }}>
            NEW ENTRANT? <Link to="/register" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold' }}>REGISTER NOW</Link>
          </p>
        </div>
      </div>
    </div>
  );
}