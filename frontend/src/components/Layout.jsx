import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  LayoutDashboard, Users, BookOpen, FileText, CheckSquare,
  BarChart2, Settings as SettingsIcon, ShieldCheck, LogOut, User, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { VERSION } from '../version.js';
import { useTranslation } from 'react-i18next';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/vendors',   icon: Users,           labelKey: 'nav.vendors' },
  { to: '/catalog',   icon: BookOpen,        labelKey: 'nav.catalog' },
  { to: '/requests',  icon: FileText,        labelKey: 'nav.requests' },
  { to: '/approvals', icon: CheckSquare,     labelKey: 'nav.approvals' },
  { to: '#',          icon: BarChart2,       labelKey: 'nav.reports' },
  { to: '/settings',  icon: SettingsIcon,    labelKey: 'nav.settings', adminOnly: true },
  { to: '#',          icon: ShieldCheck,     labelKey: 'nav.admin' },
];

export default function Layout() {
  const { user, logout, logo } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  // Read from localStorage directly — synchronous, no flash
  const [isRTL, setIsRTL] = useState(() => localStorage.getItem('language') === 'he');

  const handleLogout = () => { logout(); navigate('/login'); };

  const switchLanguage = (lang) => {
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    setIsRTL(lang === 'he');
    setUserMenuOpen(false);
  };

  // Set document direction on mount
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  const DEFAULT_LOGO = "https://www.one1.co.il/wp-content/uploads/2024/11/dark_logo.webp";
  const logoSrc = logo || DEFAULT_LOGO;

  // RTL-aware collapse button position
  const collapseLeft = isRTL
    ? (collapsed ? 'auto' : 'auto')
    : (collapsed ? 48 : 204);
  const collapseRight = isRTL
    ? (collapsed ? 48 : 204)
    : 'auto';

  // Arrow direction: in LTR collapse=left arrow, in RTL collapse=right arrow, flips when collapsed
  const CollapseIcon = isRTL
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft);

  const sidebarEl = (
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
        {NAV.filter(item => !item.adminOnly || user?.role === 'admin').map(({ to, icon: Icon, labelKey }) => {
          const label = t(labelKey);
          return to === '#' ? (
          <div key={labelKey} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 7,
            color: 'rgba(255,255,255,0.35)', fontSize: 14, whiteSpace: 'nowrap',
            borderLeft: isRTL ? 'none' : '3px solid transparent',
            borderRight: isRTL ? '3px solid transparent' : 'none',
            cursor: 'default',
          }}>
            <Icon size={17} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.35)' }}/>
            {!collapsed && label}
          </div>
        ) : (
          <NavLink key={labelKey} to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 7,
              color: '#ffffff', background: 'transparent',
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              borderLeft: isRTL ? 'none' : (isActive ? '3px solid #fff' : '3px solid transparent'),
              borderRight: isRTL ? (isActive ? '3px solid #fff' : '3px solid transparent') : 'none',
              paddingLeft: isRTL ? 10 : (isActive ? 8 : 10),
              paddingRight: isRTL ? (isActive ? 8 : 10) : 10,
            })}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon size={17} style={{ flexShrink: 0, color: '#fff' }}/>
            {!collapsed && label}
          </NavLink>
        );})}
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
  );

  const mainEl = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f6f9' }}>
      {/* Top bar with user dropdown */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '12px 24px', gap: 16, flexShrink: 0,
      }}>
        {/* User dropdown */}
        <div style={{ position:'relative' }}>
          <button onClick={()=>setUserMenuOpen(v=>!v)} style={{
            display:'flex', alignItems:'center', gap:8, padding:'6px 12px',
            borderRadius:8, border:'1px solid #e2e6ed', background:'#fff',
            cursor:'pointer', transition:'all 0.15s',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8f9fb'}
            onMouseLeave={e=>e.currentTarget.style.background='#fff'}
          >
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:600, color:'#fff',
            }}>{user?.username?.[0]?.toUpperCase()}</div>
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div style={{ fontSize:13, fontWeight:500, color:'#1a1d23' }}>{user?.username}</div>
              <div style={{ fontSize:11, color:'#9ca3af', textTransform:'capitalize' }}>{user?.role}</div>
            </div>
            <ChevronDown size={14} style={{ color:'#9ca3af', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}/>
          </button>

          {userMenuOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:200,
              background:'#fff', border:'1px solid #e2e6ed', borderRadius:10,
              boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:200, overflow:'hidden',
            }} onMouseLeave={()=>setUserMenuOpen(false)}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1a1d23' }}>{user?.username}</div>
                <div style={{ fontSize:12, color:'#9ca3af', textTransform:'capitalize' }}>{user?.role}</div>
              </div>
              <button onClick={()=>{ navigate('/profile'); setUserMenuOpen(false); }} style={{
                display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 16px',
                background:'none', border:'none', fontSize:13, color:'#374151', cursor:'pointer', textAlign: isRTL ? 'right' : 'left',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8f9fb'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              >
                <User size={14}/> {t('profile.title')}
              </button>
              <div style={{ height:1, background:'#f1f5f9' }}/>
              {/* Language switcher */}
              <div style={{ padding:'8px 16px' }}>
                <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6, fontWeight:500, textTransform:'uppercase' }}>{t('language.label')}</div>
                <div style={{ display:'flex', gap:6 }}>
                  {[
                    { code:'en', flag:'🇺🇸', label:'US-EN' },
                    { code:'he', flag:'🇮🇱', label:'IL-HE' },
                  ].map(({ code, flag, label }) => (
                    <button key={code} onClick={()=>switchLanguage(code)} style={{
                      flex:1, padding:'6px 4px', borderRadius:6, border:'1px solid',
                      borderColor: i18n.language===code ? '#1a1d23' : '#e2e6ed',
                      background: i18n.language===code ? '#1a1d23' : '#fff',
                      color: i18n.language===code ? '#fff' : '#374151',
                      fontSize:12, cursor:'pointer', fontWeight:600,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                    }}>
                      <span style={{ fontSize:16 }}>{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height:1, background:'#f1f5f9' }}/>
              <button onClick={handleLogout} style={{
                display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 16px',
                background:'none', border:'none', fontSize:13, color:'#dc2626', cursor:'pointer', textAlign: isRTL ? 'right' : 'left',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}
              >
                <LogOut size={14}/> {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet/>
      </main>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(c => !c)} style={{
        position: 'fixed',
        left: isRTL ? 'auto' : (collapsed ? 48 : 204),
        right: isRTL ? (collapsed ? 48 : 204) : 'auto',
        top: 20, zIndex: 100,
        width: 22, height: 22, borderRadius: '50%', border: '1px solid #e2e6ed',
        background: '#fff', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'left 0.2s ease, right 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <CollapseIcon size={12}/>
      </button>

      {sidebarEl}
      {mainEl}
    </div>
  );
}
