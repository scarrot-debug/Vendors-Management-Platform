import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../api/client.js';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const sessionExpired = new URLSearchParams(window.location.search).get('expired') === '1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { token, user } = await api.login(username, password);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    const next = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr';
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f4f6f9',
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e6ed',
        borderRadius: 16, padding: 40, width: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        direction: isRTL ? 'rtl' : 'ltr',
        position: 'relative',
      }}>
        {/* Language toggle */}
        <button onClick={toggleLang} style={{
          position: 'absolute', top: 14,
          right: isRTL ? 'auto' : 14,
          left: isRTL ? 14 : 'auto',
          background: 'none', border: 'none',
          fontSize: 12, fontWeight: 600, color: '#9ca3af',
          cursor: 'pointer', padding: '2px 4px',
        }}>
          {isRTL ? 'EN' : 'עב'}
        </button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="https://www.one1.co.il/wp-content/uploads/2024/11/dark_logo.webp"
            alt="ONE Logo"
            style={{ height: 36, objectFit: 'contain', marginBottom: 20 }}
          />
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1a1d23' }}>Vendor Management</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{t('auth.login')}</p>
        </div>

        {sessionExpired && (
          <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', color:'#92400e', fontSize:13, marginBottom:16, textAlign: isRTL ? 'right' : 'left' }}>
            {t('auth.sessionExpired')}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} dir={isRTL ? 'rtl' : 'ltr'}>
          {[
            { label: t('auth.username'), value: username, set: setUsername, type: 'text', placeholder: '' },
            { label: t('auth.password'), value: password, set: setPassword, type: 'password', placeholder: '' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label style={{ fontSize: 13, color: '#374151', fontWeight: 500, display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e2e6ed', background: '#f8f9fb',
                  color: '#1a1d23', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  textAlign: isRTL ? 'right' : 'left',
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '11px', borderRadius: 8, border: 'none',
            background: loading ? '#6b7280' : '#1a1d23',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
          }}>
            {loading ? t('auth.signingIn') : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
}
