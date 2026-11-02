const db = require('../config/db');

const ok  = (res, data = {}, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, message, status = 400)   => res.status(status).json({ success: false, message });

// ── GET /api/inventory ─────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { search = '', low_stock = '' } = req.query;
    let sql = `
      SELECT p.id, p.product_name, p.category, p.price, p.image, p.reorder_level, p.is_active,
             i.physical_stock, i.reserved_stock,
             (i.physical_stock - i.reserved_stock) AS available_stock,
             i.updated_at AS stock_updated_at
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE 1=1`;
    const params = [];
    if (search)    { sql += ' AND p.product_name LIKE ?'; params.push(`%${search}%`); }
    if (low_stock === 'true') {
      sql += ' AND (i.physical_stock - i.reserved_stock) <= p.reorder_level';
    }
    sql += ' ORDER BY p.product_name ASC';
    const [rows] = await db.query(sql, params);
    return ok(res, { inventory: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch inventory.', 500); }
};

// ── POST /api/inventory/:productId/add ────────────────────────
exports.addStock = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { productId } = req.params;
    const { quantity, notes } = req.body;
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return err(res, 'Quantity must be a positive integer.');

    const [rows] = await conn.query('SELECT id FROM products WHERE id=?', [productId]);
    if (!rows[0]) return err(res, 'Product not found.', 404);

    await conn.query(
      'UPDATE inventory SET physical_stock = physical_stock + ? WHERE product_id = ?',
      [qty, productId]
    );
    await conn.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by)
       VALUES (?, 'add', ?, ?, ?, ?)`,
      [productId, qty, 'MANUAL_ADD', notes || null, req.user.id]
    );
    await conn.commit();
    return ok(res, { message: `Added ${qty} units to stock.` });
  } catch (e) {
    await conn.rollback();
    console.error(e); return err(res, 'Failed to add stock.', 500);
  } finally { conn.release(); }
};

// ── POST /api/inventory/:productId/adjust ────────────────────
exports.adjustStock = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { productId } = req.params;
    const { new_physical_stock, notes } = req.body;
    const newQty = parseInt(new_physical_stock);
    if (isNaN(newQty) || newQty < 0) return err(res, 'New stock must be a non-negative integer.');

    const [invRows] = await conn.query(
      'SELECT physical_stock, reserved_stock FROM inventory WHERE product_id=?', [productId]
    );
    if (!invRows[0]) return err(res, 'Inventory not found for this product.', 404);
    const { physical_stock: oldQty, reserved_stock } = invRows[0];

    if (newQty < reserved_stock)
      return err(res, `Cannot set stock below reserved quantity (${reserved_stock}).`);

    const diff = newQty - oldQty;
    await conn.query('UPDATE inventory SET physical_stock=? WHERE product_id=?', [newQty, productId]);
    await conn.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by)
       VALUES (?, 'adjust', ?, ?, ?, ?)`,
      [productId, diff, 'MANUAL_ADJUST', notes || null, req.user.id]
    );
    await conn.commit();
    return ok(res, { message: 'Stock adjusted successfully.' });
  } catch (e) {
    await conn.rollback();
    console.error(e); return err(res, 'Failed to adjust stock.', 500);
  } finally { conn.release(); }
};

// ── GET /api/inventory/movements ─────────────────────────────
exports.movements = async (req, res) => {
  try {
    const { productId, limit = 50 } = req.query;
    let sql = `
      SELECT sm.*, p.product_name, u.full_name AS created_by_name
      FROM stock_movements sm
      LEFT JOIN products p ON p.id = sm.product_id
      LEFT JOIN users u ON u.id = sm.created_by
      WHERE 1=1`;
    const params = [];
    if (productId) { sql += ' AND sm.product_id = ?'; params.push(productId); }
    sql += ' ORDER BY sm.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const [rows] = await db.query(sql, params);
    return ok(res, { movements: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch stock movements.', 500); }
};
