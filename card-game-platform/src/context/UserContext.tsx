import React, { createContext, useContext, useState, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
  coins: number;
  isGuest: boolean;
  createdAt?: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  register: (username: string, password: string) => Promise<string | null>;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  addCoins: (amount: number, reason?: string) => Promise<void>;
  spendCoins: (amount: number, reason?: string) => Promise<boolean>;
  playAsGuest: () => Promise<void>;
  transactions: { amount: number; reason: string; time: string }[];
  loading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CURRENT_KEY = 'cardgame_current';

async function api(path: string, body?: any) {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(CURRENT_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [transactions, setTransactions] = useState<{ amount: number; reason: string; time: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const saveUser = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(CURRENT_KEY, JSON.stringify(u));
    else localStorage.removeItem(CURRENT_KEY);
  };

  const register = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      setLoading(true);
      const { user: u } = await api('/api/register', { username, password });
      saveUser(u);
      setTransactions([{ amount: 2000, reason: '注册奖励', time: new Date().toLocaleString() }]);
      return null;
    } catch (e: any) { return e.message; }
    finally { setLoading(false); }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      setLoading(true);
      const { user: u } = await api('/api/login', { username, password });
      saveUser(u);
      const { transactions: txs } = await api(`/api/user/${u.id}`);
      setTransactions(txs || []);
      return null;
    } catch (e: any) { return e.message; }
    finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    saveUser(null);
    setTransactions([]);
  }, []);

  const addCoins = useCallback(async (amount: number, reason = '游戏奖励') => {
    if (!user) return;
    try {
      const { user: u } = await api('/api/coins/add', { userId: user.id, amount, reason });
      saveUser(u);
      setTransactions(prev => [{ amount, reason, time: new Date().toLocaleString() }, ...prev]);
    } catch {}
  }, [user]);

  const spendCoins = useCallback(async (amount: number, reason = '游戏入场'): Promise<boolean> => {
    if (!user) return false;
    try {
      const { user: u } = await api('/api/coins/spend', { userId: user.id, amount, reason });
      saveUser(u);
      setTransactions(prev => [{ amount: -amount, reason, time: new Date().toLocaleString() }, ...prev]);
      return true;
    } catch { return false; }
  }, [user]);

  const playAsGuest = useCallback(async () => {
    try {
      setLoading(true);
      const { user: u } = await api('/api/guest');
      saveUser(u);
      setTransactions([{ amount: 500, reason: '游客试玩金币', time: new Date().toLocaleString() }]);
    } catch { /* fallback */ }
    finally { setLoading(false); }
  }, []);

  return (
    <UserContext.Provider value={{
      user, isLoggedIn: !!user,
      register, login, logout, addCoins, spendCoins, playAsGuest,
      transactions, loading,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}
