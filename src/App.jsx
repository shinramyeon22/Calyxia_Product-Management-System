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

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#d4af37] tracking-widest">VERIFYING ACCESS...</div>;
  }

  if (!session) return <Navigate to="/login" replace />;
  // App.jsx - Update the requireAdmin logic
if (requireAdmin) {
  const type = (user?.user_type || user?.raw_user_meta_data?.user_type || '').toUpperCase();
  // If we have a session but the user_type hasn't loaded yet, 
  // show the loading state instead of redirecting
  if (!type && session) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#d4af37]">VERIFYING PERMISSIONS...</div>;
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(type)) {
    return <Navigate to="/products" replace />;
  }
}

  return children;
};

function App() {
  return (
    <ToastProvider>
      <PageTransition>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductManagement /></ProtectedRoute>} />
          <Route path="/deleted-items" element={<ProtectedRoute requireAdmin={true}><DeletedItemsPage /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PageTransition>
    </ToastProvider>
  );
}

export default App;