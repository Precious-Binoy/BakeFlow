import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, LoadingPage, Spinner } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  ChefHat, Clock, CheckCircle, Loader2, RefreshCw,
  Eye, Play, Check, ArrowRight, Package
} from 'lucide-react';

export default function ProductionDashboard() {
  const toast = useToast();
  const [orders, setOrders] = useState({
    new: [],
    preparing: [],
    ready: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchDashboard = useCallback(() => {
    Promise.all([
      api.get('/production/orders', { params: { status: 'new' } }),
      api.get('/production/orders', { params: { status: 'preparing' } }),
      api.get('/production/orders', { params: { status: 'ready' } }),
      api.get('/production/history', { params: { status: 'completed', today: 'true', limit: 25 } }),
    ]).then(([n, p, r, c]) => {
      setOrders({
        new:       n.data.orders || [],
        preparing: p.data.orders || [],
        ready:     r.data.orders || [],
        completed: c.data.orders || [],
      });
    }).catch(err => {
      console.error(err);
      toast('Failed to load production orders.', 'error');
    }).finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 20000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleStart = async (id, e) => {
    e?.stopPropagation();
    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/production/orders/${id}/start`, { notes: 'Started in kitchen' });
      toast('Order moved to Preparing.', 'success');
      fetchDashboard();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to start preparation.', 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReady = async (id, e) => {
    e?.stopPropagation();
    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/production/orders/${id}/ready`, { notes: 'Bake completed and packaged' });
      toast('Order marked as Ready for pickup.', 'success');
      fetchDashboard();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to mark order as ready.', 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <DashboardLayout title="Production Dashboard"><LoadingPage /></DashboardLayout>;

  return (
    <DashboardLayout
      title="Production Dashboard"
      subtitle="Keep the orders moving, one step at a time."
    >
      {/* ── 4 Top Stat Cards ── */}
      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        {[
          {
            icon: <Clock size={20}/>,
            label: 'New Orders',
            sub: 'Waiting',
            value: orders.new.length,
            color: '#3B82F6',
            bg: '#EFF6FF',
          },
          {
            icon: <Loader2 size={20}/>,
            label: 'Preparing',
            sub: 'In Production',
            value: orders.preparing.length,
            color: '#F59E0B',
            bg: '#FFFBEB',
          },
          {
            icon: <CheckCircle size={20}/>,
            label: 'Ready',
            sub: 'Ready for Pickup',
            value: orders.ready.length,
            color: '#10B981',
            bg: '#ECFDF5',
          },
          {
            icon: <CheckCircle size={20}/>,
            label: 'Completed',
            sub: 'Today',
            value: orders.completed.length,
            color: 'var(--primary)',
            bg: 'var(--cream-light)',
          },
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

      {/* ── Kanban Board: Order Workflow ── */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Order Workflow</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Real-time kitchen board · auto-updates every 20 seconds
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchDashboard}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* 4 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'flex-start' }}>

        {/* ── COL 1: New ── */}
        <div className="kanban-col">
          <div className="kanban-col-header" style={{ background: '#FFF1E8', color: '#9A4518' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15}/> New ({orders.new.length})
            </span>
          </div>
          <div style={{ padding: '12px 10px', minHeight: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.new.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 10px', fontSize: 13 }}>
                No waiting orders
              </div>
            ) : orders.new.map(o => (
              <div
                key={o.id}
                className="kanban-card"
                onClick={() => setSelectedOrder(o)}
                style={{ cursor: 'pointer', margin: 0, borderLeft: '3px solid #F59E0B' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>{o.order_number}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {o.customer_name ? <strong>{o.customer_name} · </strong> : null}
                  {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                </div>
                {o.items && o.items.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 10, background: 'var(--cream-light)', padding: '6px 8px', borderRadius: 6 }}>
                    {o.items.slice(0, 2).map(i => `${i.product_name_snapshot} ×${i.quantity}`).join(', ')}
                    {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '5px 8px' }}
                    onClick={(e) => handleStart(o.id, e)}
                    disabled={updating[o.id]}
                  >
                    {updating[o.id] ? <Spinner size={12}/> : <><Play size={12}/> Start</>}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 8px' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                    title="View Details"
                  >
                    <Eye size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COL 2: Preparing ── */}
        <div className="kanban-col">
          <div className="kanban-col-header" style={{ background: '#FFFBEB', color: '#92400E' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={15}/> Preparing ({orders.preparing.length})
            </span>
          </div>
          <div style={{ padding: '12px 10px', minHeight: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.preparing.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 10px', fontSize: 13 }}>
                None currently in preparation
              </div>
            ) : orders.preparing.map(o => (
              <div
                key={o.id}
                className="kanban-card"
                onClick={() => setSelectedOrder(o)}
                style={{ cursor: 'pointer', margin: 0, borderLeft: '3px solid #F59E0B' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>{o.order_number}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(o.updated_at || o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {o.customer_name ? <strong>{o.customer_name} · </strong> : null}
                  {o.items?.length || 0} items
                </div>
                {o.items && o.items.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 10, background: 'var(--cream-light)', padding: '6px 8px', borderRadius: 6 }}>
                    {o.items.slice(0, 2).map(i => `${i.product_name_snapshot} ×${i.quantity}`).join(', ')}
                    {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '5px 8px' }}
                    onClick={(e) => handleReady(o.id, e)}
                    disabled={updating[o.id]}
                  >
                    {updating[o.id] ? <Spinner size={12}/> : <><Check size={12}/> Mark Ready</>}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 8px' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                    title="View Details"
                  >
                    <Eye size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COL 3: Ready ── */}
        <div className="kanban-col">
          <div className="kanban-col-header" style={{ background: '#ECFDF5', color: '#065F46' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={15}/> Ready ({orders.ready.length})
            </span>
          </div>
          <div style={{ padding: '12px 10px', minHeight: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.ready.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 10px', fontSize: 13 }}>
                No orders ready for pickup
              </div>
            ) : orders.ready.map(o => (
              <div
                key={o.id}
                className="kanban-card"
                onClick={() => setSelectedOrder(o)}
                style={{ cursor: 'pointer', margin: 0, borderLeft: '3px solid #10B981' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>{o.order_number}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(o.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {o.customer_name ? <strong>{o.customer_name} · </strong> : null}
                  {o.items?.length || 0} items
                </div>
                {o.items && o.items.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 8, background: 'var(--cream-light)', padding: '6px 8px', borderRadius: 6 }}>
                    {o.items.slice(0, 2).map(i => `${i.product_name_snapshot} ×${i.quantity}`).join(', ')}
                    {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge badge-ready" style={{ fontSize: 11 }}>Ready for Pickup</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 7px' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                  >
                    <Eye size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COL 4: Completed ── */}
        <div className="kanban-col">
          <div className="kanban-col-header" style={{ background: '#F8F3EC', color: 'var(--text-primary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={15}/> Completed ({orders.completed.length})
            </span>
          </div>
          <div style={{ padding: '12px 10px', minHeight: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.completed.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 10px', fontSize: 13 }}>
                No completed orders yet
              </div>
            ) : orders.completed.map(o => (
              <div
                key={o.id}
                className="kanban-card"
                onClick={() => setSelectedOrder(o)}
                style={{ cursor: 'pointer', margin: 0, opacity: 0.85 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 13 }}>{o.order_number}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(o.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {o.customer_name ? `${o.customer_name} · ` : ''}{o.items?.length || 0} items
                </div>
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-completed" style={{ fontSize: 11 }}>Completed</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{parseFloat(o.total_amount).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>Order {selectedOrder.order_number}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Status: <StatusBadge status={selectedOrder.status} />
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}
              >×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--cream-light)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                <div><strong>Customer:</strong> {selectedOrder.customer_name || 'Walk-in Customer'}</div>
                {selectedOrder.customer_phone && <div><strong>Phone:</strong> {selectedOrder.customer_phone}</div>}
                <div><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString('en-IN')}</div>
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Items to Bake</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{it.product_name_snapshot}</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Qty: {it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
              {selectedOrder.status === 'new' && (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await handleStart(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                >
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    await handleReady(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                >
                  Mark Ready
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
