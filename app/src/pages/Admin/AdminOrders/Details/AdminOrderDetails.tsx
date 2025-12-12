// src/pages/Admin/Order/AdminOrder_Details.tsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../ProdCatalog/PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './AdminOrderDetails.module.css';

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

type OrderStatus = 'AWAITING_PICKUP' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  line_total: string;
  currency: string;
  rfq_item_id: number | null;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    slug: string;
    main_image_url: string | null;
  };
  line_status?: 'PENDING' | 'READY';
}

interface Order {
  id: number;
  user_id: number | null;
  rfq_id: number | null;
  total_price: string;
  currency: string;
  pickup_location: string;
  pickup_instructions: string | null;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  rfq?: {
    id: number;
    company_name: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  };
}

function toNumberSafe(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function AdminOrder_Details() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // POS modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>(''); // keep as string for easy typing
  const [cashTouched, setCashTouched] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (authLoading) return;

    if (!isLoggedIn) {
      navigate('/login', {
        state: { backgroundLocation: { pathname: `/admin/orders/${id}` } },
      });
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/order/${id}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok || !data.success || !data.order) {
          setErrorMsg(data.message || 'Failed to load order.');
          setOrder(null);
          setItems([]);
          return;
        }

        setOrder(data.order);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error('Error loading order details:', err);
        setErrorMsg('Failed to load order details. Please try again.');
        setOrder(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, authLoading, isLoggedIn, navigate]);

  const friendlyStatus = useMemo(() => {
    if (!order) return 'Awaiting pickup';
    switch (order.status) {
      case 'AWAITING_PICKUP':
        return 'Awaiting pickup';
      case 'READY_FOR_PICKUP':
        return 'Ready for pickup';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Order status unknown';
    }
  }, [order]);

  const timelineSteps = useMemo(
    () => [
      { key: 'order_created', label: 'Order Created' },
      { key: 'ready_for_pickup', label: 'Ready for Pickup' },
      { key: 'completed', label: 'Completed' },
    ],
    []
  );

  const activeTimelineIndex = useMemo(() => {
    if (!order) return 0;
    switch (order.status) {
      case 'AWAITING_PICKUP':
        return 0;
      case 'READY_FOR_PICKUP':
        return 1;
      case 'COMPLETED':
        return 2;
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  }, [order]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, it) => sum + (it.quantity || 0), 0),
    [items]
  );

  const currency = order?.currency || (items[0] && items[0].currency) || 'PHP';

  const formatMoney = (amount: number) =>
    `${currency} ${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Action guards
  const canMarkReady = !!order && order.status === 'AWAITING_PICKUP';

  // POS rule: can only pay when order is READY_FOR_PICKUP and not already paid/completed/cancelled
const canPayNow =
  !!order &&
  order.status === 'READY_FOR_PICKUP' &&
  order.payment_status !== 'PAID';


  const orderTotal = useMemo(() => round2(toNumberSafe(order?.total_price)), [order]);
  const cashNum = useMemo(() => toNumberSafe(cashReceived), [cashReceived]);
  const change = useMemo(() => round2(Math.max(0, cashNum - orderTotal)), [cashNum, orderTotal]);
  const canConfirmCash = useMemo(
    () => canPayNow && Number.isFinite(cashNum) && cashNum >= orderTotal && orderTotal > 0,
    [canPayNow, cashNum, orderTotal]
  );

  const cashError = useMemo(() => {
    if (!showPayModal) return null;
    if (!cashTouched) return null;
    if (!cashReceived.trim()) return 'Enter cash received.';
    if (!Number.isFinite(cashNum) || cashNum <= 0) return 'Invalid cash amount.';
    if (cashNum < orderTotal) return 'Insufficient cash received.';
    return null;
  }, [showPayModal, cashTouched, cashReceived, cashNum, orderTotal]);

  const handleMarkReadyForPickup = async () => {
    if (!order || !canMarkReady) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/order/${order.id}/ready-for-pickup`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        setErrorMsg(data.message || 'Failed to update order.');
        return;
      }
      setOrder(data.order);
    } catch (err) {
      console.error('Error updating order status:', err);
      setErrorMsg('Failed to update order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openPayModal = () => {
    if (!canPayNow) return;
    setCashReceived('');
    setCashTouched(false);
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setCashReceived('');
    setCashTouched(false);
  };

  const handlePayAndComplete = async () => {
    if (!order || !canPayNow) return;

    setCashTouched(true);

    if (!canConfirmCash) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/order/${order.id}/pay-and-complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_received: cashNum }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        setErrorMsg(data.message || 'Failed to accept payment.');
        return;
      }

      setOrder(data.order);
      closePayModal();
    } catch (err) {
      console.error('Error pay-and-complete:', err);
      setErrorMsg('Failed to accept payment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Optional: quick-add buttons like a POS
  const quickAdd = (add: number) => {
    setCashTouched(true);
    const next = round2(cashNum + add);
    setCashReceived(String(next));
  };

  const backspaceCash = () => {
    setCashTouched(true);
    setCashReceived((prev) => prev.slice(0, -1));
  };

  const clearCash = () => {
    setCashTouched(true);
    setCashReceived('');
  };

  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Loading order details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>Order not found</h2>
              <p className={styles.textMuted}>
                This order may have been removed or you do not have access to it.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate('/admin/orders')}
              >
                Back to orders
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
            <button type="button" onClick={() => navigate('/admin/orders')}>
              Orders
            </button>
            <span>/</span>
            <span>ORD-{order.id}</span>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Order #{order.id}</h1>
              <p className={styles.statusText}>{friendlyStatus}</p>
              <p className={styles.timestamp}>
                Created on{' '}
                {new Date(order.created_at).toLocaleString('en-PH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => navigate('/admin/orders')}
              >
                Back to orders
              </button>
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
                        isActive ? styles.timelineDotActive : styles.timelineDotInactive
                      }`}
                    />
                    <span
                      className={`${styles.timelineLabel} ${
                        isActive ? styles.timelineLabelActive : styles.timelineLabelInactive
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Layout */}
          <section className={styles.layout}>
            {/* Items */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Items</h2>
              {items.length === 0 ? (
                <p className={styles.textMuted}>No line items were found for this order.</p>
              ) : (
                <>
                  <ul className={styles.itemList}>
                    {items.map((it) => (
                      <li key={it.id} className={styles.itemRow}>
                        {it.product && it.product.main_image_url && (
                          <button
                            type="button"
                            className={styles.thumbButton}
                            onClick={() => navigate(`/products/${it.product!.slug}`)}
                          >
                            <div className={styles.thumb}>
                              <img src={it.product.main_image_url} alt={it.product.name} />
                            </div>
                          </button>
                        )}

                        <div className={styles.itemMeta}>
                          <button
                            type="button"
                            className={styles.itemName}
                            onClick={() => it.product && navigate(`/products/${it.product.slug}`)}
                          >
                            {it.product?.name || `Product #${it.product_id}`}
                          </button>

                          <div className={styles.itemMetaRow}>
                            <span className={styles.itemQty}>Qty {it.quantity}</span>
                            <span className={styles.itemBasePrice}>
                              Unit: {formatMoney(Number(it.unit_price))}
                            </span>
                            <span className={styles.itemBaseLineTotal}>
                              Line total: {formatMoney(Number(it.line_total))}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.itemsFooter}>
                    <span className={styles.summaryText}>
                      Total quantity: {totalQuantity} unit{totalQuantity === 1 ? '' : 's'}
                    </span>
                    <span className={styles.summaryText}>
                      Order total: {formatMoney(orderTotal)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Details + Actions */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Order details</h2>
              <dl className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <dt>RFQ</dt>
                  <dd>{order.rfq_id ? `RFQ-${order.rfq_id}` : '—'}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Company</dt>
                  <dd>{order.rfq?.company_name || '—'}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Contact</dt>
                  <dd>
                    {order.rfq?.contact_name || '—'}
                    {order.rfq?.contact_email ? ` · ${order.rfq.contact_email}` : ''}
                    {order.rfq?.contact_phone ? ` · ${order.rfq.contact_phone}` : ''}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Pickup</dt>
                  <dd>
                    {order.pickup_location}
                    {order.pickup_instructions ? ` · ${order.pickup_instructions}` : ''}
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Payment</dt>
                  <dd>
                    {order.payment_method} · {order.payment_status}
                  </dd>
                </div>
              </dl>

              <div className={styles.actionsRow}>
                {canMarkReady && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleMarkReadyForPickup}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Marking...' : 'Mark ready for pickup'}
                  </button>
                )}

                {canPayNow && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={openPayModal}
                    disabled={actionLoading}
                  >
                    Pay (cash)
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* POS PAYMENT MODAL */}
      {showPayModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="payModalTitle">
          <div className={styles.modal}>
            <h2 id="payModalTitle" className={styles.modalTitle}>
              Cash payment
            </h2>

            <div className={styles.posTotals}>
              <div className={styles.posRow}>
                <span>Amount due</span>
                <strong>{formatMoney(orderTotal)}</strong>
              </div>

              <div className={styles.posRow}>
                <span>Cash received</span>
                <input
                  className={styles.posInput}
                  value={cashReceived}
                  onChange={(e) => {
                    setCashTouched(true);
                    setCashReceived(e.target.value);
                  }}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={actionLoading}
                  autoFocus
                />
              </div>

              <div className={styles.posRow}>
                <span>Change</span>
                <strong>{formatMoney(change)}</strong>
              </div>

              {cashError && <div className={styles.alertError}>{cashError}</div>}
            </div>

            {/* Quick cash buttons (optional but helps POS feel) */}
            <div className={styles.posQuickGrid}>
              <button type="button" className={styles.btnSecondary} onClick={() => quickAdd(50)} disabled={actionLoading}>
                +50
              </button>
              <button type="button" className={styles.btnSecondary} onClick={() => quickAdd(100)} disabled={actionLoading}>
                +100
              </button>
              <button type="button" className={styles.btnSecondary} onClick={() => quickAdd(500)} disabled={actionLoading}>
                +500
              </button>
              <button type="button" className={styles.btnSecondary} onClick={() => quickAdd(1000)} disabled={actionLoading}>
                +1000
              </button>
              <button type="button" className={styles.btnSecondary} onClick={backspaceCash} disabled={actionLoading}>
                Backspace
              </button>
              <button type="button" className={styles.btnSecondary} onClick={clearCash} disabled={actionLoading}>
                Clear
              </button>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={closePayModal} disabled={actionLoading}>
                Cancel
              </button>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handlePayAndComplete}
                disabled={actionLoading || !canConfirmCash}
                title={!canConfirmCash ? 'Enter cash received ≥ amount due.' : undefined}
              >
                {actionLoading ? 'Processing...' : 'Confirm payment & complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
