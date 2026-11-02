import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, ConfirmDialog, EmptyState, Spinner } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ChefHat, Play, CheckCircle, Eye, Package, RefreshCw } from 'lucide-react';

export default function ProductionOrdersPage() {
  const toast = useToast();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusF, setStatusF] = useState('');
  const [detail,  setDetail]  = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, action: 'start'|'ready' }

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/production/orders', { params: { status: statusF } })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast('Failed to load orders.', 'error'))
      .finally(() => setLoading(false));
  }, [statusF, toast]);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 30000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const viewDetail = async (order) => {
    try {
      const r = await api.get(`/orders/${order.id}`);
      setDetail(r.data);
    } catch {
      setDetail({ order, items: order.items || [], logs: [] });
    }
  };

  const handleAction = async () => {
    if (!confirm) return;
    const { id, action } = confirm;
    try {
      const url = action === 'start' ? `/production/orders/${id}/start` : `/production/orders/${id}/ready`;
      await api.patch(url);
      toast(action === 'start' ? 'Order moved to Preparing.' : 'Order marked as Ready for pickup!', 'success');
      setDetail(null);
      setConfirm(null);
      fetchOrders();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update order.', 'error');
      setConfirm(null);
    }
  };

  return (
    <DashboardLayout title="Incoming Kitchen Orders" subtitle="Production queue – prepare and fulfill customer bakery orders.">
      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--cream-light)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
          {[
            { v: '',          l: 'All Active' },
            { v: 'new',       l: 'New Orders' },
            { v: 'preparing', l: 'In Preparation' },
            { v: 'ready',     l: 'Ready for Pickup' }
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setStatusF(v)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: statusF === v ? 'var(--primary)' : 'transparent',
                color: statusF === v ? 'white' : 'var(--text-secondary)',
                fontWeight: statusF === v ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14}/> Refresh Queue
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<ChefHat size={50}/>} title="Kitchen queue is clear" message="New incoming orders will appear here automatically." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map(o => {
            const borderCol = o.status === 'new' ? '#3B82F6' : o.status === 'preparing' ? '#F59E0B' : '#10B981';
            return (
              <div
                key={o.id}
                className="card"
                style={{ borderLeft: `4px solid ${borderCol}` }}
              >
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{o.order_number}</span>
                      <StatusBadge status={o.status} />
                      {o.customer_name && <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>· {o.customer_name}</span>}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(o.items || []).map(item => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--cream-light)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '5px 10px', fontSize: 13
                          }}
                        >
                          <Package size={13} color="var(--caramel)"/>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.product_name_snapshot}</span>
                          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => viewDetail(o)}
                      title="View Details"
                      style={{ padding: '7px 12px' }}
                    >
                      <Eye size={14}/> Details
                    </button>
                    {o.status === 'new' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setConfirm({ id: o.id, action: 'start' })}
                        style={{ padding: '7px 14px' }}
                      >
                        <Play size={13}/> Start Preparing
                      </button>
                    )}
                    {o.status === 'preparing' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setConfirm({ id: o.id, action: 'ready' })}
                        style={{ padding: '7px 14px' }}
                      >
                        <CheckCircle size={13}/> Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>Order {detail.order.order_number}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Status: <StatusBadge status={detail.order.status} />
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--cream-light)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                <div><strong>Customer:</strong> {detail.order.customer_name || 'Walk-in'}</div>
                <div><strong>Placed At:</strong> {new Date(detail.order.created_at).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Items to Prepare</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(detail.items || []).map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{i.product_name_snapshot}</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Qty: {i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
              {detail.order.status === 'new' && (
                <button
                  className="btn btn-primary"
                  onClick={() => { setConfirm({ id: detail.order.id, action: 'start' }); setDetail(null); }}
                >
                  Start Preparing
                </button>
              )}
              {detail.order.status === 'preparing' && (
                <button
                  className="btn btn-success"
                  onClick={() => { setConfirm({ id: detail.order.id, action: 'ready' }); setDetail(null); }}
                >
                  Mark as Ready
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'start' ? 'Start Order Preparation' : 'Mark Order as Ready'}
        message={confirm?.action === 'start' ? 'Move this order into the kitchen preparation line?' : 'Is this order fully baked, packaged and ready for customer pickup?'}
        confirmLabel={confirm?.action === 'start' ? 'Start Preparing' : 'Mark Ready'}
        onConfirm={handleAction}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
}
