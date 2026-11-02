const db = require('../config/db');

const ok  = (res, data = {}, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, message, status = 400)   => res.status(status).json({ success: false, message });

// ── GET /api/production/orders ────────────────────────────────
exports.listOrders = async (req, res) => {
  try {
    const { status = '' } = req.query;
    let sql = `
      SELECT o.*, u.full_name AS created_by_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.created_by
      WHERE o.status NOT IN ('completed','cancelled')`;
    const params = [];
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at ASC';
    const [orders] = await db.query(sql, params);

    // Attach items for each order
    for (const order of orders) {
      const [items] = await db.query(
        'SELECT oi.*, p.image FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?',
        [order.id]
      );
      order.items = items;
    }
    return ok(res, { orders });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch production orders.', 500); }
};

// ── PATCH /api/production/orders/:id/start ────────────────────
exports.startPreparing = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const [rows] = await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE', [id]);
    const order = rows[0];
    if (!order)                  return err(res, 'Order not found.', 404);
    if (order.status !== 'new')  return err(res, 'Only new orders can be started.');

    await conn.query('UPDATE orders SET status=? WHERE id=?', ['preparing', id]);
    await conn.query(
      `INSERT INTO production_logs (order_id, previous_status, new_status, updated_by, notes)
       VALUES (?,?,?,?,?)`,
      [id, 'new', 'preparing', req.user.id, req.body.notes || 'Preparation started']
    );
    await conn.commit();
    return ok(res, { message: 'Order status changed to Preparing.' });
  } catch (e) {
    await conn.rollback();
    console.error(e); return err(res, 'Failed to update order.', 500);
  } finally { conn.release(); }
};

// ── PATCH /api/production/orders/:id/ready ────────────────────
exports.markReady = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const [rows] = await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE', [id]);
    const order = rows[0];
    if (!order)                       return err(res, 'Order not found.', 404);
    if (order.status !== 'preparing') return err(res, 'Only preparing orders can be marked ready.');

    await conn.query('UPDATE orders SET status=? WHERE id=?', ['ready', id]);
    await conn.query(
      `INSERT INTO production_logs (order_id, previous_status, new_status, updated_by, notes)
       VALUES (?,?,?,?,?)`,
      [id, 'preparing', 'ready', req.user.id, req.body.notes || 'Order ready for pickup']
    );
    await conn.commit();
    return ok(res, { message: 'Order marked as Ready.' });
  } catch (e) {
    await conn.rollback();
    console.error(e); return err(res, 'Failed to update order.', 500);
  } finally { conn.release(); }
};

// ── GET /api/production/history ───────────────────────────────
exports.history = async (req, res) => {
  try {
    const { limit = 50, status = '', today = '' } = req.query;
    let sql = `
      SELECT o.*, u.full_name AS created_by_name
      FROM orders o LEFT JOIN users u ON u.id=o.created_by
      WHERE o.status IN ('completed','cancelled')`;
    const params = [];
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    if (today === 'true') {
      sql += ' AND (DATE(o.updated_at) = CURDATE() OR DATE(o.created_at) = CURDATE())';
    }
    sql += ' ORDER BY o.updated_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await db.query(sql, params);
    for (const order of rows) {
      const [items] = await db.query(
        'SELECT oi.*, p.image FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?',
        [order.id]
      );
      order.items = items;
    }
    return ok(res, { orders: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch history.', 500); }
};
