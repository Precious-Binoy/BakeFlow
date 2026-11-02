import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { LoadingPage, StatusBadge } from '../../components/UI';
import api from '../../services/api';
import {
  ShoppingCart, CheckCircle, Clock, Loader2, XCircle,
  Package, AlertTriangle, TrendingUp, IndianRupee, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

function StatCard({ icon, label, value, sub, color, iconBg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <ArrowUpRight size={11} style={{ color: '#10B981' }} />
          <span style={{ color: '#10B981', fontWeight: 600 }}>{sub}</span>
        </div>}
      </div>
    </div>
  );
}

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#059669', '#DC2626'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/inventory', { params: { low_stock: 'true' } }).catch(() => ({ data: { inventory: [] } }))
    ]).then(([dash, inv]) => {
      setData({ ...dash.data, low_stock: inv.data.inventory || [] });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Dashboard"><LoadingPage /></DashboardLayout>;

  const { stats = {}, recent_orders = [], daily_revenue = [] } = data || {};

  // Pad daily revenue to 7 days in local timezone
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const found = daily_revenue.find(r => r.date?.slice(0, 10) === key);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    return { date: label, revenue: found ? parseFloat(found.revenue) : 0, orders: found?.orders || 0 };
  });

  const pieData = [
    { name: 'New',       value: Number(stats.new_orders)      || 0 },
    { name: 'Preparing', value: Number(stats.preparing)       || 0 },
    { name: 'Ready',     value: Number(stats.ready)           || 0 },
    { name: 'Completed', value: Number(stats.completed_today) || 0 },
    { name: 'Cancelled', value: Number(stats.cancelled_today) || 0 },
  ].filter(d => d.value > 0);

  const totalOrders = stats.total_orders !== undefined && stats.total_orders !== null
    ? Number(stats.total_orders)
    : (Number(stats.new_orders || 0) + Number(stats.preparing || 0) + Number(stats.ready || 0) + Number(stats.completed_today || 0) + Number(stats.cancelled_today || 0));

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Good morning, Admin! Here's what's happening at your bakery today.">
      {/* ── 8 Stat Cards ── */}
      <div className="grid-cols-4" style={{ marginBottom: 22 }}>
        <StatCard
          icon={<ShoppingCart size={20}/>}
          label="Total Orders"
          value={totalOrders}
          sub="+12% from yesterday"
          color="#3B82F6"
          iconBg="#EFF6FF"
        />
        <StatCard
          icon={<Clock size={20}/>}
          label="New Orders"
          value={Number(stats.new_orders || 0)}
          sub="Waiting for processing"
          color="#F59E0B"
          iconBg="#FFFBEB"
        />
        <StatCard
          icon={<Loader2 size={20}/>}
          label="Preparing"
          value={Number(stats.preparing || 0)}
          sub="In production"
          color="#C66A38"
          iconBg="#FFF3EE"
        />
        <StatCard
          icon={<CheckCircle size={20}/>}
          label="Ready"
          value={Number(stats.ready || 0)}
          sub="Ready for pickup"
          color="#10B981"
          iconBg="#ECFDF5"
        />
        <StatCard
          icon={<CheckCircle size={20}/>}
          label="Completed"
          value={Number(stats.completed_today || 0)}
          sub="Today"
          color="#059669"
          iconBg="#F0FDF4"
        />
        <StatCard
          icon={<IndianRupee size={20}/>}
          label="Today's Sales"
          value={`₹${parseFloat(stats.today_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub="+18% from yesterday"
          color="var(--caramel)"
          iconBg="#FEF9F0"
        />
        <StatCard
          icon={<Package size={20}/>}
          label="Active Products"
          value={Number(stats.active_products || 0)}
          sub="Total products"
          color="var(--primary)"
          iconBg="#FFF3EE"
        />
        <StatCard
          icon={<AlertTriangle size={20}/>}
          label="Low Stock"
          value={Number(stats.low_stock_count || 0)}
          sub="Needs attention"
          color="#DC2626"
          iconBg="#FEF2F2"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid-cols-2" style={{ marginBottom: 22 }}>
        {/* Daily Sales chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Daily Sales</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Revenue trend — last 7 days</p>
            </div>
          </div>
          <div style={{ padding: '16px 16px 12px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={last7} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--caramel)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--caramel)" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={42}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}/>
                <Tooltip
                  formatter={v => [`₹${parseFloat(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
                  cursor={{ stroke: 'var(--caramel)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--caramel)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: 'var(--caramel)' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Order Status Overview</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Today's distribution</p>
            </div>
          </div>
          <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', gap: 20 }}>
            {pieData.length > 0 ? (
              <>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                        dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none'
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {pieData.reduce((sum, item) => sum + item.value, 0)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Total</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { label: 'New',       value: Number(stats.new_orders || 0),      color: PIE_COLORS[0] },
                    { label: 'Preparing', value: Number(stats.preparing || 0),        color: PIE_COLORS[1] },
                    { label: 'Ready',     value: Number(stats.ready || 0),            color: PIE_COLORS[2] },
                    { label: 'Completed', value: Number(stats.completed_today || 0),  color: PIE_COLORS[3] },
                    { label: 'Cancelled', value: Number(stats.cancelled_today || 0),  color: PIE_COLORS[4] },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px 0', width: '100%', fontSize: 14 }}>
                No orders today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Recent Orders + Low Stock ── */}
      <div className="grid-cols-2">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Orders</h3>
            <Link to="/admin/orders" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Order No.</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Time</th>
              </tr></thead>
              <tbody>
                {recent_orders.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 28, fontSize: 14 }}>No orders yet today.</td></tr>
                ) : recent_orders.slice(0, 6).map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.order_number}</span></td>
                    <td style={{ color: 'var(--text-primary)' }}>{o.customer_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.item_count || '—'} items</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Low Stock Products</h3>
            <Link to="/admin/inventory" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            {(data?.low_stock || []).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32, fontSize: 14 }}>
                ✅ All stock levels are healthy!
              </div>
            ) : (data.low_stock || []).slice(0, 6).map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    overflow: 'hidden', border: '1px solid var(--border)',
                    background: 'var(--cream-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.product_name}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/products/fallback.jpg'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 16 }}>🍰</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{item.product_name || item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Available: {item.available_stock ?? item.quantity}</div>
                  </div>
                </div>
                <Link to="/admin/inventory" className="btn btn-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 600 }}>
                  Reorder
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
