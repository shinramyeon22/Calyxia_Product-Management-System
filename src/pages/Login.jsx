import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, loading: authLoading } = useAuth();

  // Redirect logged-in users based on role — fires AFTER AuthContext finishes loading
  useEffect(() => {
    if (authLoading || !session) return;
    const userType = String(user?.user_type || '').trim().replace(/[\s_-]+/g, '').toUpperCase();
    const status   = String(user?.record_status || '').toUpperCase();

    // Don't redirect inactive users — handleEmailLogin will block and sign them out cleanly
    if (userType !== 'SUPERADMIN' && status !== 'ACTIVE' && status !== 'A') return;

    if (userType === 'SUPERADMIN' || userType === 'ADMIN') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, session, user, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register modal state
  const [showRegister, setShowRegister] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const resetRegisterForm = () => {
    setRegFirstName(''); setRegLastName(''); setRegUsername('');
    setRegEmail(''); setRegPassword(''); setRegConfirmPassword('');
    setRegShowPassword(false); setRegShowConfirm(false); setRegError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regFirstName || !regLastName || !regUsername || !regEmail || !regPassword || !regConfirmPassword) {
      setRegError('All fields are required.'); return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.'); return;
    }
    setRegLoading(true);
    try {
      const fullName = `${regFirstName} ${regLastName}`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: { full_name: fullName, username: regUsername },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;

      // If the user gets an immediate session (email confirmation disabled),
      // insert the app_user row now while authenticated.
      // The database trigger handles the case when confirmation is enabled.
      if (signUpData?.user?.id && signUpData?.session) {
        await supabase.from('app_user').upsert(
          [{ id: signUpData.user.id, email: regEmail, user_type: 'USER', record_status: 'INACTIVE' }],
          { onConflict: 'id', ignoreDuplicates: true }
        );
      }

      alert('Account created! Your account is currently inactive and requires SuperAdmin approval before you can sign in.');
      // Force sign-out so the auto-session from signUp() doesn't bypass the
      // INACTIVE check — new accounts must wait for SuperAdmin approval.
      await supabase.auth.signOut();
      setShowRegister(false);
      resetRegisterForm();
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('error');
    const statusCode = params.get('status');
    if (!errorCode && !statusCode) return;

    let message = '';
    if (statusCode === 'pending_approval') {
      message = 'Account created! Your account is inactive pending SuperAdmin approval.';
    } else if (errorCode === 'not_activated') {
      message = 'Your account is inactive. Contact your SuperAdmin to reactivate access.';
    } else if (errorCode === 'auth_failed') {
      message = 'Authentication failed. Please try signing in again.';
    } else if (errorCode) {
      message = `Login failed: ${errorCode}`;
    }
    setTimeout(() => setError(message), 0);
  }, [location.search]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (error) {
      setError('Google sign-in failed: ' + error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from('app_user')
        .select('record_status, user_type')
        .eq('id', data.user.id)
        .single();

      const userType = String(profile?.user_type || '').trim().replace(/[\s_-]+/g, '').toUpperCase();
      const status   = String(profile?.record_status || '').toUpperCase();

      // SUPERADMIN always gets in regardless of status
      if (userType !== 'SUPERADMIN') {
        // No profile row OR explicitly inactive → block access
        if (!profile || status === 'INACTIVE' || status === 'I') {
          await supabase.auth.signOut();
          setError('Your account is inactive. Contact your SuperAdmin.');
          setLoading(false);
          return;
        }
      }
      // Navigation is handled by the useEffect above — it fires once
      // AuthContext finishes loading the user profile from Supabase.
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' }}>

      <style>{`
        @keyframes loginFloatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes loginFloatDown {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(14px); }
        }
        .login-input::placeholder { color: rgba(255,255,255,0.2); }
        .login-input:focus { border-color: rgba(99,102,241,0.7) !important; background: rgba(99,102,241,0.08) !important; }
        .google-btn:hover { background: rgba(255,255,255,0.09) !important; border-color: rgba(255,255,255,0.18) !important; }
      `}</style>

      {/* ── Left: Hero panel ── */}
      <div className="hidden lg:flex lg:flex-col" style={{ flex: '0 0 58%', position: 'relative', justifyContent: 'center', padding: '60px 64px', overflow: 'hidden' }}>

        {/* Background glow orbs */}
        <div style={{ position: 'absolute', top: '-80px', left: '10%', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '60px', right: '-60px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        {/* Floating glass cards — outer div rotates, inner div animates vertically */}
        <div style={{ position: 'absolute', top: '12%', right: '12%', transform: 'rotate(16deg)', animation: 'loginFloatUp 3.2s ease-in-out infinite' }}>
          <div style={{ width: '78px', height: '78px', background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.12))', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '22px', backdropFilter: 'blur(12px)' }} />
        </div>
        <div style={{ position: 'absolute', top: '7%', right: '28%', transform: 'rotate(-14deg)', animation: 'loginFloatDown 4s ease-in-out infinite' }}>
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, rgba(52,211,153,0.32), rgba(16,185,129,0.10))', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', backdropFilter: 'blur(10px)' }} />
        </div>
        <div style={{ position: 'absolute', top: '22%', right: '5%', transform: 'rotate(22deg)', animation: 'loginFloatUp 3.6s ease-in-out infinite 0.6s' }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, rgba(251,191,36,0.30), rgba(245,158,11,0.10))', border: '1px solid rgba(255,255,255,0.13)', borderRadius: '12px', backdropFilter: 'blur(8px)' }} />
        </div>
        <div style={{ position: 'absolute', top: '5%', right: '18%', transform: 'rotate(-8deg)', animation: 'loginFloatDown 2.8s ease-in-out infinite 0.3s' }}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, rgba(236,72,153,0.28), rgba(219,39,119,0.10))', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', backdropFilter: 'blur(8px)' }} />
        </div>

        {/* Cylinder tubes group */}
        <div style={{ position: 'absolute', right: '8%', bottom: '18%', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          {[
            { h: 110, color: '99,102,241', delay: '0s' },
            { h: 70,  color: '139,92,246', delay: '0.4s' },
            { h: 150, color: '99,102,241', delay: '0.2s' },
            { h: 90,  color: '167,139,250', delay: '0.6s' },
          ].map((c, i) => (
            <div key={i} style={{
              width: '28px',
              height: `${c.h}px`,
              background: `linear-gradient(180deg, rgba(${c.color},0.75) 0%, rgba(${c.color},0.25) 100%)`,
              borderRadius: '14px',
              border: `1px solid rgba(${c.color},0.40)`,
              backdropFilter: 'blur(8px)',
              boxShadow: `0 0 20px rgba(${c.color},0.20)`,
              animation: `loginFloat${i % 2 === 0 ? 'Up' : 'Down'} ${3.2 + i * 0.4}s ease-in-out infinite ${c.delay}`
            }} />
          ))}
        </div>

        {/* Glass disc platform under tubes */}
        <div style={{ position: 'absolute', right: '4%', bottom: '16%', width: '150px', height: '22px', background: 'rgba(99,102,241,0.12)', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.22)', backdropFilter: 'blur(10px)', boxShadow: '0 0 30px rgba(99,102,241,0.12)' }} />

        {/* Mini dashboard preview card */}
        <div style={{ position: 'absolute', bottom: '4%', left: '0', right: '8%', background: 'rgba(15,12,40,0.75)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '18px', padding: '16px 20px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', flex: 1 }} />
            <div style={{ height: '5px', width: '50px', background: 'rgba(99,102,241,0.25)', borderRadius: '3px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['rgba(99,102,241,0.25)', 'rgba(139,92,246,0.18)', 'rgba(52,211,153,0.18)'].map((bg, i) => (
              <div key={i} style={{ flex: 1, height: '32px', background: bg, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'rgba(165,180,252,0.7)', fontSize: '11px', letterSpacing: '0.45em', fontWeight: 600, textTransform: 'uppercase', marginBottom: '20px' }}>
            Product Management System
          </div>

          <h1 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: 'clamp(2.6rem, 3.8vw, 4rem)', fontStyle: 'italic', lineHeight: 1.08, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            <span style={{ color: 'white' }}>Manage your</span><br />
            <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd 60%, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>products</span>
            <span style={{ color: 'white' }}><br />with precision</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '14px', lineHeight: 1.75, maxWidth: '360px', marginBottom: '44px' }}>
            A centralized platform for real-time inventory management, pricing history, and role-based access control.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            {['Secure product vault', 'Role-based access control', 'Real-time updates'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '11px 16px', backdropFilter: 'blur(8px)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', flexShrink: 0, boxShadow: '0 0 8px rgba(99,102,241,0.5)' }} />
                <span style={{ color: 'rgba(255,255,255,0.58)', fontSize: '13px' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', borderLeft: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Glass card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '28px', padding: '44px 40px', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08) inset' }}>

            {/* Mobile logo */}
            <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.8rem', fontStyle: 'italic', color: 'white', letterSpacing: '-0.01em' }}>Calyxia</span>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '2rem', fontStyle: 'italic', color: 'white', letterSpacing: '-0.02em', marginBottom: '6px' }}>Sign In</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Welcome back — continue to Calyxia</p>
            </div>

            {error && (
              <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: '12px', color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: '9px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '13px', padding: '13px 16px', color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '9px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase' }}>
                    Password
                  </label>
                  <Link to="/forgot-password" style={{ color: 'rgba(165,180,252,0.7)', fontSize: '11px', textDecoration: 'none' }}>
                    Forgot?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-input"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '13px', padding: '13px 48px 13px 16px', color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.88 9.88l-3.29-3.29m14.83 12.83l-3.29-3.29M12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61m-7.39-7.39a3 3 0 1 1 4.24 4.24"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', borderRadius: '14px', padding: '14px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.25s', letterSpacing: '0.06em', boxShadow: loading ? 'none' : '0 8px 32px rgba(99,102,241,0.40)', marginTop: '2px' }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '10px', letterSpacing: '0.35em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="google-btn"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '14px', padding: '13px', color: 'rgba(255,255,255,0.70)', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', letterSpacing: '0.04em', opacity: loading ? 0.5 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.22)', marginTop: '24px' }}>
              No account?{' '}
              <button
                type="button"
                onClick={() => { resetRegisterForm(); setShowRegister(true); }}
                style={{ color: '#a5b4fc', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px' }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ── Register Modal ── */}
      {showRegister && (
        <div
          onClick={() => setShowRegister(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(5,3,20,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 460, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 28, padding: '44px 40px', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.45)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.9rem', fontStyle: 'italic', color: 'white', letterSpacing: '-0.02em', marginBottom: 6 }}>Create Account</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>join calyxia</p>
            </div>

            {regError && (
              <div style={{ marginBottom: 20, padding: '13px 16px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12, color: '#fca5a5', fontSize: 13, lineHeight: 1.5 }}>
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* First + Last */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 9 }}>First Name</label>
                  <input type="text" placeholder="John" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} required className="login-input" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 13, padding: '13px 14px', color: 'white', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 9 }}>Last Name</label>
                  <input type="text" placeholder="Doe" value={regLastName} onChange={e => setRegLastName(e.target.value)} required className="login-input" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 13, padding: '13px 14px', color: 'white', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Username */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 9 }}>Username</label>
                <input type="text" placeholder="johndoe" value={regUsername} onChange={e => setRegUsername(e.target.value)} required className="login-input" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 13, padding: '13px 16px', color: 'white', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 9 }}>Email Address</label>
                <input type="email" placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="login-input" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 13, padding: '13px 16px', color: 'white', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 9 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={regShowPassword ? 'text' : 'password'} placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="login-input" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 13, padding: '13px 48px 13px 16px', color: 'white', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setRegShowPassword(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {regShowPassword
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.88 9.88l-3.29-3.29m14.83 12.83l-3.29-3.29M12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61m-7.39-7.39a3 3 0 1 1 4.24 4.24"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 9 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={regShowConfirm ? 'text' : 'password'} placeholder="••••••••" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} required className="login-input" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 13, padding: '13px 48px 13px 16px', color: 'white', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setRegShowConfirm(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.28)', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {regShowConfirm
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.88 9.88l-3.29-3.29m14.83 12.83l-3.29-3.29M12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61m-7.39-7.39a3 3 0 1 1 4.24 4.24"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Pending approval notice */}
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc' }} />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(165,180,252,0.75)', lineHeight: 1.5, margin: 0 }}>
                  Your account will be <strong style={{ color: '#a5b4fc' }}>inactive</strong> until approved by a SuperAdmin.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={regLoading}
                style={{ width: '100%', background: regLoading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', borderRadius: 14, padding: '14px', color: 'white', fontSize: 14, fontWeight: 700, cursor: regLoading ? 'not-allowed' : 'pointer', transition: 'all 0.25s', letterSpacing: '0.06em', boxShadow: regLoading ? 'none' : '0 8px 32px rgba(99,102,241,0.40)', marginTop: 2, opacity: regLoading ? 0.7 : 1 }}
              >
                {regLoading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.22)', marginTop: 24 }}>
              Already have an account?{' '}
              <button type="button" onClick={() => setShowRegister(false)} style={{ color: '#a5b4fc', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>Sign in</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
