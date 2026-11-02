import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { User, Mail, Phone, Shield, Calendar, Key, CheckCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const roleLabel = {
    admin: 'Administrator',
    counter: 'Counter Staff',
    production: 'Production Staff'
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await api.patch('/auth/profile', form);
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast('Profile updated successfully!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="My Profile" subtitle="View and manage your account details">
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Top Profile Card Banner */}
        <div className="card" style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          background: 'linear-gradient(135deg, white 0%, var(--cream-light) 100%)',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 800,
            color: 'white',
            boxShadow: '0 4px 12px rgba(81,42,24,0.25)',
            flexShrink: 0
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {user?.full_name}
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                background: 'var(--cream-mid)',
                color: 'var(--primary)',
                border: '1px solid var(--border)'
              }}>
                <Shield size={13} color="var(--caramel)" />
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 8, color: 'var(--text-secondary)', fontSize: 13, flexWrap: 'wrap' }}>
              <div>User ID: <strong style={{ color: 'var(--text-primary)' }}>#{user?.id}</strong></div>
              <div>Username: <strong style={{ color: 'var(--text-primary)' }}>@{user?.username}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontWeight: 600 }}>
                <CheckCircle size={14} /> Active Account
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information & Edit Form */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Personal Information
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Update your display name, contact email, and phone number.
            </p>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} color="var(--caramel)" />
                  Full Name *
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.full_name ? 'error' : ''}`}
                  placeholder="e.g. Sarah Jenkins"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                />
                {errors.full_name && <span className="form-error">{errors.full_name}</span>}
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="var(--caramel)" />
                  Email Address
                </label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="e.g. sarah@bakeflow.local"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="var(--caramel)" />
                  Phone Number
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>

              {/* Username (Read Only) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Key size={14} color="var(--text-muted)" />
                  Username (System ID)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.username || ''}
                  disabled
                  style={{ background: 'var(--cream-light)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
                />
              </div>
            </div>

            {/* Read-only Account Details */}
            <div style={{
              background: 'var(--cream-light)',
              borderRadius: 10,
              padding: '14px 18px',
              border: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              fontSize: 12,
              color: 'var(--text-secondary)'
            }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Assigned Role: </span>
                {roleLabel[user?.role] || user?.role}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Account Status: </span>
                Active
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Member Since: </span>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'November 2026'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ minWidth: 150, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

