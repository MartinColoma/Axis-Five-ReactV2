// routes/user.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const requireAuth = require('../middleware/requireAuth');

module.exports = function UserRoutes(app) {
  const router = express.Router();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // GET /api/user/profile -> returns the logged-in user's profile
  router.get('/profile', requireAuth, async (req, res) => {
    try {
      // Adjust this to your requireAuth implementation
      const userId = req.user?.id || req.userId || req.auth?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
      }

      // IMPORTANT: do not select password
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          user_id,
          first_name,
          last_name,
          email,
          username,
          role,
          status,
          created_at,
          updated_at,
          last_login
        `
        )
        .eq('id', userId)
        .single(); // one row expected [web:168]

      if (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ success: false, message: 'Failed to load user profile.' });
      }

      return res.json({ success: true, user: data });
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      return res.status(500).json({
        success: false,
        message: 'Unexpected error while loading profile.',
      });
    }
  });

  console.log('🔧 Mounting routes at: /api/user');
  app.use('/api/user', router);
};
