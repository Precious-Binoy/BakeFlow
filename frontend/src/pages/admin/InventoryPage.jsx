import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { SearchBar, EmptyState, Spinner } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Boxes, Plus, Edit2, History, AlertTriangle, ArrowUpRight, ArrowDownLeft, RefreshCw, Package } from 'lucide-react';

export default function InventoryPage() {
  const toast = useToast();
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [lowOnly,   setLowOnly]   = useState(false);

  // Modals
  const [modal,     setModal]     = useState(null); // { type: 'add'|'adjust', product }
  const [form,      setForm]      = useState({ quantity: '', new_physical_stock: '', notes: '', selectedProductId: '' });
  const [saving,    setSaving]    = useState(false);
  const [historyModal, setHistoryModal] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/inventory', { params: { search, low_stock: lowOnly ? 'true' : '' } }),
      api.get('/inventory/movements', { params: { limit: 12 } })
    ]).then(([invRes, mvRes]) => {
      setInventory(invRes.data.inventory || []);
      setMovements(mvRes.data.movements || []);
    }).catch(err => {
      console.error(err);
      toast('Failed to load inventory data.', 'error');
    }).finally(() => setLoading(false));
  }, [search, lowOnly, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = (p = null) => {
    setModal({ type: 'add', product: p });
    setForm({
      selectedProductId: p ? p.id : (inventory[0]?.id || ''),
      quantity: '',
      notes: ''
    });
  };

  const openAdjust = (p) => {
    setModal({ type: 'adjust', product: p });
    setForm({
      selectedProductId: p.id,
      new_physical_stock: p.physical_stock ?? 0,
      notes: ''
    });
  };

  const handleSave = async () => {
    const { type, product } = modal;
    const prodId = product ? product.id : form.selectedProductId;
    if (!prodId) { toast('Please select a product.', 'warning'); return; }

    setSaving(true);
    try {
      if (type === 'add') {
        const qty = parseInt(form.quantity);
        if (!qty || qty <= 0) { toast('Enter a valid positive quantity.', 'warning'); return; }
        await api.post(`/inventory/${prodId}/add`, { quantity: qty, notes: form.notes });
        toast(`Added ${qty} units to inventory.`, 'success');
      } else {
        const qty = parseInt(form.new_physical_stock);
        if (isNaN(qty) || qty < 0) { toast('Enter a valid stock quantity.', 'warning'); return; }
        await api.post(`/inventory/${prodId}/adjust`, { new_physical_stock: qty, notes: form.notes });
        toast('Physical stock adjusted.', 'success');
      }
      setModal(null);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update stock.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Inventory Management" subtitle="Track stock levels and manage inventory.">
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 500 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search inventory products..." />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={e => setLowOnly(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--caramel)' }}
            />
            Low stock only
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} title="Refresh">
            <RefreshCw size={14}/>
          </button>
          <button className="btn btn-primary" onClick={() => openAdd(null)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16}/> + Add Stock
          </button>
        </div>
      </div>

      {/* Two Column Layout: Main Table on Left, Movements on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* ── Main Inventory Table ── */}
        <div className="card">
          {loading ? (
            <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner size={32}/></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>Image</th>
                    <th>Product</th>
                    <th>Physical Stock</th>
                    <th>Reserved Stock</th>
                    <th>Available Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState icon={<Boxes size={44}/>} title="No inventory data found" />
                      </td>
                    </tr>
                  ) : inventory.map(p => {
                    const isOut = (p.available_stock ?? 0) <= 0;
                    const isLow = !isOut && (p.available_stock <= (p.reorder_level || 5));
                    return (
                      <tr key={p.id}>
                        <td>
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.product_name}
                              onError={(e) => { e.target.onerror = null; e.target.src = '/products/fallback.jpg'; }}
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                            />
                          ) : (
                            <div style={{
                              width: 40, height: 40, borderRadius: 8,
                              background: 'var(--cream-light)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 16, border: '1px solid var(--border)'
                            }}>
                              🍞
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.product_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reorder at {p.reorder_level || 5}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.physical_stock ?? 0}</span>
                        </td>
                        <td>
                          <span style={{ color: p.reserved_stock > 0 ? '#B45309' : 'var(--text-muted)', fontWeight: 600 }}>
                            {p.reserved_stock ?? 0}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 800,
                            color: isOut ? '#DC2626' : isLow ? '#D97706' : 'var(--text-primary)',
                            fontSize: 14
                          }}>
                            {p.available_stock ?? 0}
                          </span>
                        </td>
                        <td>
                          {isOut ? (
                            <span className="badge badge-cancelled" style={{ fontSize: 11, padding: '3px 8px' }}>Out</span>
                          ) : isLow ? (
                            <span className="badge badge-preparing" style={{ fontSize: 11, padding: '3px 8px' }}>Low</span>
                          ) : (
                            <span className="badge badge-ready" style={{ fontSize: 11, padding: '3px 8px' }}>OK</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openAdjust(p)}
                              title="Adjust Stock"
                              style={{ padding: '5px 8px' }}
                            >
                              <Edit2 size={12}/>
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openAdd(p)}
                              title="Add Stock"
                              style={{ padding: '5px 8px' }}
                            >
                              <Plus size={12}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recent Stock Movements Panel ── */}
        <div className="card">
          <div className="card-header" style={{ padding: '14px 18px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recent Stock Movements</h3>
            <button
              onClick={() => setHistoryModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--caramel)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              View All
            </button>
          </div>
          <div style={{ padding: '4px 0' }}>
            {movements.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No stock movements logged yet.
              </div>
            ) : movements.slice(0, 8).map(m => {
              const isPositive = m.quantity > 0;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 18px',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: isPositive ? '#ECFDF5' : '#FEF2F2',
                      color: isPositive ? '#059669' : '#DC2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isPositive ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span style={{ color: isPositive ? '#059669' : '#DC2626', marginRight: 4 }}>
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </span>
                        {m.product_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {m.movement_type === 'add' ? 'Production batch' : m.movement_type === 'order' ? 'Counter order' : 'Adjustment'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Adjust Stock Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => !saving && setModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>
                {modal.type === 'add' ? 'Add Stock' : 'Adjust Physical Stock'}
              </h3>
              <button onClick={() => !saving && setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {modal.product ? (
                <div style={{ background: 'var(--cream-light)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{modal.product.product_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Current Physical: <strong>{modal.product.physical_stock}</strong> · Available: <strong>{modal.product.available_stock}</strong>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Select Product</label>
                  <select
                    className="form-select"
                    value={form.selectedProductId}
                    onChange={e => setForm(p => ({ ...p, selectedProductId: e.target.value }))}
                  >
                    {inventory.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.product_name} (Current: {i.physical_stock})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modal.type === 'add' ? (
                <div className="form-group">
                  <label className="form-label">Quantity to Add *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    placeholder="e.g. 20"
                    value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">New Physical Stock Count *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.new_physical_stock}
                    onChange={e => setForm(p => ({ ...p, new_physical_stock: e.target.value }))}
                    autoFocus
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  className="form-input"
                  placeholder="e.g. Fresh morning bake batch"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size={16}/> Saving…</> : (modal.type === 'add' ? 'Add Stock' : 'Save Adjustment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Movement History Modal */}
      {historyModal && (
        <div className="modal-overlay" onClick={() => setHistoryModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>Stock Movement History</h3>
              <button onClick={() => setHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Product</th>
                    <th>Change</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {new Date(m.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.product_name}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: m.quantity > 0 ? '#059669' : '#DC2626' }}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{m.movement_type}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
