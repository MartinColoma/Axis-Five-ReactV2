import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Navbar from '../Navbar/navbar';

const Home: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeAboutSlide, setActiveAboutSlide] = useState(0);

  const heroSlides = [
    '/images/Home/H1.png',
    '/images/Home/H2.jpg',
    '/images/Home/H3.png'
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/landing/contact-us`,
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
    <div className="page-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1 className="hero-title">
                Empowering Innovation,
                <br />
                Inspiring the Future.
              </h1>
              <p className="hero-subtitle">Technology Aligned. Futures Defined.</p>

              <button 
                onClick={() => scrollToSection('services')} 
                className="btn btn-primary btn-discover"
              >
                Discover Our Services
              </button>

              <div className="tech-stack">
                <img src="/images/stack/mysql.jpg" alt="MySQL" className="tech-icon" />
                <img src="/images/stack/express.jpg" alt="Express" className="tech-icon" />
                <img src="/images/stack/react.jpg" alt="React" className="tech-icon" />
                <img src="/images/stack/node.jpg" alt="Node.js" className="tech-icon" />
                <img src="/images/stack/flask.jpg" alt="Flask" className="tech-icon" />
              </div>
            </div>

            <div className="hero-carousel">
              <div className="carousel">
                <div className="carousel-inner">
                  {heroSlides.map((slide, index) => (
                    <img
                      key={index}
                      src={slide}
                      alt={`Slide ${index + 1}`}
                      className={`carousel-slide ${index === activeSlide ? 'active' : ''}`}
                    />
                  ))}
                </div>
                <button className="carousel-btn carousel-prev" onClick={prevSlide}>
                  <span>‹</span>
                </button>
                <button className="carousel-btn carousel-next" onClick={nextSlide}>
                  <span>›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="section testimonials-section">
        <div className="container">
          <h2 className="section-title">What Our Clients Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <img
                  src="/images/clients/ceo-techcorp.jpg"
                  alt="CEO TechCorp"
                  className="testimonial-img"
                />
                <div>
                  <h5 className="testimonial-name">Jane Smith</h5>
                  <p className="testimonial-role">CEO, TechCorp</p>
                </div>
              </div>
              <p className="testimonial-text">
                "Axis Five completely transformed our workflow with their IoT solutions. Their ability to
                integrate seamlessly into our existing system was impressive. The team is reliable,
                responsive, and truly committed to delivering value."
              </p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <img
                  src="/images/clients/cto-innovatex.jpg"
                  alt="CTO InnovateX"
                  className="testimonial-img"
                />
                <div>
                  <h5 className="testimonial-name">Michael Lee</h5>
                  <p className="testimonial-role">CTO, InnovateX</p>
                </div>
              </div>
              <p className="testimonial-text">
                "Professional, innovative, and client-focused. Their IT services are top-notch and exceeded our
                expectations. Axis Five delivered on time, with excellent communication throughout the project."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <h2 className="section-title">About Us</h2>
              <p className="about-text">
                Axis Five Solutions was founded by five forward-thinking engineers with a shared vision: to align
                technology with human progress. We combine deep technical expertise with bold innovation to create
                solutions that power businesses and inspire the future.
              </p>
              <Link to="/about" className="btn btn-primary">
                Know More
              </Link>
            </div>

            <div className="about-carousel">
              <div className="carousel">
                <div className="carousel-inner">
                  {heroSlides.map((slide, index) => (
                    <img
                      key={index}
                      src={slide}
                      alt={`About Slide ${index + 1}`}
                      className={`carousel-slide ${index === activeAboutSlide ? 'active' : ''}`}
                    />
                  ))}
                </div>
                <button className="carousel-btn carousel-prev" onClick={prevAboutSlide}>
                  <span>‹</span>
                </button>
                <button className="carousel-btn carousel-next" onClick={nextAboutSlide}>
                  <span>›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <i className="fas fa-microchip service-icon"></i>
              <h5 className="service-title">IoT Solutions</h5>
              <p className="service-text">
                Smart sensors, connected devices, and automation systems to bring your ideas to life.
              </p>
            </div>

            <div className="service-card">
              <i className="fas fa-code service-icon"></i>
              <h5 className="service-title">IT Services</h5>
              <p className="service-text">
                Web applications, cloud systems, and IT consulting built for scalability and performance.
              </p>
            </div>

            <div className="service-card">
              <i className="fas fa-cloud service-icon"></i>
              <h5 className="service-title">Cloud Integration</h5>
              <p className="service-text">
                Seamlessly migrate and scale your operations with secure cloud infrastructure and 24/7 support.
              </p>
            </div>

            <div className="service-card">
              <i className="fas fa-shield-alt service-icon"></i>
              <h5 className="service-title">Cybersecurity</h5>
              <p className="service-text">
                Protect your digital assets with next-gen security solutions, risk assessments, and monitoring systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="section products-section">
        <div className="container">
          <h2 className="section-title">Our Products</h2>
          <div className="products-grid">
            <div className="product-card">
              <img src="/images/products/docusort/docusort.png" alt="DocuSort" className="product-img" />
              <div className="product-body">
                <h5 className="product-title">DocuSort</h5>
                <p className="product-text">Automated machine that intelligently sorts documents.</p>
                <ul className="product-features">
                  <li>✔ Raspberry Pi</li>
                  <li>✔ Desktop Application</li>
                  <li>✔ Automated Email Alerts</li>
                </ul>
              </div>
            </div>

            <div className="product-card">
              <img src="/images/products/env_monitor/env-monitor.jpg" alt="Smart Environment Monitor" className="product-img" />
              <div className="product-body">
                <h5 className="product-title">Smart Environment Monitor</h5>
                <p className="product-text">Real-time monitoring for smart homes, offices, and industry.</p>
                <ul className="product-features">
                  <li>✔ Wireless connectivity</li>
                  <li>✔ Mobile app integration</li>
                  <li>✔ Energy-efficient</li>
                </ul>
              </div>
            </div>

            <div className="product-card">
              <img src="/images/products/security_sys/security-system.jpg" alt="Connected Security System" className="product-img" />
              <div className="product-body">
                <h5 className="product-title">Connected Security System</h5>
                <p className="product-text">IoT-enabled security, cloud connectivity, 24/7 remote access.</p>
                <ul className="product-features">
                  <li>✔ AI motion detection</li>
                  <li>✔ Cloud storage</li>
                  <li>✔ Instant mobile alerts</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="products-cta">
            <Link to="/products" className="btn btn-primary btn-lg">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section contact-section">
        <div className="container">
          <div className="contact-wrapper">
            <div className="contact-container">
              <div className="contact-header">
                <div className="icon-wrapper">📩</div>
                <h2 className="section-title">Let's get to work!</h2>
                <p className="contact-subtitle">
                  Have an idea or project in mind? Drop me a message and let's build something amazing together.
                </p>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    name="name"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    className="form-input"
                    name="email"
                    placeholder="Your Email"
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    className="form-input form-textarea"
                    name="message"
                    rows={5}
                    placeholder="Your Message"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full">
                  Send Message
                </button>
              </form>

              <div className="contact-footer">
                <p className="contact-social-text">or reach us on our social media</p>
                <div className="social-links">
                  <a
                    href="https://www.facebook.com/axisfive.solutions/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    href="https://www.instagram.com/a5.sol/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a
                    href="https://github.com/MartinColoma/Axis-Five"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
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
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3 className="footer-brand">
                <span className="axis">Axis</span>
                <span className="five">Five Solutions</span>
              </h3>
              <p className="footer-tagline">Empowering Innovation, Inspiring the Future.</p>
              <p className="footer-address">Maybunga, Pasig City Philippines 1607</p>
            </div>

            <div className="footer-col">
              <h5 className="footer-title">Quick Links</h5>
              <ul className="footer-links">
                <li><button onClick={() => scrollToSection('home')} className="footer-link">Home</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="footer-link">Testimonials</button></li>
                <li><Link to="/about" className="footer-link">About</Link></li>
                <li><button onClick={() => scrollToSection('services')} className="footer-link">Services</button></li>
                <li><button onClick={() => scrollToSection('products')} className="footer-link">Products</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="footer-link">Contact</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5 className="footer-title">About Us</h5>
              <ul className="footer-links">
                <li><Link to="/about" className="footer-link">Who We Are</Link></li>
                <li><Link to="/about#why-us" className="footer-link">Why Choose Us</Link></li>
                <li><Link to="/about#tech-stack" className="footer-link">Technologies</Link></li>
                <li><Link to="/about#founder" className="footer-link">Founder</Link></li>
                <li><Link to="/about#team" className="footer-link">Our Developers</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5 className="footer-title">Reach us here:</h5>
              <p className="footer-contact"><strong>Email:</strong> axisfive.solution@gmail.com</p>
              <p className="footer-contact"><strong>Mobile:</strong> +63 945 509 3110</p>
              <h6 className="footer-subtitle">Follow our social media</h6>
              <div className="social-links">
                <a href="https://www.facebook.com/axisfive.solutions/" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/a5.sol/" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://github.com/MartinColoma/Axis-Five" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <i className="fab fa-github"></i>
                </a>
              </div>
            </div>
          </div>

          <hr className="footer-divider" />
          <p className="footer-copyright">&copy; 2025 Axis Five Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;