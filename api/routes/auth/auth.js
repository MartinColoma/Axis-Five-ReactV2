const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

module.exports = function authRoutes(app) {
  const router = express.Router();

  // =========================================
  // 🔹 Initialize Supabase (Service Role)
  // =========================================
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const JWT_SECRET = process.env.JWT_SECRET;

  // =========================================
  // 🔹 CORS Headers for this router
  // =========================================
  router.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // =========================================
  // 🔹 Helper: Generate user_id
  // =========================================
  async function generateUserId(role) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", role);

    const nextId = (data?.length || 0) + 1;
    const prefix = role === "admin" ? "ADM" : "CST";
    return `${prefix}-${String(nextId).padStart(5, "0")}`;
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

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }

      // Check if email or username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${email},username.eq.${username}`)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email or username already exists." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate user_id
      const user_id = await generateUserId("customer");

      // Insert new user
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
  // 🔹 POST /login
  // =========================================
  router.post("/login", async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ success: false, message: "Email/Username and password are required." });
      }

      // Find user by email or username
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .maybeSingle();

      if (error || !user) {
        return res.status(400).json({ success: false, message: "Invalid credentials." });
      }

      // Compare password
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ success: false, message: "Invalid credentials." });

      // Update last_login
      await supabase
        .from("users")
        .update({ last_login: new Date() })
        .eq("id", user.id);

      // Issue JWT
      const token = jwt.sign(
        {
          id: user.id,
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "2h" }
      );

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

  // =========================================
  // 🔹 GET /verify-token
  // =========================================
  router.get("/verify-token", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: "Missing token." });

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.status(200).json({ success: true, user: decoded });
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
  });

  // =========================================
  // 🔹 Mount router
  // =========================================
  app.use("/api/auth", router);
};
