/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const UserRightsContext = createContext(null);

export const UserRightsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rights, setRights] = useState({
    PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 1,
    PRICE_ADD: 0, PRICE_VIEW: 1,
  });

  // Helper to set rights based on user_type if DB table is empty/errors
  const applyRoleBasedRights = useCallback((u) => {
    const userType = (u?.user_type || u?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
    
    if (userType === 'SUPERADMIN' || userType === 'ADMIN') {
      setRights({ PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRD_VIEW: 1, PRICE_ADD: 1, PRICE_VIEW: 1 });
    } else {
      // Standard User Defaults
      setRights({ PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 1, PRICE_ADD: 0, PRICE_VIEW: 1 });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchUserRights = async () => {
      // 1. Wait for Auth to resolve
      if (authLoading) return;

      // 2. Clear rights if no user logged in
      if (!user) {
        setRights({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = user.id || user.user_id || user.email;

        // 3. Query UserModule_Rights table
        const { data: userRights, error } = await supabase
          .from('UserModule_Rights')
          .select('module_id, right_id, has_access')
          .eq('user_id', userId);

        if (error) throw error;

        // 4. Map Results or fallback to Role logic
        if (userRights && userRights.length > 0) {
          const rightsMap = { PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 0, PRICE_ADD: 0, PRICE_VIEW: 0 };
          
          userRights.forEach(row => {
            if (row.has_access && row.module_id === 'PROD') {
              if (row.right_id === 'CREATE') rightsMap.PRD_ADD = 1;
              if (row.right_id === 'EDIT')   rightsMap.PRD_EDIT = 1;
              if (row.right_id === 'DELETE') rightsMap.PRD_DEL = 1;
              if (row.right_id === 'VIEW')   rightsMap.PRD_VIEW = 1;
            }
          });

          // Custom business logic: Prices inherit Product view/add rights
          rightsMap.PRICE_ADD = rightsMap.PRD_ADD;
          rightsMap.PRICE_VIEW = rightsMap.PRD_VIEW;
          
          setRights(rightsMap);
        } else {
          applyRoleBasedRights(user);
        }
      } catch (err) {
        console.error("UserRightsContext Error:", err.message);
        applyRoleBasedRights(user);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRights();
  }, [user, authLoading, applyRoleBasedRights]);

  // Performance optimization
  const providerValue = useMemo(() => ({
    rights,
    loading,
    hasRight: (rightCode) => rights[rightCode] === 1
  }), [rights, loading]);

  return (
    <UserRightsContext.Provider value={providerValue}>
      {children}
    </UserRightsContext.Provider>
  );
};

// The Shortcut Hook
export const useRights = () => {
  const context = useContext(UserRightsContext);
  if (!context) {
    throw new Error('useRights must be used within a UserRightsProvider');
  }
  return context;
};

export default UserRightsContext;