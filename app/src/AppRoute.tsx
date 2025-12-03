import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Landing/Home/Home';
import About from './pages/Landing/About/About';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
};

export default AppRoutes;
