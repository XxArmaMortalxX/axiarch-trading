import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('axiarch_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = useCallback((email) => {
    const userData = { email, initial: email.charAt(0).toUpperCase(), loginAt: Date.now() };
    localStorage.setItem('axiarch_user', JSON.stringify(userData));
    setUser(userData);

    // Store email for marketing (non-blocking)
    fetch('/.netlify/functions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'login' }),
    }).catch(() => {});
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('axiarch_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
