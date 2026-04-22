import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AuthCallbackPage() {
  const navigate = useNavigate();
 
  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 1. Check if user exists in your custom table
        const { data: userRow, error } = await supabase
          .from('user')
          .select('record_status')
          .eq('userId', session.user.id)
          .single();

        // 2. If no record exists, create one (Pending Approval)
        if (error && error.code === 'PGRST116') {
          await supabase.from('user').insert([
            { 
              userId: session.user.id, 
              email: session.user.email, 
              record_status: 'INACTIVE',
              user_type: 'USER' 
            }
          ]);
          await supabase.auth.signOut();
          navigate('/login?error=not_activated');
          return;
        }

        // 3. If record exists, check status
        if (userRow?.record_status === 'ACTIVE') {
          navigate('/products');
        } else {
          await supabase.auth.signOut();
          navigate('/login?error=not_activated');
        }
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="auth-container">
      <p>Finalizing sign in...</p>
    </div>
  );
}

export default AuthCallbackPage;