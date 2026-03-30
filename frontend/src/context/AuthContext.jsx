import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       if (token) {
//         try {
//           const response = await authService.getProfile();
//           setUser(response.data.user);
//         } catch {
//           logout();
//         }
//       }
//       setLoading(false);
//     };
//     initAuth();
//   }, [token]);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken]   = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
 
      // ── TEMPORARY: skip API verification for mock token ──
      // Remove this block when backend is ready
      if (token === 'mock-token') {
        setLoading(false);
        return;
      }
      // ── END temporary ──
 
      // Real token — verify with backend
      try {
        const response = await authService.getProfile();
        setUser(response.data.user);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
 
    initAuth();
  }, [token]);
  
  const login = (tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    // <AuthContext.Provider value={{ user, token, loading, login, logout }}>
    //   {children}
    // </AuthContext.Provider>
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
  {!loading && children}
  </AuthContext.Provider>
  );
};
