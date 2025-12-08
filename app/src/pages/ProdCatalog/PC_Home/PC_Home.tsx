import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import styles from './PC_Home.module.css';
import Navbar from '../PC_Navigation/PC_Navbar';
import Footer from '../../Landing/Navigation/Footer';
import usePageMeta from  '../../../hooks/usePageMeta';

interface Product {
  id: number;
  title: string;
  description: string;
  image: string;
  category: 'iot' | 'security' | 'software';
  modalContent: {
    fullDescription: string;
    features: string[];
    images: string[];
  };
}

const products: Product[] = [
  {
    id: 1,
    title: 'DocuSort: Document Sorting Machine',
    description: 'Automated sorting machine powered by Raspberry Pi.',
    image: '/images/products/docusort/docusort.png',
    category: 'iot',
    modalContent: {
      fullDescription: 'DocuSort is an advanced automated document sorting solution powered by Raspberry Pi, designed to streamline document management processes.',
      features: [
        'Raspberry Pi powered automation',
        'High-speed document sorting',
        'Smart categorization',
        'Easy integration'
      ],
      images: [
        '/images/products/docusort/docusort.png',
        '/images/products/docusort/detail1.jpg',
        '/images/products/docusort/detail2.jpg'
      ]
    }
  },
  {
    id: 2,
    title: 'Smart Environment Monitor',
    description: 'Tracks temperature, humidity & air quality in real-time.',
    image: '/images/products/env_monitor/env-monitor.jpg',
    category: 'iot',
    modalContent: {
      fullDescription: 'Real-time environmental monitoring system that tracks critical air quality metrics for optimal living and working spaces.',
      features: [
        'Temperature monitoring',
        'Humidity tracking',
        'Air quality sensors',
        'Real-time data dashboard'
      ],
      images: [
        '/images/products/env_monitor/env-monitor.jpg',
        '/images/products/env_monitor/detail1.jpg'
      ]
    }
  },
  {
    id: 3,
    title: 'Connected Security System',
    description: 'IoT-enabled system with AI motion detection & cloud access.',
    image: '/images/products/security_sys/security-system.jpg',
    category: 'security',
    modalContent: {
      fullDescription: 'Advanced IoT security system with AI-powered motion detection and cloud-based monitoring capabilities.',
      features: [
        'AI motion detection',
        'Cloud access',
        'Real-time alerts',
        'Remote monitoring'
      ],
      images: [
        '/images/products/security_sys/security-system.jpg',
        '/images/products/security_sys/detail1.jpg'
      ]
    }
  },
  {
    id: 4,
    title: 'LibraX: AIoT Library Kiosk',
    description: 'IoT-enabled library system with AI Chatbot.',
    image: '/images/products/librax/LibraX.jpg',
    category: 'software',
    modalContent: {
      fullDescription: 'Smart library management system combining IoT technology with AI-powered assistance for enhanced user experience.',
      features: [
        'AI chatbot assistance',
        'IoT integration',
        'Self-service kiosk',
        'Digital catalog'
      ],
      images: [
        '/images/products/librax/LibraX.jpg',
        '/images/products/librax/detail1.jpg'
      ]
    }
  }
];

const featuredProducts = products.slice(0, 3);

type FilterType = 'all' | 'iot' | 'security' | 'software';

export default function Products() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [heroCarouselIndex, setHeroCarouselIndex] = useState(0);
  usePageMeta("AxisFive Store - Products", "/images/Logos/A5_Logo1.png");

  // Auto-play hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroCarouselIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products.filter(
    product => activeFilter === 'all' || product.category === activeFilter
  );

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setCarouselIndex(0);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const nextHeroSlide = () => {
    setHeroCarouselIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const prevHeroSlide = () => {
    setHeroCarouselIndex((prev) =>
      prev === 0 ? featuredProducts.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    if (selectedProduct) {
      setCarouselIndex((prev) => 
        (prev + 1) % selectedProduct.modalContent.images.length
      );
    }
  };

  const prevSlide = () => {
    if (selectedProduct) {
      setCarouselIndex((prev) => 
        prev === 0 ? selectedProduct.modalContent.images.length - 1 : prev - 1
      );
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle hash navigation (e.g., /about#why-us)
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          const navbarHeight = 70;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    } else {
      // If no hash, scroll to top
      window.scrollTo(0, 0);
    }
  }, [location]);

  const scrollToSection = (sectionId: string) => {
    // If the section exists on this page (About page), scroll to it
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      // If section doesn't exist (like 'home', 'services', etc.), navigate to home page
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <Navbar />


      {/* Featured Carousel */}
      <div className={styles.heroCarousel}>
        {featuredProducts.map((product, index) => (
          <div
            key={product.id}
            className={`${styles.carouselItem} ${index === heroCarouselIndex ? styles.active : ''}`}
          >
            <img src={product.image} alt={product.title} />
            <div className={styles.carouselCaption}>
              <h5>{product.title}</h5>
              <p>{product.description}</p>
            </div>
          </div>
        ))}
        <button className={styles.carouselControlPrev} onClick={prevHeroSlide}>
          <span className={styles.carouselControlIcon}>&#8249;</span>
        </button>
        <button className={styles.carouselControlNext} onClick={nextHeroSlide}>
          <span className={styles.carouselControlIcon}>&#8250;</span>
        </button>

        {/* Carousel Indicators */}
        <div className={styles.carouselIndicators}>
          {featuredProducts.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${index === heroCarouselIndex ? styles.activeIndicator : ''}`}
              onClick={() => setHeroCarouselIndex(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Product Catalog Section */}
      <section className={styles.sectionPadding}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Product Catalog</h2>

          {/* Filters */}
          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterBtn} ${activeFilter === 'iot' ? styles.active : ''}`}
              onClick={() => handleFilterChange('iot')}
            >
              IoT
            </button>
            <button
              className={`${styles.filterBtn} ${activeFilter === 'security' ? styles.active : ''}`}
              onClick={() => handleFilterChange('security')}
            >
              Security
            </button>
            <button
              className={`${styles.filterBtn} ${activeFilter === 'software' ? styles.active : ''}`}
              onClick={() => handleFilterChange('software')}
            >
              Software
            </button>
          </div>

          {/* Products Grid */}
          <div className={styles.productsGrid}>
            {filteredProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                <img src={product.image} alt={product.title} />
                <div className={styles.cardBody}>
                  <h5>{product.title}</h5>
                  <p>{product.description}</p>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => openModal(product)}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedProduct.title}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Image Carousel */}
              <div className={styles.modalCarousel}>
                <button className={styles.carouselPrev} onClick={prevSlide}>
                  &#8249;
                </button>
                <img
                  src={selectedProduct.modalContent.images[carouselIndex]}
                  alt={`${selectedProduct.title} - Image ${carouselIndex + 1}`}
                />
                <button className={styles.carouselNext} onClick={nextSlide}>
                  &#8250;
                </button>
              </div>

              <h3>Overview</h3>
              <p>{selectedProduct.modalContent.fullDescription}</p>

              <h4>Key Features</h4>
              <ul>
                {selectedProduct.modalContent.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeModal}>
                Close
              </button>
              <button className={styles.btnPrimary}>
                Request Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onScrollToSection={scrollToSection} />

    </div>
  );
}