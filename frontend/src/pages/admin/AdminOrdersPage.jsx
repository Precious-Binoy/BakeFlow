import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { SearchBar, StatusBadge, ConfirmDialog, EmptyState, Spinner } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ClipboardList, Eye, XCircle, RefreshCw, Calendar } from 'lucide-react';

export default function AdminOrdersPage() {
  const toast = useToast();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [fromDate,setFromDate]= useState('');
  const [toDate,  setToDate]  = useState('');
  const [detail,  setDetail]  = useState(null);
  const [cancel,  setCancel]  = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/orders', { params: { search, status: statusF, from_date: fromDate, to_date: toDate } })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast('Failed to load orders.', 'error'))
      .finally(() => setLoading(false));
  }, [search, statusF, fromDate, toDate, toast]);

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
      toast('Order cancelled and reserved stock restored.', 'success');
      setDetail(null); setCancel(null);
      fetchOrders();
    } catch (err) { toast(err.response?.data?.message || 'Failed to cancel.', 'error'); setCancel(null); }
  };

  return (
    <DashboardLayout title="Orders" subtitle="Monitor and manage all bakery counter orders and transactions.">
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search order # or customer..." />
        <select className="form-select" style={{ width: 150 }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          {['new','preparing','ready','completed','cancelled'].map(s => (
            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '3px 8px' }}>
          <Calendar size={13} color="var(--text-muted)" />
          <input
            className="form-input"
            type="date"
            style={{ width: 130, border: 'none', padding: '4px 6px', fontSize: 12 }}
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            title="From date"
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>to</span>
          <input
            className="form-input"
            type="date"
            style={{ width: 130, border: 'none', padding: '4px 6px', fontSize: 12 }}
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            title="To date"
          />
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setSearch(''); setStatusF(''); setFromDate(''); setToDate(''); }}
        >
          Reset Filters
        </button>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

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
                  <th>Amount</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date &amp; Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={<ClipboardList size={44}/>} title="No orders found matching filters" />
                    </td>
                  </tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{o.order_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.customer_name || 'Walk-in'}</div>
                      {o.customer_phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customer_phone}</div>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{parseFloat(o.total_amount).toFixed(2)}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.item_count || '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{o.created_by_name || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(o.id)} style={{ padding: '5px 8px' }}>
                          <Eye size={13}/>
                        </button>
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

      {/* Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>Order {detail.order.order_number}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {new Date(detail.order.created_at).toLocaleString('en-IN')} · Created by {detail.order.created_by_name || 'Staff'}
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cream-light)', padding: 12, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{detail.order.customer_name || 'Walk-in Customer'}</div>
                  {detail.order.customer_phone && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{detail.order.customer_phone}</div>}
                </div>
                <StatusBadge status={detail.order.status} />
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Order Items</h4>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ fontSize: 13 }}>
                    <thead>
                      <tr><th>Item</th><th>Unit Price</th><th>Qty</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr>
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
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        open={!!cancel}
        title="Cancel Order"
        message="Cancel this order? Reserved stock will be restored."
        confirmLabel="Cancel Order"
        danger={true}
        onConfirm={handleCancel}
        onCancel={() => setCancel(null)}
      />
    </DashboardLayout>
  );
}
