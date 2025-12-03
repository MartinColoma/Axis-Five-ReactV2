import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Landing/Home/Home';
import About from './pages/Landing/About/About';
import ProdCatalog from './pages/ProdCatalog//PC_Home/PC_Home';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/product-catalog" element={<ProdCatalog />} />

    </Routes>
  );
};

export default AppRoutes;
