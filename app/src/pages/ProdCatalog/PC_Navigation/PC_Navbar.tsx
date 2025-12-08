import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User,
  LayoutDashboard,
  Home,
  BookImage,
  ShoppingCart,
  ShoppingBag,
  Package,
  FileText,
  Users,
 // Settings,
  UserCircle,
} from 'lucide-react'; // all Lucide icons [web:9][web:22][web:34][web:35][web:27][web:36][web:18]
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

  // Account dropdown (user/admin)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navbarRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  const { isLoggedIn, userData, logout } = useAuth();

  const showAuthModal = location.pathname === '/login' || location.pathname === '/register';
  const initialMode = location.pathname === '/register' ? 'register' : 'login';

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

  // Close mobile menu on outside click
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

  // Close account dropdown on outside click
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

  // Close mobile menu on desktop resize
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
            {/* HOME ICON: visible for everyone (guest, customer, admin) */}
            <button
              className={styles.dropdownItem}
              onClick={() => handleAccountNavigation('/')}
              aria-label="Home"
            >
              <Home size={24} />
            </button>

            {/* CART ICON: only for guests and customers (not admins) */}
            {(!isLoggedIn || userData?.role === 'customer') && (
              <button 
                className={styles.cartBtn}
                onClick={handleCartClick}
                aria-label="Shopping cart"
              >
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className={styles.cartBadge}>{cartItemCount}</span>
                )}
              </button>
            )}

            {/* AUTH BUTTONS (when not logged in) */}
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
              /* ACCOUNT DROPDOWN (when logged in) */
              <div className={styles.accountDropdown} ref={accountDropdownRef}>
                {/* User icon that toggles the dropdown */}
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
                    {/* CUSTOMER DROPDOWN (userData.role === 'customer') */}
                    {userData?.role === 'customer' ? (
                      <>
                        <div className={styles.dropdownHeader}>
                          <span className={styles.userName}>{getDisplayName()}</span>
                          <span className={styles.userRole}> (Customer)</span>
                        </div>

                        {/* RESTORED CUSTOMER BUTTONS (commented, now using Lucide) */}
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
                       

                        <button
                          className={`${styles.dropdownItem} ${styles.logoutItem}`}
                          onClick={handleLogoutClick}
                        >
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      /* ADMIN DROPDOWN (for admin users) */
                      <>
                        <div className={styles.dropdownHeader}>
                          <span className={styles.userName}>{getDisplayName()}</span>
                          <span className={styles.userRole}> (Admin)</span>
                        </div>


                        <button
                          className={styles.dropdownItem}
                          onClick={() => handleAccountNavigation('/admin/dashboard')}
                        >
                          <LayoutDashboard size={16} />
                          <span>Dashboard</span>
                        </button>

                        {/* RESTORED ADMIN BUTTONS (commented, now using Lucide) */}                        
                        <button
                          className={styles.dropdownItem}
                          onClick={() => handleAccountNavigation('/product-catalog')}
                        >
                          <BookImage size={16} />
                          <span>Catalog</span>
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
                          onClick={() => handleAccountNavigation('/admin/user-mngt')}
                        >
                          <Users size={16} />
                          <span>User Management</span>
                        </button>
                        {/* <button
                          className={styles.dropdownItem}
                          onClick={() => handleAccountNavigation('/admin/settings')}
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </button> */}
                       

                        <div className={styles.dropdownDivider}></div>
                        <button
                          className={`${styles.dropdownItem} ${styles.logoutItem}`}
                          onClick={handleLogoutClick}
                        >
                          <span>Logout</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* LOGIN / REGISTER MODAL */}
      {showAuthModal && (
        <LoginPage
          isOpen={true}
          onClose={handleModalClose}
          initialMode={initialMode}
        />
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className={styles.logoutModalOverlay} onClick={handleCancelLogout}>
          <div className={styles.logoutModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.logoutModalHeader}>
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
                  <>Logout</>
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
