import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { initializeAuth } from './store/slices/authSlice';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/common/Layout';
import { Login } from './pages/Login';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { PurchaseOrderDetail } from './pages/PurchaseOrderDetail';
import { Purchases } from './pages/Purchases';
import { PurchaseDetail } from './pages/PurchaseDetail';
import { Suppliers } from './pages/Suppliers';
import { SupplierDetail } from './pages/SupplierDetail';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { useAuth } from './hooks/useAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ForgotPassword } from './pages/ForgotPassword';
import { CancelledItems } from './pages/CancelledItems';
import { CancelledItemsDetail } from './pages/CancelledPurchaseDetail';
import RecycleBin from './pages/RecycleBin';
import WelcomeLoader from './components/loader/WelcomeLoader';
import { ReturnedItems } from './pages/ReturnedItems';
import { PurchaseReturnedDetail } from './pages/PurchaseReturnedDetail';
import PurposePage from './pages/Purpose';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Redirect root to dashboard if authenticated, otherwise to login */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/purchase-orders" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/purchase-orders" replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* Protected routes with Layout */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="purchase-orders" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <PurchaseOrders />
          </ProtectedRoute>
        } />
        <Route path="purchase-orders/:id" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <PurchaseOrderDetail />
          </ProtectedRoute>
        } />
        {/* <Route path="site" element={<Sales />} />
        <Route path="site/:id" element={<SaleDetail />} /> */}
        <Route path="purchases" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Purchases />
          </ProtectedRoute>
        } />
        <Route path="purchases/:id" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <PurchaseDetail />
          </ProtectedRoute>
        } />
        <Route path="suppliers" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Suppliers />
          </ProtectedRoute>
        } />
        <Route path="purpose" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <PurposePage />
          </ProtectedRoute>
        } />
        <Route path="suppliers/:id" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <SupplierDetail />
          </ProtectedRoute>
        } />
        <Route path="clients" element={<Customers />} />
        <Route path="clients/:id" element={<CustomerDetail />} />
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
        <Route path="cancelled-items" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <CancelledItems />
          </ProtectedRoute>
        } />
        <Route path="purchase-return" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <ReturnedItems />
          </ProtectedRoute>
        } />
        <Route path="purchase-return/:id" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <PurchaseReturnedDetail />
          </ProtectedRoute>
        } />
        <Route path="cancelled-items/:id" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <CancelledItemsDetail />
          </ProtectedRoute>
        } />
        <Route path="recycle-bin" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <RecycleBin />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch all - redirect to root which will handle auth logic */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Initialize state based on localStorage immediately
  const [showLoader, setShowLoader] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasLoaded = localStorage.getItem('wingsAppLoaded');
      return !hasLoaded; // Only show if hasn't loaded before
    }
    return true; // Default for SSR
  });

  const handleLoadingComplete = () => {
    setShowLoader(false);
    // Mark as loaded in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('wingsAppLoaded', 'true');
    }
  };


  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </div>
        <WelcomeLoader
          showLoader={showLoader}
          onLoadingComplete={handleLoadingComplete}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;