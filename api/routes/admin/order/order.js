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
    const { status } = req.query; // ?status=AWAITING_PICKUP etc.
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
          rfq_id
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
      const {
        data: orderRows,
        error: orderError,
      } = await supabase
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

      const {
        data: itemRows,
        error: itemError,
      } = await supabase
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
    return res.status(400).json({
      success: false,
      message: 'Invalid order id.',
    });
  }

  try {
    const { data: orderRows, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (orderError) {
      console.error('Error loading order for ready-for-pickup:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Failed to load order.',
      });
    }

    const order = orderRows && orderRows[0];
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (
      order.status !== 'AWAITING_PICKUP' &&
      order.status !== 'READY_FOR_PICKUP'
    ) {
      return res.status(400).json({
        success: false,
        message: 'This order cannot be marked ready for pickup.',
      });
    }

    const nextStatus =
      order.status === 'AWAITING_PICKUP' ? 'READY_FOR_PICKUP' : order.status;

    const { data: updatedRows, error: updateError } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', id)
      .select('*')
      .limit(1); // [web:57][web:250]

    if (updateError) {
      console.error('Error updating order to READY_FOR_PICKUP:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update order status.',
      });
    }

    const updatedOrder = updatedRows && updatedRows[0];

    // NEW: sync RFQ status so customer RFQ timeline shows ready for pickup
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
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while updating order.',
    });
  }
});
// ====== MARK ORDER COMPLETED (admin) ======
router.post('/:id/complete', requireAuth, async (req, res) => {
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
      .select('*')
      .eq('id', id)
      .limit(1);

    if (orderError) {
      console.error('Error loading order for complete:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Failed to load order.',
      });
    }

    const order = orderRows && orderRows[0];
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.status !== 'READY_FOR_PICKUP') {
      return res.status(400).json({
        success: false,
        message: 'Only ready orders can be completed.',
      });
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'COMPLETED' })
      .eq('id', id)
      .select('*')
      .limit(1);

    if (updateError) {
      console.error('Error updating order to COMPLETED:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete order.',
      });
    }

    const updatedOrder = updatedRows && updatedRows[0];

    // NEW: sync RFQ status so RFQ timeline shows completed
    if (updatedOrder && updatedOrder.rfq_id) {
      const { error: rfqUpdateErr } = await supabase
        .from('rfqs')
        .update({ status: 'ORDER_COMPLETED' })
        .eq('id', updatedOrder.rfq_id);

      if (rfqUpdateErr) {
        console.error('Error syncing RFQ status on completion:', rfqUpdateErr);
      }
    }

    return res.json({
      success: true,
      message: 'Order completed.',
      order: updatedOrder,
    });
  } catch (err) {
    console.error('Unexpected error completing order:', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while updating order.',
    });
  }
});



  console.log('🔧 Mounting routes at: /api/admin/order');
  app.use('/api/admin/order', router);
};
