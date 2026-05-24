import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export const SESSION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour',     value: 60 },
  { label: '2 hours',    value: 120 },
  { label: '3 hours',    value: 180 },
  { label: 'Never',      value: 0 },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const timer = useRef(null);

  // Load global session timeout from server
  useEffect(() => {
    if (!user) return;
    api.getSettings().then(s => {
      setSessionTimeout(parseInt(s.session_timeout) || 30);
    }).catch(() => {});
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (sessionTimeout === 0) return; // Never timeout
    timer.current = setTimeout(() => {
      logout();
      alert('Your session has expired. Please log in again.');
    }, sessionTimeout * 60 * 1000);
  }, [sessionTimeout, logout]);

  useEffect(() => {
    if (!user) return;
    resetTimer();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user, resetTimer]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateSessionTimeout = async (minutes) => {
    try {
      await api.setSessionTimeout(minutes);
      setSessionTimeout(minutes);
    } catch (err) {
      alert('Failed to save setting: ' + err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, sessionTimeout, updateSessionTimeout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
