import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './navbar.css';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      setIsDropdownOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 991) {
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToSection = (id: string) => {
    closeMobileMenu();
    
    // If we're not on the home page, navigate there first
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className="navbar" ref={navbarRef}>
      <div className="navbar-container">
        {/* Logo - Left Side */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <h1 className="logo">
            <span className="axis">Axis</span>
            <span className="five">Five Solutions</span>
          </h1>
        </Link>

        {/* Hamburger Menu - Right Side (Mobile Only) */}
        <button
          className={`navbar-toggler ${isMobileMenuOpen ? 'active' : ''}`}
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="toggler-bar"></span>
          <span className="toggler-bar"></span>
          <span className="toggler-bar"></span>
        </button>

        {/* Navigation Menu - Right Side */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <button className="nav-link" onClick={() => scrollToSection('home')}>
                Home
              </button>
            </li>
            
            <li className="nav-item">
              <button className="nav-link" onClick={() => scrollToSection('testimonials')}>
                Testimonials
              </button>
            </li>
            
            <li className={`nav-item dropdown ${isDropdownOpen ? 'active' : ''}`}>
              <button
                className="nav-link dropdown-toggle"
                onClick={toggleDropdown}
                aria-expanded={isDropdownOpen}
              >
                About
              </button>
              <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                <li>
                  <Link to="/about" className="dropdown-item" onClick={closeMobileMenu}>
                    Who We Are
                  </Link>
                </li>
                <li>
                  <Link to="/about#why-us" className="dropdown-item" onClick={closeMobileMenu}>
                    Why Choose Us
                  </Link>
                </li>
                <li>
                  <Link to="/about#tech-stack" className="dropdown-item" onClick={closeMobileMenu}>
                    Technologies
                  </Link>
                </li>
                <li>
                  <Link to="/about#founder" className="dropdown-item" onClick={closeMobileMenu}>
                    Founder
                  </Link>
                </li>
                <li>
                  <Link to="/about#team" className="dropdown-item" onClick={closeMobileMenu}>
                    Our Developers
                  </Link>
                </li>
              </ul>
            </li>
            
            <li className="nav-item">
              <button className="nav-link" onClick={() => scrollToSection('services')}>
                Services
              </button>
            </li>
            
            <li className="nav-item">
              <button className="nav-link" onClick={() => scrollToSection('products')}>
                Products
              </button>
            </li>
            
            <li className="nav-item">
              <button className="nav-link" onClick={() => scrollToSection('contact')}>
                Contact
              </button>
            </li>
            
            <li className="nav-item">
              <Link to="/login" className="nav-link login-btn" onClick={closeMobileMenu}>
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;