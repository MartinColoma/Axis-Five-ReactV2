import { Routes, Route, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { FC } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Landing/Home/Home';
import About from './pages/Landing/About/About';
import ProdCatalog from './pages/ProdCatalog/PC_Home/PC_Home';
import AuthModal from './pages/ProdCatalog/PC_Auth/PC_LoginReg';
import AdminHome from './pages/Admin/AdminHome/AdminHome';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: FC = () => {
  const location = useLocation();

  // Handle modal background state (for modal routing)
  const state = location.state as { backgroundLocation?: Location };
  const background = state?.backgroundLocation;

  return (
    <>
      {/* Base routes */}
      <Routes location={background || location}>
        {/* AxisFive Company Pages - Public */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/product-catalog" element={<ProdCatalog />} />

        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminHome />
            </ProtectedRoute>
          } 
        />

        {/* Add more protected routes here */}
        {/* Example:
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProducts />
            </ProtectedRoute>
          } 
        />
        */}
      </Routes>

      {/* Modal routes (rendered as portals on top of background) */}
      {background && (
        <Routes>
          <Route
            path="/login"
            element={createPortal(
              <AuthModal
                isOpen={true}
                onClose={() => {
                  window.history.back();
                }}
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
                onClose={() => {
                  window.history.back();
                }}
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