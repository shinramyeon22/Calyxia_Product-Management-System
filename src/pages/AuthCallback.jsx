import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate('/login?error=auth_failed');
        return;
      }

      const { data: userRow, error: fetchError } = await supabase
        .from('app_user')
        .select('record_status, user_type')
        .eq('id', session.user.id)
        .single();

      // If the trigger didn't run yet (or isn't deployed), create the row here
      if (fetchError && fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('app_user')
          .upsert(
            [{ id: session.user.id, email: session.user.email, record_status: 'INACTIVE', user_type: 'USER' }],
            { onConflict: 'id', ignoreDuplicates: true }
          );

        if (insertError) {
          navigate('/login?error=database_error');
          return;
        }

        await supabase.auth.signOut();
        navigate('/login?status=pending_approval');
        return;
      }

      const userType = String(userRow?.user_type || '').toUpperCase();
      const status   = String(userRow?.record_status || '').toUpperCase();
      const isActive = status === 'A' || status === 'ACTIVE';

      // SUPERADMIN always gets through
      if (userType === 'SUPERADMIN') {
        navigate('/admin');
        return;
      }

      if (!isActive) {
        await supabase.auth.signOut();
        navigate('/login?error=not_activated');
        return;
      }

      // Active ADMIN → admin dashboard; active USER → user dashboard
      if (userType === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/admin/products');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-[1px] bg-[#d4af37] mx-auto mb-6 animate-pulse"></div>
        <p className="text-[#d4af37] text-xs tracking-[0.5em]">FINALIZING SIGN IN...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
