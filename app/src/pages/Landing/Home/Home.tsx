import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Home.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Navbar from '../Navigation/navbar';
import Footer from '../Navigation/Footer';

const Home: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeAboutSlide, setActiveAboutSlide] = useState(0);
  const location = useLocation();

  const heroSlides = [
    '/images/Home/H1.png',
    '/images/Home/H2.jpg',
    '/images/Home/H3.png'
  ];

  // Handle navigation from other pages with scroll state
  useEffect(() => {
    if (location.state && (location.state as any).scrollTo) {
      const sectionId = (location.state as any).scrollTo;
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
      // Clear the state after scrolling
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_LOCAL_SERVER}/api/landing/contact-us`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert('Message sent successfully!');
        form.reset();
      } else {
        alert('Failed: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Server error. Try again later.');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextAboutSlide = () => {
    setActiveAboutSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevAboutSlide = () => {
    setActiveAboutSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      {/* Hero Section */}
      <section id="home" className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Empowering Innovation,
                <br />
                Inspiring the Future.
              </h1>
              <p className={styles.heroSubtitle}>Technology Aligned. Futures Defined.</p>

              <button 
                onClick={() => scrollToSection('services')} 
                className={styles.ctaButton}
              >
                Discover Our Services
              </button>
            </div>

            <div className={styles.heroCarousel}>
              <div className={styles.carousel}>
                <div className={styles.carouselInner}>
                  {heroSlides.map((slide, index) => (
                    <img
                      key={index}
                      src={slide}
                      alt={`Slide ${index + 1}`}
                      className={`${styles.carouselSlide} ${index === activeSlide ? styles.active : ''}`}
                    />
                  ))}
                </div>
                <button className={`${styles.carouselControl} ${styles.prev}`} onClick={prevSlide} aria-label="Previous slide">
                  <span>‹</span>
                </button>
                <button className={`${styles.carouselControl} ${styles.next}`} onClick={nextSlide} aria-label="Next slide">
                  <span>›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={styles.testimonialsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>What Our Clients Say</h2>
          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <img
                  src="/images/clients/ceo-techcorp.jpg"
                  alt="CEO TechCorp"
                  className={styles.testimonialAvatar}
                />
                <div className={styles.testimonialInfo}>
                  <h3 className={styles.testimonialName}>Jane Smith</h3>
                  <p className={styles.testimonialRole}>CEO, TechCorp</p>
                </div>
              </div>
              <p className={styles.testimonialText}>
                "Axis Five completely transformed our workflow with their IoT solutions. Their ability to
                integrate seamlessly into our existing system was impressive. The team is reliable,
                responsive, and truly committed to delivering value."
              </p>
            </div>

            <div className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <img
                  src="/images/clients/cto-innovatex.jpg"
                  alt="CTO InnovateX"
                  className={styles.testimonialAvatar}
                />
                <div className={styles.testimonialInfo}>
                  <h3 className={styles.testimonialName}>Michael Lee</h3>
                  <p className={styles.testimonialRole}>CTO, InnovateX</p>
                </div>
              </div>
              <p className={styles.testimonialText}>
                "Professional, innovative, and client-focused. Their IT services are top-notch and exceeded our
                expectations. Axis Five delivered on time, with excellent communication throughout the project."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.container}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutContent}>
              <h2 className={styles.sectionTitle}>About Us</h2>
              <p className={styles.aboutText}>
                Axis Five Solutions was founded by five forward-thinking engineers with a shared vision: to align
                technology with human progress. We combine deep technical expertise with bold innovation to create
                solutions that power businesses and inspire the future.
              </p>
              <Link to="/about" className={styles.ctaButton}>
                Know More
              </Link>
            </div>

            <div className={styles.aboutCarousel}>
              <div className={styles.carousel}>
                <div className={styles.carouselInner}>
                  {heroSlides.map((slide, index) => (
                    <img
                      key={index}
                      src={slide}
                      alt={`About Slide ${index + 1}`}
                      className={`${styles.carouselSlide} ${index === activeAboutSlide ? styles.active : ''}`}
                    />
                  ))}
                </div>
                <button className={`${styles.carouselControl} ${styles.prev}`} onClick={prevAboutSlide} aria-label="Previous about slide">
                  <span>‹</span>
                </button>
                <button className={`${styles.carouselControl} ${styles.next}`} onClick={nextAboutSlide} aria-label="Next about slide">
                  <span>›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className={styles.servicesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Services</h2>
          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <i className={`fas fa-microchip ${styles.serviceIcon}`}></i>
              <h3 className={styles.serviceTitle}>IoT Solutions</h3>
              <p className={styles.serviceDescription}>
                Smart sensors, connected devices, and automation systems to bring your ideas to life.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <i className={`fas fa-code ${styles.serviceIcon}`}></i>
              <h3 className={styles.serviceTitle}>IT Services</h3>
              <p className={styles.serviceDescription}>
                Web applications, cloud systems, and IT consulting built for scalability and performance.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <i className={`fas fa-cloud ${styles.serviceIcon}`}></i>
              <h3 className={styles.serviceTitle}>Cloud Integration</h3>
              <p className={styles.serviceDescription}>
                Seamlessly migrate and scale your operations with secure cloud infrastructure and 24/7 support.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <i className={`fas fa-shield-alt ${styles.serviceIcon}`}></i>
              <h3 className={styles.serviceTitle}>Cybersecurity</h3>
              <p className={styles.serviceDescription}>
                Protect your digital assets with next-gen security solutions, risk assessments, and monitoring systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className={styles.productsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Products</h2>
          <div className={styles.productsGrid}>
            <div className={styles.productCard}>
              <img src="/images/products/docusort/docusort.png" alt="DocuSort" className={styles.productImage} />
              <div className={styles.productContent}>
                <h3 className={styles.productTitle}>DocuSort</h3>
                <p className={styles.productDescription}>Automated machine that intelligently sorts documents.</p>
                <ul className={styles.productFeatures}>
                  <li>✔ Raspberry Pi</li>
                  <li>✔ Desktop Application</li>
                  <li>✔ Automated Email Alerts</li>
                </ul>
              </div>
            </div>

            <div className={styles.productCard}>
              <img src="/images/products/env_monitor/env-monitor.jpg" alt="Smart Environment Monitor" className={styles.productImage} />
              <div className={styles.productContent}>
                <h3 className={styles.productTitle}>Smart Environment Monitor</h3>
                <p className={styles.productDescription}>Real-time monitoring for smart homes, offices, and industry.</p>
                <ul className={styles.productFeatures}>
                  <li>✔ Wireless connectivity</li>
                  <li>✔ Mobile app integration</li>
                  <li>✔ Energy-efficient</li>
                </ul>
              </div>
            </div>

            <div className={styles.productCard}>
              <img src="/images/products/security_sys/security-system.jpg" alt="Connected Security System" className={styles.productImage} />
              <div className={styles.productContent}>
                <h3 className={styles.productTitle}>Connected Security System</h3>
                <p className={styles.productDescription}>IoT-enabled security, cloud connectivity, 24/7 remote access.</p>
                <ul className={styles.productFeatures}>
                  <li>✔ AI motion detection</li>
                  <li>✔ Cloud storage</li>
                  <li>✔ Instant mobile alerts</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.productsCta}>
            <Link to="/product-catalog" className={`${styles.ctaButton} ${styles.ctaLarge}`}>
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactWrapper}>
            <div className={styles.contactContainer}>
              <div className={styles.contactHeader}>
                <div className={styles.contactIcon}>📩</div>
                <h2 className={styles.sectionTitle}>Let's get to work!</h2>
                <p className={styles.contactSubtitle}>
                  Have an idea or project in mind? Drop us a message and let's build something amazing together.
                </p>
              </div>

              <form className={styles.contactForm} onSubmit={handleSubmit}>
                <div className={styles.formField}>
                  <input
                    type="text"
                    className={styles.formInput}
                    name="name"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <input
                    type="email"
                    className={styles.formInput}
                    name="email"
                    placeholder="Your Email"
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <textarea
                    className={`${styles.formInput} ${styles.formTextarea}`}
                    name="message"
                    rows={5}
                    placeholder="Your Message"
                    required
                  />
                </div>
                <button type="submit" className={`${styles.ctaButton} ${styles.ctaFull}`}>
                  Send Message
                </button>
              </form>

              <div className={styles.contactFooter}>
                <p className={styles.contactSocialLabel}>or reach us on our social media</p>
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
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer onScrollToSection={scrollToSection} />
    </div>
  );
};

export default Home;