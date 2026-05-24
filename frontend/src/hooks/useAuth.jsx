import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const SESSION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour',     value: 60 },
  { label: '2 hours',    value: 120 },
  { label: '3 hours',    value: 180 },
];

const DEFAULT_TIMEOUT = 30; // minutes

export { SESSION_OPTIONS };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    return parseInt(localStorage.getItem('sessionTimeout') || DEFAULT_TIMEOUT);
  });

  const timer = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    localStorage.setItem('lastActivity', Date.now().toString());
    timer.current = setTimeout(() => {
      logout();
      alert('Your session has expired. Please log in again.');
    }, sessionTimeout * 60 * 1000);
  }, [sessionTimeout, logout]);

  // Start timer on login, reset on activity
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
    localStorage.setItem('lastActivity', Date.now().toString());
    setUser(userData);
  };

  const updateSessionTimeout = (minutes) => {
    localStorage.setItem('sessionTimeout', minutes.toString());
    setSessionTimeout(minutes);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, sessionTimeout, updateSessionTimeout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
