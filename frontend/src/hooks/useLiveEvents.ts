import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/dataSource';

export function useLiveEvents(sessionState: string) {
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const isPolling = useRef(false);

  // Buffer locally to avoid flooding memory, keep last 50 events max
  const addEvents = useCallback((newEvents: any[]) => {
    setLiveEvents(prev => {
      // Create a map to deduplicate by timestamp
      const map = new Map();
      prev.forEach(e => map.set(e.timestamp, e));
      newEvents.forEach(e => map.set(e.timestamp, e));
      
      const merged = Array.from(map.values())
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // keep only the latest 50 for live UI snippet rendering so we don't blow up memory
      return merged.slice(-50);
    });
  }, []);

  useEffect(() => {
    // Only poll when actively recording/armed
    if (sessionState !== 'RECORDING' && sessionState !== 'ARMED') {
      return;
    }

    const fetchLiveEvents = async () => {
      if (isPolling.current) return;
      isPolling.current = true;
      try {
         const events = await api.pod.getSessionEvents();
         if (events && Array.isArray(events) && events.length > 0) {
            addEvents(events);
         }
      } catch (err) {
         // Silently fail live events polling since it is low priority compared to status
      } finally {
         isPolling.current = false;
      }
    };

    // Fast polling rate
    const interval = setInterval(fetchLiveEvents, 500);

    return () => {
      clearInterval(interval);
      isPolling.current = false;
    };
  }, [sessionState, addEvents]);

  // Provide a function to clear events when starting a new session
  const clearEvents = useCallback(() => {
    setLiveEvents([]);
  }, []);

  return {
    liveEvents,
    clearEvents
  };
}
