import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // 1. Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("No session found");
        navigate('/login');
        return;
      }

      // 2. Check if user exists in 'app_user'
      const { data: userRow, error: fetchError } = await supabase
        .from('app_user')
        .select('record_status')
        .eq('id', session.user.id)
        .single();

      // 3. If no record found (PGRST116), create one as ACTIVE
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log("No profile found, creating active user...");
        
        const { error: insertError } = await supabase
          .from('app_user')
          .insert([{
            id: session.user.id,
            email: session.user.email,
            record_status: 'ACTIVE', 
            user_type: 'USER'
          }]);

        if (insertError) {
          console.error("Error creating user profile:", insertError.message);
          navigate('/login?error=database_error');
          return;
        }

        navigate('/products');
        return;
      }

      // 4. Record exists — check status
      if (userRow?.record_status === 'ACTIVE') {
        navigate('/products');
      } else {
        // If status is INACTIVE or something else, sign them out
        await supabase.auth.signOut();
        navigate('/login?error=not_activated');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="auth-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#1a1a1a' 
    }}>
      <p style={{ color: 'white' }}>Finalizing sign in...</p>
    </div>
  );
}

export default AuthCallbackPage;