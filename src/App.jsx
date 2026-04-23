// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import './App.css';

// ── Protected route wrapper ────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"         element={<Login />} />
      <Route path="/register"      element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Shell-wrapped protected pages */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Add future pages here */}
        {/* <Route path="/projects" element={<Projects />} /> */}
        {/* <Route path="/tasks"    element={<Tasks />} />    */}
        {/* <Route path="/reports"  element={<Reports />} />  */}
        {/* <Route path="/users"    element={<Users />} />    */}
        {/* <Route path="/settings" element={<Settings />} /> */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;