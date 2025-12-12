// api/middleware/requireAuth.js
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

// IMPORTANT: use the same cookie options you used when setting the cookie
// so clearing works reliably.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 2 * 60 * 60 * 1000,
  path: "/",
};

function isRetryableNetworkError(err) {
  const msg = String(err?.message || '');
  const causeCode = err?.cause?.code || err?.code;
  return (
    causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
    msg.includes('fetch failed') ||
    msg.includes('Connect Timeout')
  );
}

module.exports = async function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, code: 'NO_TOKEN', message: 'Missing token.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Real auth failure: clear cookie
    res.clearCookie('auth_token', COOKIE_OPTIONS);
    return res.status(401).json({
      success: false,
      code: 'JWT_INVALID',
      message: 'Invalid or expired token.',
    });
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', decoded.id)
      .eq('session_token', decoded.session_token)
      .eq('is_active', true)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      // Real auth failure: session invalid
      res.clearCookie('auth_token', COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        code: 'SESSION_INVALID',
        message: 'Session expired or invalid.',
      });
    }

    // Best-effort last_activity update (do not fail request if it errors)
    supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', decoded.id)
      .eq('session_token', decoded.session_token)
      .then(() => {})
      .catch(() => {});

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
    // Backend dependency failure (Supabase/network) != unauthorized
    if (isRetryableNetworkError(err)) {
      return res.status(503).json({
        success: false,
        code: 'AUTH_BACKEND_UNAVAILABLE',
        message: 'Auth backend temporarily unavailable.',
      });
    }

    // Unknown error: 500 (still do NOT clear cookie unless you're sure it’s invalid)
    return res.status(500).json({
      success: false,
      code: 'AUTH_MIDDLEWARE_ERROR',
      message: 'Internal server error.',
    });
  }
};
