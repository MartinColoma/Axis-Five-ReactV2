// routes/admin/rfq.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../../middleware/requireAuth');

module.exports = function AdminRFQRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // List all RFQs for admin
  router.get('/list', requireAuth, async (req, res) => {
    try {
      const { data: rfqs, error } = await supabase
        .from('rfqs')
        .select(`
          id,
          created_at,
          status,
          currency,
          company_name,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin RFQ list:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch RFQ list.',
        });
      }

      return res.json({ success: true, rfqs: rfqs || [] });
    } catch (err) {
      console.error('Unexpected error fetching admin RFQ list:', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while fetching RFQ list.',
      });
    }
  });

  // Get single RFQ with items for admin
  router.get('/:id', requireAuth, async (req, res) => {
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
        .limit(1);

      if (rfqError) {
        console.error('Error fetching RFQ (admin):', rfqError);
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

      const { data: itemRows, error: itemError } = await supabase
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
        console.error('Error fetching RFQ items (admin):', itemError);
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
      console.error('Unexpected error fetching RFQ (admin):', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while fetching RFQ.',
      });
    }
  });
// Update quote for RFQ items (admin)
router.post('/:id/quote', requireAuth, async (req, res) => {
  const rfqId = Number(req.params.id);
  if (!rfqId || Number.isNaN(rfqId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid RFQ id.',
    });
  }

  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No items provided.',
    });
  }

  try {
    // Basic: ensure RFQ exists
    const { data: rfqRows, error: rfqError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('id', rfqId)
      .limit(1);

    if (rfqError) {
      console.error('Error loading RFQ for quote:', rfqError);
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

    // Update each rfq_item with quote info
    for (const it of items) {
      const itemId = Number(it.id);
      if (!itemId || Number.isNaN(itemId)) continue;

      const quotedUnitPrice = it.quoted_unit_price != null
        ? Number(it.quoted_unit_price)
        : null;

      const { error: updateErr } = await supabase
        .from('rfq_items')
        .update({
          quoted_unit_price: quotedUnitPrice,
          quoted_currency: it.quoted_currency || rfq.currency || 'PHP',
          quoted_lead_time: it.quoted_lead_time || null,
          line_status: 'QUOTED',
        })
        .eq('id', itemId)
        .eq('rfq_id', rfqId);

      if (updateErr) {
        console.error('Error updating RFQ item quote:', updateErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to update one or more RFQ items.',
        });
      }
    }

    // Optionally bump RFQ header status
    const { data: updatedRfqRows, error: rfqUpdateErr } = await supabase
      .from('rfqs')
      .update({
        status: 'QUOTE_SENT',
      })
      .eq('id', rfqId)
      .select('*')
      .limit(1);

    if (rfqUpdateErr) {
      console.error('Error updating RFQ header after quote:', rfqUpdateErr);
    }

    return res.json({
      success: true,
      message: 'Quote saved successfully.',
      rfq: updatedRfqRows && updatedRfqRows[0],
    });
  } catch (err) {
    console.error('Unexpected error saving quote:', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while saving quote.',
    });
  }
});
// Mark RFQ as under review (admin accepts RFQ)
router.post('/:id/accept', requireAuth, async (req, res) => {
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
      .limit(1);

    if (rfqError) {
      console.error('Error loading RFQ for admin accept:', rfqError);
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

    // Only allow moving from initial state(s)
    if (rfq.status !== 'PENDING_REVIEW') {
      return res.status(400).json({
        success: false,
        message: 'This RFQ cannot be moved to Under Review.',
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('rfqs')
      .update({ status: 'UNDER_REVIEW' })
      .eq('id', id)
      .select('*')
      .limit(1);

    if (updateError) {
      console.error('Error setting RFQ Under Review:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update RFQ status.',
      });
    }

    return res.json({
      success: true,
      message: 'RFQ marked as Under Review.',
      rfq: updated && updated[0],
    });
  } catch (err) {
    console.error('Unexpected error setting RFQ Under Review:', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while updating RFQ.',
    });
  }
});

  console.log('🔧 Mounting routes at: /api/admin/rfq');
  app.use('/api/admin/rfq', router);
};
