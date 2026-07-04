import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/dataSource';

export function useSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.backend.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    
    // Listen for local updates if we're in mock mode (sync simulation)
    const handleUpdate = () => fetchSessions();
    window.addEventListener('sessions_updated', handleUpdate);
    return () => window.removeEventListener('sessions_updated', handleUpdate);
  }, [fetchSessions]);

  return { 
    sessions, 
    loading, 
    error, 
    reload: fetchSessions,
    isEmpty: !loading && sessions.length === 0
  };
}
