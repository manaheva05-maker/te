import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const TOKEN_KEY = '@shinken_access_token';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { restoreSession(); }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }

      const data = await authAPI.me();
      setUser(data.user);
    } catch (e) {
      // ✅ FIX: Ne supprime PAS le token si c'est un timeout / erreur réseau
      // (backend Render se réveille en ~20s, l'utilisateur serait déconnecté à tort)
      const isNetworkError = (
        e?.code === 'ECONNABORTED' ||
        e?.message?.toLowerCase().includes('timeout') ||
        e?.message?.toLowerCase().includes('network error') ||
        e?.message?.toLowerCase().includes('erreur réseau')
      );
      if (!isNetworkError) {
        // Vrai 401 → token invalide → on efface
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
      // Si erreur réseau : user reste null (écran login affiché)
      // mais le token est conservé → la prochaine tentative fonctionnera
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    const data = await authAPI.login({ email, password, rememberMe });
    await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, username, aura, language) => {
    const data = await authAPI.register({ email, password, username, aura, language });
    await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.me();
      setUser(data.user);
    } catch {}
  }, []);

  const refreshToken = async () => {
    try {
      const data = await authAPI.refresh();
      if (data.accessToken) {
        await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
        return data.accessToken;
      }
    } catch {
      await logout();
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, refreshToken, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { TOKEN_KEY };
