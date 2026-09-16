import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from './AuthContext.jsx';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [s, u] = await Promise.all([api.sessions(), api.users()]);
      setSessions(s.sessions);
      setUsers(u.users);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setSessions([]);
      setUsers([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const findSession = useCallback((id) => sessions.find((s) => s.id === id) || null, [sessions]);

  // Remplace une session dans le cache local sans refaire un GET /sessions complet —
  // utile après un upload de photo, où le serveur renvoie déjà la session à jour.
  const mergeSession = useCallback((session) => {
    setSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
  }, []);

  return (
    <DataContext.Provider value={{ sessions, users, loading, error, refresh, findSession, mergeSession }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
