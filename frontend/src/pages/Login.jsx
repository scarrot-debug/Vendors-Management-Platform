import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../api/client.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f4f6f9',
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e6ed',
        borderRadius: 16, padding: 40, width: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="https://www.one1.co.il/wp-content/uploads/2024/11/dark_logo.webp"
            alt="ONE Logo"
            style={{ height: 36, objectFit: 'contain', marginBottom: 20 }}
          />
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1a1d23' }}>Vendor Management</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Username', value: username, set: setUsername, type: 'text', placeholder: 'Enter username' },
            { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label style={{ fontSize: 13, color: '#374151', fontWeight: 500, display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e2e6ed', background: '#f8f9fb',
                  color: '#1a1d23', fontSize: 14, outline: 'none',
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
            background: loading ? '#e2e6ed' : '#2563eb',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
