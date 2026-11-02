import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, Lock, User, ShieldCheck, Store, ChefHat, UtensilsCrossed } from 'lucide-react';
import { Spinner } from '../../components/UI';

const ROLE_HOME = { admin: '/admin', counter: '/counter', production: '/production' };

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.identifier.trim()) e.identifier = 'Username or email is required.';
    if (!form.password)          e.password   = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.identifier, form.password);
      toast('Welcome back, ' + user.full_name + '!', 'success');
      navigate(ROLE_HOME[user.role] || '/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--cream)',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div style={{
        flex: '0 0 48%',
        background: 'linear-gradient(160deg, #3B2015 0%, #512A18 40%, #6B3A22 70%, #B87945 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Bakery photo overlay using gradient art */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 30% 25%, rgba(184,121,69,0.25) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 70%, rgba(198,106,56,0.15) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />

        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(184,121,69,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 160, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 200, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(198,106,56,0.10)', pointerEvents: 'none' }} />

        {/* Top brand mark */}
        <div style={{ position: 'absolute', top: 40, left: 48, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UtensilsCrossed size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>BakeFlow</span>
        </div>

        {/* Decorative bread icons */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.06 }}>
          <UtensilsCrossed size={280} color="white" />
        </div>

        {/* Bottom copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{
            color: 'white', fontSize: 44, fontWeight: 900,
            lineHeight: 1.1, letterSpacing: '-1px',
            marginBottom: 16,
            textShadow: '0 2px 12px rgba(0,0,0,0.25)'
          }}>
            Fresh Bakes,<br />Better Days
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.70)',
            fontSize: 15, lineHeight: 1.7,
            maxWidth: 300
          }}>
            Streamlined operations for<br />a sweeter tomorrow.
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
            {['Bakery Production', 'Counter Orders', 'Live Inventory'].map(tag => (
              <span key={tag} style={{
                padding: '5px 12px',
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 100,
                color: 'rgba(255,255,255,0.80)',
                fontSize: 12, fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.15)'
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: 'var(--white)',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'slideUp 0.3s ease' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 58, height: 58,
              background: 'var(--primary)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 6px 20px rgba(81,42,24,0.25)'
            }}>
              <UtensilsCrossed size={28} color="white" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>
              BakeFlow
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Bakery Production &amp; Counter Management System
            </p>
          </div>

          {/* Welcome */}
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Identifier */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="login-identifier">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-identifier"
                  className={`form-input ${errors.identifier ? 'error' : ''}`}
                  style={{ paddingLeft: 38 }}
                  type="text"
                  value={form.identifier}
                  onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
                  placeholder="Username or Email"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.identifier && <span className="form-error">{errors.identifier}</span>}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', padding: 0
                  }}
                >
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', borderRadius: 8, fontWeight: 700, fontSize: 15 }}
            >
              {loading ? <><Spinner size={18}/> Signing in…</> : 'Login'}
            </button>
          </form>

          {/* Role indicators */}
          <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
              Login as
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {[
                { icon: <ShieldCheck size={20}/>, label: 'Admin', color: '#92400E', bg: '#FEF3C7' },
                { icon: <Store       size={20}/>, label: 'Counter Staff', color: '#0369A1', bg: '#E0F2FE' },
                { icon: <ChefHat     size={20}/>, label: 'Production Staff', color: '#7C3AED', bg: '#F3E8FF' },
              ].map(({ icon, label, color, bg }) => (
                <div key={label} style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px',
                  background: bg,
                  borderRadius: 10,
                  border: `1px solid ${color}22`,
                  cursor: 'default'
                }}>
                  <span style={{ color }}>{icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 24 }}>
            BakeFlow v1.0 · College Mini Project
          </p>
        </div>
      </div>
    </div>
  );
}
