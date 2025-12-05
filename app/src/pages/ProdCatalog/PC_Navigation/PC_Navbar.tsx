import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Package, 
  FileText, 
  LayoutDashboard,
  Home,
  ShoppingBag,
  ShoppingCart,
  UserCircle,
  Users,
  Settings
} from 'lucide-react';
import styles from './PC_Navbar.module.css';
import LoginPage from '../PC_Auth/PC_LoginReg';
import { useAuth } from '../../../contexts/AuthContext';

interface EcommerceNavbarProps {
  cartItemCount?: number;
  onCartClick?: () => void;
}

const EcommerceNavbar: FC<EcommerceNavbarProps> = ({ 
  cartItemCount = 0,
  onCartClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isLoggedIn, userData, logout } = useAuth();
  
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

  const handleLogoutClick = () => {
    closeAccountDropdown();
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/product-catalog');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleAccountNavigation = (path: string) => {
    closeAccountDropdown();
    closeMobileMenu();
    navigate(path);
  };

  const getDisplayName = () => {
    if (!userData) return 'Guest';
    return `${userData.first_name} ${userData.last_name}`;
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


          <div className={styles.navbarActions}>
            {/* Show cart for customers or non-logged in users */}
            {(!isLoggedIn || userData?.role === 'customer') && (
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
            )}

            {/* Show Login/Register buttons when NOT logged in */}
            {!isLoggedIn ? (
              <div className={styles.authButtons}>
                <button className={styles.btnLogin} onClick={handleLogin}>
                  Login
                </button>
                <button className={styles.btnRegister} onClick={handleRegister}>
                  Register
                </button>
              </div>
            ) : (
              /* Show user icon dropdown ONLY when logged in */
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
                    {userData?.role === 'customer' ? (
                    <>
                      <div className={styles.dropdownHeader}>
                        <span className={styles.userName}>{getDisplayName()}</span>
                        <span className={styles.userRole}>Customer</span>
                      </div>
                      <div className={styles.dropdownDivider}></div>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/user/home')}
                      >
                        <Home size={16} />
                        <span>Home</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/product-catalog')}
                      >
                        <ShoppingBag size={16} />
                        <span>Products</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/user/cart')}
                      >
                        <ShoppingCart size={16} />
                        <span>Cart</span>
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
                        onClick={() => handleAccountNavigation('/user/profile')}
                      >
                        <UserCircle size={16} />
                        <span>Profile</span>
                      </button>
                      <div className={styles.dropdownDivider}></div>
                      <button
                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                        onClick={handleLogoutClick}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.dropdownHeader}>
                        <span className={styles.userName}>{getDisplayName()}</span>
                        <span className={styles.userRole}> (Admin)</span>
                      </div>
                      <div className={styles.dropdownDivider}></div>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/admin/home')}
                      >
                        <LayoutDashboard size={16} />
                        <span>Dashboard</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/admin/products')}
                      >
                        <ShoppingBag size={16} />
                        <span>Products</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/admin/orders')}
                      >
                        <Package size={16} />
                        <span>Orders</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/admin/rfqs')}
                      >
                        <FileText size={16} />
                        <span>RFQs</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/admin/customers')}
                      >
                        <Users size={16} />
                        <span>Customers</span>
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleAccountNavigation('/admin/settings')}
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <div className={styles.dropdownDivider}></div>
                      <button
                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                        onClick={handleLogoutClick}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            )}
            
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.logoutModalOverlay} onClick={handleCancelLogout}>
          <div className={styles.logoutModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.logoutModalHeader}>
              <LogOut size={32} className={styles.logoutIcon} />
              <h3>Confirm Logout</h3>
            </div>
            <div className={styles.logoutModalBody}>
              <p>Are you sure you want to logout?</p>
              <p className={styles.logoutSubtext}>
                You'll need to login again to access your account.
              </p>
            </div>
            <div className={styles.logoutModalFooter}>
              <button
                className={styles.btnCancel}
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                className={styles.btnLogout}
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <span className={styles.spinner}></span>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EcommerceNavbar;