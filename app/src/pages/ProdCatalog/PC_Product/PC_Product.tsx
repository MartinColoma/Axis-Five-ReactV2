// src/pages/ProdCatalog/PC_Product/PC_Product.tsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PC_Product.module.css';
import Navbar from '../PC_Navigation/PC_Navbar';
import Footer from '../../Landing/Navigation/Footer';
import usePageMeta from '../../../hooks/usePageMeta';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  brand: string | null;
  pricing_model:
    | 'one_time_hardware'
    | 'hardware_plus_subscription'
    | 'subscription_only';
  base_price: string | null;
  currency: string;
  is_iot_connected: boolean;
  requires_subscription: boolean;
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';
  lead_time_days: number | null;
  min_order_qty: number;
  main_image_url: string | null;
  gallery_image_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

type StockBadge = 'In stock' | 'Low stock' | 'Out of stock' | 'Made to order';

export default function PC_Product() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [rfqQuantity, setRfqQuantity] = useState(1);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showAddToCartOverlay, setShowAddToCartOverlay] = useState(false);

  usePageMeta(
    product ? `${product.name} - AxisFive Store` : 'AxisFive Store - Product',
    product?.main_image_url || '/images/Logos/A5_Logo1.png'
  );

  useEffect(() => {
    if (!slug) return;

    const fetchProductAndReviews = async () => {
      setLoading(true);
      try {
        const [productRes, reviewsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/product-catalog/products/${slug}`),
          fetch(
            `${API_BASE_URL}/api/product-catalog/products/${slug}/reviews`
          ),
        ]);

        const productJson = await productRes.json();
        const reviewsJson = await reviewsRes.json();

        if (productJson.success && productJson.product) {
          setProduct(productJson.product);
        } else {
          setProduct(null);
        }

        if (reviewsJson.success && Array.isArray(reviewsJson.reviews)) {
          setReviews(reviewsJson.reviews);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error('Error loading product page:', err);
        setProduct(null);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [slug]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const images = useMemo(() => {
    if (!product) return [];
    const gallery = product.gallery_image_urls || [];
    const main = product.main_image_url ? [product.main_image_url] : [];
    const all = [...main, ...gallery];
    return Array.from(new Set(all));
  }, [product]);

  const stockBadge: StockBadge | null = useMemo(() => {
    if (!product) return null;
    switch (product.stock_status) {
      case 'in_stock':
        return 'In stock';
      case 'low_stock':
        return 'Low stock';
      case 'out_of_stock':
        return 'Out of stock';
      case 'made_to_order':
        return 'Made to order';
      default:
        return null;
    }
  }, [product]);

  const effectiveQuantity = useMemo(() => {
    if (!product) return 1;
    return Math.max(product.min_order_qty || 1, rfqQuantity || 1);
  }, [product, rfqQuantity]);

  // 🔹 PDP → RFQ page
  const handleRFQSubmit = () => {
    if (!product) return;

    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          backgroundLocation: { pathname: `/products/${product.slug}` },
        },
      });
      return;
    }

    navigate('/rfq', {
      state: {
        source: 'pdp',
        items: [
          {
            product_id: product.id,
            quantity: effectiveQuantity,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              main_image_url: product.main_image_url,
              base_price: product.base_price,
              currency: product.currency,
            },
            unit_price: product.base_price,
            currency: product.currency,
          },
        ],
      },
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          backgroundLocation: { pathname: `/products/${product.slug}` },
        },
      });
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-catalog/cart/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            product_id: product.id,
            quantity: effectiveQuantity,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setShowAddToCartOverlay(true);
        setTimeout(() => setShowAddToCartOverlay(false), 2000);
      } else {
        showNotification(
          'error',
          data.message || 'Failed to add item to cart.'
        );
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      showNotification('error', 'Failed to add item to cart.');
    }
  };

  const formatPrice = (p: Product) => {
    if (!p.base_price) return 'Contact us for pricing';
    const value = Number(p.base_price);
    if (Number.isNaN(value)) return 'Contact us for pricing';
    return `${p.currency} ${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading product details...</p>
          </div>
        </main>
        <Footer onScrollToSection={() => {}} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`${styles.page} ${styles.pageNotFound}`}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <h2>Product not found</h2>
            <p>
              The product you are looking for may have been removed or is
              temporarily unavailable.
            </p>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate('/product-catalog')}
            >
              Back to Products
            </button>
          </div>
        </main>
        <Footer onScrollToSection={() => {}} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <button
            type="button"
            onClick={() => navigate('/product-catalog')}
          >
            Products
          </button>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <section className={styles.productLayout}>
          {/* Left: Gallery */}
          <div className={styles.gallery}>
            {images.length > 0 ? (
              <>
                <div className={styles.mainImageWrapper}>
                  <img
                    src={images[activeImageIndex]}
                    alt={`${product.name} - Image ${activeImageIndex + 1}`}
                    className={styles.mainImage}
                  />
                </div>
                {images.length > 1 && (
                  <div className={styles.thumbnailRow}>
                    {images.map((img, idx) => (
                      <button
                        key={img + idx}
                        type="button"
                        className={`${styles.thumbBtn} ${
                          idx === activeImageIndex
                            ? styles.thumbActive
                            : ''
                        }`}
                        onClick={() => setActiveImageIndex(idx)}
                      >
                        <img
                          src={img}
                          alt={`${product.name} thumbnail ${idx + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.placeholderImage}>
                <span>No image available</span>
              </div>
            )}
          </div>

          {/* Right: Summary / actions */}
          <div className={styles.summary}>
            <h1 className={styles.title}>{product.name}</h1>

            <div className={styles.metaRow}>
              {product.brand && (
                <span className={styles.brand}>by {product.brand}</span>
              )}
              {product.sku && (
                <span className={styles.sku}>SKU: {product.sku}</span>
              )}
            </div>

            {averageRating > 0 && (
              <div className={styles.ratingRow}>
                <span className={styles.stars}>
                  {'★'.repeat(Math.round(averageRating))}
                  {'☆'.repeat(5 - Math.round(averageRating))}
                </span>
                <span className={styles.ratingText}>
                  {averageRating.toFixed(1)} / 5 · {reviews.length} review
                  {reviews.length === 1 ? '' : 's'}
                </span>
              </div>
            )}

            {stockBadge && (
              <div className={styles.badgesRow}>
                <span
                  className={`${styles.stockBadge} ${
                    product.stock_status === 'out_of_stock'
                      ? styles.stockOut
                      : product.stock_status === 'low_stock'
                      ? styles.stockLow
                      : styles.stockIn
                  }`}
                >
                  {stockBadge}
                </span>
                {product.is_iot_connected && (
                  <span className={styles.tagBadge}>IoT Connected</span>
                )}
                {product.requires_subscription && (
                  <span className={styles.tagBadge}>
                    Subscription Required
                  </span>
                )}
              </div>
            )}

            <div className={styles.priceBlock}>
              <div className={styles.price}>{formatPrice(product)}</div>
              <div className={styles.pricingModel}>
                {product.pricing_model === 'one_time_hardware' &&
                  'One-time hardware purchase'}
                {product.pricing_model ===
                  'hardware_plus_subscription' &&
                  'Hardware + subscription'}
                {product.pricing_model === 'subscription_only' &&
                  'Subscription only'}
              </div>
            </div>

            {product.short_description && (
              <p className={styles.shortDescription}>
                {product.short_description}
              </p>
            )}

            {/* RFQ & Cart controls */}
            <div className={styles.actionsCard}>
              <div className={styles.quantityRow}>
                <label htmlFor="qty">Quantity</label>
                <div className={styles.qtyControls}>
                  <button
                    type="button"
                    onClick={() =>
                      setRfqQuantity((q) => Math.max(1, q - 1))
                    }
                  >
                    −
                  </button>
                  <input
                    id="qty"
                    type="number"
                    min={product.min_order_qty || 1}
                    value={effectiveQuantity}
                    onChange={(e) =>
                      setRfqQuantity(
                        Math.max(
                          product.min_order_qty || 1,
                          Number(e.target.value) || 1
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setRfqQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
                {product.min_order_qty > 1 && (
                  <p className={styles.minQtyNote}>
                    Minimum order: {product.min_order_qty} unit
                    {product.min_order_qty > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className={styles.actionsButtons}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleAddToCart}
                  disabled={product.stock_status === 'out_of_stock'}
                >
                  Add to Cart
                </button>
                                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleRFQSubmit}
                  disabled={product.stock_status === 'out_of_stock'}
                >
                  Request for Quote
                </button>
              </div>

              {product.lead_time_days !== null && (
                <p className={styles.leadTime}>
                  Estimated lead time: {product.lead_time_days} day
                  {product.lead_time_days === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Details & reviews */}
        <section className={styles.detailsSection}>
          <div className={styles.detailsLeft}>
            <h2>Product details</h2>
            {product.description ? (
              <p className={styles.longDescription}>
                {product.description}
              </p>
            ) : (
              <p className={styles.longDescriptionMuted}>
                Detailed description coming soon. Contact us for more
                information.
              </p>
            )}

            <div className={styles.specsGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Category</span>
                <span className={styles.specValue}>
                  {(product.category || 'Uncategorized')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>
                  IoT Connected
                </span>
                <span className={styles.specValue}>
                  {product.is_iot_connected ? 'Yes' : 'No'}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>
                  Requires Subscription
                </span>
                <span className={styles.specValue}>
                  {product.requires_subscription ? 'Yes' : 'No'}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Stock status</span>
                <span className={styles.specValue}>
                  {stockBadge || 'Unknown'}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Created</span>
                <span className={styles.specValue}>
                  {new Date(product.created_at).toLocaleDateString(
                    'en-PH',
                    {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailsRight}>
            <h2>Customer reviews</h2>

            {reviews.length === 0 ? (
              <p className={styles.noReviews}>
                No reviews yet. Be the first to deploy this solution.
              </p>
            ) : (
              <>
                <div className={styles.reviewSummary}>
                  <div className={styles.reviewScore}>
                    <span className={styles.reviewScoreValue}>
                      {averageRating.toFixed(1)}
                    </span>
                    <span className={styles.reviewScoreOutOf}>
                      / 5
                    </span>
                  </div>
                  <div className={styles.reviewScoreStars}>
                    <span className={styles.stars}>
                      {'★'.repeat(Math.round(averageRating))}
                      {'☆'.repeat(
                        5 - Math.round(averageRating)
                      )}
                    </span>
                    <span className={styles.reviewCount}>
                      {reviews.length} review
                      {reviews.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className={styles.reviewList}>
                  {reviews.map((r) => (
                    <article
                      key={r.id}
                      className={styles.reviewCard}
                    >
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewStars}>
                          {'★'.repeat(r.rating)}
                          {'☆'.repeat(5 - r.rating)}
                        </span>
                        <span className={styles.reviewTitle}>
                          {r.title || 'Untitled review'}
                        </span>
                      </div>
                      <p className={styles.reviewComment}>
                        {r.comment || 'No additional comment.'}
                      </p>
                      <div className={styles.reviewMeta}>
                        <span>
                          {r.user
                            ? `${r.user.first_name || ''} ${
                                r.user.last_name || ''
                              }`.trim() || 'Customer'
                            : 'Customer'}
                        </span>
                        <span>
                          {new Date(
                            r.created_at
                          ).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Big centered "Added to cart" overlay */}
      {showAddToCartOverlay && (
        <div className={styles.cartOverlay}>
          <div className={styles.cartOverlayContent}>
            <h2>Added to cart</h2>
            <p>
              {product.name} (x{effectiveQuantity})
            </p>
            <div className={styles.cartOverlayActions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate('/cart')}
              >
                View cart
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowAddToCartOverlay(false)}
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {notification && (
        <div
          className={`${styles.notification} ${
            notification.type === 'success'
              ? styles.notificationSuccess
              : styles.notificationError
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <Footer onScrollToSection={() => {}} />
    </div>
  );
}
