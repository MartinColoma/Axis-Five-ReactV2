import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './navbar.module.css';

interface NavbarProps {
  onScrollToSection?: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onScrollToSection }) => {
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
    
    if (onScrollToSection) {
      // Use the parent's scrollToSection if provided
      onScrollToSection(id);
    } else {
      // Fallback: Default behavior for navigation
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const section = document.getElementById(id);
          if (section) {
            const navbarHeight = 70;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      } else {
        const section = document.getElementById(id);
        if (section) {
          const navbarHeight = 70;
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  // Handle About button click - scroll to about section AND toggle dropdown
  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle dropdown (don't close mobile menu to keep dropdown visible)
    setIsDropdownOpen(!isDropdownOpen);
    
    // Scroll to about section on homepage (without closing menu on mobile)
    if (onScrollToSection) {
      onScrollToSection('about');
    } else {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const section = document.getElementById('about');
          if (section) {
            const navbarHeight = 70;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      } else {
        const section = document.getElementById('about');
        if (section) {
          const navbarHeight = 70;
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  return (
    <nav className={styles.navbar} ref={navbarRef}>
      <div className={styles.navbarContainer}>
        {/* Logo - Left Side */}
        <Link to="/" className={styles.navbarBrand} onClick={closeMobileMenu}>
          <h1 className={styles.logo}>
            <span className={styles.axis}>Axis</span>
            <span className={styles.five}>Five Solutions</span>
          </h1>
        </Link>

        {/* Hamburger Menu - Right Side (Mobile Only) */}
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

        {/* Navigation Menu - Right Side */}
        <div className={`${styles.navbarMenu} ${isMobileMenuOpen ? styles.active : ''}`}>
          <ul className={styles.navbarNav}>
            <li className={styles.navItem}>
              <button className={styles.navLink} onClick={() => scrollToSection('home')}>
                Home
              </button>
            </li>
            
            <li className={styles.navItem}>
              <button className={styles.navLink} onClick={() => scrollToSection('testimonials')}>
                Testimonials
              </button>
            </li>
            
            <li className={`${styles.navItem} ${styles.dropdown} ${isDropdownOpen ? styles.active : ''}`}>
              <button
                className={`${styles.navLink} ${styles.dropdownToggle}`}
                onClick={handleAboutClick}
                aria-expanded={isDropdownOpen}
              >
                About
              </button>
              <ul className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.show : ''}`}>
                <li>
                  <Link to="/about" className={styles.dropdownItem} onClick={closeMobileMenu}>
                    Who We Are
                  </Link>
                </li>
                <li>
                  <Link to="/about#why-us" className={styles.dropdownItem} onClick={closeMobileMenu}>
                    Why Choose Us
                  </Link>
                </li>
                <li>
                  <Link to="/about#tech-stack" className={styles.dropdownItem} onClick={closeMobileMenu}>
                    Technologies
                  </Link>
                </li>
                <li>
                  <Link to="/about#founder" className={styles.dropdownItem} onClick={closeMobileMenu}>
                    Founder
                  </Link>
                </li>
                <li>
                  <Link to="/about#team" className={styles.dropdownItem} onClick={closeMobileMenu}>
                    Our Developers
                  </Link>
                </li>
              </ul>
            </li>
            
            <li className={styles.navItem}>
              <button className={styles.navLink} onClick={() => scrollToSection('services')}>
                Services
              </button>
            </li>
            
            <li className={styles.navItem}>
              <button className={styles.navLink} onClick={() => scrollToSection('products')}>
                Products
              </button>
            </li>
            
            <li className={styles.navItem}>
              <button 
                className={`${styles.navLink} ${styles.contactBtn}`} 
                onClick={() => scrollToSection('contact')}
              >
                Contact Us
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;