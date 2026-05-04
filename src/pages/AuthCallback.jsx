import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Changed name to AuthCallback to match your App.jsx import
export const handleAuthCallback = async (supabaseClient, navigate) => {
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError || !session) {
    navigate('/login');
    return;
  }

  const { data: userRow, error: fetchError } = await supabaseClient
    .from('app_user')
    .select('record_status')
    .eq('id', session.user.id)
    .single();

  if (fetchError && fetchError.code === 'PGRST116') {
    const { error: insertError } = await supabaseClient
      .from('app_user')
      .insert([{
        id: session.user.id,
        email: session.user.email,
        record_status: 'ACTIVE', 
        user_type: 'USER'
      }] );

    if (insertError) {
      navigate('/login?error=database_error');
      return;
    }

    navigate('/products');
    return;
  }

  if (userRow?.record_status === 'ACTIVE') {
    navigate('/products');
  } else {
    await supabaseClient.auth.signOut();
    navigate('/login?error=not_activated');
  }
};

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    handleAuthCallback(supabase, navigate);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Finalizing sign in...</p>
    </div>
  );
}

export default AuthCallback;