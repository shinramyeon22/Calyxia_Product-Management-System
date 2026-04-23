import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  // 1. CRITICAL: If still loading, wait! 
  // Don't redirect yet because we don't know the user's role yet.
  if (loading) {
    return <div className="min-h-screen bg-black text-white p-10">Verifying access...</div>;
  }

  // 2. If no user is logged in at all, go to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 3. If Admin is required but user isn't an admin, go to products
  if (requireAdmin && user.user_type?.toUpperCase() !== 'ADMIN') {
    console.log("Access Denied: User is not an admin", user.user_type);
    return <Navigate to="/products" />;
  }

  return children;
}