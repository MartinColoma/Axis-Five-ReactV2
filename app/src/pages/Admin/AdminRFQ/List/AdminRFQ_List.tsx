// src/pages/Admin/RFQ/AdminRFQ_List.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../ProdCatalog/PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './AdminRFQ_List.module.css';
import { Eye, CircleCheck } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

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
}

export default function AdminRFQ_List() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rfqs, setRfqs] = useState<RFQHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const [statusFilter, setStatusFilter] = useState<RFQStatus | 'ALL'>(
    'ALL'
  );
  const [searchTerm, setSearchTerm] = useState('');

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
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(
        `${API_BASE_URL}/api/admin/rfq/list?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to load RFQs.');
        setRfqs([]);
        setTotalCount(0);
        return;
      }

      setRfqs(Array.isArray(data.rfqs) ? data.rfqs : []);
      setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : 0);
    } catch (err) {
      console.error('Error loading RFQ list:', err);
      setErrorMsg('Failed to load RFQs. Please try again.');
      setRfqs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  fetchList();
}, [authLoading, isLoggedIn, statusFilter, page]);


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

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((rfq) => {
      const idStr = `rfq-${rfq.id}`.toLowerCase();
      const company = (rfq.company_name || '').toLowerCase();
      const summary = (rfq.summary || '').toLowerCase();
      return (
        idStr.includes(term) ||
        company.includes(term) ||
        summary.includes(term)
      );
    });
  }, [rows, searchTerm]);

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
          <div className={styles.headerRowTop}>
            <h1 className={styles.title}>All Request For Quote</h1>

            <div className={styles.filtersRow}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by RFQ ID or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as RFQStatus | 'ALL')
                }
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="QUOTE_SENT">Quote sent</option>
                <option value="PARTIALLY_QUOTED">Partially quoted</option>
                <option value="CONVERTED_TO_ORDER">Converted to order</option>
                <option value="REJECTED_BY_ADMIN">Rejected by AxisFive</option>
                <option value="REJECTED_BY_CUSTOMER">Cancelled by customer</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
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
          ) : filteredRows.length === 0 ? (
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>No RFQs found</h2>
              <p className={styles.textMuted}>
                Try adjusting your filters or search term.
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

                {filteredRows.map((rfq) => (
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
                        className={`${styles.badge} ${statusClass(rfq.status)}`}
                      >
                        {statusLabel(rfq.status)}
                      </span>
                    </div>
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
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
                  {!loading && filteredRows.length > 0 && (
            <div className={styles.paginationRow}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages} · Showing {rfqs.length} of {totalCount} RFQs
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() =>
                  setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                }
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
      </main>
    </div>
  );
}
