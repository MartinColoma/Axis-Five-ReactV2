// routes/admin/analytics/analytics.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../../middleware/requireAuth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TZ = 'Asia/Manila';

function manilaDayKey(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${day}`;
}

function parseRangeDays(range) {
  const raw = String(range || '30d').trim().toLowerCase();
  const days = parseInt(raw.replace('d', ''), 10);
  if (!Number.isFinite(days)) return 30;
  return Math.max(1, Math.min(365, days));
}

function buildManilaDayBuckets(rangeDays) {
  const now = new Date();
  const todayKey = manilaDayKey(now);
  const today = new Date(`${todayKey}T00:00:00`);

  const start = new Date(today);
  start.setDate(today.getDate() - (rangeDays - 1));

  const buckets = [];
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.push(manilaDayKey(d));
  }
  return buckets;
}

function manilaDayKeyFromDbTimestamp(tsString) {
  const d = new Date(tsString);
  if (Number.isNaN(d.getTime())) return null;
  return manilaDayKey(d);
}

function countByField(rows, field) {
  const map = new Map();
  for (const r of rows) {
    const k = r?.[field] ?? 'UNKNOWN';
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function countPerManilaDay(rows, dateField, dayKeysSet) {
  const map = new Map();
  for (const r of rows) {
    const raw = r?.[dateField];
    if (!raw) continue;
    const key = manilaDayKeyFromDbTimestamp(raw);
    if (!key) continue;
    if (dayKeysSet.has(key)) map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function isRetryableSupabaseError(err) {
  const msg = String(err?.message || '');
  const causeCode = err?.cause?.code || err?.code;
  return (
    causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
    msg.includes('fetch failed') ||
    msg.includes('Connect Timeout')
  );
}

module.exports = function adminAnalyticsRoutes(app) {
  const router = express.Router();

  router.get('/analytics', requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const rangeDays = parseRangeDays(req.query.range);

      const dayKeys = buildManilaDayBuckets(rangeDays);
      const dayKeysSet = new Set(dayKeys);

      const startLocal = `${dayKeys[0]} 00:00:00`;
      const endLocal = `${dayKeys[dayKeys.length - 1]} 23:59:59.999`;

      const [
        productsAll,
        productsActive,

        rfqsRange,
        rfqsAllForStatus,

        ordersRange,
        ordersAllForStatus,

        paymentsCapturedRange,

        usersAll,
        usersActive,
        usersInactive,
        usersRange,
        usersAllForStatus,
        usersAllForRole,

        usersArchivedAll,
        usersArchivedRange,
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),

        supabase.from('rfqs').select('id, status, created_at').gte('created_at', startLocal).lte('created_at', endLocal),
        supabase.from('rfqs').select('status'),

        supabase.from('orders').select('id, status, created_at').gte('created_at', startLocal).lte('created_at', endLocal),
        supabase.from('orders').select('status'),

        supabase
          .from('payments')
          .select('amount_due, status, created_at')
          .eq('status', 'CAPTURED')
          .gte('created_at', startLocal)
          .lte('created_at', endLocal),

        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
        supabase.from('users').select('id, created_at').gte('created_at', startLocal).lte('created_at', endLocal),
        supabase.from('users').select('status'),
        supabase.from('users').select('role'),

        supabase.from('users_archived').select('id', { count: 'exact', head: true }),
        supabase.from('users_archived').select('id, archived_at').gte('archived_at', startLocal).lte('archived_at', endLocal),
      ]);

      const allResults = [
        productsAll,
        productsActive,
        rfqsRange,
        rfqsAllForStatus,
        ordersRange,
        ordersAllForStatus,
        paymentsCapturedRange,
        usersAll,
        usersActive,
        usersInactive,
        usersRange,
        usersAllForStatus,
        usersAllForRole,
        usersArchivedAll,
        usersArchivedRange,
      ];

      const firstError = allResults.find((r) => r.error)?.error;
      if (firstError) {
        console.error('Analytics supabase error:', firstError);

        if (isRetryableSupabaseError(firstError)) {
          return res.status(503).json({
            success: false,
            message: 'Analytics backend temporarily unavailable.',
          });
        }

        return res.status(500).json({ success: false, message: 'Failed to load analytics' });
      }

      // ---- KPIs (grouped) ----
      const storeTotalProducts = productsAll.count ?? 0;
      const storeActiveProducts = productsActive.count ?? 0;

      const rfqsRangeRows = rfqsRange.data || [];
      const ordersRangeRows = ordersRange.data || [];

      const paymentsRows = paymentsCapturedRange.data || [];
      const storeCapturedRevenuePhp = paymentsRows.reduce((sum, p) => sum + Number(p.amount_due || 0), 0);

      const userTotalUsers = usersAll.count ?? 0;
      const userActiveUsers = usersActive.count ?? 0;
      const userInactiveUsers = usersInactive.count ?? 0;
      const userArchivedUsers = usersArchivedAll.count ?? 0;

      // ---- Per-day series ----
      const rfqPerDayMap = countPerManilaDay(rfqsRangeRows, 'created_at', dayKeysSet);
      const orderPerDayMap = countPerManilaDay(ordersRangeRows, 'created_at', dayKeysSet);

      const usersRangeRows = usersRange.data || [];
      const userPerDayMap = countPerManilaDay(usersRangeRows, 'created_at', dayKeysSet);

      const usersArchivedRangeRows = usersArchivedRange.data || [];
      const archivedPerDayMap = countPerManilaDay(usersArchivedRangeRows, 'archived_at', dayKeysSet);

      const rfqsPerDay = dayKeys.map((date) => ({ date, count: rfqPerDayMap.get(date) || 0 }));
      const ordersPerDay = dayKeys.map((date) => ({ date, count: orderPerDayMap.get(date) || 0 }));
      const usersPerDay = dayKeys.map((date) => ({ date, count: userPerDayMap.get(date) || 0 }));
      const archivedUsersPerDay = dayKeys.map((date) => ({ date, count: archivedPerDayMap.get(date) || 0 }));

      // ---- Distributions (all-time) ----
      const rfqsByStatus = countByField(rfqsAllForStatus.data || [], 'status');
      const ordersByStatus = countByField(ordersAllForStatus.data || [], 'status');
      const usersByStatus = countByField(usersAllForStatus.data || [], 'status'); // active/inactive/suspended
      const usersByRole = countByField(usersAllForRole.data || [], 'role');

      return res.status(200).json({
        success: true,
        tz: TZ,
        rangeDays,

        kpis: {
          users: {
            totalUsers: userTotalUsers,
            activeUsers: userActiveUsers,
            inactiveUsers: userInactiveUsers,
            archivedUsers: userArchivedUsers,
          },
          store: {
            totalProducts: storeTotalProducts,
            activeProducts: storeActiveProducts,
            totalRfqs: rfqsRangeRows.length,
            totalOrders: ordersRangeRows.length,
            capturedRevenuePhp: storeCapturedRevenuePhp,
          },
        },

        usersByStatus,
        usersByRole,
        usersPerDay,
        archivedUsersPerDay,

        rfqsByStatus,
        ordersByStatus,
        rfqsPerDay,
        ordersPerDay,
      });
    } catch (err) {
      console.error('Analytics route error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.use('/api/admin', router);
};
