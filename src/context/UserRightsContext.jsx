/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';

const UserRightsContext = createContext(null);

export const UserRightsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Initial state includes the standard keys plus the sprint requirements
  const [rights, setRights] = useState({
    PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 1, PRD_RESTORE: 0,
    PRICE_ADD: 0, PRICE_VIEW: 1,
    REP_VIEW: 0, REP_TOP: 0, ADM_USER: 0, AUDIT_VIEW: 0, RIGHTS_MGMT: 0,
    REP_001: 0, REP_002: 0 
  });

  const normalizeUserType = (type) => String(type || 'USER').trim().replace(/[\s_-]+/g, '').toUpperCase();
  const getUserType = (u) => normalizeUserType(
    u?.user_type ||
    u?.raw_user_meta_data?.user_type ||
    u?.raw_user_meta_data?.role ||
    u?.user_metadata?.user_type ||
    u?.user_metadata?.role ||
    u?.app_metadata?.user_type ||
    u?.app_metadata?.role
  );

  const getRoleRights = useCallback((u) => {
    const userType = getUserType(u);
    if (userType === 'SUPERADMIN') {
      return {
        PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 1, PRD_VIEW: 1, PRD_RESTORE: 1,
        PRICE_ADD: 1, PRICE_VIEW: 1,
        REP_VIEW: 1, REP_TOP: 1, ADM_USER: 1, AUDIT_VIEW: 1, RIGHTS_MGMT: 1,
        REP_001: 1, REP_002: 1
      };
    }
    if (userType === 'ADMIN') {
      return {
        PRD_ADD: 1, PRD_EDIT: 1, PRD_DEL: 0, PRD_VIEW: 1, PRD_RESTORE: 1,
        PRICE_ADD: 1, PRICE_VIEW: 1,
        REP_VIEW: 1, REP_TOP: 0, ADM_USER: 1, AUDIT_VIEW: 1, RIGHTS_MGMT: 0,
        REP_001: 1, REP_002: 0
      };
    }
    return {
      PRD_ADD: 0, PRD_EDIT: 0, PRD_DEL: 0, PRD_VIEW: 1, PRD_RESTORE: 0,
      PRICE_ADD: 0, PRICE_VIEW: 1,
      REP_VIEW: 0, REP_TOP: 0, ADM_USER: 0, AUDIT_VIEW: 0, RIGHTS_MGMT: 0,
      REP_001: 0, REP_002: 0
    };
  }, []);

  const applyRoleBasedRights = useCallback((u) => {
    setRights(getRoleRights(u));
    setLoading(false);
  }, [getRoleRights]);

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
        const userId = user.id || user.user_id;

        const { data: userRights, error } = await supabase
          .from('UserModule_Rights')
          .select('module_id, right_id, has_access')
          .eq('user_id', userId);

        if (error) throw error;

        const roleRights = getRoleRights(user);

        if (userRights && userRights.length > 0 && roleRights.PRD_ADD !== 1) {
          // 1. Initialize with the role-based or default rights map
          const rightsMap = {
            ...roleRights,
            PRD_VIEW: roleRights.PRD_VIEW || 0,
            PRICE_VIEW: roleRights.PRICE_VIEW || 0,
            REP_TOP: roleRights.REP_TOP || 0,
            REP_001: roleRights.REP_001 || 0,
            REP_002: roleRights.REP_002 || 0,
          };
          
          // 2. Direct Map from Database rows
          userRights.forEach(row => {
            const val = row.has_access ? 1 : 0;
            if (row.right_id) {
              rightsMap[row.right_id] = val;
              if (row.right_id === 'REP_TOP') {
                rightsMap.REP_002 = val;
              }
              if (row.right_id === 'REP_002') {
                rightsMap.REP_TOP = val;
              }
            }

            if (row.has_access) {
              if (row.module_id === 'PROD' && row.right_id === 'VIEW') rightsMap.PRD_VIEW = 1;
              if (row.module_id === 'REP' || row.module_id === 'REPORTS') rightsMap.REP_VIEW = 1;
              if (row.module_id === 'ADM' && row.right_id === 'USER') rightsMap.ADM_USER = 1;
            }
          });

          rightsMap.REP_TOP = rightsMap.REP_002;
          rightsMap.PRICE_VIEW = rightsMap.PRD_VIEW || 0;
          setRights(rightsMap);
        } else {
          setRights(roleRights);
        }
      } catch (err) {
        console.error("UserRightsContext Error:", err.message);
        applyRoleBasedRights(user);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRights();
  }, [user, authLoading, applyRoleBasedRights, getRoleRights]);
      
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