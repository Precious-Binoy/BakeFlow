import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const roleLabel = {
    admin: 'Administrator',
    counter: 'Counter Staff',
    production: 'Production Staff'
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <header className="topbar" style={{ position: 'relative', zIndex: 40 }}>
      <div>
        {title && (
          <h1 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Notifications Icon & Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
            title="Notifications"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: notifOpen ? 'var(--cream-mid)' : 'var(--cream-light)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              position: 'relative',
              transition: 'background 0.15s'
            }}
          >
            <Bell size={17} />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--terracotta)'
            }} />
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 290,
              background: 'white',
              borderRadius: 12,
              border: '1px solid var(--border)',
              boxShadow: '0 10px 25px -5px rgba(59,32,21,0.12), 0 8px 10px -6px rgba(59,32,21,0.06)',
              overflow: 'hidden',
              zIndex: 50
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications</span>
                <span style={{ fontSize: 11, color: 'var(--caramel)', fontWeight: 600 }}>Active</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>System Running Smoothly</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>All services operational</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--caramel)', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Fresh Stock Verified</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Inventory levels recorded</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* User Profile Button with Dropdown Trigger */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: dropdownOpen ? 'var(--cream-mid)' : 'transparent',
              border: 'none',
              borderRadius: 24,
              padding: '3px 6px 3px 10px',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user?.full_name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                {roleLabel[user?.role] || user?.role}
              </div>
            </div>

            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--caramel)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, color: 'white',
              boxShadow: '0 2px 6px rgba(184,121,69,0.35)',
              position: 'relative'
            }}>
              {initials}
            </div>

            <ChevronDown size={14} color="var(--text-secondary)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Google-Account Style Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 280,
              background: 'white',
              borderRadius: 16,
              border: '1px solid var(--border)',
              boxShadow: '0 15px 30px -5px rgba(59,32,21,0.15), 0 10px 15px -5px rgba(59,32,21,0.08)',
              overflow: 'hidden',
              zIndex: 50,
              animation: 'fadeIn 0.15s ease'
            }}>
              {/* Header with Avatar & User Info */}
              <div style={{
                padding: '20px 16px 16px',
                textAlign: 'center',
                background: 'linear-gradient(180deg, var(--cream-light) 0%, white 100%)',
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 20, color: 'white',
                  margin: '0 auto 10px',
                  boxShadow: '0 4px 10px rgba(81,42,24,0.25)'
                }}>
                  {initials}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {user?.email || `@${user?.username}`}
                </div>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: 'var(--cream-mid)', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                  {roleLabel[user?.role] || user?.role} • ID #{user?.id}
                </div>
              </div>

              {/* Menu Actions */}
              <div style={{ padding: '8px 6px' }}>
                <button
                  onClick={() => handleNavigate(`/${user?.role}/profile`)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600,
                    textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={16} color="var(--caramel)" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => handleNavigate(`/${user?.role}/settings`)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600,
                    textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings size={16} color="var(--caramel)" />
                  <span>Settings & Security</span>
                </button>
              </div>

              {/* Sign out */}
              <div style={{ padding: '6px', borderTop: '1px solid var(--border)', background: 'var(--cream-light)' }}>
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '9px 14px',
                    borderRadius: 8,
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    cursor: 'pointer',
                    color: '#DC2626',
                    fontSize: 13, fontWeight: 700,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
