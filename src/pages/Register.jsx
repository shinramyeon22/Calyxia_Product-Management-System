import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const fullName = `${firstName} ${lastName}`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;

      // If the user gets an immediate session (email confirmation disabled),
      // insert the app_user row now while authenticated.
      // The database trigger handles the case when confirmation is enabled.
      if (signUpData?.user?.id && signUpData?.session) {
        await supabase.from('app_user').upsert(
          [{ id: signUpData.user.id, email, user_type: 'USER', record_status: 'INACTIVE' }],
          { onConflict: 'id', ignoreDuplicates: true }
        );
        await supabase.auth.signOut();
      }

      alert('Account created! Your account is currently inactive and requires SuperAdmin approval before you can sign in.');
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-slate-200 rounded-xl px-5 py-3.5 text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition text-sm bg-white";

  return (
    <>
      <style>{`
        @keyframes registerFloatUp {
          0%   { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes registerFloatDown {
          0%   { opacity: 0; transform: translateY(-18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes registerPulse {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.38; }
        }
        @keyframes registerDrift {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .reg-card-wrap-1 {
          animation: registerFloatUp 0.9s cubic-bezier(.22,1,.36,1) 0.2s both;
          transform: rotate(-6deg);
        }
        .reg-card-wrap-2 {
          animation: registerFloatDown 0.9s cubic-bezier(.22,1,.36,1) 0.45s both;
          transform: rotate(5deg);
        }
        .reg-card-wrap-3 {
          animation: registerFloatUp 0.9s cubic-bezier(.22,1,.36,1) 0.65s both;
          transform: rotate(-3deg);
        }
        .reg-drift { animation: registerDrift 5s ease-in-out infinite; }
        .reg-drift-slow { animation: registerDrift 7s ease-in-out infinite; }
        .reg-pulse { animation: registerPulse 4s ease-in-out infinite; }
        .reg-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 12px 18px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .reg-input::placeholder { color: rgba(255,255,255,0.28); }
        .reg-input:focus {
          border-color: rgba(99,102,241,0.7);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
          background: rgba(255,255,255,0.09);
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background orbs */}
        <div className="reg-pulse" style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div className="reg-pulse" style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', animationDelay: '2s' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* ── LEFT HERO PANEL ── */}
        <div
          className="hidden lg:flex lg:flex-col"
          style={{
            width: '58%',
            padding: '56px 52px',
            position: 'relative',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ animation: 'registerFloatUp 0.7s cubic-bezier(.22,1,.36,1) both' }}>
            <span className="serif-font" style={{ fontSize: 28, fontStyle: 'italic', color: '#a5b4fc', letterSpacing: '-0.5px', fontWeight: 700 }}>Calyxia</span>
          </div>

          {/* Hero text */}
          <div style={{ animation: 'registerFloatUp 0.8s cubic-bezier(.22,1,.36,1) 0.1s both' }}>
            <h1 className="serif-font" style={{
              fontSize: 52,
              fontStyle: 'italic',
              fontWeight: 700,
              lineHeight: 1.08,
              marginBottom: 20,
              background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Join the<br />platform.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.65, maxWidth: 340 }}>
              Create your account and start managing products with clarity and confidence.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
              {['Product Tracking', 'Role-Based Access', 'Analytics', 'Audit Trail'].map((pill, i) => (
                <span key={pill} style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: 'rgba(165,180,252,0.9)',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.22)',
                  animation: `registerFloatUp 0.6s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.08}s both`,
                }}>
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Floating glass cards */}
          <div style={{ position: 'relative', height: 260, marginTop: 20 }}>
            {/* Card 1 — top left */}
            <div className="reg-card-wrap-1" style={{ position: 'absolute', top: 0, left: 20 }}>
              <div className="reg-drift" style={{
                width: 170,
                padding: '16px 18px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>New Product</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#c7d2fe' }}>Wireless Headset</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>₱4,299.00</div>
                <div style={{ marginTop: 10, height: 3, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ width: '65%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                </div>
              </div>
            </div>

            {/* Card 2 — top right */}
            <div className="reg-card-wrap-2" style={{ position: 'absolute', top: 16, right: 40 }}>
              <div className="reg-drift-slow" style={{
                width: 155,
                padding: '14px 16px',
                borderRadius: 16,
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(165,180,252,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Users Online</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#a5b4fc' }}>24</div>
                <div style={{ fontSize: 10, color: 'rgba(165,180,252,0.45)', marginTop: 2 }}>+3 today</div>
              </div>
            </div>

            {/* Card 3 — bottom center */}
            <div className="reg-card-wrap-3" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) rotate(-3deg)' }}>
              <div className="reg-drift" style={{
                width: 200,
                padding: '14px 18px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Approval Pending</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>A</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#c7d2fe' }}>admin@calyxia.co</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Reviewing request</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cylinder tubes */}
            <div style={{ position: 'absolute', bottom: 30, left: 0, width: 8, height: 90, borderRadius: 4, background: 'linear-gradient(180deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.2) 100%)', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, width: 6, height: 60, borderRadius: 3, background: 'linear-gradient(180deg, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.15) 100%)', boxShadow: '0 0 8px rgba(139,92,246,0.25)' }} />
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 28,
              padding: '44px 40px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
              animation: 'registerFloatUp 0.8s cubic-bezier(.22,1,.36,1) 0.15s both',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div className="serif-font lg:hidden" style={{ fontSize: 26, fontStyle: 'italic', color: '#a5b4fc', fontWeight: 700, marginBottom: 6 }}>Calyxia</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', marginBottom: 6 }}>Create Account</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>join calyxia</p>
            </div>

            {error && (
              <div style={{
                marginBottom: 20,
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12,
                color: '#fca5a5',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* First + Last name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="reg-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="reg-input"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Username</label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="reg-input"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="reg-input"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="reg-input"
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? (
                      /* Eye open */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      /* Eye closed */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="reg-input"
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Pending approval notice */}
              <div style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <div style={{ marginTop: 1, width: 16, height: 16, flexShrink: 0, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc' }} />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(165,180,252,0.8)', lineHeight: 1.5, margin: 0 }}>
                  Your account will be <strong style={{ color: '#a5b4fc' }}>inactive</strong> until approved by a SuperAdmin.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  width: '100%',
                  padding: '14px',
                  borderRadius: 14,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading
                    ? 'rgba(99,102,241,0.4)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.4)',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
