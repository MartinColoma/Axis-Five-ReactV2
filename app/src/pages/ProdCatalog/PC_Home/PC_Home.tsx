import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from './PC_Home.module.css';
import Navbar from '../PC_Navigation/PC_Navbar';
import Footer from '../../Landing/Navigation/Footer';
import usePageMeta from '../../../hooks/usePageMeta';

type FilterType = 'all' | 'iot' | 'security' | 'software';

interface LocalProduct {
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

// Keep your existing hardcoded products for HERO only
const localProducts: LocalProduct[] = [
  {
    id: 1,
    title: 'DocuSort: Document Sorting Machine',
    description: 'Automated sorting machine powered by Raspberry Pi.',
    image: '/images/products/docusort/docusort.png',
    category: 'iot',
    modalContent: {
      fullDescription:
        'DocuSort is an advanced automated document sorting solution powered by Raspberry Pi, designed to streamline document management processes.',
      features: [
        'Raspberry Pi powered automation',
        'High-speed document sorting',
        'Smart categorization',
        'Easy integration',
      ],
      images: [
        '/images/products/docusort/docusort.png',
        '/images/products/docusort/detail1.jpg',
        '/images/products/docusort/detail2.jpg',
      ],
    },
  },
  {
    id: 2,
    title: 'Smart Environment Monitor',
    description: 'Tracks temperature, humidity & air quality in real-time.',
    image: '/images/products/env_monitor/env-monitor.jpg',
    category: 'iot',
    modalContent: {
      fullDescription:
        'Real-time environmental monitoring system that tracks critical air quality metrics for optimal living and working spaces.',
      features: [
        'Temperature monitoring',
        'Humidity tracking',
        'Air quality sensors',
        'Real-time data dashboard',
      ],
      images: [
        '/images/products/env_monitor/env-monitor.jpg',
        '/images/products/env_monitor/detail1.jpg',
      ],
    },
  },
  {
    id: 3,
    title: 'Connected Security System',
    description: 'IoT-enabled system with AI motion detection & cloud access.',
    image: '/images/products/security_sys/security-system.jpg',
    category: 'security',
    modalContent: {
      fullDescription:
        'Advanced IoT security system with AI-powered motion detection and cloud-based monitoring capabilities.',
      features: [
        'AI motion detection',
        'Cloud access',
        'Real-time alerts',
        'Remote monitoring',
      ],
      images: [
        '/images/products/security_sys/security-system.jpg',
        '/images/products/security_sys/detail1.jpg',
      ],
    },
  },
  {
    id: 4,
    title: 'LibraX: AIoT Library Kiosk',
    description: 'IoT-enabled library system with AI Chatbot.',
    image: '/images/products/librax/LibraX.jpg',
    category: 'software',
    modalContent: {
      fullDescription:
        'Smart library management system combining IoT technology with AI-powered assistance for enhanced user experience.',
      features: ['AI chatbot assistance', 'IoT integration', 'Self-service kiosk', 'Digital catalog'],
      images: [
        '/images/products/librax/LibraX.jpg',
        '/images/products/librax/detail1.jpg',
      ],
    },
  },
];

const featuredProducts = localProducts.slice(0, 3);

interface ApiProduct {
  id: number;
  sku: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string | null; // "iot" | "security" | "software"
  main_image_url: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string; //VITE_API_LOCAL_SERVER //VITE_API_BASE_URL

export default function Products() {
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [heroCarouselIndex, setHeroCarouselIndex] = useState(0);

  usePageMeta('AxisFive Store - Products', '/images/Logos/A5_Logo1.png');

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch products from backend for catalog grid
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/product-catalog/products`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setApiProducts(data.products);
        } else {
          console.error('Failed to load products:', data.message);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Auto-play hero carousel (still uses local featuredProducts)
  useEffect(() => {
    if (featuredProducts.length === 0) return;

    const interval = setInterval(() => {
      setHeroCarouselIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredProducts = useMemo(
    () =>
      apiProducts.filter((product) => {
        if (activeFilter === 'all') return true;
        const cat = (product.category || '').toLowerCase();
        return cat === activeFilter;
      }),
    [apiProducts, activeFilter]
  );

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const nextHeroSlide = () => {
    if (!featuredProducts.length) return;
    setHeroCarouselIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const prevHeroSlide = () => {
    if (!featuredProducts.length) return;
    setHeroCarouselIndex((prev) =>
      prev === 0 ? featuredProducts.length - 1 : prev - 1
    );
  };

  // Hash navigation (unchanged)
  useEffect(() => {
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
            behavior: 'smooth',
          });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  const getProductImage = (p: ApiProduct) =>
    p.main_image_url || '/images/products/placeholder.png';

  const getShortText = (p: ApiProduct) =>
    p.short_description || (p.description ? p.description.slice(0, 120) + '…' : 'View details');

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <Navbar />

      {/* HERO CAROUSEL - unchanged, still uses local files */}
      <div className={styles.heroCarousel}>
        {featuredProducts.map((product, index) => (
          <div
            key={product.id}
            className={`${styles.carouselItem} ${
              index === heroCarouselIndex ? styles.active : ''
            }`}
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
              className={`${styles.indicator} ${
                index === heroCarouselIndex ? styles.activeIndicator : ''
              }`}
              onClick={() => setHeroCarouselIndex(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Product Catalog Section (dynamic from DB) */}
      <section className={styles.sectionPadding}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Product Catalog</h2>

          {/* Filters */}
          <div className={styles.filters}>
            <button
              className={`${styles.filterBtn} ${
                activeFilter === 'all' ? styles.active : ''
              }`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterBtn} ${
                activeFilter === 'iot' ? styles.active : ''
              }`}
              onClick={() => handleFilterChange('iot')}
            >
              IoT
            </button>
            <button
              className={`${styles.filterBtn} ${
                activeFilter === 'security' ? styles.active : ''
              }`}
              onClick={() => handleFilterChange('security')}
            >
              Security
            </button>
            <button
              className={`${styles.filterBtn} ${
                activeFilter === 'software' ? styles.active : ''
              }`}
              onClick={() => handleFilterChange('software')}
            >
              Software
            </button>
          </div>

          {/* Products Grid (cards are links to PDP) */}
          {loading && apiProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading products...
            </p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No products found for this category.
            </p>
          ) : (
            <div className={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className={styles.productCard}
                >
                  <img src={getProductImage(product)} alt={product.name} />
                  <div className={styles.cardBody}>
                    <h5>{product.name}</h5>
                    <p>{getShortText(product)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer onScrollToSection={scrollToSection} />
    </div>
  );
}
