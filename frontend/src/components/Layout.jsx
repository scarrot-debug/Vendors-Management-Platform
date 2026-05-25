import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  LayoutDashboard, Users, BookOpen, FileText, CheckSquare,
  BarChart2, Settings as SettingsIcon, ShieldCheck, LogOut, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import { VERSION } from '../version.js';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendors',   icon: Users,           label: 'Vendors' },
  { to: '#',          icon: BookOpen,         label: 'Catalog' },
  { to: '#',          icon: FileText,         label: 'Requests' },
  { to: '#',          icon: CheckSquare,      label: 'Approvals' },
  { to: '#',          icon: BarChart2,        label: 'Reports' },
  { to: '/settings',  icon: SettingsIcon,     label: 'Settings', adminOnly: true },
  { to: '#',          icon: ShieldCheck,      label: 'Admin' },
];

export default function Layout() {
  const { user, logout, logo } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const DEFAULT_LOGO = "https://www.one1.co.il/wp-content/uploads/2024/11/dark_logo.webp";
  const logoSrc = logo || DEFAULT_LOGO;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 64 : 220,
        background: '#1a1d23',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 68,
        }}>
          <img src={logoSrc} alt="Logo" style={{
            height: 30, objectFit: 'contain',
            maxWidth: collapsed ? 32 : 160,
            transition: 'max-width 0.2s ease',
          }}/>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.filter(item => !item.adminOnly || user?.role === 'admin').map(({ to, icon: Icon, label }) => to === '#' ? (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 7,
              color: 'rgba(255,255,255,0.35)', fontSize: 14, whiteSpace: 'nowrap',
              borderLeft: '3px solid transparent', cursor: 'default',
            }}>
              <Icon size={17} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.35)' }}/>
              {!collapsed && label}
            </div>
          ) : (
            <NavLink key={label} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 7,
                color: '#ffffff', background: 'transparent',
                textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
                borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                paddingLeft: isActive ? 8 : 10,
              })}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={17} style={{ flexShrink: 0, color: '#fff' }}/>
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Version at bottom */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {!collapsed && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '4px 0' }}>
              {VERSION}
            </div>
          )}
        </div>
      </aside>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(c => !c)} style={{
        position: 'fixed', left: collapsed ? 48 : 204, top: 20, zIndex: 100,
        width: 22, height: 22, borderRadius: '50%', border: '1px solid #e2e6ed',
        background: '#fff', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'left 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <ChevronLeft size={12} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
      </button>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f6f9' }}>
        {/* Top bar - transparent, floating */}
        <div style={{
          height: 48, background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: 16, flexShrink: 0,
        }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
            }}>{user?.username?.[0]?.toUpperCase() || 'A'}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d23' }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <div style={{ width: 1, height: 24, background: '#d1d5db' }}/>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e6ed',
            background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.background = '#fff'; }}
          >
            <LogOut size={14}/> Logout
          </button>
        </div>
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
