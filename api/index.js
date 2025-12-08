// =========================================
// 🧠 Axis-Five API — Main Server Entry
// =========================================

require("dotenv").config(); // ✅ Load environment variables first

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// =========================================
// 🔹 Middleware (ORDER MATTERS!)
// =========================================

// 🔥 1. Cookie parser FIRST
app.use(cookieParser());

// 🔥 2. CORS configuration with proper settings
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174", // Add backup local port
      "https://axis-five-solution.onrender.com",
      process.env.FRONTEND_URL, // Add this env variable in Render
    ].filter(Boolean), // Remove undefined values
    credentials: true, // ✅ Critical for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// 🔥 3. JSON parser
app.use(express.json());

// 🔥 4. Request Logger (MOVED BEFORE ROUTES!)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  console.log(`🍪 Cookies:`, req.cookies);
  console.log(`🔑 Auth Header:`, req.headers.authorization ? 'Present' : 'None');
  next();
});

// =========================================
// 🔹 Validate Environment Variables
// =========================================
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables. Check your .env file.");
  process.exit(1);
}

// =========================================
// 🔹 Import Route Modules
// =========================================
const contact_us = require("./routes/landing/contact-us");
const auth = require("./routes/auth/auth");
const prod_catalog = require('./routes/prod-catalog/product-catalog')
const adminUser = require('./routes/admin/users/users')
const adminProduct = require('./routes/admin/products/products')

// =========================================
// 🔹 Serve Static Files (Frontend Build)
// =========================================
app.use(express.static(path.join(__dirname, "..", "dist")));

// =========================================
// 🔹 Health Check Endpoint
// =========================================
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    message: "✅ API is running",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// =========================================
// 🔹 Mount Routes
// =========================================
console.log("\n🔧 Mounting routes...");
contact_us(app);
console.log("✅ Contact Us route mounted");
// 🔹 Login/Register Routes
auth(app);
console.log("✅ Auth route mounted");
// 🔹 Product-Catalog Routes
prod_catalog(app);
console.log("✅ Product-Catalog route mounted");

// 🔹 Admin Routes
adminUser(app);
console.log("✅ Admin User route mounted");
adminProduct(app);
console.log("✅ Admin Product route mounted");
// 🔹 User Routes
// Insert here if needed
// =========================================
// 🔹 ROUTE DEBUGGER - Print All Registered Routes
// =========================================
const printRoutes = () => {
  console.log("\n📋 ===== REGISTERED ROUTES =====");
  
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      routes.push(`${methods.padEnd(7)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Routes registered on a router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
          const path = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace('^', '')
            .replace('$', '');
          routes.push(`${methods.padEnd(7)} ${path}${handler.route.path}`);
        }
      });
    }
  });
  
  routes.sort().forEach(route => console.log(`  ${route}`));
  console.log("================================\n");
};

// Call the debug function
printRoutes();

// =========================================
// 🔹 SPA Catch-All (EXCLUDES API ROUTES)
// =========================================
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

// =========================================
// 🔹 404 Handler (For Unmatched API Routes)
// =========================================
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "❌ Route not found" });
});

// =========================================
// 🔹 Start Server
// =========================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Axis-Five API running on http://localhost:${PORT}`);
  console.log(`📍 Server started at: ${new Date().toLocaleString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🍪 Cookie parser: Enabled`);
  console.log(`🔐 CORS credentials: Enabled`);
});