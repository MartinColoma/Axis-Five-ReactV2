import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './PC_Navbar.module.css';
import LoginPage from '../PC_Auth/PC_LoginReg';

interface EcommerceNavbarProps {
  cartItemCount?: number;
  onCartClick?: () => void;
}

const EcommerceNavbar: React.FC<EcommerceNavbarProps> = ({ 
  cartItemCount = 0,
  onCartClick 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on login OR register route
  const showAuthModal = location.pathname === '/login' || location.pathname === '/register';
  const initialMode = location.pathname === '/register' ? 'register' : 'login';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleCartClick = () => {
    closeMobileMenu();
    if (onCartClick) {
      onCartClick();
    } else {
      navigate('/cart');
    }
  };

  const handleModalClose = () => {
    const bgLocation = location.state?.backgroundLocation;
    if (bgLocation) {
      navigate(bgLocation.pathname);
    } else {
      navigate('/product-catalog');
    }
  };

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`} ref={navbarRef}>
        <div className={styles.navbarContainer}>
          {/* Logo - Left Side */}
          <Link to="/product-catalog" className={styles.navbarBrand} onClick={closeMobileMenu}>
            <h1 className={styles.logo}>
              <span className={styles.axis}>Axis</span>
              <span className={styles.five}>Five</span>
              <span className={styles.store}> Store</span>
            </h1>
          </Link>

          {/* Main Navigation - Center */}
          <div className={`${styles.navbarMenu} ${isMobileMenuOpen ? styles.active : ''}`}>
            <ul className={styles.navbarNav}>
              <li className={styles.navItem}>
                <Link to="/products" className={styles.navLink} onClick={closeMobileMenu}>
                  Products
                </Link>
              </li>
              
              <li className={styles.navItem}>
                <Link to="/solutions" className={styles.navLink} onClick={closeMobileMenu}>
                  Solutions
                </Link>
              </li>
              
              <li className={styles.navItem}>
                <Link to="/support" className={styles.navLink} onClick={closeMobileMenu}>
                  Support
                </Link>
              </li>
              
              <li className={styles.navItem}>
                <Link to="/contact" className={styles.navLink} onClick={closeMobileMenu}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Side Actions */}
          <div className={styles.navbarActions}>
            {/* Login button - opens modal with background location */}
            <button
              className={styles.loginBtn} 
              onClick={() =>
                navigate('/login', {
                  state: { backgroundLocation: location },
                })
              }
            >
              LOGIN
            </button>

            {/* Register button - opens modal with background location */}
            <button
              className={styles.registerBtn} 
              onClick={() =>
                navigate('/register', {
                  state: { backgroundLocation: location },
                })
              }
            >
              REGISTER
            </button>

            <button 
              className={styles.cartBtn}
              onClick={handleCartClick}
              aria-label="Shopping cart"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {cartItemCount > 0 && (
                <span className={styles.cartBadge}>{cartItemCount}</span>
              )}
            </button>

            {/* Hamburger Menu - Mobile Only */}
            <button
              className={`${styles.navbarToggler} ${isMobileMenuOpen ? styles.active : ''}`}
              type="button"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <span className={styles.togglerBar}></span>
              <span className={styles.togglerBar}></span>
              <span className={styles.togglerBar}></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Render modal for both login and register */}
      {showAuthModal && (
        <LoginPage
          isOpen={true}
          onClose={handleModalClose}
          initialMode={initialMode}
        />
      )}
    </>
  );
};

export default EcommerceNavbar;