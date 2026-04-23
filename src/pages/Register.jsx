import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import neuLogo from '../assets/neu-logo.png'; 
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', username: '', email: '', password: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { first_name: formData.firstName, last_name: formData.lastName, username: formData.username } }
    });
    if (error) alert(error.message);
    else { alert("Check your email!"); navigate('/login'); }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="logo-wrapper">
          <img src={neuLogo} alt="NEU Logo" className="main-logo" />
        </div>
        <div className="auth-box">
          <h1 className="system-title">CALYXIA</h1>
          <p className="system-subtitle">Create New Account</p>
          <form onSubmit={handleRegister}>
            <div className="input-row">
              <input type="text" placeholder="FIRST NAME" className="auth-input" onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
              <input type="text" placeholder="LAST NAME" className="auth-input" onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
            </div>
            <input type="text" placeholder="USERNAME" className="auth-input" onChange={(e) => setFormData({...formData, username: e.target.value})} required />
            <input type="email" placeholder="EMAIL ADDRESS" className="auth-input" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input type="password" placeholder="PASSWORD" className="auth-input" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            <button type="submit" className="btn-primary">REGISTER ACCOUNT</button>
          </form>
          <div className="divider"><span>OR</span></div>
          <button type="button" onClick={() => supabase.auth.signInWithOAuth({provider: 'google'})} className="btn-google">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="22" alt="G" />
            REGISTER WITH GOOGLE
          </button>
          <p style={{ marginTop: '50px', color: '#94a3b8' }}>
            ALREADY ENROLLED? <Link to="/login" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold' }}>SIGN IN</Link>
          </p>
        </div>
      </div>
    </div>
  );
}