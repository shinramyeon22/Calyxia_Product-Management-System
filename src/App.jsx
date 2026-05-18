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

  const normalizedType = String(user?.user_type || '').trim().replace(/[\s_-]+/g, '').toUpperCase();

  // SUPERADMIN is always exempt — never redirect them, regardless of status.
  if (normalizedType !== 'SUPERADMIN') {
    const status = String(user?.record_status || '').toUpperCase();
    // Block unless the DB explicitly says ACTIVE/A — missing or INACTIVE both block.
    if (status !== 'ACTIVE' && status !== 'A') {
      return <Navigate to="/login?error=not_activated" replace />;
    }
  }

  if (requireAdmin && !['ADMIN', 'SUPERADMIN'].includes(normalizedType)) {
    return <Navigate to="/products" replace />;
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