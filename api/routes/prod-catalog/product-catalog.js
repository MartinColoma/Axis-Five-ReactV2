// =========================================
// routes/prod-catalog/product-catalog.js
// =========================================

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

module.exports = function ProductCatalogRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // NOTE: Public catalog – no admin token required.
  // If you want to rate-limit or add basic protection later, add middleware here.

  // =========================================
  // 📦 GET /products - Public product list for catalog cards
  // =========================================
  router.get("/products", async (req, res) => {
    try {
      const { category } = req.query;

      let query = supabase
        .from("products")
        .select(
          `
          id,
          sku,
          name,
          slug,
          short_description,
          description,
          category,
          brand,
          pricing_model,
          base_price,
          currency,
          is_iot_connected,
          requires_subscription,
          stock_quantity,
          stock_status,
          main_image_url,
          gallery_image_urls,
          is_active,
          created_at
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (category) {
        // allow ?category=iot etc.
        query = query.eq("category", category);
      }

      const { data: products, error } = await query;

      if (error) {
        console.error("❌ Error fetching products:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch products",
        });
      }

      return res.status(200).json({
        success: true,
        products,
        count: products?.length ?? 0,
      });
    } catch (err) {
      console.error("❌ Unexpected error fetching products:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  });

  // =========================================
  // 📦 GET /products/:slug - Single product for PDP
  // =========================================
  router.get("/products/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      const { data: product, error } = await supabase
        .from("products")
        .select(
          `
          id,
          sku,
          name,
          slug,
          short_description,
          description,
          category,
          brand,
          pricing_model,
          base_price,
          currency,
          is_iot_connected,
          requires_subscription,
          stock_quantity,
          stock_status,
          lead_time_days,
          min_order_qty,
          main_image_url,
          gallery_image_urls,
          is_active,
          created_at,
          updated_at
        `
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching product by slug:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch product",
        });
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        product,
      });
    } catch (err) {
      console.error("❌ Unexpected error fetching product:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch product",
      });
    }
  });

  // =========================================
  // 🔹 Mount all routes under /api/product-catalog
  // =========================================
  console.log("🔧 Mounting routes at: /api/product-catalog");
  app.use("/api/product-catalog", router);
};
