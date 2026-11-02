import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Spinner, EmptyState } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Printer, Calendar, TrendingUp, ShoppingBag, IndianRupee, Award, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#059669', '#DC2626'];

export default function ReportsPage() {
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [activeTab,   setActiveTab]   = useState('summary'); // 'summary'|'best_sellers'|'order_status'|'date_wise'
  const [fromDate,    setFromDate]    = useState(sevenDaysAgo);
  const [toDate,      setToDate]      = useState(today);
  const [sales,       setSales]       = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [summary,     setSummary]     = useState([]);
  const [loading,     setLoading]     = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { from_date: fromDate, to_date: toDate };
      const [s, b, sm] = await Promise.all([
        api.get('/reports/sales',        { params }),
        api.get('/reports/best-sellers', { params }),
        api.get('/reports/order-summary',{ params }),
      ]);
      setSales(s.data.sales || []);
      setBestSellers(b.data.best_sellers || []);
      setSummary(sm.data.summary || []);
    } catch (err) {
      console.error(err);
      toast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const totalRevenue = sales.reduce((a, s) => a + parseFloat(s.revenue || 0), 0);
  const totalOrders  = sales.reduce((a, s) => a + parseInt(s.completed_orders || 0), 0);
  const avgOrderVal  = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Chart data
  const chartData = sales.map(s => ({
    date: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(s.revenue || 0),
    orders: parseInt(s.completed_orders || 0)
  })).reverse();

  // Total best seller quantity for percentage calculation
  const totalBestSellerQty = bestSellers.reduce((a, b) => a + parseInt(b.total_quantity || 0), 0);

  return (
    <DashboardLayout title="Sales &amp; Reports" subtitle="Analyze your bakery performance.">
      {/* Top Filter and Print Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--cream-light)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          {[
            { id: 'summary',      label: 'Sales Summary' },
            { id: 'best_sellers', label: 'Best Selling Products' },
            { id: 'order_status', label: 'Order Status' },
            { id: 'date_wise',    label: 'Date-wise Sales' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
            <Calendar size={14} color="var(--text-muted)" />
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ border: 'none', background: 'none', fontSize: 12, outline: 'none', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>–</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ border: 'none', background: 'none', fontSize: 12, outline: 'none', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14}/> Print Report
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}><Spinner size={32}/></div>
      ) : (
        <>
          {/* ── TAB 1: Sales Summary ── */}
          {activeTab === 'summary' && (
            <div>
              {/* 3 Metric Summary Cards */}
              <div className="grid-cols-3" style={{ marginBottom: 22 }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#FEF9F0', color: 'var(--caramel)' }}>
                    <IndianRupee size={22}/>
                  </div>
                  <div>
                    <div className="stat-value">₹ {totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <div className="stat-label">Total Sales</div>
                    <div className="stat-sub">Completed orders only</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                    <ShoppingBag size={22}/>
                  </div>
                  <div>
                    <div className="stat-value">{totalOrders}</div>
                    <div className="stat-label">Completed Orders</div>
                    <div className="stat-sub">In selected period</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                    <TrendingUp size={22}/>
                  </div>
                  <div>
                    <div className="stat-value">₹ {avgOrderVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <div className="stat-label">Average Order Value</div>
                    <div className="stat-sub">Per completed order</div>
                  </div>
                </div>
              </div>

              {/* Sales Overview Chart + Best Selling Products list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
                {/* Sales Area Chart */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>Sales Overview</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Revenue trend for selected period</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px 16px 12px' }}>
                    {chartData.length === 0 ? (
                      <EmptyState title="No sales data" message="No completed orders in this date range." />
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="reportsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="var(--caramel)" stopOpacity={0.30}/>
                              <stop offset="95%" stopColor="var(--caramel)" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={45}
                            tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}/>
                          <Tooltip
                            formatter={v => [`₹${parseFloat(v).toLocaleString('en-IN')}`, 'Revenue']}
                            contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="var(--caramel)" strokeWidth={2.5} fill="url(#reportsGrad)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Best Selling Products Ranking */}
                <div className="card">
                  <div className="card-header">
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Best Selling Products</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Top items</span>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 44 }}>#</th>
                          <th>Product</th>
                          <th style={{ textAlign: 'right' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bestSellers.length === 0 ? (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No sales recorded.</td></tr>
                        ) : bestSellers.slice(0, 6).map((b, i) => {
                          const pct = totalBestSellerQty > 0 ? Math.round((parseInt(b.total_quantity || 0) / totalBestSellerQty) * 100) : 0;
                          return (
                            <tr key={b.product_id || i}>
                              <td>
                                <span style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: i === 0 ? '#FEF3C7' : i === 1 ? '#E0F2FE' : 'var(--cream-light)',
                                  color: i === 0 ? '#92400E' : i === 1 ? '#0369A1' : 'var(--text-secondary)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700
                                }}>
                                  {i + 1}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.product_name}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{b.total_quantity}</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 12 }}>{pct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Best Selling Products Detailed Table ── */}
          {activeTab === 'best_sellers' && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Top Selling Products</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>Rank</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellers.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No data available.</td></tr>
                    ) : bestSellers.map((b, i) => (
                      <tr key={b.product_id || i}>
                        <td>
                          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{i + 1}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{b.product_name}</td>
                        <td><span className="badge" style={{ background: 'var(--cream-light)', color: 'var(--text-secondary)' }}>{b.category || 'Bakery'}</span></td>
                        <td style={{ fontWeight: 700 }}>{b.total_quantity}</td>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{parseFloat(b.total_revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: Order Status ── */}
          {activeTab === 'order_status' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 700 }}>Status Distribution</h3></div>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {summary.length === 0 ? <EmptyState title="No orders in this period" /> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={summary.map((s, i) => ({ name: s.status, value: parseInt(s.count) }))}
                          cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          dataKey="value" paddingAngle={3}
                        >
                          {summary.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 700 }}>Status Breakdown</h3></div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Status</th><th>Orders Count</th><th>Total Value</th></tr>
                    </thead>
                    <tbody>
                      {summary.map((s, i) => (
                        <tr key={s.status}>
                          <td><span className="badge" style={{ textTransform: 'capitalize' }}>{s.status}</span></td>
                          <td style={{ fontWeight: 700 }}>{s.count}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{parseFloat(s.total_amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: Date-wise Sales ── */}
          {activeTab === 'date_wise' && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 700 }}>Daily Sales Breakdown</h3></div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Completed Orders</th><th>Total Revenue</th><th>Avg Order Value</th></tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No completed orders in this date range.</td></tr>
                    ) : sales.map(s => {
                      const rev = parseFloat(s.revenue || 0);
                      const ord = parseInt(s.completed_orders || 0);
                      return (
                        <tr key={s.date}>
                          <td style={{ fontWeight: 600 }}>{new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td>{ord}</td>
                          <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{rev.toFixed(2)}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>₹{ord > 0 ? (rev / ord).toFixed(2) : '0.00'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
