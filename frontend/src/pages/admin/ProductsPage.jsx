import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { ActiveBadge, ConfirmDialog, EmptyState, LoadingPage, Spinner } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Plus, Edit2, ToggleLeft, ToggleRight, Package, Search, Eye, X, CheckCircle, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Bread', 'Cakes', 'Cookies', 'Muffins', 'Pastries', 'Other'];
const EMPTY_FORM  = { product_name: '', description: '', category: '', price: '', reorder_level: '10', is_active: true };

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [showModal,setShowModal]= useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [formErr,  setFormErr]  = useState({});
  const [imgFile,  setImgFile]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)    params.search   = search;
    if (catFilter) params.category = catFilter;
    api.get('/products', { params })
      .then(r => setProducts(r.data.products || []))
      .catch(() => toast('Failed to load products.', 'error'))
      .finally(() => setLoading(false));
  }, [search, catFilter, toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setImgFile(null); setFormErr({}); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      product_name:  p.product_name,
      description:   p.description || '',
      category:      p.category,
      price:         p.price,
      reorder_level: p.reorder_level,
      is_active:     !!p.is_active
    });
    setImgFile(null);
    setFormErr({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.product_name.trim()) e.product_name = 'Name is required.';
    if (!form.category)            e.category     = 'Category is required.';
    if (!form.price || isNaN(form.price) || parseFloat(form.price) < 0) e.price = 'Valid price required.';
    setFormErr(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imgFile) fd.append('image', imgFile);

      if (editing) {
        await api.put(`/products/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast('Product updated successfully.', 'success');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast('Product added successfully.', 'success');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save product.', 'error');
    } finally { setSaving(false); }
  };

  const handleToggle = async () => {
    if (!confirm) return;
    try {
      await api.patch(`/products/${confirm.id}/toggle`);
      toast(`Product ${confirm.is_active ? 'deactivated' : 'activated'}.`, 'success');
      fetchProducts();
    } catch { toast('Failed to update product status.', 'error'); }
    setConfirm(null);
  };

  return (
    <DashboardLayout
      title="Product Management"
      subtitle={isAdmin ? "Manage your bakery products, inventory stock, and pricing." : "Browse available bakery products and inventory availability."}
    >
      {/* Top Filter and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 520 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 38 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name..."
            />
          </div>
          <select
            className="form-select"
            style={{ width: 170 }}
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16}/> + Add Product
          </button>
        )}
      </div>

      {/* Products Table Card */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner size={32}/></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 68 }}>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', minWidth: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={<Package size={44}/>} title="No products found" message="Try adjusting your search or category filter." />
                    </td>
                  </tr>
                ) : products.map(p => {
                  const available = p.available_stock ?? 0;
                  const isLow = available <= (p.reorder_level || 5);
                  return (
                    <tr
                      key={p.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewProduct(p)}
                    >
                      <td onClick={e => { e.stopPropagation(); setViewProduct(p); }}>
                        <div style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--cream-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.product_name}
                              onError={(e) => { e.target.onerror = null; e.target.src = '/products/fallback.jpg'; }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: 20 }}>🧁</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.product_name}</div>
                        {p.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>
                          ₹{parseFloat(p.price).toFixed(0)}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: isLow ? '#DC2626' : 'var(--text-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {isLow && <AlertTriangle size={12} color="#DC2626" />}
                          {available}
                        </span>
                      </td>
                      <td>
                        <ActiveBadge active={p.is_active} />
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {/* View details action */}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setViewProduct(p)}
                            title="View Product Details"
                            style={{ padding: '6px 9px' }}
                          >
                            <Eye size={14} color="var(--primary)" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => openEdit(p)}
                                title="Edit Product"
                                style={{ padding: '6px 9px' }}
                              >
                                <Edit2 size={13}/>
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setConfirm({ id: p.id, is_active: p.is_active })}
                                title={p.is_active ? 'Deactivate' : 'Activate'}
                                style={{ padding: '6px 9px' }}
                              >
                                {p.is_active ? <ToggleRight size={15} color="#10B981"/> : <ToggleLeft size={15} color="var(--text-muted)"/>}
                              </button>
                            </>
                          )}
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

      {/* Product Details View Modal */}
      {viewProduct && (
        <div className="modal-overlay" onClick={() => setViewProduct(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>Product Details</h3>
              <button onClick={() => setViewProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Product Image */}
              <div style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', background: 'var(--cream-light)', border: '1px solid var(--border)' }}>
                <img
                  src={viewProduct.image || '/products/fallback.jpg'}
                  alt={viewProduct.product_name}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/products/fallback.jpg'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {viewProduct.product_name}
                  </h2>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Category: <strong>{viewProduct.category}</strong>
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>
                    ₹{parseFloat(viewProduct.price).toFixed(0)}
                  </div>
                  <ActiveBadge active={viewProduct.is_active} />
                </div>
              </div>

              {/* Description */}
              {viewProduct.description && (
                <div style={{ background: 'var(--cream-light)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {viewProduct.description}
                </div>
              )}

              {/* Stock Breakdown */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                textAlign: 'center',
                padding: '14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'white'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>AVAILABLE STOCK</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                    {viewProduct.available_stock ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>PHYSICAL STOCK</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {viewProduct.physical_stock ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>REORDER LEVEL</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626', marginTop: 2 }}>
                    {viewProduct.reorder_level ?? 10}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setViewProduct(null)}>Close</button>
              {isAdmin && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const p = viewProduct;
                    setViewProduct(null);
                    openEdit(p);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit2 size={14} /> Edit Product
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{editing ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => !saving && setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className={`form-input ${formErr.product_name ? 'error' : ''}`}
                    placeholder="e.g. Chocolate Cake"
                    value={form.product_name}
                    onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))}
                  />
                  {formErr.product_name && <span className="form-error">{formErr.product_name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className={`form-select ${formErr.category ? 'error' : ''}`}
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErr.category && <span className="form-error">{formErr.category}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    className={`form-input ${formErr.price ? 'error' : ''}`}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="350"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  />
                  {formErr.price && <span className="form-error">{formErr.price}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={e => setForm(p => ({ ...p, reorder_level: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Freshly baked with rich Belgian chocolate..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImgFile(e.target.files[0])}
                  style={{ fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--caramel)' }}
                />
                <label htmlFor="is_active" style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Product is active (available for counter order)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size={16}/> Saving…</> : (editing ? 'Update Product' : 'Add Product')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate/Activate Dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.is_active ? 'Deactivate Product' : 'Activate Product'}
        message={confirm?.is_active ? 'This product will be hidden from the counter ordering screen.' : 'This product will be made available for counter ordering.'}
        confirmLabel={confirm?.is_active ? 'Deactivate' : 'Activate'}
        danger={confirm?.is_active}
        onConfirm={handleToggle}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
}
