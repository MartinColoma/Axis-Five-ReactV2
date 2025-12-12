// src/pages/Account/RFQ/RFQ_Details.tsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../../contexts/AuthContext';
import styles from './RFQ_Details.module.css';

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

type RFQStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'QUOTE_SENT'
  | 'PARTIALLY_QUOTED'
  | 'REJECTED_BY_ADMIN'
  | 'REJECTED_BY_CUSTOMER'
  | 'EXPIRED'
  | 'CONVERTED_TO_ORDER'
  | 'READY_FOR_PICKUP_FROM_ORDER'
  | 'ORDER_COMPLETED';


interface RFQItem {
  id: number;
  rfq_id: number;
  product_id: number;
  quantity: number;
  quoted_unit_price: string | null;
  quoted_total_price: string | null;
  currency: string;
  line_lead_time_days: number | null;
  line_status: string;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    slug: string;
    main_image_url: string | null;
    base_price: string | null;
  };
}

interface RFQ {
  id: number;
  user_id: number | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  use_case: string | null;
  site_info: string | null;
  additional_notes: string | null;
  status: RFQStatus;
  currency: string;
  price_valid_until: string | null;
  overall_lead_time_days: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  items?: RFQItem[];
}

export default function RFQ_Details() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [items, setItems] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (authLoading) return;

    if (!isLoggedIn) {
      navigate('/login', {
        state: { backgroundLocation: { pathname: `/account/rfqs/${id}` } },
      });
      return;
    }

    const fetchRFQ = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/product-catalog/rfq/${id}`,
          { credentials: 'include' }
        );
        const data = await res.json();

        if (!res.ok || !data.success || !data.rfq) {
          setErrorMsg(data.message || 'Failed to load RFQ.');
          setRfq(null);
          setItems([]);
          return;
        }

        setRfq(data.rfq);
        setItems(Array.isArray(data.items) ? data.items : data.rfq.items || []);
      } catch (err) {
        console.error('Error loading RFQ details:', err);
        setErrorMsg('Failed to load RFQ details. Please try again.');
        setRfq(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRFQ();
  }, [id, authLoading, isLoggedIn, navigate]);

const friendlyStatus = useMemo(() => {
  if (!rfq) return 'RFQ Submitted – Pending review';

  switch (rfq.status) {
    case 'PENDING_REVIEW':
      return 'RFQ Submitted – Pending review';
    case 'UNDER_REVIEW':
      return 'Under review by AxisFive';
    case 'QUOTE_SENT':
      return 'Quote sent – Awaiting your response';
    case 'PARTIALLY_QUOTED':
      return 'Partially quoted – Some items pending';
    case 'REJECTED_BY_ADMIN':
      return 'Rejected by AxisFive team';
    case 'REJECTED_BY_CUSTOMER':
      return 'Rejected – You declined this quote';
    case 'EXPIRED':
      return 'Quote expired';
    case 'CONVERTED_TO_ORDER':
      return 'Order created from this RFQ';
    case 'READY_FOR_PICKUP_FROM_ORDER':
      return 'Order ready for pickup';
    case 'ORDER_COMPLETED':
      return 'Order completed';
    default:
      return 'RFQ status unknown';
  }
}, [rfq]);


  const timelineSteps = useMemo(
    () => [
      { key: 'submitted', label: 'RFQ Submitted' },
      { key: 'review', label: 'Under Review' },
      { key: 'quote_sent', label: 'Quote Sent' },
      { key: 'quote_accepted', label: 'Quote Accepted' },
      { key: 'order_created', label: 'Order Created' },
      { key: 'ready_for_pickup', label: 'Ready for Pickup' },
      { key: 'completed', label: 'Completed' },
    ],
    []
  );

const activeTimelineIndex = useMemo(() => {
  if (!rfq) return 0;
  switch (rfq.status) {
    case 'PENDING_REVIEW':
      return 0;
    case 'UNDER_REVIEW':
      return 1;
    case 'QUOTE_SENT':
    case 'PARTIALLY_QUOTED':
      return 2;
    case 'CONVERTED_TO_ORDER':
      return 4; // Order Created
    case 'READY_FOR_PICKUP_FROM_ORDER':
      return 5; // Ready for Pickup
    case 'ORDER_COMPLETED':
      return 6; // Completed
    case 'EXPIRED':
    case 'REJECTED_BY_ADMIN':
    case 'REJECTED_BY_CUSTOMER':
      return 2;
    default:
      return 0;
  }
}, [rfq]);


  const totalQuantity = useMemo(
    () => items.reduce((sum, it) => sum + (it.quantity || 0), 0),
    [items]
  );

  const currency = rfq?.currency || (items[0] && items[0].currency) || 'PHP';

  const estimatedTotal = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((sum, it) => {
      const raw =
        it.quoted_total_price ??
        (it.quoted_unit_price
          ? String(Number(it.quoted_unit_price) * it.quantity)
          : null);
      const num = raw ? Number(raw) : NaN;
      return Number.isNaN(num) ? sum : sum + num;
    }, 0);
  }, [items]);

  const baseTotal = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((sum, it) => {
      const base = it.product?.base_price
        ? Number(it.product.base_price) * it.quantity
        : 0;
      return sum + base;
    }, 0);
  }, [items]);

  const formatMoney = (amount: number) =>
    `${currency} ${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const canCancel =
    !!rfq &&
    (rfq.status === 'PENDING_REVIEW' || rfq.status === 'PARTIALLY_QUOTED');

  const canRespondToQuote =
    !!rfq &&
    (rfq.status === 'QUOTE_SENT' || rfq.status === 'PARTIALLY_QUOTED');

  const handleCancelRFQ = async () => {
    if (!rfq || !canCancel) return;
    setIsCancelling(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-catalog/rfq/${rfq.id}/cancel`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success || !data.rfq) {
        setErrorMsg(data.message || 'Failed to cancel RFQ.');
        return;
      }

      setRfq(data.rfq);
      setErrorMsg(null);
      setShowCancelModal(false);
    } catch (err) {
      console.error('Error cancelling RFQ:', err);
      setErrorMsg('Failed to cancel RFQ. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!rfq || !canRespondToQuote) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-catalog/rfq/${rfq.id}/accept`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success || !data.rfq) {
        setErrorMsg(data.message || 'Failed to accept quote.');
        return;
      }

      setRfq(data.rfq);
    } catch (err) {
      console.error('Error accepting quote:', err);
      setErrorMsg('Failed to accept quote. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!rfq || !canRespondToQuote) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/product-catalog/rfq/${rfq.id}/reject`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success || !data.rfq) {
        setErrorMsg(data.message || 'Failed to reject quote.');
        return;
      }

      setRfq(data.rfq);
    } catch (err) {
      console.error('Error rejecting quote:', err);
      setErrorMsg('Failed to reject quote. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Loading RFQ details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>RFQ not found</h2>
              <p className={styles.textMuted}>
                This request for quote may have been removed or you do not have
                access to it.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate('/account/rfqs')}
              >
                Back to RFQs
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
          {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <button
              type="button"
              onClick={() => navigate('/account/rfqs')}
            >
              RFQs
            </button>
            <span>/</span>
            <span>RFQ-{rfq.id}</span>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>RFQ #{rfq.id}</h1>
              <p className={styles.statusText}>{friendlyStatus}</p>
              <p className={styles.timestamp}>
                Submitted on{' '}
                {new Date(rfq.created_at).toLocaleString('en-PH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Timeline</h2>
            <ol className={styles.timeline}>
              {timelineSteps.map((step, index) => {
                const isActive = index <= activeTimelineIndex;
                return (
                  <li key={step.key} className={styles.timelineItem}>
                    <div
                      className={`${styles.timelineDot} ${
                        isActive
                          ? styles.timelineDotActive
                          : styles.timelineDotInactive
                      }`}
                    />
                    <span
                      className={`${styles.timelineLabel} ${
                        isActive
                          ? styles.timelineLabelActive
                          : styles.timelineLabelInactive
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Layout: selected products + project details / actions */}
          <section className={styles.layout}>
            {/* Selected products with base and seller quote */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Selected products</h2>
              {items.length === 0 ? (
                <p className={styles.textMuted}>
                  No line items were found for this RFQ.
                </p>
              ) : (
                <>
                  <ul className={styles.itemList}>
                    {items.map((it) => {
                      const basePriceNum = it.product?.base_price
                        ? Number(it.product.base_price)
                        : null;

                      const baseLineTotal =
                        basePriceNum != null
                          ? basePriceNum * it.quantity
                          : null;

                      const hasQuote =
                        it.quoted_total_price || it.quoted_unit_price;
                      const quotedUnitPriceNum = it.quoted_unit_price
                        ? Number(it.quoted_unit_price)
                        : null;
                      const quotedLineTotal = hasQuote
                        ? Number(
                            it.quoted_total_price ||
                              Number(it.quoted_unit_price || 0) *
                                it.quantity
                          ) || 0
                        : null;

                      return (
                        <li key={it.id} className={styles.itemRow}>
                          {it.product && it.product.main_image_url && (
                            <button
                              type="button"
                              className={styles.thumbButton}
                              onClick={() =>
                                navigate(`/products/${it.product!.slug}`)
                              }
                            >
                              <div className={styles.thumb}>
                                <img
                                  src={it.product.main_image_url}
                                  alt={it.product.name}
                                />
                              </div>
                            </button>
                          )}

                          <div className={styles.itemMeta}>
                            <button
                              type="button"
                              className={styles.itemName}
                              onClick={() =>
                                it.product &&
                                navigate(`/products/${it.product.slug}`)
                              }
                            >
                              {it.product?.name ||
                                `Product #${it.product_id}`}
                            </button>

                            {/* Row 1: qty + base prices */}
                            <div className={styles.itemMetaRow}>
                              <span className={styles.itemQty}>
                                Qty {it.quantity}
                              </span>

                              {basePriceNum != null && (
                                <span className={styles.itemMetaValue}>
                                  Base: {formatMoney(basePriceNum)} / unit
                                </span>
                              )}

                              {baseLineTotal != null && (
                                <span
                                  className={styles.itemBaseLineTotal}
                                >
                                  Base line total:{' '}
                                  {formatMoney(baseLineTotal)}
                                </span>
                              )}
                            </div>

                            {/* Row 2: seller quote (if present) */}
                            {hasQuote && (
                              <div className={styles.itemMetaRow}>
                                {quotedUnitPriceNum != null && (
                                  <span
                                    className={styles.itemMetaValue}
                                  >
                                    Seller quote:{' '}
                                    {formatMoney(quotedUnitPriceNum)} / unit
                                  </span>
                                )}
                                {quotedLineTotal !== null && (
                                  <span
                                    className={styles.itemLineTotal}
                                  >
                                    Quoted line total:{' '}
                                    {formatMoney(quotedLineTotal)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Row 3: lead time */}
                            {it.line_lead_time_days !== null && (
                              <div className={styles.itemMetaRow}>
                                <span className={styles.itemMetaLabel}>
                                  Lead time:
                                </span>
                                <span className={styles.itemMetaValue}>
                                  {it.line_lead_time_days} day
                                  {it.line_lead_time_days === 1 ? '' : 's'}
                                </span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className={styles.itemsFooter}>
                    <span className={styles.summaryText}>
                      Total quantity: {totalQuantity} unit
                      {totalQuantity === 1 ? '' : 's'}
                    </span>

                    {baseTotal > 0 && (
                      <span className={styles.summaryText}>
                        Items subtotal (catalog): {formatMoney(baseTotal)}
                      </span>
                    )}

                    {estimatedTotal > 0 && (
                      <span className={styles.summaryText}>
                        Seller quoted total: {formatMoney(estimatedTotal)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Project details + actions */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Project details</h2>
              <dl className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <dt>Company</dt>
                  <dd>{rfq.company_name || '—'}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Contact</dt>
                  <dd>
                    {rfq.contact_name || '—'}
                    {rfq.contact_email ? ` · ${rfq.contact_email}` : ''}
                    {rfq.contact_phone ? ` · ${rfq.contact_phone}` : ''}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Use case</dt>
                  <dd>{rfq.use_case || '—'}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Site details</dt>
                  <dd>{rfq.site_info || '—'}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Additional notes</dt>
                  <dd>{rfq.additional_notes || '—'}</dd>
                </div>
              </dl>
              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate('/product-catalog')}
                >
                  Back to catalog
                </button>

                {canCancel && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setShowCancelModal(true)}
                    disabled={isCancelling || actionLoading}
                  >
                    Cancel RFQ
                  </button>
                )}

                {canRespondToQuote && (
                  <>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleRejectQuote}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Reject quote'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={handleAcceptQuote}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Accept quote'}
                    </button>
                  </>
                )}

                {!canRespondToQuote && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => navigate('/account/rfqs')}
                  >
                    View all RFQs
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {showCancelModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Cancel RFQ?</h2>
            <p className={styles.modalText}>
              This will cancel your request and notify AxisFive. You will no
              longer receive a quote for this RFQ.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep RFQ
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleCancelRFQ}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
