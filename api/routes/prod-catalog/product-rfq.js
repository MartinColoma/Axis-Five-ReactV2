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
  router.get('/list', requireAuth, async (req, res) => {
    const userId = req.user && req.user.id;

    try {
      const {
        data: rfqs,
        error,
      } = await supabase
        .from('rfqs')
        .select(
          `
          id,
          created_at,
          status,
          currency,
          company_name
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching RFQ list:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch RFQ list.',
        });
      }

      return res.json({
        success: true,
        rfqs: rfqs || [],
      });
    } catch (err) {
      console.error('Unexpected error fetching RFQ list:', err);
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

  console.log('🔧 Mounting routes at: /api/product-catalog/rfq');
  app.use('/api/product-catalog/rfq', router);
};
