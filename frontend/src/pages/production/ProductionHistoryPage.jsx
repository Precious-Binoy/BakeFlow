import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, EmptyState, Spinner, SearchBar } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ClipboardList, Eye, Package, Calendar, RefreshCw } from 'lucide-react';

export default function ProductionHistoryPage() {
  const toast = useToast();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusF, setStatusF] = useState('');
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState(null);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    api.get('/production/history', { params: { status: statusF } })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast('Failed to load production history.', 'error'))
      .finally(() => setLoading(false));
  }, [statusF, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const viewDetail = async (order) => {
    try {
      const r = await api.get(`/orders/${order.id}`);
      setDetail(r.data);
    } catch {
      setDetail({ order, items: order.items || [], logs: [] });
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.items?.some(i => i.product_name_snapshot?.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout title="Production History" subtitle="Archived queue of completed and fulfilled bakery orders.">
      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 500 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search order #, customer, product..." />
          <div style={{ display: 'flex', gap: 6, background: 'var(--cream-light)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            {[
              { v: '',          l: 'All' },
              { v: 'completed', l: 'Completed' },
              { v: 'cancelled', l: 'Cancelled' }
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

        <button className="btn btn-secondary btn-sm" onClick={fetchHistory} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48}/>} title="No records found in history" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredOrders.map(o => (
            <div key={o.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>{o.order_number}</span>
                  <StatusBadge status={o.status} />
                  {o.customer_name && <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>· {o.customer_name}</span>}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {new Date(o.updated_at || o.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(o.items || []).map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'var(--cream-light)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '4px 10px', fontSize: 12
                      }}
                    >
                      <Package size={12} color="var(--caramel)"/>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.product_name_snapshot}</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(o)} style={{ padding: '6px 12px' }}>
                <Eye size={13}/> View Details
              </button>
            </div>
          ))}
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
                <div><strong>Created:</strong> {new Date(detail.order.created_at).toLocaleString('en-IN')}</div>
                <div><strong>Last Updated:</strong> {new Date(detail.order.updated_at).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Items</h4>
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
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
