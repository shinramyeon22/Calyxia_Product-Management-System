import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Products from './pages/Products';
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import ProductDetails from './pages/ProductDetails';
import DeletedItemsPage from './pages/DeletedItemsPage';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import { ToastProvider } from './context/ToastProvider';
import PageTransition from './components/PageTransition';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#d4af37] tracking-widest">VERIFYING ACCESS...</div>;
  }

  if (!session) return <Navigate to="/login" replace />;

  // Block only when the DB explicitly says INACTIVE/I — never block SUPERADMIN.
  // An empty/undefined record_status means the profile couldn't be fetched (RLS),
  // so we give the benefit of the doubt to the valid session.
  if (user && user.record_status) {
    const status = String(user.record_status).toUpperCase();
    const type  = String(user.user_type  || '').toUpperCase();
    const isInactive = status === 'INACTIVE' || status === 'I';
    if (type !== 'SUPERADMIN' && isInactive) {
      return <Navigate to="/login?error=not_activated" replace />;
    }
  }

  if (requireAdmin) {
    const normalizeUserType = (type) => String(type || '').trim().replace(/[\s_-]+/g, '').toUpperCase();
    const type = normalizeUserType(user?.user_type);
    if (!['ADMIN', 'SUPERADMIN'].includes(type)) {
      return <Navigate to="/products" replace />;
    }
  }

  return children;
};

function App() {
  // 1. Get the current location
  const location = useLocation();

  return (
    <ToastProvider>
      <PageTransition>
        {/* 2. Add location and key to Routes */}
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* 3. Redirect root directly to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          
          {/* Note: Ensure the link to here is /product/123, not /products/123 */}
          <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />

          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
          <Route path="/deleted-items" element={<ProtectedRoute requireAdmin={true}><DeletedItemsPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PageTransition>
    </ToastProvider>
  );
}

export default App;