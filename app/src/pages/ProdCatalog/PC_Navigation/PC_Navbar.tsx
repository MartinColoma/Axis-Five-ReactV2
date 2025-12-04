import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Package, FileText, LayoutDashboard } from 'lucide-react';
import styles from './PC_Navbar.module.css';
import LoginPage from '../PC_Auth/PC_LoginReg';

interface EcommerceNavbarProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
}

const EcommerceNavbar: React.FC<EcommerceNavbarProps> = ({ 
  cartItemCount = 0,
  onCartClick,
  isLoggedIn = false,
  userName = 'Guest'
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const showAuthModal = location.pathname === '/login' || location.pathname === '/register';
  const initialMode = location.pathname === '/register' ? 'register' : 'login';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const closeAccountDropdown = () => {
    setIsAccountDropdownOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        closeAccountDropdown();
      }
    };

    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountDropdownOpen]);

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

  const handleLogin = () => {
    closeAccountDropdown();
    navigate('/login', {
      state: { backgroundLocation: location },
    });
  };

  const handleRegister = () => {
    closeAccountDropdown();
    navigate('/register', {
      state: { backgroundLocation: location },
    });
  };

  const handleLogout = () => {
    closeAccountDropdown();
    // Add logout logic here
    console.log('Logging out...');
  };

  const handleAccountNavigation = (path: string) => {
    closeAccountDropdown();
    closeMobileMenu();
    navigate(path);
  };

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`} ref={navbarRef}>
        <div className={styles.navbarContainer}>
          <Link to="/product-catalog" className={styles.navbarBrand} onClick={closeMobileMenu}>
            <h1 className={styles.logo}>
              <span className={styles.axis}>Axis</span>
              <span className={styles.five}>Five</span>
              <span className={styles.store}> Store</span>
            </h1>
          </Link>

          <div className={`${styles.navbarMenu} ${isMobileMenuOpen ? styles.active : ''}`}>
            <ul className={styles.navbarNav}>
              <li className={styles.navItem}>
                <Link to="/product-catalog" className={styles.navLink} onClick={closeMobileMenu}>
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

          <div className={styles.navbarActions}>
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
            {/* Account Dropdown */}
            <div className={styles.accountDropdown} ref={accountDropdownRef}>
              <button
                className={styles.accountBtn}
                onClick={toggleAccountDropdown}
                aria-label="Account menu"
                aria-expanded={isAccountDropdownOpen}
              >
                <User size={20} />
              </button>

              {isAccountDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {!isLoggedIn ? (
                    <>
                      <button
                        className={styles.dropdownItem}
                        onClick={handleLogin}
                      >
                        <User size={16} />
                        <span>Login</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={handleRegister}
                      >
                        <User size={16} />
                        <span>Register</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.dropdownHeader}>
                        <span className={styles.userName}>{userName}</span>
                      </div>
                      <div className={styles.dropdownDivider}></div>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/user/dashboard')}
                      >
                        <LayoutDashboard size={16} />
                        <span>Account</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/user/orders')}
                      >
                        <Package size={16} />
                        <span>Orders</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/user/rfq')}
                      >
                        <FileText size={16} />
                        <span>RFQ</span>
                      </button>
                      <div className={styles.dropdownDivider}></div>
                      <button
                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
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