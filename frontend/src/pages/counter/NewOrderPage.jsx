import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Spinner, EmptyState } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ShoppingCart, Plus, Minus, Trash2, Package, Search, ArrowLeft } from 'lucide-react';

const CATEGORY_FILTERS = ['All', 'Cakes', 'Pastries', 'Bread', 'Cookies', 'Muffins'];

export default function NewOrderPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [products,   setProducts]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('All');
  const [categories, setCategories] = useState([]);
  const [cart,       setCart]       = useState([]);
  const [customer,   setCustomer]   = useState({ name: '', phone: '' });
  const [placing,    setPlacing]    = useState(false);
  const [orderNo,    setOrderNo]    = useState('');

  // Generate display order number
  useEffect(() => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setOrderNo(`#BF${num}`);
  }, []);

  const fetchProducts = useCallback(() => {
    const params = { active_only: 'true' };
    if (search)                           params.search   = search;
    if (catFilter && catFilter !== 'All') params.category = catFilter;
    api.get('/products', { params })
      .then(r => setProducts(r.data.products))
      .catch(() => toast('Failed to load products.', 'error'));
  }, [search, catFilter]);

  useEffect(() => {
    fetchProducts();
    api.get('/products/categories').then(r => setCategories(r.data.categories || []));
  }, [fetchProducts]);

  const addToCart = (product) => {
    if (product.available_stock <= 0) { toast('This product is out of stock.', 'warning'); return; }
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.available_stock) { toast(`Only ${product.available_stock} units available.`, 'warning'); return prev; }
        return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        product_id:   product.id,
        product_name: product.product_name,
        price:        parseFloat(product.price),
        available:    product.available_stock,
        quantity:     1,
        image:        product.image,
      }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.product_id !== productId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > c.available) { toast(`Only ${c.available} units available.`, 'warning'); return c; }
      return { ...c, quantity: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(c => c.product_id !== productId));

  const subtotal = cart.reduce((a, c) => a + c.price * c.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) { toast('Add at least one product to the order.', 'warning'); return; }
    setPlacing(true);
    try {
      const payload = {
        customer_name:  customer.name  || null,
        customer_phone: customer.phone || null,
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
      };
      const r = await api.post('/orders', payload);
      toast(`Order ${r.data.order_number} created successfully!`, 'success');
      setCart([]);
      setCustomer({ name: '', phone: '' });
      navigate('/counter/orders');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to place order.', 'error');
    } finally { setPlacing(false); }
  };

  // All categories including DB categories merged with defaults
  const allCats = ['All', ...Array.from(new Set([...CATEGORY_FILTERS.slice(1), ...categories]))];

  return (
    <DashboardLayout title="Create New Order" subtitle="Select products and build your order">
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 132px)', margin: '-4px 0' }}>

        {/* ── LEFT: Products Panel ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }}/>
            <input
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {allCats.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 100,
                  border: '1.5px solid',
                  borderColor: catFilter === cat ? 'var(--caramel)' : 'var(--border)',
                  background: catFilter === cat ? 'var(--caramel)' : 'var(--white)',
                  color: catFilter === cat ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: "'Inter', sans-serif"
                }}
              >{cat}</button>
            ))}
          </div>

          {/* Product Grid */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {products.length === 0 ? (
              <EmptyState icon={<Package size={44}/>} title="No products found" message="Try adjusting your filters"/>
            ) : (
              <div className="product-grid">
                {products.map(p => {
                  const inCart    = cart.find(c => c.product_id === p.id);
                  const available = p.available_stock ?? 0;
                  const isOut     = available <= 0;
                  return (
                    <div
                      key={p.id}
                      className={`product-card ${isOut ? 'out-of-stock' : ''}`}
                      onClick={() => !isOut && addToCart(p)}
                    >
                      {p.image
                        ? <img
                            src={p.image}
                            alt={p.product_name}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/products/fallback.jpg'; }}
                          />
                        : <div style={{ height: 120, background: 'var(--cream-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={32} color="var(--border)"/>
                          </div>
                      }
                      <div className="card-info">
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.product_name}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>
                            ₹{parseFloat(p.price).toFixed(0)}
                          </span>
                          <span style={{ fontSize: 11, color: isOut ? '#DC2626' : 'var(--text-secondary)', fontWeight: 500 }}>
                            {isOut ? 'Out of stock' : `Stock: ${available}`}
                          </span>
                        </div>
                        {inCart ? (
                          <div style={{
                            marginTop: 8,
                            background: 'var(--caramel)',
                            borderRadius: 6,
                            textAlign: 'center',
                            padding: '4px 0',
                            color: 'white',
                            fontSize: 12, fontWeight: 700
                          }}>
                            {inCart.quantity} in order ✓
                          </div>
                        ) : isOut ? (
                          <div style={{
                            marginTop: 8,
                            background: '#FEE2E2',
                            color: '#DC2626',
                            borderRadius: 6,
                            textAlign: 'center',
                            padding: '4px 0',
                            fontSize: 11, fontWeight: 700
                          }}>
                            Out of stock
                          </div>
                        ) : (
                          <div style={{
                            marginTop: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 4,
                            background: 'var(--cream-light)',
                            borderRadius: 6,
                            padding: '4px 0',
                            color: 'var(--text-secondary)',
                            fontSize: 12, fontWeight: 600,
                            border: '1px solid var(--border)'
                          }}>
                            <Plus size={13}/> Add
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Order Summary Panel ── */}
        <div className="cart-panel" style={{ borderRadius: '14px 14px 0 0', border: '1px solid var(--border)', borderBottom: 'none' }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--cream-light)',
            borderRadius: '14px 14px 0 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <ShoppingCart size={18} color="var(--caramel)"/>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Order Summary</h3>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Order No. <strong style={{ color: 'var(--primary)' }}>{orderNo}</strong>
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Customer Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
              <input
                className="form-input"
                style={{ fontSize: 13, padding: '8px 12px' }}
                placeholder="Customer name"
                value={customer.name}
                onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
              <input
                className="form-input"
                style={{ fontSize: 13, padding: '8px 12px' }}
                placeholder="Phone number"
                value={customer.phone}
                onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Items heading */}
          <div style={{ padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Items
            </span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: 14 }}>
                <ShoppingCart size={32} style={{ marginBottom: 8, opacity: 0.3 }}/>
                <p style={{ margin: 0 }}>Click products to add</p>
              </div>
            ) : cart.map(c => (
              <div key={c.product_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0',
                borderBottom: '1px solid var(--border-light)'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {c.product_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                    ₹{c.price.toFixed(0)} × {c.quantity}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={() => updateQty(c.product_id, -1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  ><Minus size={11}/></button>
                  <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', fontSize: 14 }}>{c.quantity}</span>
                  <button
                    onClick={() => updateQty(c.product_id, 1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: '1.5px solid var(--caramel)', background: 'var(--caramel)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  ><Plus size={11} color="white"/></button>
                </div>
                <div style={{ minWidth: 52, textAlign: 'right', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  ₹{(c.price * c.quantity).toFixed(0)}
                </div>
                <button
                  onClick={() => removeFromCart(c.product_id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', padding: 2 }}
                ><Trash2 size={13}/></button>
              </div>
            ))}
          </div>

          {/* Total + Save Order */}
          <div style={{ padding: '14px 20px', borderTop: '2px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 17, fontWeight: 900 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total</span>
              <span style={{ color: 'var(--primary)' }}>₹{subtotal.toFixed(0)}</span>
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 10, fontWeight: 700, fontSize: 15 }}
              onClick={placeOrder}
              disabled={placing || cart.length === 0}
            >
              {placing ? <><Spinner size={18}/> Saving…</> : 'Save Order'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
