import { useState, useCallback } from 'react';
import { api } from '../services/dataSource';

export enum SYNC_STAGES {
  IDLE = 'idle',
  CHECKING = 'checking',
  DOWNLOADING = 'downloading',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export function useSyncSession() {
  const [stage, setStage] = useState<SYNC_STAGES>(SYNC_STAGES.IDLE);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startSync = useCallback(async () => {
    setStage(SYNC_STAGES.CHECKING);
    setError(null);
    setProgress(0);

    try {
      // 1. Check Pod Connection
      const status = await api.pod.getStatus();
      if (!status.connected) throw new Error('Pod not connected');
      setProgress(20);

      // 2. Fetch Latest Session Info
      setStage(SYNC_STAGES.DOWNLOADING);
      const sessionInfo = await api.pod.getLatestSession();
      setProgress(40);

      // 3. Download Events (simulating progress)
      const downloadInterval = setInterval(() => {
        setProgress(p => (p < 80 ? p + 5 : p));
      }, 300);

      const events = await api.pod.getSessionEvents();
      clearInterval(downloadInterval);
      setProgress(85);

      // 4. Save to Backend
      setStage(SYNC_STAGES.UPLOADING);
      
      const metrics = sessionInfo.metrics || {};
      const durationSeconds = metrics.duration || 3600;
      
      const processedSession = {
        type: 'Full Training', // Simplified for demo
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `${Math.floor(durationSeconds / 60)}m`,
        intensity: Math.floor(Math.random() * 30) + 70, // Mock calc
        battery: status.batteryPct || 80,
        stats: {
          passes: events.filter((e: any) => e.type === 'pass').length || 120,
          shots: events.filter((e: any) => e.type === 'shot').length || 12,
          dribbles: 24,
          sprints: metrics.sprints || 15,
          distance: metrics.distance ? `${(metrics.distance / 1000).toFixed(1)} km` : '5.2 km'
        },
        highlight: { icon: '⚡', text: 'Strong performance detected' },
        isNew: true
      };

      await api.backend.uploadSession(processedSession);

      // 5. Acknowledge and clear data on ESP
      if (sessionInfo.sessionId) {
        await api.pod.ackSession(sessionInfo.sessionId);
      }

      setProgress(100);
      setStage(SYNC_STAGES.COMPLETED);
      
      // Trigger list refresh
      window.dispatchEvent(new Event('sessions_updated'));

    } catch (err: any) {
      setError(err.message || 'Sync failed');
      setStage(SYNC_STAGES.ERROR);
    }
  }, []);

  const reset = useCallback(() => {
    setStage(SYNC_STAGES.IDLE);
    setProgress(0);
    setError(null);
  }, []);

  return {
    stage,
    progress,
    error,
    startSync,
    reset,
    isSyncing: stage !== SYNC_STAGES.IDLE && stage !== SYNC_STAGES.COMPLETED && stage !== SYNC_STAGES.FAILED
  };
}
