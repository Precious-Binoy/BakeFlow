import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { SearchBar, StatusBadge, ConfirmDialog, EmptyState, Spinner } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ClipboardList, Eye, XCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function CounterOrdersPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState(searchParams.get('status') || '');
  const [detail,  setDetail]  = useState(null);
  const [cancel,  setCancel]  = useState(null);
  const [complete,setComplete]= useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/orders', { params: { search, status: statusF } })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast('Failed to load orders.', 'error'))
      .finally(() => setLoading(false));
  }, [search, statusF, toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewDetail = async (id) => {
    try {
      const r = await api.get(`/orders/${id}`);
      setDetail(r.data);
    } catch { toast('Failed to load order details.', 'error'); }
  };

  const handleCancel = async () => {
    try {
      await api.patch(`/orders/${cancel}/cancel`);
      toast('Order cancelled and stock released.', 'success');
      setCancel(null); setDetail(null); fetchOrders();
    } catch (err) { toast(err.response?.data?.message || 'Failed to cancel.', 'error'); setCancel(null); }
  };

  const handleComplete = async () => {
    try {
      await api.patch(`/orders/${complete}/complete`);
      toast('Order marked as completed!', 'success');
      setComplete(null); setDetail(null); fetchOrders();
    } catch (err) { toast(err.response?.data?.message || 'Failed to complete.', 'error'); setComplete(null); }
  };

  return (
    <DashboardLayout title="Order History" subtitle="Track customer orders and manage fulfillment status.">
      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 520 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by order # or customer..." />
          <div style={{ display: 'flex', gap: 6, background: 'var(--cream-light)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            {[
              { v: '',           l: 'All' },
              { v: 'new',        l: 'New' },
              { v: 'preparing',  l: 'Preparing' },
              { v: 'ready',      l: 'Ready' },
              { v: 'completed',  l: 'Completed' }
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setStatusF(v)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusF === v ? 'var(--primary)' : 'transparent',
                  color: statusF === v ? 'white' : 'var(--text-secondary)',
                  fontWeight: statusF === v ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} title="Refresh">
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Orders Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner size={32}/></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={<ClipboardList size={44}/>} title="No orders found" />
                    </td>
                  </tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{o.order_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.customer_name || 'Walk-in Customer'}</div>
                      {o.customer_phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customer_phone}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.item_count || '—'} items</td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{parseFloat(o.total_amount).toFixed(2)}</span>
                    </td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(o.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(o.id)} style={{ padding: '5px 8px' }}>
                          <Eye size={13}/>
                        </button>
                        {o.status === 'ready' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => setComplete(o.id)}
                            title="Complete Order"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                          >
                            <CheckCircle size={13}/> Complete
                          </button>
                        )}
                        {(o.status === 'new' || o.status === 'preparing') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCancel(o.id)}
                            title="Cancel Order"
                            style={{ padding: '5px 8px' }}
                          >
                            <XCircle size={13} color="#DC2626"/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>Order {detail.order.order_number}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {new Date(detail.order.created_at).toLocaleString('en-IN')}
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cream-light)', padding: 12, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{detail.order.customer_name || 'Walk-in Customer'}</div>
                  {detail.order.customer_phone && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{detail.order.customer_phone}</div>}
                </div>
                <StatusBadge status={detail.order.status} />
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Ordered Items</h4>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ fontSize: 13 }}>
                    <thead>
                      <tr><th>Item</th><th>Price</th><th>Qty</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                    </thead>
                    <tbody>
                      {(detail.items || []).map(i => (
                        <tr key={i.id}>
                          <td style={{ fontWeight: 600 }}>{i.product_name_snapshot}</td>
                          <td>₹{parseFloat(i.unit_price).toFixed(2)}</td>
                          <td style={{ fontWeight: 700 }}>{i.quantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{parseFloat(i.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--cream-light)', borderRadius: 8, fontSize: 16, fontWeight: 800 }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary)' }}>₹{parseFloat(detail.order.total_amount).toFixed(2)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
              {detail.order.status === 'ready' && (
                <button
                  className="btn btn-success"
                  onClick={() => { setComplete(detail.order.id); setDetail(null); }}
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        open={!!cancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? Any reserved inventory will be restored."
        confirmLabel="Cancel Order"
        danger={true}
        onConfirm={handleCancel}
        onCancel={() => setCancel(null)}
      />

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        open={!!complete}
        title="Complete Order"
        message="Has the customer picked up their items and finished payment?"
        confirmLabel="Complete Order"
        onConfirm={handleComplete}
        onCancel={() => setComplete(null)}
      />
    </DashboardLayout>
  );
}
