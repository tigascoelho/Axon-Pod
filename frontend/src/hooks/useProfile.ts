import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/dataSource';

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.backend.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (updates: any) => {
    try {
      await api.backend.updateProfile({ ...profile, ...updates });
      setProfile((prev: any) => ({ ...prev, ...updates }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refresh: fetchProfile
  };
}
