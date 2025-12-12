// src/pages/ProdCatalog/RFQ/RFQ.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './RFQ.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface RFQProduct {
  id: number;
  name: string;
  slug: string;
  main_image_url: string | null;
  base_price: string | null;
  currency?: string;
}

interface RFQItemInput {
  cart_item_id?: number;   // 🔹 new
  product_id: number;
  quantity: number;
  product: RFQProduct;
  unit_price?: string | null;
  currency?: string;
}


interface RFQLocationState {
  source?: 'pdp' | 'cart';
  items?: RFQItemInput[];
}

export default function RFQPage() {
  const { isLoggedIn, userData, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

const state = (location.state || {}) as RFQLocationState;
const initialItems = Array.isArray(state.items) ? state.items : [];

  const [items] = useState<RFQItemInput[]>(initialItems);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [useCase, setUseCase] = useState('');
  const [siteInfo, setSiteInfo] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    // If no items were passed, send back to catalog or cart
    if (!initialItems.length && !authLoading) {
      navigate('/product-catalog');
    }
  }, [initialItems.length, authLoading, navigate]);

  useEffect(() => {
    if (userData) {
      const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
      if (fullName && !contactName) setContactName(fullName);
      if (userData.email && !contactEmail) setContactEmail(userData.email);
    }
  }, [userData, contactName, contactEmail]);

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setErrorMsg('Please log in to submit a request for quote.');
      return;
    }
    if (!items.length) {
      setErrorMsg('No products selected for this RFQ.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        company_name: companyName || null,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        use_case: useCase || null,
        site_info: siteInfo || null,
        additional_notes: additionalNotes || null,
        currency:
          items[0].currency || items[0].product.currency || 'PHP',
        items: items.map((i) => ({
          cart_item_id: i.cart_item_id ?? null,  // 🔹 pass through
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/api/product-catalog/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to submit RFQ.');
        return;
      }

      setSuccessMsg(
        'Your request for quote has been submitted. Our team will contact you shortly.'
      );

      navigate(`/account/rfqs/${data.rfq.id}`);
    } catch (err) {
      console.error('Error submitting RFQ:', err);
      setErrorMsg('Failed to submit RFQ. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  if (authLoading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Preparing your RFQ...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>No products selected</h2>
              <p className={styles.textMuted}>
                Please select products from the catalog or your cart before requesting a quote.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate('/product-catalog')}
              >
                Browse products
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Request for Quote</h1>

          <section className={styles.layout}>
            {/* Left: items summary */}
            <div className={styles.summaryCard}>
              <h2 className={styles.sectionTitle}>Selected products</h2>
              <ul className={styles.itemList}>
                {items.map((item) => {
                  const unit =
                    item.unit_price ??
                    item.product.base_price ??
                    '0';
                  const unitNum = Number(unit) || 0;
                  const lineTotal = unitNum * item.quantity;
                  const currency = item.currency || item.product.currency || 'PHP';

                  return (
                    <li key={item.product_id} className={styles.itemRow}>
                      {item.product.main_image_url && (
                        <button
                          type="button"
                          className={styles.thumbButton}
                          onClick={() =>
                            navigate(`/products/${item.product.slug}`)
                          }
                        >
                          <div className={styles.thumb}>
                            <img
                              src={item.product.main_image_url}
                              alt={item.product.name}
                            />
                          </div>
                        </button>
                      )}
                      <div className={styles.itemMeta}>
                        <button
                          type="button"
                          className={styles.itemName}
                          onClick={() =>
                            navigate(`/products/${item.product.slug}`)
                          }
                        >
                          {item.product.name}
                        </button>
                        <div className={styles.itemMetaRow}>
                          <span className={styles.itemQty}>
                            Qty: {item.quantity}
                          </span>
                          <span className={styles.itemPrice}>
                            {currency}{' '}
                            {unitNum.toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className={styles.itemMetaRow}>
                          <span className={styles.itemLineTotalLabel}>
                            Est. line total:
                          </span>
                          <span className={styles.itemLineTotal}>
                            {currency}{' '}
                            {lineTotal.toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.summaryFooter}>
                <span className={styles.summaryText}>
                  Total quantity: {totalQuantity} unit{totalQuantity === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Right: RFQ form */}
            <form className={styles.formCard} onSubmit={handleSubmit}>
              <h2 className={styles.sectionTitle}>Tell us about your project</h2>

              {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}
              {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Company / Organization
                  <input
                    type="text"
                    className={styles.input}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., AxisFive Solutions Inc."
                  />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.label}>
                  Contact name
                  <input
                    type="text"
                    className={styles.input}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your full name"
                  />
                </label>
                <label className={styles.label}>
                  Contact email
                  <input
                    type="email"
                    className={styles.input}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </label>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Contact phone
                  <input
                    type="tel"
                    className={styles.input}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                  />
                </label>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Intended use case
                  <textarea
                    className={styles.textarea}
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    placeholder="Briefly describe how you plan to use these products."
                    rows={3}
                  />
                </label>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Site / deployment details
                  <textarea
                    className={styles.textarea}
                    value={siteInfo}
                    onChange={(e) => setSiteInfo(e.target.value)}
                    placeholder="e.g., indoor/outdoor, number of locations, environment constraints, etc."
                    rows={3}
                  />
                </label>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Additional notes
                  <textarea
                    className={styles.textarea}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any timing, budget, or integration requirements you want our team to know."
                    rows={3}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting RFQ…' : 'Submit request'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
