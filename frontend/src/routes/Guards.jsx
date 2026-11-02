import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/UI';

// Home redirect based on role
const ROLE_HOME = { admin: '/admin', counter: '/counter', production: '/production' };

// ── ProtectedRoute ────────────────────────────────────────────
export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  return children;
}

// ── PublicRoute (redirect if already logged in) ───────────────
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  return children;
}
