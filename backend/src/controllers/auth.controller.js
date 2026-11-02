const bcrypt = require('bcrypt');
const db     = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────
const ok  = (res, data = {}, status = 200)  => res.status(status).json({ success: true,  ...data });
const err = (res, message, status = 400)    => res.status(status).json({ success: false, message });

// ── POST /api/auth/login ──────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return err(res, 'Username/email and password are required.');

    const [rows] = await db.query(
      'SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1',
      [identifier, identifier]
    );
    const user = rows[0];
    if (!user)           return err(res, 'Invalid credentials.', 401);
    if (!user.is_active) return err(res, 'Your account is inactive. Contact your administrator.', 403);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return err(res, 'Invalid credentials.', 401);

    // Store minimal session in signed cookie
    const payload = { id: user.id, role: user.role };
    res.cookie('bakeflow_session', JSON.stringify(payload), {
      signed:   true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge:   8 * 60 * 60 * 1000, // 8 hours
    });

    return ok(res, {
      user: {
        id:        user.id,
        full_name: user.full_name,
        username:  user.username,
        email:     user.email,
        role:      user.role,
      },
    });
  } catch (e) {
    console.error('login error:', e);
    return err(res, 'Login failed. Please try again.', 500);
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────
exports.logout = (_req, res) => {
  res.clearCookie('bakeflow_session');
  return ok(res, { message: 'Logged out successfully.' });
};

// ── GET /api/auth/me ──────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, username, email, role, phone, is_active, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows[0]) return err(res, 'User not found.', 404);
    return ok(res, { user: rows[0] });
  } catch (e) {
    console.error('me error:', e);
    return err(res, 'Failed to fetch user.', 500);
  }
};

// ── PATCH /api/auth/profile ────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;
    if (!full_name || !full_name.trim()) {
      return err(res, 'Full name is required.');
    }

    if (email && email.trim()) {
      const [existing] = await db.query(
        'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
        [email.trim(), req.user.id]
      );
      if (existing.length > 0) {
        return err(res, 'This email address is already in use.', 409);
      }
    }

    await db.query(
      'UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?',
      [full_name.trim(), email?.trim() || null, phone?.trim() || null, req.user.id]
    );

    const [rows] = await db.query(
      'SELECT id, full_name, username, email, role, phone, is_active, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    return ok(res, {
      message: 'Profile updated successfully.',
      user: rows[0]
    });
  } catch (e) {
    console.error('updateProfile error:', e);
    return err(res, 'Failed to update profile.', 500);
  }
};

// ── PATCH /api/auth/change-password ───────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return err(res, 'Both current and new passwords are required.');
    }
    if (newPassword.length < 6) {
      return err(res, 'New password must be at least 6 characters long.');
    }

    const [rows] = await db.query('SELECT password FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!rows[0]) return err(res, 'User not found.', 404);

    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return err(res, 'Incorrect current password.', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    return ok(res, { message: 'Password changed successfully.' });
  } catch (e) {
    console.error('changePassword error:', e);
    return err(res, 'Failed to change password.', 500);
  }
};
