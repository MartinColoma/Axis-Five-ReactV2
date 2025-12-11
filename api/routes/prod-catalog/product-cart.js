// routes/prod-catalog/product-cart.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../../routes/middleware/requireAuth');

module.exports = function ProductCartRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const getOrCreateActiveCart = async (userId) => {
    const { data: existing, error: findError } = await supabase
      .from('cart_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (findError) throw findError;
    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
      .from('cart_sessions')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (createError) throw createError;
    return created.id;
  };

  // GET /api/product-catalog/cart
  router.get('/', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;

      const { data: cart, error: cartError } = await supabase
        .from('cart_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (cartError) {
        console.error('❌ Error fetching cart session:', cartError);
        return res.status(500).json({
          success: false,
          message: 'Failed to load cart',
        });
      }

      if (!cart) {
        return res.status(200).json({
          success: true,
          items: [],
          total_quantity: 0,
          item_count: 0,
        });
      }

      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select(
          `
          id,
          product_id,
          quantity,
          unit_price,
          currency,
          status,
          product:products (
            id,
            name,
            slug,
            main_image_url,
            base_price
          )
        `
        )
        .eq('cart_id', cart.id)
        .eq('status', 'ACTIVE') // only active items
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('❌ Error fetching cart items:', itemsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to load cart',
        });
      }

      const safeItems = items || [];
      const totalQuantity = safeItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      const itemCount = safeItems.length;

      return res.status(200).json({
        success: true,
        items: safeItems,
        total_quantity: totalQuantity,
        item_count: itemCount,
      });
    } catch (err) {
      console.error('❌ Unexpected error loading cart:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to load cart',
      });
    }
  });

  // POST /api/product-catalog/cart/items  (INCREMENT quantity)
  router.post('/items', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { product_id, quantity } = req.body;

      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'product_id and positive quantity are required',
        });
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, base_price, currency, is_active')
        .eq('id', product_id)
        .maybeSingle();

      if (productError) {
        console.error('❌ Error verifying product:', productError);
        return res.status(500).json({
          success: false,
          message: 'Failed to add item to cart',
        });
      }

      if (!product || !product.is_active) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or inactive',
        });
      }

      const cartId = await getOrCreateActiveCart(userId);
      const unitPrice = product.base_price ?? null;
      const currency = product.currency || 'PHP';

      // read existing ACTIVE quantity (if any)
      const { data: existingItem, error: existingError } = await supabase
        .from('cart_items')
        .select('id, quantity, status')
        .eq('cart_id', cartId)
        .eq('product_id', product_id)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (existingError) {
        console.error('❌ Error reading existing cart item:', existingError);
        return res.status(500).json({
          success: false,
          message: 'Failed to add item to cart',
        });
      }

      const newQuantity = existingItem
        ? existingItem.quantity + quantity
        : quantity;

      // upsert ACTIVE row
      const { error: upsertError } = await supabase
        .from('cart_items')
        .upsert(
          {
            cart_id: cartId,
            product_id,
            quantity: newQuantity,
            unit_price: unitPrice,
            currency,
            status: 'ACTIVE',
          },
          { onConflict: 'cart_id,product_id' }
        );

      if (upsertError) {
        console.error('❌ Error upserting cart item:', upsertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to add item to cart',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Item added to cart',
      });
    } catch (err) {
      console.error('❌ Unexpected error adding to cart:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
      });
    }
  });

  // PATCH /api/product-catalog/cart/items/:id  (set quantity)
  router.patch('/items/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than zero',
        });
      }

      const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .select(
          `
          id,
          status,
          cart:cart_sessions!inner (
            id,
            user_id,
            status
          )
        `
        )
        .eq('id', id)
        .eq('cart.user_id', userId)
        .eq('cart.status', 'ACTIVE')
        .eq('status', 'ACTIVE') // only update active row
        .maybeSingle();

      if (itemError) {
        console.error('❌ Error verifying cart item:', itemError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update cart item',
        });
      }

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        });
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);

      if (updateError) {
        console.error('❌ Error updating cart item:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update cart item',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cart item updated',
      });
    } catch (err) {
      console.error('❌ Unexpected error updating cart item:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
      });
    }
  });

  // DELETE /api/product-catalog/cart/items/:id  (soft delete → REMOVED)
  router.delete('/items/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .select(
          `
          id,
          status,
          cart:cart_sessions!inner (
            id,
            user_id,
            status
          )
        `
        )
        .eq('id', id)
        .eq('cart.user_id', userId)
        .eq('cart.status', 'ACTIVE')
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (itemError) {
        console.error('❌ Error verifying cart item for delete:', itemError);
        return res.status(500).json({
          success: false,
          message: 'Failed to remove cart item',
        });
      }

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        });
      }

      const { error: deleteError } = await supabase
        .from('cart_items')
        .update({ status: 'REMOVED' })
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Error soft-deleting cart item:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'Failed to remove cart item',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cart item removed',
      });
    } catch (err) {
      console.error('❌ Unexpected error removing cart item:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove cart item',
      });
    }
  });

  console.log('🔧 Mounting routes at: /api/product-catalog/cart');
  app.use('/api/product-catalog/cart', router);
};
