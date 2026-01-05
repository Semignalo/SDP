import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import MobileContainer from './components/layout/MobileContainer';
import BottomNav from './components/layout/BottomNav';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import TestTools from './pages/TestTools';
import Referral from './pages/Referral';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import AdminLayout from './pages/admin/AdminLayout';

import Invoice from './pages/Invoice';
import Settings from './pages/Settings'; // Added for Settings route

function AppContent() {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register', '/test', '/checkout'];
  // Check if current path starts with /product/ (for dynamic routes) or is in the exact list
  const showNav = !hideNavPaths.includes(location.pathname)
    && !location.pathname.startsWith('/product/')
    && !location.pathname.startsWith('/invoice/');

  return (
    <MobileContainer>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Routes>
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/invoice/:id" element={<Invoice />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/test" element={<TestTools />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </MobileContainer>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin/*" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              } />
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
