// =========================================
// routes/admin/dashboard.js
// =========================================

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

module.exports = function adminProductRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const JWT_SECRET = process.env.JWT_SECRET;

  // =========================================
  // 🔐 MIDDLEWARE: Verify Admin Token
  // =========================================
  async function verifyAdminToken(req, res, next) {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];

    console.log("🔍 Admin verification - Token present:", !!token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing token",
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user is admin
      if (decoded.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin access required",
        });
      }

      // Verify active session
      const { data: session } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", decoded.id)
        .eq("session_token", decoded.session_token)
        .eq("is_active", true)
        .maybeSingle();

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Session expired or invalid",
        });
      }

      req.user = decoded; // Attach user info to request
      next();
    } catch (err) {
      console.error("❌ Admin token verification failed:", err.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  }

  // =========================================
  // 🔹 ADMIN PRODUCT ROUTES
  // =========================================

  // =========================================
  // ➕ POST /add-product - Create new product + units
  // =========================================

  function makeRandomSuffix(length = 4) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function buildMachineId({ productSku, seq }) {
    const prefix = (productSku || "GEN").split("-")[0].toUpperCase(); // e.g. RBOT
    const year = new Date().getFullYear();
    const seqStr = String(seq).padStart(4, "0"); // 0001, 0002, ...
    const rand = makeRandomSuffix(4); // AB3F

    return `${prefix}-UNIT-${year}-${seqStr}-${rand}`;
  }

  router.post("/add-product", verifyAdminToken, async (req, res) => {
    try {
      const {
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
      } = req.body;

      if (!sku || !name || !slug || !category) {
        return res.status(400).json({
          success: false,
          message: "SKU, name, slug, and category are required",
        });
      }

      const parsedStockQty =
        typeof stock_quantity === "number"
          ? stock_quantity
          : Number.isFinite(Number(stock_quantity))
          ? Number(stock_quantity)
          : 0;

      const validPricingModels = [
        "one_time_hardware",
        "hardware_plus_subscription",
        "subscription_only",
      ];
      if (pricing_model && !validPricingModels.includes(pricing_model)) {
        return res.status(400).json({
          success: false,
          message: "Invalid pricing_model value",
        });
      }

      const validStockStatus = ["in_stock", "low_stock", "out_of_stock", "made_to_order"];
      if (stock_status && !validStockStatus.includes(stock_status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock_status value",
        });
      }

      const { data: existingProduct, error: existingError } = await supabase
        .from("products")
        .select("id, sku")
        .eq("sku", sku)
        .maybeSingle();

      if (existingError) {
        console.error("Error checking existing product:", existingError);
        return res.status(500).json({
          success: false,
          message: "Failed to check existing product",
        });
      }

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "SKU already exists",
        });
      }

      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert([
          {
            sku,
            name,
            slug,
            short_description: short_description || null,
            description: description || null,
            category: category || null,
            brand: brand || null,
            pricing_model: pricing_model || "hardware_plus_subscription",
            base_price: base_price ?? null,
            currency: currency || "PHP",
            is_iot_connected:
              typeof is_iot_connected === "boolean" ? is_iot_connected : true,
            requires_subscription:
              typeof requires_subscription === "boolean" ? requires_subscription : false,
            stock_quantity: parsedStockQty,
            stock_status: stock_status || "in_stock",
            lead_time_days: lead_time_days ?? null,
            min_order_qty:
              typeof min_order_qty === "number"
                ? min_order_qty
                : Number.isFinite(Number(min_order_qty))
                ? Number(min_order_qty)
                : 1,
            main_image_url: main_image_url || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting product:", insertError);
        return res.status(500).json({
          success: false,
          message: "Failed to create product",
        });
      }

      const unitsToCreate = Math.max(parsedStockQty, 0);
      let createdUnits = [];

      if (unitsToCreate > 0) {
        const unitRows = [];
        for (let i = 1; i <= unitsToCreate; i++) {
          const machine_id = buildMachineId({
            productSku: newProduct.sku,
            seq: i,
          });

          unitRows.push({
            product_id: newProduct.id,
            machine_id,
            status: "IN_STOCK",
          });
        }

        const { data: unitData, error: unitError } = await supabase
          .from("product_units")
          .insert(unitRows)
          .select();

        if (unitError) {
          console.error("Error creating product units:", unitError);
        } else {
          createdUnits = unitData || [];
        }
      }

      console.log(
        `✅ Product created: ${newProduct.sku} with ${createdUnits.length} unit(s) by admin: ${req.user.username}`
      );

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: newProduct,
        units_created: createdUnits.length,
      });
    } catch (err) {
      console.error("Error creating product:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to create product",
      });
    }
  });

  // =========================================
  // 📦 GET /products - List products for overview
  // =========================================
  router.get("/products", verifyAdminToken, async (req, res) => {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select(
          "id, sku, name, category, pricing_model, stock_quantity, stock_status, requires_subscription, is_iot_connected, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        products,
        count: products.length,
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  });

  // =========================================
  // 📦 GET /products-summary - Basic product stats
  // =========================================
  router.get("/products-summary", verifyAdminToken, async (req, res) => {
    try {
      const { data: totalProductsData, error: totalErr } = await supabase
        .from("products")
        .select("id");

      if (totalErr) throw totalErr;

      const { data: activeProductsData, error: activeErr } = await supabase
        .from("products")
        .select("id")
        .eq("is_active", true);

      if (activeErr) throw activeErr;

      const { data: iotProductsData, error: iotErr } = await supabase
        .from("products")
        .select("id")
        .eq("is_iot_connected", true);

      if (iotErr) throw iotErr;

      const { data: subRequiredData, error: subErr } = await supabase
        .from("products")
        .select("id")
        .eq("requires_subscription", true);

      if (subErr) throw subErr;

      return res.status(200).json({
        success: true,
        summary: {
          total_products: totalProductsData?.length ?? 0,
          active_products: activeProductsData?.length ?? 0,
          iot_products: iotProductsData?.length ?? 0,
          subscription_required_products: subRequiredData?.length ?? 0,
        },
      });
    } catch (err) {
      console.error("Error fetching products summary:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch products summary",
      });
    }
  });

  // =========================================
  // 🔹 Mount all routes under /api/admin/dashboard
  // =========================================
  console.log("🔧 Mounting admin dashboard routes at: /api/admin/dashboard");
  app.use("/api/admin/", router);
};
