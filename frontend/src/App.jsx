import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, PublicRoute } from './routes/Guards';

// Pages
import LoginPage from './pages/auth/LoginPage';

// Shared Profile & Settings
import ProfilePage from './pages/shared/ProfilePage';
import SettingsPage from './pages/shared/SettingsPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsPage from './pages/admin/ProductsPage';
import InventoryPage from './pages/admin/InventoryPage';
import StaffPage from './pages/admin/StaffPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import ReportsPage from './pages/admin/ReportsPage';

// Counter
import CounterDashboard from './pages/counter/CounterDashboard';
import NewOrderPage from './pages/counter/NewOrderPage';
import CounterOrdersPage from './pages/counter/CounterOrdersPage';

// Production
import ProductionDashboard from './pages/production/ProductionDashboard';
import ProductionOrdersPage from './pages/production/ProductionOrdersPage';
import ProductionHistoryPage from './pages/production/ProductionHistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute roles={['admin']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute roles={['admin']}>
                  <StaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute roles={['admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Counter Routes */}
            <Route
              path="/counter"
              element={
                <ProtectedRoute roles={['counter']}>
                  <CounterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/counter/new-order"
              element={
                <ProtectedRoute roles={['counter']}>
                  <NewOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/counter/orders"
              element={
                <ProtectedRoute roles={['counter']}>
                  <CounterOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/counter/products"
              element={
                <ProtectedRoute roles={['counter', 'admin']}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/counter/profile"
              element={
                <ProtectedRoute roles={['counter']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/counter/settings"
              element={
                <ProtectedRoute roles={['counter']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Production Routes */}
            <Route
              path="/production"
              element={
                <ProtectedRoute roles={['production']}>
                  <ProductionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/orders"
              element={
                <ProtectedRoute roles={['production']}>
                  <ProductionOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/history"
              element={
                <ProtectedRoute roles={['production']}>
                  <ProductionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/profile"
              element={
                <ProtectedRoute roles={['production']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/production/settings"
              element={
                <ProtectedRoute roles={['production']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Default fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
