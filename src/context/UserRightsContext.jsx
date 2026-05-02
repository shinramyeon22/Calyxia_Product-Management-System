/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';

const UserRightsContext = createContext(null);

export const UserRightsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rights, setRights] = useState({
    PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 1, PRD_RESTORE: 0,
    PRICE_ADD: 0, PRICE_VIEW: 1,
    REP_VIEW: 0, REP_TOP: 0, ADM_USER: 0, AUDIT_VIEW: 0, RIGHTS_MGMT: 0
  });

  const applyRoleBasedRights = useCallback((u) => {
    const userType = (u?.user_type || u?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
    
    if (userType === 'SUPERADMIN') {
      setRights({ 
        PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRD_VIEW: 1, PRD_RESTORE: 1,
        PRICE_ADD: 1, PRICE_VIEW: 1,
        REP_VIEW: 1, REP_TOP: 1, ADM_USER: 1, AUDIT_VIEW: 1, RIGHTS_MGMT: 1 
      });
    } else if (userType === 'ADMIN') {
      setRights({ 
        PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 0, PRD_VIEW: 1, PRD_RESTORE: 1,
        PRICE_ADD: 1, PRICE_VIEW: 1,
        REP_VIEW: 1, REP_TOP: 0, ADM_USER: 1, AUDIT_VIEW: 1, RIGHTS_MGMT: 0 
      });
    } else {
      setRights({ 
        PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 0, PRD_VIEW: 1, PRD_RESTORE: 0,
        PRICE_ADD: 0, PRICE_VIEW: 1,
        REP_VIEW: 1, REP_TOP: 0, ADM_USER: 0, AUDIT_VIEW: 0, RIGHTS_MGMT: 0 
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchUserRights = async () => {
      if (authLoading) return;

      if (!user) {
        setRights({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = user.id || user.user_id || user.email;

        const { data: userRights, error } = await supabase
          .from('UserModule_Rights')
          .select('module_id, right_id, has_access')
          .eq('user_id', userId);

        if (error) throw error;

        if (userRights && userRights.length > 0) {
          const rightsMap = { 
            PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 0, PRD_RESTORE: 0,
            PRICE_ADD: 0, PRICE_VIEW: 0,
            REP_VIEW: 0, REP_TOP: 0, ADM_USER: 0, AUDIT_VIEW: 0, RIGHTS_MGMT: 0 
          };
          
          userRights.forEach(row => {
            if (row.has_access) {
              if (row.module_id === 'PROD') {
                if (row.right_id === 'CREATE') rightsMap.PRD_ADD = 1;
                if (row.right_id === 'EDIT')   rightsMap.PRD_EDIT = 1;
                if (row.right_id === 'DELETE') rightsMap.PRD_DEL = 1;
                if (row.right_id === 'VIEW')   rightsMap.PRD_VIEW = 1;
                if (row.right_id === 'RESTORE') rightsMap.PRD_RESTORE = 1;
              }
              if (row.module_id === 'REP') {
                if (row.right_id === 'VIEW') rightsMap.REP_VIEW = 1;
                if (row.right_id === 'TOP')  rightsMap.REP_TOP = 1;
              }
              if (row.module_id === 'ADM' && row.right_id === 'USER') rightsMap.ADM_USER = 1;
              if (row.module_id === 'ADM' && row.right_id === 'RIGHTS') rightsMap.RIGHTS_MGMT = 1;
              if (row.module_id === 'AUDIT' || row.right_id === 'AUDIT') rightsMap.AUDIT_VIEW = 1;
            }
          });

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

export const useRights = () => {
  const context = useContext(UserRightsContext);
  if (!context) {
    throw new Error('useRights must be used within a UserRightsProvider');
  }
  return context;
};

export default UserRightsContext;