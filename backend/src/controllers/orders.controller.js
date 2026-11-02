const db = require('../config/db');

const ok  = (res, data = {}, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, message, status = 400)   => res.status(status).json({ success: false, message });

// ── Generate unique order number ──────────────────────────────
const generateOrderNumber = () => {
  const now  = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BF-${date}-${rand}`;
};

// ── GET /api/orders ───────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { status = '', search = '', from_date = '', to_date = '', created_by = '' } = req.query;
    let sql = `
      SELECT o.*, u.full_name AS created_by_name,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
      FROM orders o
      LEFT JOIN users u ON u.id = o.created_by
      WHERE 1=1`;
    const params = [];
    if (status)    { sql += ' AND o.status = ?';           params.push(status); }
    if (search)    { sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (from_date) { sql += ' AND (DATE(o.created_at) >= ? OR (o.status = "completed" AND DATE(o.updated_at) >= ?))'; params.push(from_date, from_date); }
    if (to_date)   { sql += ' AND (DATE(o.created_at) <= ? OR (o.status = "completed" AND DATE(o.updated_at) <= ?))'; params.push(to_date, to_date); }
    if (created_by){ sql += ' AND o.created_by = ?';       params.push(created_by); }
    sql += ' ORDER BY o.created_at DESC';

    const [rows] = await db.query(sql, params);
    return ok(res, { orders: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch orders.', 500); }
};

// ── GET /api/orders/:id ───────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await db.query(
      `SELECT o.*, u.full_name AS created_by_name
       FROM orders o LEFT JOIN users u ON u.id=o.created_by
       WHERE o.id=? LIMIT 1`, [id]
    );
    if (!orders[0]) return err(res, 'Order not found.', 404);

    const [items] = await db.query(
      `SELECT oi.*, p.image FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=?`, [id]
    );
    const [logs] = await db.query(
      `SELECT pl.*, u.full_name AS updated_by_name
       FROM production_logs pl LEFT JOIN users u ON u.id=pl.updated_by
       WHERE pl.order_id=? ORDER BY pl.created_at ASC`, [id]
    );
    return ok(res, { order: orders[0], items, logs });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch order.', 500); }
};

// ── POST /api/orders ──────────────────────────────────────────
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { customer_name, customer_phone, items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return err(res, 'Order must contain at least one product.');

    // Validate each item and calculate server-side total
    let total = 0;
    const resolvedItems = [];
    for (const item of items) {
      const qty = parseInt(item.quantity);
      if (!item.product_id || !qty || qty <= 0)
        return err(res, 'Each item must have a valid product and quantity.');

      const [prodRows] = await conn.query(
        `SELECT p.id, p.product_name, p.price, p.is_active,
                i.physical_stock, i.reserved_stock,
                (i.physical_stock - i.reserved_stock) AS available
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = ? FOR UPDATE`,
        [item.product_id]
      );
      const prod = prodRows[0];
      if (!prod)           return err(res, `Product ID ${item.product_id} not found.`);
      if (!prod.is_active) return err(res, `Product "${prod.product_name}" is not available.`);
      if (prod.available < qty)
        return err(res, `Insufficient stock for "${prod.product_name}". Available: ${prod.available}.`);

      const subtotal = parseFloat(prod.price) * qty;
      total += subtotal;
      resolvedItems.push({ ...prod, qty, subtotal });
    }

    // Generate unique order number
    let orderNumber, attempts = 0;
    do {
      orderNumber = generateOrderNumber();
      const [chk] = await conn.query('SELECT id FROM orders WHERE order_number=?', [orderNumber]);
      if (chk.length === 0) break;
    } while (++attempts < 5);

    // Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, customer_name, customer_phone, created_by, total_amount, status)
       VALUES (?,?,?,?,?,'new')`,
      [orderNumber, customer_name || null, customer_phone || null, req.user.id, total.toFixed(2)]
    );
    const orderId = orderResult.insertId;

    // Insert items & reserve stock
    for (const item of resolvedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name_snapshot, unit_price, quantity, subtotal)
         VALUES (?,?,?,?,?,?)`,
        [orderId, item.id, item.product_name, item.price, item.qty, item.subtotal.toFixed(2)]
      );
      await conn.query(
        'UPDATE inventory SET reserved_stock = reserved_stock + ? WHERE product_id = ?',
        [item.qty, item.id]
      );
      await conn.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by)
         VALUES (?, 'reserve', ?, ?, ?, ?)`,
        [item.id, item.qty, orderNumber, 'Reserved for order', req.user.id]
      );
    }

    // Log status
    await conn.query(
      `INSERT INTO production_logs (order_id, previous_status, new_status, updated_by, notes)
       VALUES (?,NULL,'new',?,'Order created')`,
      [orderId, req.user.id]
    );

    await conn.commit();
    return ok(res, { message: 'Order created successfully.', order_id: orderId, order_number: orderNumber, total }, 201);
  } catch (e) {
    await conn.rollback();
    console.error(e); return err(res, e.message || 'Failed to create order.', 500);
  } finally { conn.release(); }
};

// ── PATCH /api/orders/:id/cancel ─────────────────────────────
exports.cancel = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const [orders] = await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE', [id]);
    const order = orders[0];
    if (!order)                 return err(res, 'Order not found.', 404);
    if (order.status !== 'new') return err(res, 'Only new orders can be cancelled.');

    // Release reserved stock
    const [items] = await conn.query('SELECT * FROM order_items WHERE order_id=?', [id]);
    for (const item of items) {
      await conn.query(
        'UPDATE inventory SET reserved_stock = GREATEST(0, reserved_stock - ?) WHERE product_id=?',
        [item.quantity, item.product_id]
      );
      await conn.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by)
         VALUES (?, 'release', ?, ?, ?, ?)`,
        [item.product_id, item.quantity, order.order_number, 'Released – order cancelled', req.user.id]
      );
    }

    await conn.query('UPDATE orders SET status=? WHERE id=?', ['cancelled', id]);
    await conn.query(
      `INSERT INTO production_logs (order_id, previous_status, new_status, updated_by, notes)
       VALUES (?,?,?,?,?)`,
      [id, 'new', 'cancelled', req.user.id, req.body.notes || 'Cancelled']
    );
    await conn.commit();
    return ok(res, { message: 'Order cancelled successfully.' });
  } catch (e) {
    await conn.rollback();
    console.error(e); return err(res, 'Failed to cancel order.', 500);
  } finally { conn.release(); }
};

// ── PATCH /api/orders/:id/complete ───────────────────────────
exports.complete = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const [orders] = await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE', [id]);
    const order = orders[0];
    if (!order)                   return err(res, 'Order not found.', 404);
    if (order.status !== 'ready') return err(res, 'Only ready orders can be completed.');

    const [items] = await conn.query('SELECT * FROM order_items WHERE order_id=?', [id]);
    for (const item of items) {
      // Deduct physical stock and release reserved
      await conn.query(
        `UPDATE inventory
         SET physical_stock  = GREATEST(0, physical_stock  - ?),
             reserved_stock  = GREATEST(0, reserved_stock  - ?)
         WHERE product_id=?`,
        [item.quantity, item.quantity, item.product_id]
      );
      await conn.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by)
         VALUES (?, 'deduct', ?, ?, ?, ?)`,
        [item.product_id, item.quantity, order.order_number, 'Deducted – order completed', req.user.id]
      );
    }

    await conn.query('UPDATE orders SET status=? WHERE id=?', ['completed', id]);
    await conn.query(
      `INSERT INTO production_logs (order_id, previous_status, new_status, updated_by, notes)
       VALUES (?,?,?,?,?)`,
      [id, 'ready', 'completed', req.user.id, 'Order completed by counter']
    );
    await conn.commit();
    return ok(res, { message: 'Order marked as completed.' });
  } catch (e) {
    await conn.rollback();
    console.error(e); return err(res, 'Failed to complete order.', 500);
  } finally { conn.release(); }
};
