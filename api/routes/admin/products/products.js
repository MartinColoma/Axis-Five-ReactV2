// =========================================
// routes/admin/products/products.js
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

      if (decoded.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin access required",
        });
      }

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

      req.user = decoded;
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
  // Helpers for unit IDs
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
    const prefix = (productSku || "GEN").split("-")[0].toUpperCase();
    const year = new Date().getFullYear();
    const seqStr = String(seq).padStart(4, "0");
    const rand = makeRandomSuffix(4);
    return `${prefix}-UNIT-${year}-${seqStr}-${rand}`;
  }

  // =========================================
  // ➕ POST /add-product - Create new product + units
  // =========================================
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
        gallery_image_urls,
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

      const validStockStatus = [
        "in_stock",
        "low_stock",
        "out_of_stock",
        "made_to_order",
      ];
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
              typeof requires_subscription === "boolean"
                ? requires_subscription
                : false,
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
            gallery_image_urls: Array.isArray(gallery_image_urls)
              ? gallery_image_urls
              : null,
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
          `
          id,
          sku,
          name,
          slug,
          category,
          pricing_model,
          stock_quantity,
          stock_status,
          requires_subscription,
          is_iot_connected,
          is_active,
          main_image_url,
          created_at
          `
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

  // PATCH /api/admin/products/:id/unlist - soft delete product
  router.patch("/products/:id/unlist", verifyAdminToken, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product id",
        });
      }

      const { data: updated, error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", id)
        .select("id, sku, name, is_active")
        .single();

      if (error) {
        console.error("Error unlisting product:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to update product",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product unlisted successfully",
        product: updated,
      });
    } catch (err) {
      console.error("Error in unlist product route:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update product",
      });
    }
  });

  // PATCH /api/admin/products/:id/active - toggle is_active
  router.patch("/products/:id/active", verifyAdminToken, async (req, res) => {
    const id = Number(req.params.id);
    const { is_active } = req.body || {};
    if (!id || Number.isNaN(id) || typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid product id or is_active flag",
      });
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active })
        .eq("id", id)
        .select("id, sku, name, is_active")
        .single();

      if (error) {
        console.error("Error updating product active flag:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to update product status",
        });
      }

      return res.status(200).json({
        success: true,
        product: data,
      });
    } catch (err) {
      console.error("Error in product active route:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update product status",
      });
    }
  });

  // =========================================
  // BULK activate/unlist endpoints
  // =========================================

  // PATCH /api/admin/products/bulk/activate
  router.patch("/products/bulk/activate", verifyAdminToken, async (req, res) => {
    console.log("🔁 BULK ACTIVATE body:", req.body);

    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids array is required",
      });
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active: true })
        .in("id", ids)
        .select("id, sku, name, is_active");

      if (error) {
        console.error("Error bulk activating products:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to bulk activate products",
        });
      }

      return res.status(200).json({
        success: true,
        updated: data,
      });
    } catch (err) {
      console.error("Error in bulk activate route:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to bulk activate products",
      });
    }
  });

  // PATCH /api/admin/products/bulk/unlist
  router.patch("/products/bulk/unlist", verifyAdminToken, async (req, res) => {
    console.log("🔁 BULK UNLIST body:", req.body);

    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids array is required",
      });
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active: false })
        .in("id", ids)
        .select("id, sku, name, is_active");

      if (error) {
        console.error("Error bulk unlisting products:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to bulk unlist products",
        });
      }

      return res.status(200).json({
        success: true,
        updated: data,
      });
    } catch (err) {
      console.error("Error in bulk unlist route:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to bulk unlist products",
      });
    }
  });
// GET /api/admin/products/:id - fetch single product
router.get("/products/:id", verifyAdminToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product id",
    });
  }

  try {
    const { data, error } = await supabase
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
        is_active,
        created_at
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch product",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product: data,
    });
  } catch (err) {
    console.error("Error in get product route:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// helper to build machine_id (reuse your existing implementation)
function makeRandomSuffix(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function buildMachineId({ productSku, seq }) {
  const prefix = (productSku || "GEN").split("-")[0].toUpperCase();
  const year = new Date().getFullYear();
  const seqStr = String(seq).padStart(4, "0");
  const rand = makeRandomSuffix(4);
  return `${prefix}-UNIT-${year}-${seqStr}-${rand}`;
}

// PATCH /api/admin/products/:id - update product + sync units with stock_quantity
router.patch("/products/:id", verifyAdminToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product id",
    });
  }

  try {
    // 1) Load current product and unit count
    const { data: currentProduct, error: productErr } = await supabase
      .from("products")
      .select("id, sku, stock_quantity")
      .eq("id", id)
      .single();

    if (productErr) {
      console.error("Error loading current product:", productErr);
      return res.status(500).json({
        success: false,
        message: "Failed to load product",
      });
    }

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const oldQty = currentProduct.stock_quantity ?? 0;

    // 2) Build update payload from request body
    const {
      name,
      sku,
      category,
      stock_quantity,
      stock_status,
      is_active,
      pricing_model,
      base_price,
      currency,
      requires_subscription,
      is_iot_connected,
      main_image_url,
      short_description,
      description,
      brand,
      lead_time_days,
      min_order_qty,
    } = req.body || {};

    const updatePayload = {};

    if (typeof name === "string") updatePayload.name = name;
    if (typeof sku === "string") updatePayload.sku = sku;
    if (typeof category === "string" || category === null) updatePayload.category = category;
    if (typeof stock_quantity === "number") updatePayload.stock_quantity = stock_quantity;
    if (typeof stock_status === "string") updatePayload.stock_status = stock_status;
    if (typeof is_active === "boolean") updatePayload.is_active = is_active;
    if (typeof pricing_model === "string") updatePayload.pricing_model = pricing_model;
    if (typeof base_price === "number") updatePayload.base_price = base_price;
    if (typeof currency === "string") updatePayload.currency = currency;
    if (typeof requires_subscription === "boolean")
      updatePayload.requires_subscription = requires_subscription;
    if (typeof is_iot_connected === "boolean")
      updatePayload.is_iot_connected = is_iot_connected;
    if (typeof main_image_url === "string" || main_image_url === null)
      updatePayload.main_image_url = main_image_url;
    if (typeof short_description === "string" || short_description === null)
      updatePayload.short_description = short_description;
    if (typeof description === "string" || description === null)
      updatePayload.description = description;
    if (typeof brand === "string" || brand === null) updatePayload.brand = brand;
    if (typeof lead_time_days === "number" || lead_time_days === null)
      updatePayload.lead_time_days = lead_time_days;
    if (typeof min_order_qty === "number") updatePayload.min_order_qty = min_order_qty;

    // Always bump updated_at
    updatePayload.updated_at = new Date().toISOString();

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // 3) If stock_quantity is changing, compute delta and sync product_units
    let newQty = oldQty;
    if (typeof stock_quantity === "number" && Number.isFinite(stock_quantity)) {
      newQty = Math.max(0, stock_quantity);
    }

    // Start with product update
    const { data: updatedProduct, error: updateErr } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select(
        `
        id,
        sku,
        name,
        slug,
        short_description,
        category,
        pricing_model,
        stock_quantity,
        stock_status,
        requires_subscription,
        is_iot_connected,
        main_image_url,
        is_active,
        created_at
        `
      )
      .single();

    if (updateErr) {
      console.error("Error updating product:", updateErr);
      return res.status(500).json({
        success: false,
        message: "Failed to update product",
      });
    }

    // 4) Sync units if quantity changed
    const qtyDelta = newQty - oldQty;

    if (qtyDelta > 0) {
      // need to add units
      const unitsToAdd = qtyDelta;
      const unitRows = [];

      // find current max sequence by counting existing units for this product
      const { data: existingUnits, error: unitsErr } = await supabase
        .from("product_units")
        .select("id")
        .eq("product_id", id);

      if (unitsErr) {
        console.error("Error loading existing units:", unitsErr);
      }

      const existingCount = existingUnits?.length ?? 0;

      for (let i = 1; i <= unitsToAdd; i++) {
        const seq = existingCount + i;
        const machine_id = buildMachineId({
          productSku: updatedProduct.sku,
          seq,
        });

        unitRows.push({
          product_id: updatedProduct.id,
          machine_id,
          status: "IN_STOCK",
        });
      }

      if (unitRows.length > 0) {
        const { error: insertUnitsErr } = await supabase
          .from("product_units")
          .insert(unitRows);

        if (insertUnitsErr) {
          console.error("Error inserting new product units:", insertUnitsErr);
          // do not fail the whole request, but log it
        }
      }
    } else if (qtyDelta < 0) {
      // need to remove units
      const unitsToRemove = Math.min(-qtyDelta, oldQty);

      // Remove most recently created IN_STOCK units first
      const { data: removableUnits, error: removableErr } = await supabase
        .from("product_units")
        .select("id")
        .eq("product_id", id)
        .eq("status", "IN_STOCK")
        .order("created_at", { ascending: false })
        .limit(unitsToRemove);

      if (removableErr) {
        console.error("Error loading removable units:", removableErr);
      } else if (removableUnits && removableUnits.length > 0) {
        const idsToDelete = removableUnits.map((u) => u.id);
        const { error: deleteErr } = await supabase
          .from("product_units")
          .delete()
          .in("id", idsToDelete);

        if (deleteErr) {
          console.error("Error deleting product units:", deleteErr);
        }
      }
    }

    return res.status(200).json({
      success: true,
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error in update product route:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
});


  // =========================================
  // 🔹 Mount all routes under /api/admin/
  // =========================================
  console.log("🔧 Mounting admin dashboard routes at: /api/admin/");
  app.use("/api/admin/", router);
};
