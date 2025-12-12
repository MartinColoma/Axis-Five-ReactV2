// src/pages/ProdCatalog/PC_Navigation/PC_Navbar.tsx
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
  UserCircle,
} from 'lucide-react';
import styles from './PC_Navbar.module.css';
import LoginPage from '../PC_Auth/PC_LoginReg';
import { useAuth } from '../../../contexts/AuthContext';

interface EcommerceNavbarProps {
  cartItemCount?: number;      // optional override from parent (still supported)
  onCartClick?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

const EcommerceNavbar: FC<EcommerceNavbarProps> = ({ 
  cartItemCount,
  onCartClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Account dropdown (user/admin)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Cart badge (from backend)
  const [cartCount, setCartCount] = useState<number>(0);

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

  // Scroll effect
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

  // 🔹 Load cart count for logged‑in customers
  useEffect(() => {
    if (!isLoggedIn || userData?.role !== 'customer') {
      setCartCount(0);
      return;
    }

    const loadCartCount = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/product-catalog/cart`,
          {
            credentials: 'include',
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          // prefer backend aggregate; fall back to items length if needed
          const total =
            typeof data.total_quantity === 'number'
              ? data.total_quantity
              : Array.isArray(data.items)
              ? data.items.reduce(
                  (sum: number, item: { quantity?: number }) =>
                    sum + (item.quantity || 0),
                  0
                )
              : 0;
          setCartCount(total);
        }
      } catch (err) {
        console.error('Error loading cart count:', err);
      }
    };

    loadCartCount();
  }, [isLoggedIn, userData?.role]);

  const effectiveCartCount =
    typeof cartItemCount === 'number' ? cartItemCount : cartCount;

  const handleCartClick = () => {
    closeMobileMenu();
    if (onCartClick) {
      onCartClick();
    } else {
      navigate('/cart');
    }
  };

  const handleModalClose = () => {
    const bgLocation = (location.state as any)?.backgroundLocation;
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
      setCartCount(0);
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
            {/* Home icon */}
            <button
              className={styles.dropdownItem}
              onClick={() => handleAccountNavigation('/')}
              aria-label="Home"
            >
              <Home size={24} />
            </button>

            {/* Cart icon: guests + customers */}
            {(!isLoggedIn || userData?.role === 'customer') && (
              <button 
                className={styles.cartBtn}
                onClick={handleCartClick}
                aria-label="Shopping cart"
              >
                <ShoppingCart size={24} />
                {effectiveCartCount > 0 && (
                  <span className={styles.cartBadge}>{effectiveCartCount}</span>
                )}
              </button>
            )}

            {/* Auth buttons / account dropdown */}
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
                          <span className={styles.userRole}> (Customer)</span>
                        </div>

                        <button
                          className={styles.dropdownItem}
                          onClick={() => handleAccountNavigation('/account/rfqs')}
                        >
                          <Package size={16} />
                          <span>My Requests</span>
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
                          <span>Users</span>
                        </button>

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
