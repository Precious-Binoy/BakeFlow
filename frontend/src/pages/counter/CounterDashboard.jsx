import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, LoadingPage } from '../../components/UI';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ShoppingCart, Clock, CheckCircle, Loader2, PlusCircle, ClipboardList, RefreshCw } from 'lucide-react';

export default function CounterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(() => {
    Promise.all([
      api.get('/orders', { params: { status: 'new' } }),
      api.get('/orders', { params: { status: 'preparing' } }),
      api.get('/orders', { params: { status: 'ready' } }),
      api.get('/orders', { params: { status: 'completed', from_date: new Date().toISOString().slice(0,10) } }),
    ]).then(([n, p, r, c]) => {
      setData({
        new_orders: n.data.orders,
        preparing:  p.data.orders,
        ready:      r.data.orders,
        completed:  c.data.orders,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 20000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) return <DashboardLayout title="Counter Dashboard"><LoadingPage /></DashboardLayout>;

  const allRecent = [
    ...(data?.new_orders || []),
    ...(data?.preparing || []),
    ...(data?.ready || []),
    ...(data?.completed || []),
  ]
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  .slice(0, 6);

  return (
    <DashboardLayout
      title="Counter Staff Dashboard"
      subtitle={`Manage your orders and serve your customers efficiently.`}
    >
      {/* ── 4 Stat Cards ── */}
      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        {[
          { icon: <ShoppingCart size={20}/>, label: 'New Orders',      sub: 'Waiting',       value: data?.new_orders?.length || 0, color: '#3B82F6', bg: '#EFF6FF' },
          { icon: <Loader2     size={20}/>, label: 'Preparing',        sub: 'In Production',  value: data?.preparing?.length  || 0, color: '#F59E0B', bg: '#FFFBEB' },
          { icon: <CheckCircle size={20}/>, label: 'Ready',            sub: 'Ready for Pickup',value: data?.ready?.length      || 0, color: '#10B981', bg: '#ECFDF5' },
          { icon: <Clock       size={20}/>, label: 'Completed',        sub: 'Today',          value: data?.completed?.length  || 0, color: 'var(--primary)', bg: 'var(--cream-light)' },
        ].map(({ icon, label, sub, value, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}>
              <span style={{ color }}>{icon}</span>
            </div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
              <div className="stat-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 24 }}>
        {/* ── Quick Actions ── */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/counter/new-order" className="quick-action-card">
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <PlusCircle size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Create New Order</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Take a new customer order</div>
              </div>
            </Link>
            <Link to="/counter/orders" className="quick-action-card secondary">
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'var(--cream-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <ClipboardList size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>View Order History</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Check past orders</div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Recent Orders ── */}
        <div className="card">
          <div className="card-header" style={{ padding: '14px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Orders</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={fetchDashboard} title="Refresh">
                <RefreshCw size={13}/>
              </button>
              <Link to="/counter/orders" className="btn btn-secondary btn-sm">View All</Link>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Order No.</th>
                <th>Items</th>
                <th>Status</th>
                <th>Time</th>
              </tr></thead>
              <tbody>
                {allRecent.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 14 }}>No active orders.</td></tr>
                ) : allRecent.map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.order_number}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.item_count || '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ready orders alert */}
      {data?.ready?.length > 0 && (
        <div style={{
          background: '#ECFDF5', border: '1px solid #A7F3D0',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontWeight: 700, color: '#065F46', fontSize: 15 }}>
              {data.ready.length} Order{data.ready.length > 1 ? 's' : ''} Ready for Pickup
            </span>
          </div>
          <Link to="/counter/orders" className="btn btn-sm" style={{ background: '#059669', color: 'white' }}>
            View Ready Orders
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
