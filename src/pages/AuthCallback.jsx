import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      console.log('SESSION:', session);

      if (!session) {
        console.log('No session found — redirecting to login');
        navigate('/login');
        return;
      }

      const { data: userRow, error } = await supabase
        .from('user')
        .select('record_status')
        .eq('userId', session.user.id)
        .single();

      console.log('USER ROW:', userRow);
      console.log('DB ERROR:', error);
      console.log('record_status:', userRow?.record_status);

      // No user row found — create INACTIVE record and block access
      if (error && error.code === 'PGRST116') {
        console.log('No user row — creating INACTIVE record');
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

      // User is ACTIVE — allow in
      if (userRow?.record_status === 'ACTIVE') {
        console.log('User is ACTIVE — redirecting to dashboard');
        navigate('/dashboard');
        return;
      }

      // Any other status — block access
      console.log('User is NOT active — signing out');
      await supabase.auth.signOut();
      navigate('/login?error=not_activated');
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'Poppins, sans-serif',
    }}>
      <p>Finalizing sign in…</p>
    </div>
  );
}

export default AuthCallbackPage;