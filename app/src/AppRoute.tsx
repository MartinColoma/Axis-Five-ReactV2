import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Home from './pages/Landing/Home/Home';
import About from './pages/Landing/About/About';
import ProdCatalog from './pages/ProdCatalog/PC_Home/PC_Home';
import AuthModal from './pages/ProdCatalog/PC_Auth/PC_LoginReg';

const AppRoutes: React.FC = () => {
  const location = useLocation();

  // Handle modal background state (for modal routing)
  const state = location.state as { backgroundLocation?: Location };
  const background = state?.backgroundLocation;

  return (
    <>
      {/* Base routes */}
      <Routes location={background || location}>
        {/* AxisFive Company Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/product-catalog" element={<ProdCatalog />} />

        {/* Add more routes here */}
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

export default AppRoutes;