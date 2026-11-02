const path = require('path');
const fs   = require('fs');
const db   = require('../config/db');

const ok  = (res, data = {}, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, message, status = 400)   => res.status(status).json({ success: false, message });

// ── GET /api/products ─────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { search = '', category = '', active_only = '' } = req.query;
    let sql = `
      SELECT p.*, i.physical_stock, i.reserved_stock,
             (i.physical_stock - i.reserved_stock) AS available_stock
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE 1=1`;
    const params = [];
    if (search)      { sql += ' AND p.product_name LIKE ?'; params.push(`%${search}%`); }
    if (category)    { sql += ' AND p.category = ?'; params.push(category); }
    if (active_only === 'true') { sql += ' AND p.is_active = 1'; }
    sql += ' ORDER BY p.product_name ASC';
    const [rows] = await db.query(sql, params);
    return ok(res, { products: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch products.', 500); }
};

// ── GET /api/products/categories ─────────────────────────────
exports.categories = async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
    return ok(res, { categories: rows.map(r => r.category) });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch categories.', 500); }
};

// ── POST /api/products ────────────────────────────────────────
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { product_name, description, category, price, reorder_level, is_active } = req.body;
    if (!product_name || !category || price === undefined)
      return err(res, 'Name, category and price are required.');
    if (isNaN(price) || parseFloat(price) < 0)
      return err(res, 'Price must be a non-negative number.');

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

    const [result] = await conn.query(
      'INSERT INTO products (product_name, description, category, price, image, reorder_level, is_active) VALUES (?,?,?,?,?,?,?)',
      [product_name.trim(), description || null, category.trim(),
       parseFloat(price), imagePath,
       parseInt(reorder_level) || 10,
       is_active !== undefined ? (is_active ? 1 : 0) : 1]
    );
    await conn.query('INSERT INTO inventory (product_id, physical_stock, reserved_stock) VALUES (?,0,0)', [result.insertId]);
    await conn.commit();
    return ok(res, { message: 'Product created successfully.', id: result.insertId }, 201);
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return err(res, 'Failed to create product.', 500);
  } finally { conn.release(); }
};

// ── PUT /api/products/:id ─────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, image FROM products WHERE id=?', [id]);
    if (!rows[0]) return err(res, 'Product not found.', 404);

    const { product_name, description, category, price, reorder_level, is_active } = req.body;
    if (price !== undefined && (isNaN(price) || parseFloat(price) < 0))
      return err(res, 'Price must be a non-negative number.');

    let sets = [], params = [];
    if (product_name  !== undefined) { sets.push('product_name=?');  params.push(product_name.trim()); }
    if (description   !== undefined) { sets.push('description=?');   params.push(description || null); }
    if (category      !== undefined) { sets.push('category=?');      params.push(category.trim()); }
    if (price         !== undefined) { sets.push('price=?');         params.push(parseFloat(price)); }
    if (reorder_level !== undefined) { sets.push('reorder_level=?'); params.push(parseInt(reorder_level)); }
    if (is_active     !== undefined) { sets.push('is_active=?');     params.push(is_active ? 1 : 0); }
    if (req.file) {
      sets.push('image=?');
      params.push(`/uploads/products/${req.file.filename}`);
      // Remove old image if it exists
      if (rows[0].image) {
        const old = path.join(__dirname, '../../', rows[0].image);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
    }
    if (!sets.length) return err(res, 'No fields to update.');

    params.push(id);
    await db.query(`UPDATE products SET ${sets.join(',')} WHERE id=?`, params);
    return ok(res, { message: 'Product updated successfully.' });
  } catch (e) { console.error(e); return err(res, 'Failed to update product.', 500); }
};

// ── PATCH /api/products/:id/toggle ───────────────────────────
exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, is_active FROM products WHERE id=?', [id]);
    if (!rows[0]) return err(res, 'Product not found.', 404);
    const newState = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE products SET is_active=? WHERE id=?', [newState, id]);
    return ok(res, { message: `Product ${newState ? 'activated' : 'deactivated'}.`, is_active: newState });
  } catch (e) { console.error(e); return err(res, 'Failed to update product status.', 500); }
};
