import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import neuLogo from '../assets/neu-logo.png';

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your identity…');

  useEffect(() => {
    const handleAuth = async () => {
      let session = null;

      const { data: sessionData, error: authError } = await supabase.auth.getSessionFromUrl();
      if (authError) {
        console.log('AUTH CALLBACK ERROR:', authError);
      }

      session = sessionData?.session;
      if (!session) {
        const { data: currentSession } = await supabase.auth.getSession();
        session = currentSession?.session;
      }

      console.log('SESSION:', session);

      if (!session) {
        navigate('/login');
        return;
      }

      setStatus('Checking account status…');

      const { data: userRow, error } = await supabase
        .from('user')
        .select('record_status')
        .eq('userId', session.user.id)
        .single();

      console.log('USER ROW:', userRow);
      console.log('DB ERROR:', error);

      if (error && error.code === 'PGRST116') {
        setStatus('Setting up your account…');
        await supabase.from('user').insert([{
          userId: session.user.id,
          email: session.user.email,
          record_status: 'INACTIVE',
          user_type: 'USER',
        }]);
        await supabase.auth.signOut();
        navigate('/login?error=not_activated');
        return;
      }

      if (userRow?.record_status === 'ACTIVE') {
        setStatus('Welcome! Redirecting…');
        setTimeout(() => navigate('/dashboard'), 1000);
        return;
      }

      await supabase.auth.signOut();
      navigate('/login?error=not_activated');
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(at 0% 0%, rgba(27,67,50,0.4) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(212,175,55,0.1) 0, transparent 50%), #05080a',
      fontFamily: "'Poppins', sans-serif",
      gap: '32px',
    }}>

      {/* Rolling logo */}
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        
        {/* Outer gold orbit ring */}
        <div style={{
          position: 'absolute', inset: '-10px',
          borderRadius: '50%',
          border: '2px dashed rgba(212,175,55,0.3)',
          animation: 'cas-orbit 3s linear infinite',
        }} />

        {/* Gold glow pulse ring */}
        <div style={{
          position: 'absolute', inset: '-4px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#d4af37',
          borderRightColor: 'rgba(212,175,55,0.4)',
          animation: 'cas-spin 1.2s ease-in-out infinite',
        }} />

        {/* Rolling logo image */}
        <img
          src={neuLogo}
          alt="NEU Logo"
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'white',
            padding: '8px',
            border: '4px solid #d4af37',
            boxShadow: '0 0 50px rgba(212,175,55,0.5), 0 0 100px rgba(212,175,55,0.2)',
            animation: 'cas-roll 1.2s ease-in-out infinite',
            display: 'block',
          }}
        />
      </div>

      {/* CALYXIA wordmark + status */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: '1.6rem',
          fontWeight: 900,
          color: '#d4af37',
          letterSpacing: '10px',
          margin: '0 0 12px',
          textShadow: '0 0 30px rgba(212,175,55,0.4)',
        }}>
          CALYXIA
        </p>

        {/* Animated status dots */}
        <p style={{
          color: '#64748b',
          fontSize: '0.82rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          margin: '0 0 16px',
        }}>
          {status}
        </p>

        {/* Three bouncing dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#d4af37',
              animation: `cas-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.7,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&family=Poppins:wght@400&display=swap');

        @keyframes cas-roll {
          0%   { transform: rotate(0deg)   scale(1);    }
          25%  { transform: rotate(90deg)  scale(1.05); }
          50%  { transform: rotate(180deg) scale(1);    }
          75%  { transform: rotate(270deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1);    }
        }

        @keyframes cas-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes cas-orbit {
          to { transform: rotate(-360deg); }
        }

        @keyframes cas-bounce {
          0%, 100% { transform: translateY(0);    opacity: 0.4; }
          50%       { transform: translateY(-8px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

export default AuthCallbackPage;