import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/dataSource';

export function usePodStatus() {
  const [podStatus, setPodStatus] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const failureCount = useRef(0);
  const isPolling = useRef(false);
  const lastState = useRef('OFFLINE');

  const fetchStatus = useCallback(async () => {
    if (isPolling.current) return;
    isPolling.current = true;
    
    try {
      const data = await api.pod.getStatus();
      const connected = !!data.connected;
      setPodStatus(data);
      // Only mark connected when the pod explicitly reports it's connected.
      if (connected) {
        setIsConnected(true);
        lastState.current = data.state || lastState.current;
        failureCount.current = 0; // reset on success
        setError(null);
      } else {
        // Pod responded but reports not connected; treat as a soft failure.
        failureCount.current += 1;
        if (failureCount.current >= 3) {
          setIsConnected(false);
          lastState.current = data.state || lastState.current;
          setError('Pod not connected');
        }
      }
    } catch (err: any) {
      failureCount.current += 1;
      
      // Fallback logic: allow brief misses (e.g., 2 dropped packets) before declaring offline
      if (failureCount.current >= 3) {
        setIsConnected(false);
        lastState.current = 'OFFLINE';
        setError(err.message || 'Pod disconnected');
      }
    } finally {
      if (loading) setLoading(false);
      isPolling.current = false;
    }
  }, [loading]);

  useEffect(() => {
    fetchStatus();
    // 1000ms polling for real-time reactivity, but prevents stacked requests via isPolling lock
    const interval = setInterval(fetchStatus, 1000); 
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    podStatus,
    loading,
    error,
    isConnected,
    battery: podStatus?.batteryPct || 0,
    state: isConnected ? (podStatus?.state || 'IDLE') : (lastState.current === 'RECORDING' || lastState.current === 'ARMED' ? 'OFFLINE_RECORDING' : 'OFFLINE'),
    checkNow: fetchStatus
  };
}
