const bcrypt = require('bcrypt');
const db     = require('../config/db');

const ok  = (res, data = {}, status = 200)  => res.status(status).json({ success: true,  ...data });
const err = (res, message, status = 400)    => res.status(status).json({ success: false, message });

// ── GET /api/users ────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { search = '', role = '' } = req.query;
    let sql = `SELECT id, full_name, username, email, role, phone, is_active, created_at
               FROM users WHERE 1=1`;
    const params = [];
    if (search) { sql += ' AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (role)   { sql += ' AND role = ?'; params.push(role); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    return ok(res, { users: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch users.', 500); }
};

// ── POST /api/users ───────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { full_name, username, email, password, role, phone } = req.body;
    if (!full_name || !username || !email || !password || !role)
      return err(res, 'All required fields must be provided.');
    if (!['admin','counter','production'].includes(role))
      return err(res, 'Invalid role.');
    if (password.length < 6)
      return err(res, 'Password must be at least 6 characters.');

    // Check duplicates
    const [dup] = await db.query('SELECT id FROM users WHERE username=? OR email=?', [username, email]);
    if (dup.length > 0) return err(res, 'Username or email already exists.');

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (full_name, username, email, password, role, phone) VALUES (?,?,?,?,?,?)',
      [full_name.trim(), username.trim(), email.trim(), hash, role, phone || null]
    );
    return ok(res, { message: 'Employee created successfully.', id: result.insertId }, 201);
  } catch (e) { console.error(e); return err(res, 'Failed to create employee.', 500); }
};

// ── PUT /api/users/:id ────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, phone, is_active, password } = req.body;

    const [rows] = await db.query('SELECT id, username FROM users WHERE id=?', [id]);
    if (!rows[0]) return err(res, 'Employee not found.', 404);

    // Check email duplicate (exclude self)
    if (email) {
      const [dup] = await db.query('SELECT id FROM users WHERE email=? AND id!=?', [email, id]);
      if (dup.length > 0) return err(res, 'Email already in use by another user.');
    }

    let sets = [], params = [];
    if (full_name !== undefined) { sets.push('full_name=?');  params.push(full_name.trim()); }
    if (email     !== undefined) { sets.push('email=?');      params.push(email.trim()); }
    if (role      !== undefined) {
      if (!['admin','counter','production'].includes(role)) return err(res, 'Invalid role.');
      sets.push('role=?'); params.push(role);
    }
    if (phone      !== undefined) { sets.push('phone=?');     params.push(phone || null); }
    if (is_active  !== undefined) { sets.push('is_active=?'); params.push(is_active ? 1 : 0); }
    if (password) {
      if (password.length < 6) return err(res, 'Password must be at least 6 characters.');
      sets.push('password=?'); params.push(await bcrypt.hash(password, 12));
    }
    if (!sets.length) return err(res, 'No fields to update.');

    params.push(id);
    await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=?`, params);
    return ok(res, { message: 'Employee updated successfully.' });
  } catch (e) { console.error(e); return err(res, 'Failed to update employee.', 500); }
};

// ── PATCH /api/users/:id/toggle ───────────────────────────────
exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, is_active FROM users WHERE id=?', [id]);
    if (!rows[0]) return err(res, 'Employee not found.', 404);
    const newState = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE users SET is_active=? WHERE id=?', [newState, id]);
    return ok(res, { message: `Employee ${newState ? 'activated' : 'deactivated'}.`, is_active: newState });
  } catch (e) { console.error(e); return err(res, 'Failed to update employee status.', 500); }
};
