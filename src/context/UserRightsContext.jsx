/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const UserRightsContext = createContext({});

export const UserRightsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [rights, setRights] = useState({
    PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 1,
    PRICE_ADD: 0, PRICE_VIEW: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRights = async () => {
      if (!user || authLoading) { setLoading(false); return; }
      try {
        const userId = user.email || user.user_id || user.id;
        const { data: userRights, error } = await supabase
          .from('UserModule_Rights')
          .select('module_id, right_id, has_access')
          .eq('user_id', userId);

        if (error) { applyRoleBasedRights(user); return; }

        const rightsMap = { PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 0, PRICE_ADD: 0, PRICE_VIEW: 0 };
        if (userRights?.length > 0) {
          userRights.forEach(row => {
            if (row.has_access && row.module_id === 'PROD') {
              if (row.right_id === 'CREATE') rightsMap.PRD_ADD = 1;
              if (row.right_id === 'EDIT') rightsMap.PRD_EDIT = 1;
              if (row.right_id === 'DELETE') rightsMap.PRD_DEL = 1;
              if (row.right_id === 'VIEW') rightsMap.PRD_VIEW = 1;
            }
          });
          rightsMap.PRICE_ADD = rightsMap.PRD_ADD;
          rightsMap.PRICE_VIEW = rightsMap.PRD_VIEW;
        } else {
          applyRoleBasedRights(user); return;
        }
        setRights(rightsMap);
      } catch (err) {
        console.error("Error fetching user rights:", err);
        // eslint-disable-next-line no-unused-vars
        applyRoleBasedRights(user);
      } finally { setLoading(false); }
    };

    const applyRoleBasedRights = (user) => {
      const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
      if (userType === 'SUPERADMIN' || userType === 'ADMIN') {
        setRights({ PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRD_VIEW: 1, PRICE_ADD: 1, PRICE_VIEW: 1 });
      } else {
        setRights({ PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 1, PRICE_ADD: 0, PRICE_VIEW: 1 });
      }
      setLoading(false);
    };

    fetchUserRights();
  }, [user, authLoading]);

  const hasRight = (rightCode) => rights[rightCode] === 1;

  return (
    <UserRightsContext.Provider value={{ rights, hasRight, loading }}>
      {children}
    </UserRightsContext.Provider>
  );
};

export const useRights = () => {
  const context = useContext(UserRightsContext);
  if (!context) throw new Error('useRights must be used within a UserRightsProvider');
  return context;
};

export default UserRightsContext;