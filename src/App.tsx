import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/common/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Suppliers } from './pages/Suppliers';
import { Customers } from './pages/Customers';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { useAuth } from './hooks/useAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ForgotPassword } from './pages/ForgotPassword';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/forgot-password" 
        element={<ForgotPassword />} 
      />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="purchase-orders" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <PurchaseOrders />
          </ProtectedRoute>
        } />
        <Route path="sales" element={<Sales />} />
        <Route path="purchases" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Purchases />
          </ProtectedRoute>
        } />
        <Route path="suppliers" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Suppliers />
          </ProtectedRoute>
        } />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Settings />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;