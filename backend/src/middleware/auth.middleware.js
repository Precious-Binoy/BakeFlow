/**
 * Middleware: authenticate request from signed cookie.
 */
const authenticate = (req, res, next) => {
  const raw = req.signedCookies?.bakeflow_session;
  if (!raw) return res.status(401).json({ success: false, message: 'Authentication required.' });

  try {
    const payload = JSON.parse(raw);
    if (!payload?.id || !payload?.role) throw new Error('bad payload');
    req.user = payload; // { id, role }
    next();
  } catch {
    res.clearCookie('bakeflow_session');
    return res.status(401).json({ success: false, message: 'Invalid session. Please log in again.' });
  }
};

/**
 * Middleware factory: restrict to given roles.
 * @param {...string} roles  e.g. 'admin', 'counter', 'production'
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

module.exports = { authenticate, authorize };
