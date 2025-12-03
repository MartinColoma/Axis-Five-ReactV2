import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./About.css";

const About: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle hash navigation (e.g., /about#why-us)
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      />
      <header>
        <nav className="navbar">
          <div className="logo">
            <Link to="/">
              <h1>
                <span className="axis">Axis</span>
                <span className="five">Five Solutions</span>
              </h1>
            </Link>
          </div>

          <ul className="nav-links">
            <li>
              <Link to="/#home" className="active">Home</Link>
            </li>
            <li>
              <Link to="/#testimonials">Testimonials</Link>
            </li>

            {/* About Dropdown */}
            <li className="dropdown">
              <Link to="/about">About</Link>
              <div className="dropdown-content">
                <Link to="/about#about">Who We Are</Link>
                <Link to="/about#why-us">Why Choose Us</Link>
                <Link to="/about#tech-stack">Technologies</Link>
                <Link to="/about#founder">Founder</Link>
                <Link to="/about#team">Our Developers</Link>
              </div>
            </li>

            {/* Services */}
            <li>
              <Link to="/#services">Services</Link>
            </li>

            {/* Products */}
            <li>
              <Link to="/#products">Products</Link>
            </li>

            <li>
              <Link to="/#contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <h1>
            Empowering Innovation, <span className="highlight">Inspiring the Future</span>
          </h1>
          <p className="hero-subtitle">
            Where cutting-edge technology meets human ingenuity to create tomorrow's solutions today
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="section about-full" id="about">
        <div className="content-container">
          <h2>Who We Are</h2>
          <div className="about-content">
            <div className="about-text">
              <p className="intro-text">
                Axis Five Solutions was founded in 2023 by five forward-thinking engineers united by a shared vision:
                to align technology with human progress and create solutions that truly matter.
              </p>

              <p>
                We specialize in IoT solutions and IT services. Our team combines years of expertise in engineering,
                software development, and systems integration to deliver practical, scalable, and future-ready systems.
              </p>

              <p>
                Based in Maybunga, Pasig City, we bring local expertise with international standards — building technology
                that enhances human capability.
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">10+</div>
                <div className="stat-label">Projects Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5+</div>
                <div className="stat-label">Happy Clients</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">2</div>
                <div className="stat-label">Years Experience</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Vision Values */}
      <section className="section mvv-section">
        <div className="content-container">
          <h2>Our Foundation</h2>
          <div className="mvv-grid">
            <div className="mvv-card">
              <div className="mvv-icon"><i className="fas fa-bullseye"></i></div>
              <h3>Our Mission</h3>
              <p>
                To empower businesses and individuals through accessible, human-centered IoT and IT solutions.
              </p>
            </div>

            <div className="mvv-card">
              <div className="mvv-icon"><i className="fas fa-eye"></i></div>
              <h3>Our Vision</h3>
              <p>
                To lead Southeast Asia in transforming how people interact with intelligent, sustainable technology.
              </p>
            </div>

            <div className="mvv-card">
              <div className="mvv-icon"><i className="fas fa-heart"></i></div>
              <h3>Our Values</h3>
              <ul>
                <li><strong>Innovation:</strong> Practical but forward-thinking</li>
                <li><strong>Integrity:</strong> Transparent and ethical</li>
                <li><strong>Excellence:</strong> Quality in every detail</li>
                <li><strong>Collaboration:</strong> Building together</li>
                <li><strong>Sustainability:</strong> Designed for longevity</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section about-full" id="why-us">
        <div className="content-container">
          <h2>Why Choose Axis Five Solutions</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-rocket"></i></div>
              <h3>Fast Deployment</h3>
              <p>Agile methodology enabling 40% faster deployment.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-shield-alt"></i></div>
              <h3>Enterprise Security</h3>
              <p>Military-grade encryption & secure authentication.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-globe"></i></div>
              <h3>Global Reach</h3>
              <p>24/7 cloud-based support and monitoring.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-handshake"></i></div>
              <h3>Client-Centered</h3>
              <p>Every system is designed for your exact needs.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-cogs"></i></div>
              <h3>Scalable Systems</h3>
              <p>Architecture that grows with your business.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-tools"></i></div>
              <h3>Full-Stack Expertise</h3>
              <p>From hardware to cloud deployment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="section tech-section" id="tech-stack">
        <div className="content-container">
          <h2>Technologies We Master</h2>

          <div className="tech-categories">

            <div className="tech-category">
              <h3>Hardware & IoT</h3>
              <div className="tech-tags">
                <span className="tech-tag">Arduino</span>
                <span className="tech-tag">Raspberry Pi</span>
                <span className="tech-tag">Sensors</span>
                <span className="tech-tag">Modules</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>Software Development</h3>
              <div className="tech-tags">
                <span className="tech-tag">Python</span>
                <span className="tech-tag">JavaScript</span>
                <span className="tech-tag">React</span>
                <span className="tech-tag">Node.js</span>
                <span className="tech-tag">C/C++</span>
                <span className="tech-tag">C#</span>
                <span className="tech-tag">Java</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>Cloud & Infrastructure</h3>
              <div className="tech-tags">
                <span className="tech-tag">AWS</span>
                <span className="tech-tag">Google Cloud</span>
                <span className="tech-tag">Azure</span>
                <span className="tech-tag">Docker</span>
                <span className="tech-tag">Kubernetes</span>
                <span className="tech-tag">MongoDB</span>
                <span className="tech-tag">MySQL</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>Analytics & AI</h3>
              <div className="tech-tags">
                <span className="tech-tag">Machine Learning</span>
                <span className="tech-tag">TensorFlow</span>
                <span className="tech-tag">Data Analytics</span>
                <span className="tech-tag">Real-time Processing</span>
                <span className="tech-tag">Predictive Analytics</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="section about-full" id="founder">
        <div className="content-container">
          <h2>Meet Our Founder</h2>

          <div className="founder-container">
            <div className="founder-image">
              <img src="/images/Team/founder_1.jpg" alt="Founder" />
            </div>

            <div className="founder-text">
              <h3>Kiyoshi Adachi</h3>
              <p className="founder-title">Founder & Chief Technology Officer</p>

              <p className="founder-bio">
                Kiyoshi is a visionary leader with 8+ years of IoT and enterprise IT experience.
                His passion started during his Computer Engineering studies.
              </p>

              <p className="founder-bio">
                Before founding Axis Five Solutions, he led technology teams at several tech startups,
                gaining deep experience in scaling complex systems.
              </p>

              <div className="founder-achievements">
                <h4>Key Achievements:</h4>
                <ul>
                  <li>Led 100+ IoT implementations</li>
                  <li>Published 5 IoT security research papers</li>
                  <li>Speaker at 3 international conferences</li>
                  <li>AWS Solutions Architect Certified</li>
                </ul>
              </div>

              <blockquote className="founder-quote">
                "Technology should serve humanity… Our mission is to simplify the complex."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="section">
        <div className="content-container">
          <h2 className="team-header">Meet Our Expert Developers</h2>
          <p className="team-intro">
            Our diverse team brings complementary skills and passion for innovation.
          </p>

          <div className="team-container">

            <div className="team-member">
              <img src="/images/Team/Martin.png" alt="Martin" />
              <div className="member-info">
                <h3>Martin</h3>
                <p className="role">Full Stack Developer</p>
                <p className="experience">3+ years experience</p>
                <div className="skills">
                  <span className="skill">React</span>
                  <span className="skill">Node.js</span>
                  <span className="skill">Python</span>
                </div>
              </div>
            </div>

            <div className="team-member">
              <img src="/images/Team/Earl2.png" alt="Earl" />
              <div className="member-info">
                <h3>Earl</h3>
                <p className="role">Hardware Engineer</p>
                <p className="experience">4+ years experience</p>
                <div className="skills">
                  <span className="skill">PCB Design</span>
                  <span className="skill">Embedded</span>
                  <span className="skill">IoT Protocols</span>
                </div>
              </div>
            </div>

            <div className="team-member">
              <img src="/images/Team/Karl.png" alt="Karl" />
              <div className="member-info">
                <h3>Karl</h3>
                <p className="role">Frontend Developer</p>
                <p className="experience">3+ years experience</p>
                <div className="skills">
                  <span className="skill">React</span>
                  <span className="skill">Vue.js</span>
                  <span className="skill">UI/UX</span>
                </div>
              </div>
            </div>

            <div className="team-member">
              <img src="/images/Team/Kent2.png" alt="Kent" />
              <div className="member-info">
                <h3>Kent</h3>
                <p className="role">Operations Manager</p>
                <p className="experience">5+ years experience</p>
                <div className="skills">
                  <span className="skill">Project Management</span>
                  <span className="skill">QA</span>
                  <span className="skill">Client Relations</span>
                </div>
              </div>
            </div>

            <div className="team-member">
              <img src="/images/Team/Paul.png" alt="Paul" />
              <div className="member-info">
                <h3>Paul</h3>
                <p className="role">Hardware System Engineer</p>
                <p className="experience">4+ years experience</p>
                <div className="skills">
                  <span className="skill">Architecture</span>
                  <span className="skill">Firmware</span>
                  <span className="skill">Testing</span>
                </div>
              </div>
            </div>

          </div>

          <Link to="/team" className="view-more-btn">
            View Complete Team Profiles
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-container">

          <div className="footer-column">
            <div className="footer-logo">
              <Link to="/">
                <h1>
                  <span className="footer-axis">Axis</span>
                  <span className="footer-five">Five Solutions</span>
                </h1>
              </Link>
            </div>

            <p className="tagline">Empowering Innovation, Inspiring the Future.</p>
            <p className="subtitle">Maybunga, Pasig City Philippines 1607</p>
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/#home">Home</Link></li>
              <li><Link to="/#testimonials">Testimonials</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/#services">Services</Link></li>
              <li><Link to="/#products">Products</Link></li>
              <li><Link to="/#contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>About Us</h3>
            <ul className="footer-links">
              <li><Link to="/about#about">Who We Are</Link></li>
              <li><Link to="/about#why-us">Why Choose Us</Link></li>
              <li><Link to="/about#tech-stack">Technologies</Link></li>
              <li><Link to="/about#founder">Founder</Link></li>
              <li><Link to="/about#team">Our Developers</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Reach us here:</h3>
            <p className="subtitle"><strong>Email:</strong> axisfive.solution@gmail.com</p>
            <p className="subtitle"><strong>Mobile:</strong> +63 945 509 3110</p>

            <div className="footer-social">
              <h4>Follow us</h4>

              <div className="social-links">
                <a href="https://www.facebook.com/axisfive.solutions/" target="_blank" rel="noopener" className="footer-btn">
                  <i className="fab fa-facebook-f" />
                </a>

                <a href="https://www.instagram.com/a5.sol/" target="_blank" rel="noopener" className="footer-btn">
                  <i className="fab fa-instagram" />
                </a>

                <a href="https://github.com/MartinColoma/Axis-Five" target="_blank" rel="noopener" className="footer-btn">
                  <i className="fab fa-github" />
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="copyright">
          <p>© 2025 Axis Five Solutions. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default About;