// =========================================
// routes/admin/dashboard.js
// =========================================

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

module.exports = function adminDashboardRoutes(app) {
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
    
    console.log('🔍 Admin verification - Token present:', !!token);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: Missing token" 
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user is admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: "Forbidden: Admin access required" 
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
          message: "Session expired or invalid" 
        });
      }

      req.user = decoded; // Attach user info to request
      next();
    } catch (err) {
      console.error('❌ Admin token verification failed:', err.message);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }
  }

  // =========================================
  // 🔹 ADMIN DASHBOARD ROUTES
  // Note: /verify-token is handled by AuthContext
  // =========================================

  // =========================================
  // 📋 GET /users - Get all active users
  // =========================================
  router.get("/users", verifyAdminToken, async (req, res) => {
    console.log('📋 GET /users called by:', req.user?.username);
    
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("user_id, first_name, last_name, email, username, role, status, created_at, last_login")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Format data for frontend
      const formattedUsers = users.map(user => ({
        user_id: user.user_id,
        full_name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login
      }));

      console.log(`✅ Retrieved ${formattedUsers.length} users`);

      return res.status(200).json({ 
        success: true, 
        users: formattedUsers,
        count: formattedUsers.length
      });
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch users" 
      });
    }
  });

  // =========================================
  // 👤 GET /users/:user_id - Get single user
  // =========================================
  router.get("/users/:user_id", verifyAdminToken, async (req, res) => {
    try {
      const { user_id } = req.params;

      const { data: user, error } = await supabase
        .from("users")
        .select("user_id, first_name, last_name, email, username, role, status, created_at, last_login")
        .eq("user_id", user_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        throw error;
      }

      return res.status(200).json({ 
        success: true, 
        user: {
          ...user,
          full_name: `${user.first_name} ${user.last_name}`
        }
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch user" 
      });
    }
  });

  // =========================================
  // ➕ POST /users - Create new user
  // =========================================
  router.post("/users", verifyAdminToken, async (req, res) => {
    try {
      const { first_name, last_name, email, username, password, role } = req.body;

      // Validation
      if (!first_name || !last_name || !email || !username || !password || !role) {
        return res.status(400).json({ 
          success: false, 
          message: "All fields are required" 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 6 characters" 
        });
      }

      if (!['admin', 'customer'].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid role. Must be 'admin' or 'customer'" 
        });
      }

      // Check if email or username already exists
      const { data: existingUsers } = await supabase
        .from("users")
        .select("email, username")
        .or(`email.eq.${email},username.eq.${username}`);

      if (existingUsers && existingUsers.length > 0) {
        const existingEmail = existingUsers.find(u => u.email === email);
        const existingUsername = existingUsers.find(u => u.username === username);
        
        if (existingEmail) {
          return res.status(409).json({ 
            success: false, 
            message: "Email already exists" 
          });
        }
        if (existingUsername) {
          return res.status(409).json({ 
            success: false, 
            message: "Username already exists" 
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          first_name,
          last_name,
          email,
          username,
          password: hashedPassword,
          role,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ User created: ${newUser.user_id} by admin: ${req.user.username}`);

      return res.status(201).json({ 
        success: true, 
        message: "User created successfully",
        user: {
          user_id: newUser.user_id,
          full_name: `${newUser.first_name} ${newUser.last_name}`,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          status: newUser.status,
          created_at: newUser.created_at
        }
      });
    } catch (err) {
      console.error('Error creating user:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create user" 
      });
    }
  });

  // =========================================
  // ✏️ PUT /users/:user_id - Update user
  // =========================================
  router.put("/users/:user_id", verifyAdminToken, async (req, res) => {
    try {
      const { user_id } = req.params;
      const { first_name, last_name, email, username, role, status, password } = req.body;

      if (!first_name || !last_name || !email || !username || !role || !status) {
        return res.status(400).json({ 
          success: false, 
          message: "All fields except password are required" 
        });
      }

      if (!['admin', 'customer'].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid role" 
        });
      }

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status" 
        });
      }

      if (password && password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 6 characters" 
        });
      }

      const { data: existingUser } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", user_id)
        .single();

      if (!existingUser) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const { data: duplicates } = await supabase
        .from("users")
        .select("user_id, email, username")
        .or(`email.eq.${email},username.eq.${username}`)
        .neq("user_id", user_id);

      if (duplicates && duplicates.length > 0) {
        const duplicateEmail = duplicates.find(u => u.email === email);
        const duplicateUsername = duplicates.find(u => u.username === username);
        
        if (duplicateEmail) {
          return res.status(409).json({ 
            success: false, 
            message: "Email already in use by another user" 
          });
        }
        if (duplicateUsername) {
          return res.status(409).json({ 
            success: false, 
            message: "Username already in use by another user" 
          });
        }
      }

      const updateData = {
        first_name,
        last_name,
        email,
        username,
        role,
        status,
        updated_at: new Date().toISOString()
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const { data: updatedUser, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ User updated: ${user_id} by admin: ${req.user.username}`);

      return res.status(200).json({ 
        success: true, 
        message: "User updated successfully",
        user: {
          user_id: updatedUser.user_id,
          full_name: `${updatedUser.first_name} ${updatedUser.last_name}`,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          status: updatedUser.status,
          created_at: updatedUser.created_at
        }
      });
    } catch (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update user" 
      });
    }
  });

  // =========================================
  // 🗑️ DELETE /users/:user_id - Archive user
  // =========================================
  router.delete("/users/:user_id", verifyAdminToken, async (req, res) => {
    try {
      const { user_id } = req.params;
      const { reason } = req.body;

      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user_id)
        .single();

      if (!existingUser) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      if (existingUser.user_id === req.user.user_id) {
        return res.status(403).json({ 
          success: false, 
          message: "You cannot delete your own account" 
        });
      }

      const { data, error } = await supabase.rpc('soft_delete_user', {
        p_user_id: user_id,
        p_archived_by: req.user.username,
        p_reason: reason || 'Deleted by administrator'
      });

      if (error) throw error;

      console.log(`✅ User archived: ${user_id} by admin: ${req.user.username}`);

      return res.status(200).json({ 
        success: true, 
        message: "User archived successfully",
        archived_user_id: user_id
      });
    } catch (err) {
      console.error('Error archiving user:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to archive user" 
      });
    }
  });

  // =========================================
  // 📦 GET /users-archived - Get archived users
  // =========================================
  router.get("/users-archived", verifyAdminToken, async (req, res) => {
    try {
      const { data: archivedUsers, error } = await supabase
        .from("users_archived")
        .select("*")
        .order("archived_at", { ascending: false });

      if (error) throw error;

      const formattedUsers = archivedUsers.map(user => ({
        id: user.id,
        user_id: user.user_id,
        full_name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        archived_at: user.archived_at,
        archived_by: user.archived_by,
        archive_reason: user.archive_reason
      }));

      return res.status(200).json({ 
        success: true, 
        users: formattedUsers,
        count: formattedUsers.length
      });
    } catch (err) {
      console.error('Error fetching archived users:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch archived users" 
      });
    }
  });

  // =========================================
  // ♻️ POST /users/restore/:user_id - Restore user
  // =========================================
  router.post("/users/restore/:user_id", verifyAdminToken, async (req, res) => {
    try {
      const { user_id } = req.params;

      const { data, error } = await supabase.rpc('restore_user', {
        p_user_id: user_id
      });

      if (error) {
        if (error.message.includes('already active')) {
          return res.status(409).json({ 
            success: false, 
            message: "User is already active" 
          });
        }
        if (error.message.includes('No archived record')) {
          return res.status(404).json({ 
            success: false, 
            message: "No archived record found for this user" 
          });
        }
        throw error;
      }

      console.log(`✅ User restored: ${user_id} by admin: ${req.user.username}`);

      return res.status(200).json({ 
        success: true, 
        message: "User restored successfully",
        restored_user_id: user_id
      });
    } catch (err) {
      console.error('Error restoring user:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to restore user" 
      });
    }
  });

  // =========================================
  // 🔹 Mount all routes under /api/admin/dashboard
  // =========================================
  console.log('🔧 Mounting admin dashboard routes at: /api/admin/dashboard');
  app.use("/api/admin/dashboard", router);
};