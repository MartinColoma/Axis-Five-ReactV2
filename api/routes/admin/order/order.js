// routes/admin/order.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../../middleware/requireAuth');

module.exports = function AdminOrderRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ====== LIST ORDERS (admin) ======
  router.get('/list', requireAuth, async (req, res) => {
    const { status } = req.query;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const limit = Math.max(1, Math.min(pageSize, 100));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let query = supabase
        .from('orders')
        .select(
          `
          id,
          created_at,
          status,
          currency,
          total_price,
          pickup_location,
          user_id,
          rfq_id,
          payment_method,
          payment_status
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status && typeof status === 'string') {
        query = query.eq('status', status);
      }

      const { data: orders, error, count } = await query;

      if (error) {
        console.error('Error fetching admin order list:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch orders list.',
        });
      }

      return res.json({
        success: true,
        orders: orders || [],
        totalCount: count || 0,
        page,
        pageSize: limit,
      });
    } catch (err) {
      console.error('Unexpected error fetching admin order list:', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while fetching orders list.',
      });
    }
  });

  // ====== ORDER DETAILS (admin) ======
  router.get('/:id', requireAuth, async (req, res) => {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id.',
      });
    }

    try {
      const { data: orderRows, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          *,
          rfq:rfqs (
            id,
            company_name,
            contact_name,
            contact_email,
            contact_phone
          )
        `
        )
        .eq('id', id)
        .limit(1);

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch order.',
        });
      }

      const order = orderRows && orderRows[0];
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found.',
        });
      }

      const { data: itemRows, error: itemError } = await supabase
        .from('order_items')
        .select(
          `
          *,
          product:products (
            id,
            name,
            slug,
            main_image_url
          )
        `
        )
        .eq('order_id', id);

      if (itemError) {
        console.error('Error fetching order items:', itemError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch order items.',
        });
      }

      return res.json({
        success: true,
        order,
        items: itemRows || [],
      });
    } catch (err) {
      console.error('Unexpected error fetching order:', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while fetching order.',
      });
    }
  });

  // ====== MARK ORDER READY FOR PICKUP (admin) ======
  router.post('/:id/ready-for-pickup', requireAuth, async (req, res) => {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id.' });
    }

    try {
      const { data: orderRows, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .limit(1);

      if (orderError) {
        console.error('Error loading order for ready-for-pickup:', orderError);
        return res.status(500).json({ success: false, message: 'Failed to load order.' });
      }

      const order = orderRows && orderRows[0];
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (order.status !== 'AWAITING_PICKUP' && order.status !== 'READY_FOR_PICKUP') {
        return res.status(400).json({
          success: false,
          message: 'This order cannot be marked ready for pickup.',
        });
      }

      const nextStatus = order.status === 'AWAITING_PICKUP' ? 'READY_FOR_PICKUP' : order.status;

      const { data: updatedRows, error: updateError } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', id)
        .select('*')
        .limit(1); // [web:57]

      if (updateError) {
        console.error('Error updating order to READY_FOR_PICKUP:', updateError);
        return res.status(500).json({ success: false, message: 'Failed to update order status.' });
      }

      const updatedOrder = updatedRows && updatedRows[0];

      // Sync RFQ status so customer RFQ timeline can move
      if (updatedOrder && updatedOrder.rfq_id) {
        const { error: rfqUpdateErr } = await supabase
          .from('rfqs')
          .update({ status: 'READY_FOR_PICKUP_FROM_ORDER' })
          .eq('id', updatedOrder.rfq_id);

        if (rfqUpdateErr) {
          console.error('Error syncing RFQ status from order:', rfqUpdateErr);
        }
      }

      return res.json({
        success: true,
        message: 'Order marked as ready for pickup.',
        order: updatedOrder,
      });
    } catch (err) {
      console.error('Unexpected error marking order ready for pickup:', err);
      return res.status(500).json({ success: false, message: 'Unexpected error while updating order.' });
    }
  });

// ====== PAY (CASH) + COMPLETE (admin, simple sequential) ======
router.post('/:id/pay-and-complete', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const amountReceivedRaw = req.body?.amount_received;

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid order id.' });
  }

  const amount_received = Number(amountReceivedRaw);
  if (!Number.isFinite(amount_received) || amount_received <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount_received.' });
  }

  try {
    // 1) Load order
    const { data: orderRows, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (orderError) {
      console.error('Error loading order for pay-and-complete:', orderError);
      return res.status(500).json({ success: false, message: 'Failed to load order.' });
    }

    const order = orderRows?.[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.status !== 'READY_FOR_PICKUP') {
      return res.status(400).json({ success: false, message: 'Order must be READY_FOR_PICKUP to accept payment.' });
    }

    if (order.payment_status === 'PAID' || order.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Order is already paid/completed.' });
    }

    const amount_due = Number(order.total_price);
    if (!Number.isFinite(amount_due)) {
      return res.status(500).json({ success: false, message: 'Order total is invalid.' });
    }

    if (amount_received < amount_due) {
      return res.status(400).json({ success: false, message: 'Insufficient cash received.' });
    }

    const change_given = Number((amount_received - amount_due).toFixed(2));

    // 2) Insert payment (return row with id)
    const created_by = req.user?.id ?? null; // adjust if your middleware uses a different field

    const { data: paymentRows, error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: id,
        payment_method: 'CASH',
        status: 'CAPTURED',
        currency: order.currency || 'PHP',
        amount_due,
        amount_received,
        change_given,
        created_by,
      })
      .select('*')
      .limit(1);

    if (payErr) {
      console.error('Error inserting payment:', payErr);
      return res.status(500).json({ success: false, message: 'Failed to create payment record.' });
    }

    const payment = paymentRows?.[0];
    if (!payment) {
      return res.status(500).json({ success: false, message: 'Payment record not returned.' });
    }

    // 3) Insert payment_items for audit (bulk insert)
    const { data: orderItemRows, error: itemsErr } = await supabase
      .from('order_items')
      .select('id, quantity, line_total, currency')
      .eq('order_id', id);

    if (itemsErr) {
      console.error('Error loading order_items:', itemsErr);
      return res.status(500).json({ success: false, message: 'Failed to load order items for payment.' });
    }

    const paymentItemsPayload = (orderItemRows || []).map((it) => ({
      payment_id: payment.id,
      order_item_id: it.id,
      quantity: it.quantity,
      line_total: it.line_total,
      currency: it.currency || order.currency || 'PHP',
    }));

    if (paymentItemsPayload.length > 0) {
      const { error: payItemsErr } = await supabase.from('payment_items').insert(paymentItemsPayload);
      if (payItemsErr) {
        console.error('Error inserting payment_items:', payItemsErr);
        return res.status(500).json({ success: false, message: 'Payment saved but failed to log payment items.' });
      }
    }

    // 4) Update order: PAID + COMPLETED
    const { data: updatedOrderRows, error: updErr } = await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        payment_method: 'CASH',
        status: 'COMPLETED',
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .limit(1);

    if (updErr) {
      console.error('Error updating order paid/completed:', updErr);
      return res.status(500).json({ success: false, message: 'Payment logged but failed to update order.' });
    }

    const updatedOrder = updatedOrderRows?.[0];

    // 5) Sync RFQ (best-effort)
    if (updatedOrder?.rfq_id) {
      const { error: rfqErr } = await supabase
        .from('rfqs')
        .update({ status: 'ORDER_COMPLETED' })
        .eq('id', updatedOrder.rfq_id);

      if (rfqErr) console.error('RFQ sync failed:', rfqErr);
    }

    return res.json({
      success: true,
      message: 'Payment accepted and order completed.',
      payment,
      order: updatedOrder,
    });
  } catch (err) {
    console.error('Unexpected error pay-and-complete:', err);
    return res.status(500).json({ success: false, message: 'Unexpected error while completing payment.' });
  }
});


  console.log('🔧 Mounting routes at: /api/admin/order');
  app.use('/api/admin/order', router);
};
