const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

module.exports = function authRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const JWT_SECRET = process.env.JWT_SECRET;

  // Cookie configuration
  const COOKIE_OPTIONS = {
    httpOnly: true,        // Can't be accessed by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',      // CSRF protection
    maxAge: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    path: '/'             // Available for all routes
  };

  router.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true"); // IMPORTANT for cookies
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  async function generateUserId(role) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", role);

    const nextId = (data?.length || 0) + 1;
    const prefix = role === "admin" ? "ADM" : "CST";
    return `${prefix}-${String(nextId).padStart(5, "0")}`;
  }

  function generateSessionToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  // =========================================
  // 🔹 POST /register
  // =========================================
  router.post("/register", async (req, res) => {
    try {
      const { first_name, last_name, email, username, password } = req.body;

      if (!first_name || !last_name || !email || !username || !password) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${email},username.eq.${username}`)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email or username already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user_id = await generateUserId("customer");

      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            user_id,
            first_name,
            last_name,
            email,
            username,
            password: hashedPassword,
            role: "customer",
            status: "active",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: "Registration successful.",
        user: {
          id: data.id,
          user_id: data.user_id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          username: data.username,
          role: data.role,
          status: data.status,
        },
      });
    } catch (err) {
      console.error("❌ Register Error:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  });

  // =========================================
  // 🔹 POST /login (with HTTP-Only Cookie)
  // =========================================
  router.post("/login", async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ success: false, message: "Email/Username and password are required." });
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .maybeSingle();

      if (error || !user) {
        return res.status(400).json({ success: false, message: "Invalid credentials." });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ success: false, message: "Invalid credentials." });

      // Check for active session
      const { data: existingSession } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (existingSession) {
        return res.status(409).json({ 
          success: false, 
          message: "Account is already logged in on another device. Please logout from other sessions first.",
          code: "ACTIVE_SESSION_EXISTS"
        });
      }

      const sessionToken = generateSessionToken();
      const sessionExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await supabase
        .from("user_sessions")
        .insert([{
          user_id: user.id,
          session_token: sessionToken,
          expires_at: sessionExpiry.toISOString(),
          is_active: true,
          last_activity: new Date().toISOString()
        }]);

      await supabase
        .from("users")
        .update({ last_login: new Date() })
        .eq("id", user.id);

      const token = jwt.sign(
        {
          id: user.id,
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          username: user.username,
          role: user.role,
          session_token: sessionToken
        },
        JWT_SECRET,
        { expiresIn: "2h" }
      );

      // 🔥 SET HTTP-ONLY COOKIE (Primary storage)
      res.cookie('auth_token', token, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: "Login successful.",
        token, // Still send token for localStorage backup
        user: {
          id: user.id,
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("❌ Login Error:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  });

  // =========================================
  // 🔹 POST /logout
  // =========================================
  router.post("/logout", async (req, res) => {
    try {
      // Try to get token from cookie first, then Authorization header
      const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: "Missing token." });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", decoded.id)
        .eq("session_token", decoded.session_token);

      // Clear the cookie
      res.clearCookie('auth_token', { path: '/' });

      return res.status(200).json({ success: true, message: "Logout successful." });
    } catch (err) {
      console.error("❌ Logout Error:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  });

  // =========================================
  // 🔹 GET /verify-token (Check cookie first)
  // =========================================
  router.get("/verify-token", async (req, res) => {
    // Try cookie first (primary), then Authorization header (fallback)
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token." });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const { data: session } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", decoded.id)
        .eq("session_token", decoded.session_token)
        .eq("is_active", true)
        .maybeSingle();

      if (!session) {
        res.clearCookie('auth_token', { path: '/' });
        return res.status(401).json({ 
          success: false, 
          message: "Session expired or invalid.",
          code: "SESSION_INVALID"
        });
      }

      await supabase
        .from("user_sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("user_id", decoded.id)
        .eq("session_token", decoded.session_token);

      // Refresh cookie expiration
      res.cookie('auth_token', token, COOKIE_OPTIONS);

      return res.status(200).json({ success: true, user: decoded });
    } catch (err) {
      res.clearCookie('auth_token', { path: '/' });
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
  });

  app.use("/api/auth", router);
};