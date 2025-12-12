// AppRoutes.tsx
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { FC } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Landing Page
import Home from './pages/Landing/Home/Home';
import About from './pages/Landing/About/About';

// Product Catalog
import ProdCatalog from './pages/ProdCatalog/PC_Home/PC_Home';
import AuthModal from './pages/ProdCatalog/PC_Auth/PC_LoginReg';
import PC_Product from './pages/ProdCatalog/PC_Product/PC_Product';
import PC_Cart from './pages/ProdCatalog/PC_Product/Cart/Cart';
import PC_RFQ from './pages/ProdCatalog/PC_Product/RFQ/RFQ';
import PC_RFQDetails from './pages/ProdCatalog/PC_Product/RFQ/Details/RFQ_Details'
import PC_RFQList from './pages/ProdCatalog/PC_Product/RFQ/List/RFQ_List'

// Admin Pages
import AdminHome from './pages/Admin/AdminHome/AdminHome';
import AdminUsers from './pages/Admin/AdminUsers/AdminUser';
import AdminProd from './pages/Admin/AdminProducts/AdminProd';
import AdminRFQList from './pages/Admin/AdminRFQ/List/AdminRFQ_List';
import AdminRFQDetails from './pages/Admin/AdminRFQ/Details/AdminRFQ_Details';
import AdminOrderList from './pages/Admin/AdminOrders/List/AdminOrderList';
import AdminOrderDetails from './pages/Admin/AdminOrders/Details/AdminOrderDetails';
const AppRoutes: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { backgroundLocation?: Location };
  const background = state?.backgroundLocation;

  const handleAuthModalClose = () => {
    const currentState = location.state as { backgroundLocation?: Location };

    if (currentState?.backgroundLocation) {
      navigate(currentState.backgroundLocation.pathname, { replace: true });
    } else {
      navigate('/product-catalog', { replace: true });
    }
  };

  return (
    <>
      {/* Base routes */}
      <Routes location={background || location}>
        {/* AxisFive Company Pages - Public */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* Store */}
        <Route path="/product-catalog" element={<ProdCatalog />} />
        <Route path="/products/:slug" element={<PC_Product />} />
        <Route path="/cart" element={<PC_Cart />} />
        <Route path="/rfq" element={<PC_RFQ />} />
        
        {/* Protected Store Routes*/}
        <Route
          path="/account/rfqs/:id"
          element={
            <ProtectedRoute requiredRole="customer">
              <PC_RFQDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/rfqs"
          element={
            <ProtectedRoute requiredRole="customer">
              <PC_RFQList />
            </ProtectedRoute>
          }
        />
        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-mngt"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rfqs/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminRFQDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rfqs"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminRFQList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminOrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminOrderList />
            </ProtectedRoute>
          }
        />
      </Routes>
      
      {/* Modal routes (login/register) */}
      {background && (
        <Routes>
          <Route
            path="/login"
            element={createPortal(
              <AuthModal
                isOpen
                onClose={handleAuthModalClose}
                initialMode="login"
              />,
              document.body
            )}
          />
          <Route
            path="/register"
            element={createPortal(
              <AuthModal
                isOpen
                onClose={handleAuthModalClose}
                initialMode="register"
              />,
              document.body
            )}
          />
        </Routes>
      )}
    </>
  );
};

const AppRoutesWithAuth: FC = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default AppRoutesWithAuth;
