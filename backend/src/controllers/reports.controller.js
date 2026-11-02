const db = require('../config/db');

const ok  = (res, data = {}, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, message, status = 400)   => res.status(status).json({ success: false, message });

// ── GET /api/reports/dashboard ────────────────────────────────
exports.dashboard = async (_req, res) => {
  try {
    // Total orders count in the entire database
    const [[totalOrders]] = await db.query('SELECT COUNT(*) AS cnt FROM orders');
    const [[totalToday]]  = await db.query('SELECT COUNT(*) AS cnt FROM orders WHERE DATE(created_at) = CURDATE()');

    // Sales and completed orders for today (completed on CURDATE)
    const [[todaySales]] = await db.query(`
      SELECT COUNT(*) AS total_completed, COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE status = 'completed' AND (DATE(updated_at) = CURDATE() OR DATE(created_at) = CURDATE())`);

    // Status counts:
    // - Active queues (new, preparing, ready) count all currently open orders
    // - Completed and cancelled counts represent today's completed/cancelled orders
    const [[statusCounts]] = await db.query(`
      SELECT
        COALESCE(SUM(status = 'new'), 0)        AS new_orders,
        COALESCE(SUM(status = 'preparing'), 0)  AS preparing,
        COALESCE(SUM(status = 'ready'), 0)      AS ready,
        COALESCE(SUM(status = 'completed' AND (DATE(updated_at) = CURDATE() OR DATE(created_at) = CURDATE())), 0) AS completed_today,
        COALESCE(SUM(status = 'cancelled' AND (DATE(updated_at) = CURDATE() OR DATE(created_at) = CURDATE())), 0) AS cancelled_today
      FROM orders`);

    const [[activeProducts]] = await db.query('SELECT COUNT(*) AS cnt FROM products WHERE is_active = 1');
    const [[lowStock]] = await db.query(`
      SELECT COUNT(*) AS cnt FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE (i.physical_stock - i.reserved_stock) <= p.reorder_level AND p.is_active = 1`);

    // Recent orders (last 10)
    const [recentOrders] = await db.query(`
      SELECT o.*, u.full_name AS created_by_name FROM orders o
      LEFT JOIN users u ON u.id = o.created_by
      ORDER BY o.created_at DESC LIMIT 10`);

    // Daily revenue last 7 days (based on when the order was completed/updated)
    const [dailyRevenue] = await db.query(`
      SELECT DATE_FORMAT(COALESCE(updated_at, created_at), '%Y-%m-%d') AS date,
             COALESCE(SUM(total_amount), 0) AS revenue,
             COUNT(*) AS orders
      FROM orders
      WHERE status = 'completed' AND COALESCE(updated_at, created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(COALESCE(updated_at, created_at), '%Y-%m-%d')
      ORDER BY date ASC`);

    return ok(res, {
      stats: {
        total_orders:     parseInt(totalOrders.cnt, 10),
        total_today:      parseInt(totalToday.cnt, 10),
        new_orders:       parseInt(statusCounts.new_orders || 0, 10),
        preparing:        parseInt(statusCounts.preparing || 0, 10),
        ready:            parseInt(statusCounts.ready || 0, 10),
        completed_today:  parseInt(statusCounts.completed_today || 0, 10),
        cancelled_today:  parseInt(statusCounts.cancelled_today || 0, 10),
        today_revenue:    parseFloat(todaySales.revenue || 0),
        active_products:  parseInt(activeProducts.cnt, 10),
        low_stock_count:  parseInt(lowStock.cnt, 10),
      },
      recent_orders:  recentOrders,
      daily_revenue:  dailyRevenue,
    });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch dashboard data.', 500); }
};

// ── GET /api/reports/sales ────────────────────────────────────
exports.sales = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let sql = `
      SELECT DATE_FORMAT(COALESCE(updated_at, created_at), '%Y-%m-%d') AS date,
             COUNT(*) AS completed_orders,
             COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders WHERE status='completed'`;
    const params = [];
    if (from_date) { sql += ' AND DATE(COALESCE(updated_at, created_at)) >= ?'; params.push(from_date); }
    if (to_date)   { sql += ' AND DATE(COALESCE(updated_at, created_at)) <= ?'; params.push(to_date); }
    sql += " GROUP BY DATE_FORMAT(COALESCE(updated_at, created_at), '%Y-%m-%d') ORDER BY date DESC";
    const [rows] = await db.query(sql, params);
    return ok(res, { sales: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch sales data.', 500); }
};

// ── GET /api/reports/best-sellers ────────────────────────────
exports.bestSellers = async (req, res) => {
  try {
    const { from_date, to_date, limit = 10 } = req.query;
    let sql = `
      SELECT oi.product_id, oi.product_name_snapshot AS product_name,
             SUM(oi.quantity) AS total_quantity,
             SUM(oi.subtotal) AS total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'completed'`;
    const params = [];
    if (from_date) { sql += ' AND DATE(COALESCE(o.updated_at, o.created_at)) >= ?'; params.push(from_date); }
    if (to_date)   { sql += ' AND DATE(COALESCE(o.updated_at, o.created_at)) <= ?'; params.push(to_date); }
    sql += ` GROUP BY oi.product_id, oi.product_name_snapshot
             ORDER BY total_quantity DESC LIMIT ?`;
    params.push(parseInt(limit));
    const [rows] = await db.query(sql, params);
    return ok(res, { best_sellers: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch best sellers.', 500); }
};

// ── GET /api/reports/order-summary ───────────────────────────
exports.orderSummary = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let sql = `
      SELECT status, COUNT(*) AS count,
             COALESCE(SUM(total_amount),0) AS total_amount
      FROM orders WHERE 1=1`;
    const params = [];
    if (from_date) { sql += ' AND DATE(created_at) >= ?'; params.push(from_date); }
    if (to_date)   { sql += ' AND DATE(created_at) <= ?'; params.push(to_date); }
    sql += ' GROUP BY status';
    const [rows] = await db.query(sql, params);
    return ok(res, { summary: rows });
  } catch (e) { console.error(e); return err(res, 'Failed to fetch order summary.', 500); }
};
