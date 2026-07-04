import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/dataSource';

const DeviceContext = createContext(null);

export const DEVICE_STATES = {
  OFFLINE: 'offline',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  SYNCING: 'syncing',
  FAILED: 'failed',
};

export const SYNC_STAGES = {
  IDLE: 'idle',
  CHECKING: 'checking',
  DOWNLOADING: 'downloading',
  UPLOADING: 'uploading',
  COMPLETED: 'completed',
  ERROR: 'error',
};

export function DeviceProvider({ children }) {
  const [deviceState, setDeviceState] = useState(DEVICE_STATES.OFFLINE);
  const [syncStage, setSyncStage] = useState(SYNC_STAGES.IDLE);
  const [syncPending, setSyncPending] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [lastSync, setLastSync] = useState('N/A');
  const [syncProgress, setSyncProgress] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await api.pod.getStatus();
      setDeviceState(status.connected ? DEVICE_STATES.CONNECTED : DEVICE_STATES.OFFLINE);
      setBatteryLevel(status.battery);
      setSyncPending(status.pendingSync);
    } catch {
      setDeviceState(DEVICE_STATES.OFFLINE);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const connectPod = async () => {
    // legacy connect flow: quick re-check
    setDeviceState(DEVICE_STATES.CONNECTING);
    await fetchStatus();
  };

  // New: show a pod selector modal and connect to chosen host
  const [showPodSelector, setShowPodSelector] = useState(false);

  const openPodSelector = () => setShowPodSelector(true);
  const closePodSelector = () => setShowPodSelector(false);

  const connectToPodHost = async (hostUrl) => {
    try {
      setDeviceState(DEVICE_STATES.CONNECTING);
      // allow runtime override of pod base URL
      if (api.pod.setPodBaseUrl) api.pod.setPodBaseUrl(hostUrl);
      await fetchStatus();
      setShowPodSelector(false);
    } catch (e) {
      setDeviceState(DEVICE_STATES.OFFLINE);
      setShowPodSelector(false);
      throw e;
    }
  };

  const startSync = async () => {
    if (deviceState !== DEVICE_STATES.CONNECTED) return;

    setDeviceState(DEVICE_STATES.SYNCING);
    setSyncStage(SYNC_STAGES.CHECKING);
    setSyncProgress(0);

    try {
      // 1. Fetch metadata
      const info = await api.pod.getLatestSession();
      setSyncProgress(20);
      setSyncStage(SYNC_STAGES.DOWNLOADING);

      // 2. Download events (with simulated progress for UI feel)
      const events = await api.pod.getSessionEvents();
      setSyncProgress(80);
      setSyncStage(SYNC_STAGES.UPLOADING);

      // 3. Upload to backend
      const result = await api.backend.uploadSession({
        type: 'Express Session',
        duration: info.duration,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        battery: batteryLevel,
        stats: { passes: 45, shots: 8, dribbles: 12, sprints: 6, distance: '2.1 km' }
      });

      if (result.success) {
        setSyncStage(SYNC_STAGES.COMPLETED);
        setSyncPending(false);
        setLastSync('Just now');
        window.dispatchEvent(new Event('sessions_updated'));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setSyncStage(SYNC_STAGES.ERROR);
      setDeviceState(DEVICE_STATES.FAILED);
    } finally {
      // Return to connected state after success or error wait
      setTimeout(() => {
        if (deviceState === DEVICE_STATES.SYNCING) {
           setDeviceState(DEVICE_STATES.CONNECTED);
        }
      }, 3000);
    }
  };

  const resetSync = () => {
    setSyncStage(SYNC_STAGES.IDLE);
    setSyncProgress(0);
  };

  return (
    <DeviceContext.Provider value={{
      deviceState,
      syncStage,
      syncPending,
      batteryLevel,
      lastSync,
      syncProgress,
      connectPod,
      showPodSelector,
      openPodSelector,
      closePodSelector,
      connectToPodHost,
      startSync,
      resetSync,
      setSyncPending,
      setDeviceState
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) throw new Error('useDevice must be used within DeviceProvider');
  return context;
}
