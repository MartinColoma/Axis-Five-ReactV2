// auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

module.exports = function authRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const JWT_SECRET = process.env.JWT_SECRET;

  // Cookie configuration
  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    path: "/",
  };

  async function generateUserId(role) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", role);

    if (error) {
      console.error("generateUserId error:", error);
      throw error;
    }

    const nextId = (data?.length || 0) + 1;
    const prefix = role === "admin" ? "ADM" : "CST";
    return `${prefix}-${String(nextId).padStart(5, "0")}`;
  }

  function generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  // ==============================
  // POST /register
  // ==============================
  router.post("/register", async (req, res) => {
    try {
      const { first_name, last_name, email, username, password } = req.body;

      if (!first_name || !last_name || !email || !username || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format." });
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${email},username.eq.${username}`)
        .maybeSingle();

      if (checkError) {
        console.error("Register checkError:", checkError);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }

      if (existingUser) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Email or username already exists.",
          });
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
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  });

  // ==============================
  // POST /login (with HTTP-only cookie)
  // ==============================
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
    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid credentials." });
    }

    // ✅ ALLOW MULTIPLE ACTIVE SESSIONS: no existingSession check

    const sessionToken = generateSessionToken();
    const sessionExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await supabase
      .from("user_sessions")
      .insert([{
        user_id: user.id,
        session_token: sessionToken,
        expires_at: sessionExpiry.toISOString(),
        is_active: true,
        last_activity: new Date().toISOString(),
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
        session_token: sessionToken,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
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


  // ==============================
  // POST /logout (current device only)
  // ==============================
  router.post("/logout", async (req, res) => {
    try {
      const token =
        req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];

      console.log("🚪 Logout attempt - Token found:", !!token);

      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Missing token." });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", decoded.id)
        .eq("session_token", decoded.session_token);

      res.clearCookie("auth_token", { path: "/" });

      console.log("✅ Logout successful for user:", decoded.username);

      return res
        .status(200)
        .json({ success: true, message: "Logout successful." });
    } catch (err) {
      console.error("❌ Logout Error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  });

// ==============================
// GET /verify-token (cookie-first)
// ==============================
router.get("/verify-token", async (req, res) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "NO_TOKEN",
      message: "Missing token.",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Real auth failure: clear cookie
    res.clearCookie("auth_token", COOKIE_OPTIONS);
    return res.status(401).json({
      success: false,
      code: "JWT_INVALID",
      message: "Invalid or expired token.",
    });
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", decoded.id)
      .eq("session_token", decoded.session_token)
      .eq("is_active", true)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      // Real auth failure: session is gone/expired
      res.clearCookie("auth_token", COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        code: "SESSION_INVALID",
        message: "Session expired or invalid.",
      });
    }

    // Best-effort: update activity (don't fail auth if this update fails)
    supabase
      .from("user_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("user_id", decoded.id)
      .eq("session_token", decoded.session_token)
      .then(() => {})
      .catch(() => {});

    // Refresh cookie expiration for this device
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.status(200).json({ success: true, user: decoded });
  } catch (err) {
    // IMPORTANT: Supabase/network issues are NOT "logged out"
    // Don’t clear cookie here.
    return res.status(503).json({
      success: false,
      code: "AUTH_BACKEND_UNAVAILABLE",
      message: "Auth backend temporarily unavailable.",
    });
  }
});


  app.use("/api/auth", router);
};
