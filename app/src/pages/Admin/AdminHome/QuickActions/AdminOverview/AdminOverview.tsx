import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './AdminOverview.module.css';
import { useAuth } from '../../../../../contexts/AuthContext';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title,
} from 'chart.js';

import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title
);

type AnalyticsResponse = {
  success: boolean;
  message?: string;

  tz?: string;
  rangeDays?: number;

  kpis: {
    users: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      archivedUsers: number;
    };
    store: {
      totalProducts: number;
      activeProducts: number;
      totalRfqs: number;
      totalOrders: number;
      capturedRevenuePhp: number;
    };
  };

  usersByStatus: { status: string; count: number }[];
  usersByRole: { status: string; count: number }[];
  usersPerDay: { date: string; count: number }[];
  archivedUsersPerDay: { date: string; count: number }[];

  rfqsByStatus: { status: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  rfqsPerDay: { date: string; count: number }[];
  ordersPerDay: { date: string; count: number }[];
};


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const AdminOverview: React.FC = () => {
  const { isLoading: authLoading, isLoggedIn, userData } = useAuth();

  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/analytics?range=30d`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 401) {
        showNotification('error', 'Unauthorized. Please login again.');
        setAnalytics(null);
        return;
      }

      if (res.status === 503) {
        showNotification('error', 'Analytics temporarily unavailable. Try again.');
        return;
      }

      const data: AnalyticsResponse = await res.json();
      if (data.success) setAnalytics(data);
      else showNotification('error', data.message || 'Failed to load analytics');
    } catch (e) {
      console.error('Analytics fetch error:', e);
      showNotification('error', 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) return;
    if (userData?.role !== 'admin') return;
    fetchAnalytics();
  }, [authLoading, isLoggedIn, userData?.role, fetchAnalytics]);

  const canView = !authLoading && isLoggedIn && userData?.role === 'admin';

  const commonOptions = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 150,
        plugins: {
          legend: { display: true, labels: { color: '#e0e0e0' } },
        },
        scales: {
          x: { ticks: { color: '#bbbbbb' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#bbbbbb' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      }) as const,
    []
  );

  // ---- USERS ----
  const usersLineData = useMemo(() => {
    const labels = analytics?.usersPerDay.map((x) => x.date) ?? [];
    const values = analytics?.usersPerDay.map((x) => x.count) ?? [];
    return {
      labels,
      datasets: [
        {
          label: 'New users',
          data: values,
          tension: 0.3,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.15)',
          pointRadius: 2,
          pointHoverRadius: 4,
          fill: true,
        },
      ],
    };
  }, [analytics]);

  const usersStatusDoughnutData = useMemo(() => {
    const labels = analytics?.usersByStatus.map((x) => x.status) ?? [];
    const values = analytics?.usersByStatus.map((x) => x.count) ?? [];
    return {
      labels,
      datasets: [
        {
          label: 'Users by status',
          data: values,
          backgroundColor: [
            'rgba(40, 167, 69, 0.55)',  // active
            'rgba(108, 117, 125, 0.55)', // inactive
            'rgba(220, 53, 69, 0.55)',  // archived
            'rgba(255, 193, 7, 0.55)',  // suspended (if you use it)
            'rgba(187, 187, 187, 0.35)',
          ],
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        },
      ],
    };
  }, [analytics]);

  // ---- STORE ----
  const rfqLineData = useMemo(() => {
    const labels = analytics?.rfqsPerDay.map((x) => x.date) ?? [];
    const values = analytics?.rfqsPerDay.map((x) => x.count) ?? [];
    return {
      labels,
      datasets: [
        {
          label: 'RFQs',
          data: values,
          tension: 0.3,
          borderColor: '#00bcd4',
          backgroundColor: 'rgba(0, 188, 212, 0.15)',
          pointRadius: 2,
          pointHoverRadius: 4,
          fill: true,
        },
      ],
    };
  }, [analytics]);

  const ordersBarData = useMemo(() => {
    const labels = analytics?.ordersPerDay.map((x) => x.date) ?? [];
    const values = analytics?.ordersPerDay.map((x) => x.count) ?? [];
    return {
      labels,
      datasets: [
        {
          label: 'Orders',
          data: values,
          backgroundColor: 'rgba(0, 188, 212, 0.35)',
          borderColor: 'rgba(0, 188, 212, 0.8)',
          borderWidth: 1,
        },
      ],
    };
  }, [analytics]);

  const ordersStatusDoughnutData = useMemo(() => {
    const labels = analytics?.ordersByStatus.map((x) => x.status) ?? [];
    const values = analytics?.ordersByStatus.map((x) => x.count) ?? [];
    return {
      labels,
      datasets: [
        {
          label: 'Orders by status',
          data: values,
          backgroundColor: [
            'rgba(0, 188, 212, 0.55)',
            'rgba(40, 167, 69, 0.55)',
            'rgba(255, 193, 7, 0.55)',
            'rgba(220, 53, 69, 0.55)',
            'rgba(187, 187, 187, 0.35)',
          ],
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        },
      ],
    };
  }, [analytics]);

  return (
    <>
      <section className={`${styles.tabPane} ${styles.active}`} aria-label="Overview analytics">
        <div className={styles.tableHeader}>
          <h5>Analytics</h5>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={fetchAnalytics}
            disabled={loading || !canView}
            title="Refresh analytics"
          >
            Refresh
          </button>
        </div>

        {!canView && <div className={styles.waitingText}>Waiting for authentication…</div>}

        {canView && (
          <>
            {/* USER KPIs */}
            <div className={styles.kpiHeader}>User Analytics</div>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Total Users</div>
                <div className={styles.kpiValue}>{analytics?.kpis.users.totalUsers ?? '-'}</div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Active Users</div>
                <div className={styles.kpiValue}>{analytics?.kpis.users.activeUsers ?? '-'}</div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Inactive Users</div>
                <div className={styles.kpiValue}>{analytics?.kpis.users.inactiveUsers ?? '-'}</div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Archived Users</div>
                <div className={styles.kpiValue}>{analytics?.kpis.users.archivedUsers ?? '-'}</div>
              </div>
            </div>

            {/* USERS SECTION */}
            <div className={styles.sectionBlock}>
              <div className={styles.usersChartsGrid}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>New users per day (30d)</div>
                  <div className={styles.chartBox}>
                    <Line data={usersLineData} options={commonOptions} />
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>Users by status</div>
                  <div className={styles.chartBox}>
                    <Doughnut data={usersStatusDoughnutData} options={commonOptions} />
                  </div>
                </div>
              </div>
            </div>
            {/* STORE SECTION */}
            {/* STORE KPIs */}
            <div className={styles.kpiHeader}>Store Analytics</div>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Total Products</div>
                <div className={styles.kpiValue}>{analytics?.kpis.store.totalProducts ?? '-'}</div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Active Products</div>
                <div className={styles.kpiValue}>{analytics?.kpis.store.activeProducts ?? '-'}</div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>RFQs (30d)</div>
                <div className={styles.kpiValue}>{analytics?.kpis.store.totalRfqs ?? '-'}</div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Orders (30d)</div>
                <div className={styles.kpiValue}>{analytics?.kpis.store.totalOrders ?? '-'}</div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiLabel}>Captured Revenue (PHP)</div>
                <div className={styles.kpiValue}>
                  {analytics ? analytics.kpis.store.capturedRevenuePhp.toLocaleString() : '-'}
                </div>
              </div>
            </div>
            <div className={styles.sectionBlock}>
              <div className={styles.storeLayout}>
                {/* Left column: stacked charts */}
                <div className={styles.storeStack}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>RFQs per day (30d)</div>
                    <div className={styles.chartBox}>
                      <Line data={rfqLineData} options={commonOptions} />
                    </div>
                  </div>

                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>Orders per day (30d)</div>
                    <div className={styles.chartBox}>
                      <Bar data={ordersBarData} options={commonOptions} />
                    </div>
                  </div>
                </div>

                {/* Right column: doughnut */}
                <div className={styles.chartCard}>
                  <div className={styles.chartTitle}>Orders by status</div>
                  <div className={styles.chartBox}>
                    <Doughnut data={ordersStatusDoughnutData} options={commonOptions} />
                  </div>
                </div>
              </div>
            </div>

          </>
        )}

        {loading && <div className={styles.loadingOverlay}>Loading analytics...</div>}
      </section>

      {notification && (
        <div
          className={`${styles.notification} ${
            styles[
              `notification${
                notification.type.charAt(0).toUpperCase() + notification.type.slice(1)
              }` as 'notificationSuccess' | 'notificationError'
            ]
          } ${styles.show}`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            className={styles.notificationClose}
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

export default AdminOverview;
