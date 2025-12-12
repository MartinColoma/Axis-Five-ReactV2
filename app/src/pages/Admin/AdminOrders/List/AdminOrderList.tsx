import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../ProdCatalog/PC_Navigation/PC_Navbar';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './AdminOrderList.module.css';
import { Eye } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

type OrderStatus = 'AWAITING_PICKUP' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';

interface OrderHeader {
  id: number;
  created_at: string;
  status: OrderStatus;
  currency: string;
  total_price: string;
  pickup_location: string | null;
  rfq_id: number | null;
}

export default function AdminOrder_List() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
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
          `${API_BASE_URL}/api/admin/order/list?${params.toString()}`,
          { credentials: 'include' }
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.message || 'Failed to load orders.');
          setOrders([]);
          setTotalCount(0);
          return;
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : 0);
      } catch (err) {
        console.error('Error loading orders list:', err);
        setErrorMsg('Failed to load orders. Please try again.');
        setOrders([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [authLoading, isLoggedIn, statusFilter, page]);

  const statusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'AWAITING_PICKUP':
        return 'Awaiting pickup';
      case 'READY_FOR_PICKUP':
        return 'Ready for pickup';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const statusClass = (status: OrderStatus) => {
    switch (status) {
      case 'AWAITING_PICKUP':
        return styles.badgePending;
      case 'READY_FOR_PICKUP':
        return styles.badgeInfo;
      case 'COMPLETED':
        return styles.badgeSuccess;
      case 'CANCELLED':
        return styles.badgeDanger;
      default:
        return styles.badgeNeutral;
    }
  };

  const rows = useMemo(
    () =>
      orders.map((order) => {
        const summary = order.rfq_id
          ? `Order from RFQ-${order.rfq_id}`
          : 'Direct order';
        return { ...order, summary };
      }),
    [orders]
  );

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((order) => {
      const idStr = `order-${order.id}`.toLowerCase();
      const summary = (order.summary || '').toLowerCase();
      return idStr.includes(term) || summary.includes(term);
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
              <p>Loading orders...</p>
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
                Sign in with an admin account to manage orders.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() =>
                  navigate('/login', {
                    state: {
                      backgroundLocation: { pathname: '/admin/orders' },
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
            <h1 className={styles.title}>All orders</h1>

            <div className={styles.filtersRow}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by Order ID or summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as OrderStatus | 'ALL')
                }
              >
                <option value="ALL">All statuses</option>
                <option value="AWAITING_PICKUP">Awaiting pickup</option>
                <option value="READY_FOR_PICKUP">Ready for pickup</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
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
              <p>Loading orders...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>No orders found</h2>
              <p className={styles.textMuted}>
                Try adjusting your filters or search term.
              </p>
            </div>
          ) : (
            <section className={styles.rfqSection}>
              <ul className={styles.itemList}>
                <li className={`${styles.itemRow} ${styles.headerRow}`}>
                  <div className={styles.colId}>Order</div>
                  <div className={styles.colDate}>Created</div>
                  <div className={styles.colSummary}>Summary</div>
                  <div className={styles.colTotal}>Total</div>
                  <div className={styles.colStatus}>Status</div>
                  <div className={styles.colActions}>Actions</div>
                </li>

                {filteredRows.map((order) => (
                  <li key={order.id} className={styles.itemRow}>
                    <div className={styles.colId}>
                      <span className={styles.rfqCode}>ORD-{order.id}</span>
                    </div>
                    <div className={styles.colDate}>
                      {new Date(order.created_at).toLocaleString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className={styles.colSummary}>
                      <span className={styles.summaryText}>{order.summary}</span>
                    </div>
                    <div className={styles.colTotal}>
                      <span className={styles.summaryText}>
                        {order.currency || 'PHP'}{' '}
                        {Number(order.total_price).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className={styles.colStatus}>
                      <span
                        className={`${styles.badge} ${statusClass(order.status)}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </div>
                    <div className={styles.colActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="View details"
                        title="View details"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
                Page {page} of {totalPages} · Showing {orders.length} of{' '}
                {totalCount} orders
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
        </div>
      </main>
    </div>
  );
}
