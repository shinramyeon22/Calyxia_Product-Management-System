import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Changed name to AuthCallback to match your App.jsx import
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate('/login');
        return;
      }

      const { data: userRow, error: fetchError } = await supabase
        .from('app_user')
        .select('record_status')
        .eq('id', session.user.id)
        .single();

      // If new user, create record and go to products
      if (fetchError && fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('app_user')
          .insert([{
            id: session.user.id,
            email: session.user.email,
            record_status: 'ACTIVE', 
            user_type: 'USER'
          }]);

        if (insertError) {
          navigate('/login?error=database_error');
          return;
        }

        navigate('/products'); // <--- Redirect 1
        return;
      }

      // If existing user, check status
      if (userRow?.record_status === 'ACTIVE') {
        navigate('/products'); // <--- Redirect 2
      } else {
        await supabase.auth.signOut();
        navigate('/login?error=not_activated');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Finalizing sign in...</p>
    </div>
  );
}

export default AuthCallback;