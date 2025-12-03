import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

interface FooterProps {
  onScrollToSection?: (sectionId: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onScrollToSection }) => {
  const handleScroll = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerColumn}>
            <h3 className={styles.footerBrand}>
              <span className={styles.axis}>Axis</span>
              <span className={styles.five}>Five Solutions</span>
            </h3>
            <p className={styles.footerTagline}>Empowering Innovation, Inspiring the Future.</p>
            <p className={styles.footerAddress}>Maybunga, Pasig City Philippines 1607</p>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerHeading}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li>
                <button onClick={() => handleScroll('home')} className={styles.footerLink}>
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleScroll('testimonials')} className={styles.footerLink}>
                  Testimonials
                </button>
              </li>
              <li>
                <Link to="/about" className={styles.footerLink}>
                  About
                </Link>
              </li>
              <li>
                <button onClick={() => handleScroll('services')} className={styles.footerLink}>
                  Services
                </button>
              </li>
              <li>
                <button onClick={() => handleScroll('products')} className={styles.footerLink}>
                  Products
                </button>
              </li>
              <li>
                <button onClick={() => handleScroll('contact')} className={styles.footerLink}>
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerHeading}>About Us</h4>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/about" className={styles.footerLink}>
                  Who We Are
                </Link>
              </li>
              <li>
                <Link to="/about#why-us" className={styles.footerLink}>
                  Why Choose Us
                </Link>
              </li>
              <li>
                <Link to="/about#tech-stack" className={styles.footerLink}>
                  Technologies
                </Link>
              </li>
              <li>
                <Link to="/about#founder" className={styles.footerLink}>
                  Founder
                </Link>
              </li>
              <li>
                <Link to="/about#team" className={styles.footerLink}>
                  Our Developers
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerHeading}>Reach us here:</h4>
            <p className={styles.footerContact}>
              <strong>Email:</strong> axisfive.solution@gmail.com
            </p>
            <p className={styles.footerContact}>
              <strong>Mobile:</strong> +63 945 509 3110
            </p>
            <h5 className={styles.footerSubheading}>Follow our social media</h5>
            <div className={styles.socialLinks}>
              <a
                href="https://www.facebook.com/axisfive.solutions/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="https://www.instagram.com/a5.sol/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="https://github.com/MartinColoma/Axis-Five"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="GitHub"
              >
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.footerDivider}></div>
        <p className={styles.footerCopyright}>
          &copy; 2025 Axis Five Solutions. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;