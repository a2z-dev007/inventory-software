import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/common/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { PurchaseOrderDetail } from './pages/PurchaseOrderDetail';
import { Sales } from './pages/Sales';
import { SaleDetail } from './pages/SaleDetail';
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
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/purchase-orders" replace /> : <Login />}
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
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

  const resetLoader = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wingsAppLoaded');
      setShowLoader(true);
    }
  };
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

export default App;