import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  Lock, Eye, EyeOff, Bell, Volume2, ShieldCheck,
  CheckCircle, AlertCircle, Save, Sliders
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  // Password state
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading,  setPwdLoading]  = useState(false);
  const [pwdErrors,   setPwdErrors]   = useState({});

  // Notification Preferences (stored in localStorage)
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('bakeflow_user_prefs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      orderSounds: true,
      lowStockAlerts: true,
      autoRefresh: true,
      compactView: false
    };
  });

  const togglePref = (key) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('bakeflow_user_prefs', JSON.stringify(next));
      toast('Preference saved.', 'info');
      return next;
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwdForm.currentPassword) errs.currentPassword = 'Enter your current password.';
    if (!pwdForm.newPassword)     errs.newPassword = 'Enter a new password.';
    else if (pwdForm.newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters.';
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errs).length > 0) {
      setPwdErrors(errs);
      return;
    }

    setPwdLoading(true);
    setPwdErrors({});
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      toast('Password changed successfully!', 'success');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const roleLabel = {
    admin: 'Administrator',
    counter: 'Counter Staff',
    production: 'Production Staff'
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your security, password, and preferences">
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Change Password Card */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--cream-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={18} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Change Password
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
                  Ensure your account uses a secure password of at least 6 characters.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className={`form-input ${pwdErrors.currentPassword ? 'error' : ''}`}
                  placeholder="Enter current password"
                  value={pwdForm.currentPassword}
                  onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                  }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwdErrors.currentPassword && <span className="form-error">{pwdErrors.currentPassword}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className={`form-input ${pwdErrors.newPassword ? 'error' : ''}`}
                    placeholder="At least 6 characters"
                    value={pwdForm.newPassword}
                    onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                    }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdErrors.newPassword && <span className="form-error">{pwdErrors.newPassword}</span>}
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`form-input ${pwdErrors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter new password"
                    value={pwdForm.confirmPassword}
                    onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                    }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdErrors.confirmPassword && <span className="form-error">{pwdErrors.confirmPassword}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwdLoading}
                style={{ minWidth: 160, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Lock size={15} />
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Notification & Workspace Preferences */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--cream-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={18} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Preferences & Alerts
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
                  Customize your local system sound notifications and dashboard refresh behavior.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Audio Alerts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--cream-light)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Volume2 size={20} color="var(--caramel)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Order Audio Chimes</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Play sound notifications when orders move to ready or new orders arrive</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePref('orderSounds')}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: prefs.orderSounds ? 'var(--caramel)' : '#D1D5DB',
                  position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: prefs.orderSounds ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            {/* Low Stock Alerts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--cream-light)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bell size={20} color="var(--caramel)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Low Stock Indicators</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Highlight items below reorder threshold on POS and Inventory screens</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePref('lowStockAlerts')}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: prefs.lowStockAlerts ? 'var(--caramel)' : '#D1D5DB',
                  position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: prefs.lowStockAlerts ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            {/* Auto Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--cream-light)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={20} color="var(--caramel)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Live Dashboard Sync</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Automatically refresh orders and status counters on dashboard screens</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => togglePref('autoRefresh')}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: prefs.autoRefresh ? 'var(--caramel)' : '#D1D5DB',
                  position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: prefs.autoRefresh ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="card" style={{ padding: '20px 24px', background: 'var(--cream-light)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <ShieldCheck size={18} color="#10B981" />
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Session & Security Overview</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.full_name}</strong> ({roleLabel[user?.role] || user?.role}).
            Your session is secured using signed HTTP-only cookies with role-based route verification. Session duration: 8 hours.
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

