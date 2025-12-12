// routes/prod-catalog/product-rfq.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../../routes/middleware/requireAuth');

module.exports = function ProductRFQRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ======================================================
  // CREATE RFQ  (from cart / RFQ form)
  // ======================================================
  router.post('/', requireAuth, async (req, res) => {
    const userId = req.user && req.user.id;

    const {
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      use_case,
      site_info,
      additional_notes,
      currency,
      items,
    } = req.body || {};

    try {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one item is required for an RFQ.',
        });
      }

      const cleanedItems = items
        .map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
        }))
        .filter((it) => it.product_id && it.quantity > 0);

      if (!cleanedItems.length) {
        return res.status(400).json({
          success: false,
          message: 'RFQ items are invalid or empty.',
        });
      }

      const rfqPayload = {
        user_id: userId || null,
        company_name: company_name || null,
        contact_name: contact_name || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        use_case: use_case || null,
        site_info: site_info || null,
        additional_notes: additional_notes || null,
        currency: currency || 'PHP',
        status: 'PENDING_REVIEW',
      };

      // 1) Create RFQ header
      const {
        data: rfqRows,
        error: rfqError,
      } = await supabase
        .from('rfqs')
        .insert(rfqPayload)
        .select('*')
        .limit(1);

      if (rfqError) {
        console.error('Error creating RFQ header:', rfqError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create RFQ.',
        });
      }

      const rfq = rfqRows && rfqRows[0];
      if (!rfq) {
        return res.status(500).json({
          success: false,
          message: 'RFQ was created but not returned.',
        });
      }

      // 2) Create RFQ line items
      const rfqItemPayloads = cleanedItems.map((it) => ({
        rfq_id: rfq.id,
        product_id: it.product_id,
        quantity: it.quantity,
        currency: rfq.currency || 'PHP',
        line_status: 'PENDING_REVIEW',
      }));

      const {
        data: rfqItemRows,
        error: rfqItemsError,
      } = await supabase
        .from('rfq_items')
        .insert(rfqItemPayloads)
        .select('*');

      if (rfqItemsError) {
        console.error('Error creating RFQ items:', rfqItemsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create RFQ items.',
        });
      }

      // 3) Mark related cart items as RFQED (soft delete from cart view)
      const cartItemIds = (items || [])
        .map((it) => it.cart_item_id)
        .filter((id) => typeof id === 'number');

      if (cartItemIds.length > 0) {
        const { error: markError } = await supabase
          .from('cart_items')
          .update({ status: 'RFQED' })
          .in('id', cartItemIds)
          .eq('status', 'ACTIVE');

        if (markError) {
          console.error(
            'Error marking cart items as RFQED after RFQ:',
            markError
          );
          // do not fail RFQ, just log
        }
      }

      return res.status(201).json({
        success: true,
        message: 'RFQ created successfully.',
        rfq,
        items: rfqItemRows || [],
      });
    } catch (err) {
      console.error('Unexpected error creating RFQ:', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while creating RFQ.',
      });
    }
  });

  // ======================================================
  // GET RFQ headers for current user (list page)
  // ======================================================
// List all RFQs for admin (with status filter + pagination)
router.get('/list', requireAuth, async (req, res) => {
  const { status } = req.query; // e.g. ?status=PENDING_REVIEW
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;

  const limit = Math.max(1, Math.min(pageSize, 100)); // cap if you want
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('rfqs')
      .select(
        `
        id,
        created_at,
        status,
        currency,
        company_name,
        user_id
      `,
        { count: 'exact' } // get total rows for pagination
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data: rfqs, error, count } = await query;

    if (error) {
      console.error('Error fetching admin RFQ list:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch RFQ list.',
      });
    }

    return res.json({
      success: true,
      rfqs: rfqs || [],
      totalCount: count || 0,
      page,
      pageSize: limit,
    });
  } catch (err) {
    console.error('Unexpected error fetching admin RFQ list:', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while fetching RFQ list.',
    });
  }
});


  // ======================================================
  // GET single RFQ with items (details page)
  // ======================================================
  router.get('/:id', requireAuth, async (req, res) => {
    const userId = req.user && req.user.id;
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RFQ id.',
      });
    }

    try {
      const {
        data: rfqRows,
        error: rfqError,
      } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .limit(1);

      if (rfqError) {
        console.error('Error fetching RFQ:', rfqError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch RFQ.',
        });
      }

      const rfq = rfqRows && rfqRows[0];
      if (!rfq) {
        return res.status(404).json({
          success: false,
          message: 'RFQ not found.',
        });
      }

      const {
        data: itemRows,
        error: itemError,
      } = await supabase
        .from('rfq_items')
        .select(
          `
          *,
          product:products (
            id,
            name,
            slug,
            main_image_url,
            base_price
          )
        `
        )
        .eq('rfq_id', id);

      if (itemError) {
        console.error('Error fetching RFQ items:', itemError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch RFQ items.',
        });
      }

      return res.json({
        success: true,
        rfq,
        items: itemRows || [],
      });
    } catch (err) {
      console.error('Unexpected error fetching RFQ:', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while fetching RFQ.',
      });
    }
  });

  // ======================================================
  // CANCEL RFQ by customer (only if still pending/partial)
  // ======================================================
  router.patch('/:id/cancel', requireAuth, async (req, res) => {
    const userId = req.user && req.user.id;
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RFQ id.',
      });
    }

    try {
      const {
        data: rfqRows,
        error: rfqError,
      } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .limit(1);

      if (rfqError) {
        console.error('Error loading RFQ for cancel:', rfqError);
        return res.status(500).json({
          success: false,
          message: 'Failed to load RFQ.',
        });
      }

      const rfq = rfqRows && rfqRows[0];
      if (!rfq) {
        return res.status(404).json({
          success: false,
          message: 'RFQ not found.',
        });
      }

      if (
        rfq.status !== 'PENDING_REVIEW' &&
        rfq.status !== 'PARTIALLY_QUOTED'
      ) {
        return res.status(400).json({
          success: false,
          message: 'This RFQ can no longer be cancelled.',
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from('rfqs')
        .update({ status: 'REJECTED_BY_CUSTOMER' })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .limit(1);

      if (updateError) {
        console.error('Error cancelling RFQ:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to cancel RFQ.',
        });
      }

      return res.json({
        success: true,
        message: 'RFQ cancelled successfully.',
        rfq: updated && updated[0],
      });
    } catch (err) {
      console.error('Unexpected error cancelling RFQ:', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while cancelling RFQ.',
      });
    }
  });
// Customer rejects quote
router.post('/:id/reject', requireAuth, async (req, res) => {
  const userId = req.user && req.user.id;
  const id = Number(req.params.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid RFQ id.',
    });
  }

  try {
    const { data: rfqRows, error: rfqError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .limit(1);

    if (rfqError) {
      console.error('Error loading RFQ for reject:', rfqError);
      return res.status(500).json({
        success: false,
        message: 'Failed to load RFQ.',
      });
    }

    const rfq = rfqRows && rfqRows[0];
    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found.',
      });
    }

    if (rfq.status !== 'QUOTE_SENT' && rfq.status !== 'PARTIALLY_QUOTED') {
      return res.status(400).json({
        success: false,
        message: 'This RFQ is not in a quotable state.',
      });
    }

    const { data: updated, error: updErr } = await supabase
      .from('rfqs')
      .update({ status: 'REJECTED_BY_CUSTOMER' })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .limit(1);

    if (updErr) {
      console.error('Error rejecting RFQ:', updErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to reject RFQ.',
      });
    }

    return res.json({
      success: true,
      message: 'RFQ rejected.',
      rfq: updated && updated[0],
    });
  } catch (err) {
    console.error('Unexpected error rejecting RFQ:', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while rejecting RFQ.',
    });
  }
});
// Customer accepts quote
router.post('/:id/accept', requireAuth, async (req, res) => {
  const userId = req.user && req.user.id;
  const id = Number(req.params.id);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid RFQ id.',
    });
  }

  try {
    // 1) Load RFQ and validate
    const { data: rfqRows, error: rfqError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .limit(1);

    if (rfqError) {
      console.error('Error loading RFQ for accept:', rfqError);
      return res.status(500).json({
        success: false,
        message: 'Failed to load RFQ.',
      });
    }

    const rfq = rfqRows && rfqRows[0];
    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found.',
      });
    }

    if (rfq.status !== 'QUOTE_SENT' && rfq.status !== 'PARTIALLY_QUOTED') {
      return res.status(400).json({
        success: false,
        message: 'This RFQ is not in a quotable state.',
      });
    }

    // 2) Load RFQ items (must have quoted prices)
    const { data: rfqItems, error: itemsError } = await supabase
      .from('rfq_items')
      .select('*')
      .eq('rfq_id', id);

    if (itemsError) {
      console.error('Error loading RFQ items for accept:', itemsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to load RFQ items.',
      });
    }

    if (!rfqItems || rfqItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items found to convert to order.',
      });
    }

    const quotedItems = rfqItems.filter(
      (it) =>
        (it.quoted_unit_price != null || it.quoted_total_price != null) &&
        it.line_status === 'QUOTED'
    );

    if (quotedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No quoted items available to convert to order.',
      });
    }

    // 3) For each item, compute unit price & line total from quote
    const orderItemsPayload = [];
    let orderTotal = 0;

    for (const it of quotedItems) {
      const quantity = Number(it.quantity);
      const unitPrice = it.quoted_unit_price
        ? Number(it.quoted_unit_price)
        : it.quoted_total_price
        ? Number(it.quoted_total_price) / quantity
        : 0;

      const lineTotal =
        it.quoted_total_price != null
          ? Number(it.quoted_total_price)
          : unitPrice * quantity;

      orderTotal += lineTotal;

      // 4) Allocate a product unit for this product (seller-side only)
      // NOTE: this is a simple "one unit per line" allocation.
      // If quantity > 1 you may want to select many rows instead.
      const { data: unitRows, error: unitError } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', it.product_id)
        .eq('status', 'IN_STOCK')
        .order('created_at', { ascending: true })
        .limit(1);

      if (unitError) {
        console.error('Error selecting product unit:', unitError);
        return res.status(500).json({
          success: false,
          message:
            'Failed to allocate inventory for one or more items. Please contact support.',
        });
      }

      const allocatedUnit = unitRows && unitRows[0];
      if (!allocatedUnit) {
        return res.status(400).json({
          success: false,
          message:
            'One or more items are no longer in stock. Please contact AxisFive for an updated quote.',
        });
      }

      // Mark that unit as RESERVED (or SOLD, depending on your flow)
      const { error: reserveErr } = await supabase
        .from('product_units')
        .update({ status: 'RESERVED' })
        .eq('id', allocatedUnit.id)
        .eq('status', 'IN_STOCK');

      if (reserveErr) {
        console.error('Error reserving product unit:', reserveErr);
        return res.status(500).json({
          success: false,
          message:
            'Failed to reserve inventory for one or more items. Please contact support.',
        });
      }

      orderItemsPayload.push({
        product_id: it.product_id,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        currency: it.currency || rfq.currency || 'PHP',
        rfq_item_id: it.id,
        product_unit_id: allocatedUnit.id,  // NEW
      });
    }

    // 5) Create order header
    const { data: orderRows, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        rfq_id: rfq.id,
        total_price: orderTotal,
        currency: rfq.currency || 'PHP',
        // pickup_location / instructions can be overridden later
      })
      .select('*')
      .limit(1);

    if (orderErr) {
      console.error('Error creating order from RFQ:', orderErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order from RFQ.',
      });
    }

    const order = orderRows && orderRows[0];
    if (!order) {
      return res.status(500).json({
        success: false,
        message: 'Order was created but not returned.',
      });
    }

    // 6) Create order_items
    const { error: orderItemsErr } = await supabase
      .from('order_items')
      .insert(
        orderItemsPayload.map((it) => ({
          ...it,
          order_id: order.id,
        }))
      );

    if (orderItemsErr) {
      console.error('Error creating order items from RFQ:', orderItemsErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order items from RFQ.',
      });
    }

    // 7) Update RFQ status to CONVERTED_TO_ORDER
    const { data: updatedRfqRows, error: rfqUpdateErr } = await supabase
      .from('rfqs')
      .update({ status: 'CONVERTED_TO_ORDER' })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .limit(1);

    if (rfqUpdateErr) {
      console.error('Error updating RFQ to CONVERTED_TO_ORDER:', rfqUpdateErr);
      // Do not fail order creation; the order already exists
    }

    return res.json({
      success: true,
      message: 'RFQ accepted and order created.',
      rfq: updatedRfqRows && updatedRfqRows[0] ? updatedRfqRows[0] : rfq,
      order,
    });
  } catch (err) {
    console.error('Unexpected error accepting RFQ:', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while accepting RFQ.',
    });
  }
});

  console.log('🔧 Mounting routes at: /api/product-catalog/rfq');
  app.use('/api/product-catalog/rfq', router);
};
