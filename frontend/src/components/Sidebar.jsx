import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Boxes, Users, ShoppingCart,
  ClipboardList, BarChart2, LogOut, ChefHat, History,
  PlusCircle, UtensilsCrossed, Settings
} from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin',           icon: <LayoutDashboard size={17}/>, label: 'Dashboard', end: true },
  { section: 'Catalogue' },
  { to: '/admin/products',  icon: <Package        size={17}/>, label: 'Products' },
  { to: '/admin/inventory', icon: <Boxes          size={17}/>, label: 'Inventory' },
  { section: 'Operations' },
  { to: '/admin/orders',    icon: <ShoppingCart   size={17}/>, label: 'Orders' },
  { section: 'Management' },
  { to: '/admin/staff',     icon: <Users          size={17}/>, label: 'Staff Management' },
  { to: '/admin/reports',   icon: <BarChart2      size={17}/>, label: 'Reports' },
  { to: '/admin/settings',  icon: <Settings       size={17}/>, label: 'Settings' },
];

const COUNTER_LINKS = [
  { to: '/counter',           icon: <LayoutDashboard size={17}/>, label: 'Dashboard', end: true },
  { to: '/counter/new-order', icon: <PlusCircle      size={17}/>, label: 'New Order' },
  { to: '/counter/orders',    icon: <ClipboardList   size={17}/>, label: 'Order History' },
  { to: '/counter/products',  icon: <Package         size={17}/>, label: 'Products' },
];

const PRODUCTION_LINKS = [
  { to: '/production',         icon: <LayoutDashboard size={17}/>, label: 'Dashboard', end: true },
  { to: '/production/orders',  icon: <ChefHat         size={17}/>, label: 'Incoming Orders' },
  { to: '/production/history', icon: <History         size={17}/>, label: 'Production History' },
];

const linkMap = { admin: ADMIN_LINKS, counter: COUNTER_LINKS, production: PRODUCTION_LINKS };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const links = linkMap[user?.role] || [];
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: 36, height: 36,
          background: 'var(--caramel)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <UtensilsCrossed size={18} color="white" />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 17, lineHeight: 1, letterSpacing: '-0.3px' }}>BakeFlow</div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, lineHeight: 1.3, marginTop: 2 }}>Bakery Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {links.map((link, i) =>
          link.section ? (
            <div key={i} className="sidebar-section">{link.section}</div>
          ) : (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 13px', marginBottom: 4,
          borderRadius: 8, background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--caramel)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: 'white', flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, textTransform: 'capitalize' }}>
              {user?.role === 'counter' ? 'Counter Staff' : user?.role === 'production' ? 'Production Staff' : 'Administrator'}
            </div>
          </div>
        </div>
        <button onClick={logout} className="sidebar-link" style={{ gap: 11 }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
