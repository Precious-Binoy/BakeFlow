import { Search } from 'lucide-react';

// Reusable UI components

// ── StatusBadge ──────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    new:        'badge badge-new',
    preparing:  'badge badge-preparing',
    ready:      'badge badge-ready',
    completed:  'badge badge-completed',
    cancelled:  'badge badge-cancelled',
  };
  const label = { new: 'New', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
  return <span className={map[status] || 'badge'}>{label[status] || status}</span>;
}

// ── RoleBadge ────────────────────────────────────────────────
export function RoleBadge({ role }) {
  const cls = { admin: 'badge badge-admin', counter: 'badge badge-counter', production: 'badge badge-production' };
  const lbl = { admin: 'Admin', counter: 'Counter', production: 'Production' };
  return <span className={cls[role] || 'badge'}>{lbl[role] || role}</span>;
}

// ── ActiveBadge ──────────────────────────────────────────────
export function ActiveBadge({ active }) {
  return <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

// ── LoadingPage ──────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <Spinner size={36} />
      <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Loading…</p>
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────────
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ color: 'var(--gray-300)', marginBottom: 4 }}>{icon}</div>}
      <h3>{title || 'No data found'}</h3>
      {message && <p style={{ fontSize: 14 }}>{message}</p>}
      {action}
    </div>
  );
}

// ── ConfirmDialog ────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: 18 }}>{title}</h3>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--gray-700)', fontSize: 15 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────
export function StatCard({ icon, label, value, color = 'var(--caramel)', iconBg = '#FEF3E7' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ── SearchBar ────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
      <Search size={16} className="search-icon" />
      <input
        className="form-input"
        style={{ paddingLeft: 36 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
