// src/pages/Admin/RFQ/AdminRFQ_List.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../ProdCatalog/PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './AdminRFQ_List.module.css';
import { Eye, CircleCheck } from 'lucide-react'; // Eye + CircleCheck icons [web:131][web:129]

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

type RFQStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
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
  // if backend returns this, you can display it or join to profiles later
  // user_id?: string;
}

export default function AdminRFQ_List() {
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
        const res = await fetch(`${API_BASE_URL}/api/admin/rfq/list`, {
          credentials: 'include',
        });
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
    case 'UNDER_REVIEW':
      return 'Under review';
    case 'QUOTE_SENT':
      return 'Quote sent';
    case 'PARTIALLY_QUOTED':
      return 'Partially quoted';
    case 'CONVERTED_TO_ORDER':
      return 'Converted to order';
    case 'REJECTED_BY_ADMIN':
      return 'Rejected by AxisFive';
    case 'REJECTED_BY_CUSTOMER':
      return 'Cancelled by customer';
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
    case 'UNDER_REVIEW':
      return styles.badgeInfo;
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

const handleAcceptRfq = async (id: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/rfq/${id}/accept`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('Failed to set Under Review:', data);
      setErrorMsg(data.message || 'Failed to update RFQ.');
      return;
    }

    // Update local list
    setRfqs((prev) =>
      prev.map((rfq) =>
        rfq.id === id ? { ...rfq, status: 'UNDER_REVIEW' } : rfq
      )
    );
  } catch (err) {
    console.error('Error updating RFQ status:', err);
    setErrorMsg('Failed to update RFQ. Please try again.');
  }
};


  const rows = useMemo(
    () =>
      rfqs.map((rfq) => {
        const summary = rfq.company_name
          ? `For ${rfq.company_name}`
          : 'No company name provided';
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
              <p>Loading RFQs...</p>
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
              <h2 className={styles.subtitle}>Admin access required</h2>
              <p className={styles.textMuted}>
                Sign in with an admin account to manage RFQs.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() =>
                  navigate('/login', {
                    state: {
                      backgroundLocation: { pathname: '/admin/rfqs' },
                    },
                  })
                }
              >
                Login
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
          <h1 className={styles.title}>All RFQs</h1>

          {errorMsg && (
            <div className={styles.centerBox}>
              <p className={styles.textMuted}>{errorMsg}</p>
            </div>
          )}

          {loading ? (
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Loading RFQs...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>No RFQs yet</h2>
              <p className={styles.textMuted}>
                RFQs submitted by customers will appear here for review.
              </p>
            </div>
          ) : (
                <section className={styles.rfqSection}>
                  <ul className={styles.itemList}>
                    <li className={`${styles.itemRow} ${styles.headerRow}`}>
                      <div className={styles.colId}>RFQ</div>
                      <div className={styles.colDate}>Created</div>
                      <div className={styles.colSummary}>Summary</div>
                      <div className={styles.colStatus}>Status</div>
                      <div className={styles.colActions}>Actions</div>
                    </li>

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
                          <span className={styles.summaryText}>{rfq.summary}</span>
                        </div>
                        <div className={styles.colStatus}>
                          <span
                            className={`${styles.badge} ${statusClass(rfq.status)}`}
                          >
                            {statusLabel(rfq.status)}
                          </span>
                        </div>
                        <div className={styles.colActions}>
                          <div className={styles.colActions}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              aria-label="View details"
                              title="View details"
                              onClick={() => navigate(`/admin/rfqs/${rfq.id}`)}
                            >
                              <Eye size={18} />
                            </button>

                            {rfq.status === 'PENDING_REVIEW' && (
                              <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
                                aria-label="Mark under review"
                                title="Mark under review"
                                onClick={() => handleAcceptRfq(rfq.id)}
                              >
                                <CircleCheck size={18} />
                              </button>
                            )}
                          </div>
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
