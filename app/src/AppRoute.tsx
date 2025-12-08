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

// User Pages

// Admin Pages
import AdminHome from './pages/Admin/AdminHome/AdminHome';
import AdminUsers from './pages/Admin/AdminUsers/AdminUser';
import AdminProd from './pages/Admin/AdminProducts/AdminProd';

const AppRoutes: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Handle modal background state (for modal routing)
  const state = location.state as { backgroundLocation?: Location };
  const background = state?.backgroundLocation;

  // Centralized close handler for auth modals
  const handleAuthModalClose = () => {
    const currentState = location.state as { backgroundLocation?: Location };

    if (currentState?.backgroundLocation) {
      // Go back to the page that opened the modal
      navigate(currentState.backgroundLocation.pathname, { replace: true });
    } else {
      // Safe fallback to a public route (avoid protected routes to prevent loops)
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
        <Route path="/product-catalog" element={<ProdCatalog />} />
        <Route path="/products/:slug" element={<PC_Product />} />

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
      </Routes>

      {/* Modal routes (rendered as portals on top of background) */}
      {background && (
        <Routes>
          <Route
            path="/login"
            element={createPortal(
              <AuthModal
                isOpen={true}
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
                isOpen={true}
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

// Wrap the entire app routes with AuthProvider
const AppRoutesWithAuth: FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default AppRoutesWithAuth;
