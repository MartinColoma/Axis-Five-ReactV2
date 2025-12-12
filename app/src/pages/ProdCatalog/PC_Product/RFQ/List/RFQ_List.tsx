// src/pages/ProdCatalog/PC_Product/RFQ/List/RFQ_List.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../../contexts/AuthContext';
import styles from './RFQ_List.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

type RFQStatus =
  | 'PENDING_REVIEW'
  | 'QUOTE_SENT'
  | 'PARTIALLY_QUOTED'
  | 'REJECTED_BY_ADMIN'
  | 'REJECTED_BY_CUSTOMER'
  | 'EXPIRED'
  | 'CONVERTED_TO_ORDER';

interface RFQHeader {
  id: number;
  created_at: string;
  status: RFQStatus;
  currency: string | null;
  company_name: string | null;
}

export default function RFQ_List() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rfqs, setRfqs] = useState<RFQHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchList = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/product-catalog/rfq/list`,
          { credentials: 'include' }
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'Failed to load RFQs.');
          setRfqs([]);
          return;
        }

        setRfqs(Array.isArray(data.rfqs) ? data.rfqs : []);
      } catch (err) {
        console.error('Error loading RFQ list:', err);
        setErrorMsg('Failed to load RFQs. Please try again.');
        setRfqs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [authLoading, isLoggedIn]);

  const statusLabel = (status: RFQStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending review';
      case 'QUOTE_SENT':
        return 'Quote sent';
      case 'PARTIALLY_QUOTED':
        return 'Partially quoted';
      case 'CONVERTED_TO_ORDER':
        return 'Converted to order';
      case 'REJECTED_BY_ADMIN':
        return 'Rejected by AxisFive';
      case 'REJECTED_BY_CUSTOMER':
        return 'Cancelled by you';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  const statusClass = (status: RFQStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return styles.badgePending;
      case 'QUOTE_SENT':
      case 'PARTIALLY_QUOTED':
        return styles.badgeInfo;
      case 'CONVERTED_TO_ORDER':
        return styles.badgeSuccess;
      case 'EXPIRED':
      case 'REJECTED_BY_ADMIN':
      case 'REJECTED_BY_CUSTOMER':
        return styles.badgeDanger;
      default:
        return styles.badgeNeutral;
    }
  };

  const rows = useMemo(
    () =>
      rfqs.map((rfq) => {
        const summary = rfq.company_name
          ? `For ${rfq.company_name}`
          : 'Summary not available';
        return { ...rfq, summary };
      }),
    [rfqs]
  );

  if (authLoading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Loading your RFQs...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>Sign in to view RFQs</h2>
              <p className={styles.textMuted}>
                Your request for quote history is available once you log in.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() =>
                  navigate('/login', {
                    state: {
                      backgroundLocation: { pathname: '/account/rfqs' },
                    },
                  })
                }
              >
                Login / Register
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
          <h1 className={styles.title}>My Requests</h1>

          {errorMsg && (
            <div className={styles.centerBox}>
              <p className={styles.textMuted}>{errorMsg}</p>
            </div>
          )}

          {loading ? (
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Loading your RFQs...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>No RFQs yet</h2>
              <p className={styles.textMuted}>
                Submit a request for quote from any product page or from your cart.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate('/product-catalog')}
              >
                Browse products
              </button>
            </div>
          ) : (
            <section className={styles.rfqSection}>
              <div className={`${styles.itemRow} ${styles.headerRow}`}>
                <div className={styles.colId}>RFQ</div>
                <div className={styles.colDate}>Created</div>
                <div className={styles.colSummary}>Summary</div>
                <div className={styles.colStatus}>Status</div>
                <div className={styles.colActions}>Actions</div>
              </div>

              <ul className={styles.itemList}>
                {rows.map((rfq) => (
                  <li key={rfq.id} className={styles.itemRow}>
                    <div className={styles.colId}>
                      <span className={styles.rfqCode}>RFQ-{rfq.id}</span>
                    </div>
                    <div className={styles.colDate}>
                      {new Date(rfq.created_at).toLocaleString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className={styles.colSummary}>
                      <span className={styles.summaryText}>
                        {rfq.summary}
                      </span>
                    </div>
                    <div className={styles.colStatus}>
                      <span
                        className={`${styles.badge} ${statusClass(
                          rfq.status
                        )}`}
                      >
                        {statusLabel(rfq.status)}
                      </span>
                    </div>
                    <div className={styles.colActions}>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() =>
                          navigate(`/account/rfqs/${rfq.id}`)
                        }
                      >
                        View details
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
