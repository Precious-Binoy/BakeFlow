import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { SearchBar, RoleBadge, ActiveBadge, ConfirmDialog, EmptyState, Spinner } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Plus, Edit2, ToggleLeft, ToggleRight, Users, UserCheck } from 'lucide-react';

const EMPTY_FORM = { full_name: '', username: '', email: '', password: '', role: 'counter', phone: '', is_active: true };
const ROLES = ['admin', 'counter', 'production'];

export default function StaffPage() {
  const toast = useToast();
  const [staff,     setStaff]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [formErr,   setFormErr]   = useState({});
  const [saving,    setSaving]    = useState(false);
  const [confirm,   setConfirm]   = useState(null);

  const fetchStaff = useCallback(() => {
    setLoading(true);
    api.get('/users', { params: { search, role: roleFilter } })
      .then(r => setStaff(r.data.users || []))
      .catch(() => toast('Failed to load staff.', 'error'))
      .finally(() => setLoading(false));
  }, [search, roleFilter, toast]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setFormErr({}); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({
      full_name: s.full_name,
      username:  s.username,
      email:     s.email,
      password:  '',
      role:      s.role,
      phone:     s.phone || '',
      is_active: !!s.is_active
    });
    setFormErr({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required.';
    if (!form.username.trim())  e.username  = 'Username is required.';
    if (!form.email.trim())     e.email     = 'Email is required.';
    if (!editing && !form.password) e.password = 'Password is required.';
    if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    setFormErr(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        await api.put(`/users/${editing}`, payload);
        toast('Employee updated successfully.', 'success');
      } else {
        await api.post('/users', payload);
        toast('Employee created successfully.', 'success');
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save employee.', 'error');
    } finally { setSaving(false); }
  };

  const handleToggle = async () => {
    if (!confirm) return;
    try {
      await api.patch(`/users/${confirm.id}/toggle`);
      toast(`Employee ${confirm.is_active ? 'deactivated' : 'activated'}.`, 'success');
      fetchStaff();
    } catch { toast('Failed to update status.', 'error'); }
    setConfirm(null);
  };

  return (
    <DashboardLayout title="Staff Management" subtitle="Manage your bakery team members, roles and access permissions.">
      {/* Top Filter and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 500 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search staff members..." />
          <select
            className="form-select"
            style={{ width: 150 }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>

        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16}/> + Add Employee
        </button>
      </div>

      {/* Staff Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner size={32}/></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={<Users size={44}/>} title="No staff members found" message="Add employee accounts to grant access." />
                    </td>
                  </tr>
                ) : staff.map(s => {
                  const initials = s.full_name
                    ? s.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                    : '?';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: s.role === 'admin' ? '#FEF3C7' : s.role === 'counter' ? '#E0F2FE' : '#F3E8FF',
                            color: s.role === 'admin' ? '#92400E' : s.role === 'counter' ? '#0369A1' : '#7C3AED',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.full_name}</span>
                        </div>
                      </td>
                      <td>
                        <code style={{ background: 'var(--cream-light)', padding: '2px 6px', borderRadius: 4, fontSize: 12, color: 'var(--primary)' }}>
                          {s.username}
                        </code>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.phone || '—'}</td>
                      <td><RoleBadge role={s.role} /></td>
                      <td><ActiveBadge active={s.is_active} /></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(s)}
                            title="Edit Employee"
                            style={{ padding: '5px 8px' }}
                          >
                            <Edit2 size={13}/>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setConfirm({ id: s.id, is_active: s.is_active })}
                            title={s.is_active ? 'Deactivate' : 'Activate'}
                            style={{ padding: '5px 8px' }}
                          >
                            {s.is_active ? <ToggleRight size={15} color="#10B981"/> : <ToggleLeft size={15} color="var(--text-muted)"/>}
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

      {/* Add / Edit Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{editing ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => !saving && setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className={`form-input ${formErr.full_name ? 'error' : ''}`}
                    placeholder="e.g. Rahul Mehta"
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  />
                  {formErr.full_name && <span className="form-error">{formErr.full_name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    className={`form-input ${formErr.username ? 'error' : ''}`}
                    placeholder="e.g. rahulm"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  />
                  {formErr.username && <span className="form-error">{formErr.username}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    className={`form-input ${formErr.email ? 'error' : ''}`}
                    type="email"
                    placeholder="rahul@bakeflow.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                  {formErr.email && <span className="form-error">{formErr.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  >
                    <option value="admin">Administrator</option>
                    <option value="counter">Counter Staff</option>
                    <option value="production">Production Staff</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{editing ? 'New Password (Optional)' : 'Password *'}</label>
                  <input
                    className={`form-input ${formErr.password ? 'error' : ''}`}
                    type="password"
                    placeholder={editing ? 'Leave blank to keep' : 'Min 6 characters'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  {formErr.password && <span className="form-error">{formErr.password}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="staff_active"
                  checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--caramel)' }}
                />
                <label htmlFor="staff_active" style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Account is active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size={16}/> Saving…</> : (editing ? 'Update Employee' : 'Create Employee')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.is_active ? 'Deactivate Account' : 'Activate Account'}
        message={confirm?.is_active ? 'This will revoke login access for this employee. Continue?' : 'This will restore login access for this employee. Continue?'}
        confirmLabel={confirm?.is_active ? 'Deactivate' : 'Activate'}
        danger={confirm?.is_active}
        onConfirm={handleToggle}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
}
