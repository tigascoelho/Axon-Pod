import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/dataSource';

export function useProgress(period: 'weekly' | 'monthly' = 'weekly') {
  const [data, setData] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendData, recordsData] = await Promise.all([
        api.backend.getProgress(period),
        api.backend.getRecords()
      ]);
      setData(trendData);
      setRecords(recordsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    records,
    loading,
    error,
    refresh: fetchData
  };
}
