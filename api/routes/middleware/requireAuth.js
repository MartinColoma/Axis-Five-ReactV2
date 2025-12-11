// api/middleware/requireAuth.js
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware: verify auth_token cookie / Bearer token
 * and attach req.user = decoded user payload.
 */
module.exports = async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Missing token.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Make sure session is still active (same logic as /verify-token)
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', decoded.id)
      .eq('session_token', decoded.session_token)
      .eq('is_active', true)
      .maybeSingle();

    if (sessionError) {
      console.error('Session fetch error in requireAuth:', sessionError);
    }

    if (!session) {
      res.clearCookie('auth_token', { path: '/' });
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid.',
      });
    }

    // optional: update last_activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', decoded.id)
      .eq('session_token', decoded.session_token);

    // Attach to request for downstream routes
    req.user = {
      id: decoded.id,
      user_id: decoded.user_id,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      session_token: decoded.session_token,
    };

    return next();
  } catch (err) {
    console.error('requireAuth error:', err.message);
    res.clearCookie('auth_token', { path: '/' });
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token.' });
  }
};
