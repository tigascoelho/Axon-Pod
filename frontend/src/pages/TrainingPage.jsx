import { useState, useEffect, useRef } from 'react';
import { usePodStatus } from '../hooks/usePodStatus';
import { useLiveEvents } from '../hooks/useLiveEvents';
import { useSyncSession, SYNC_STAGES } from '../hooks/useSyncSession';
import { BatteryIndicator, SyncStatusCard } from '../components/DeviceComponents';
import Spinner from '../components/Spinner';
import { api } from '../services/dataSource';

function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── Pod Visual ── */
function PodVisual({ state, battery }) {
  const isTraining = state === 'training';
  const isConnected = state === 'connected' || state === 'training' || state === 'finished';

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="w-44 h-44 rounded-full flex items-center justify-center transition-all duration-1000"
        style={{
          background: isTraining
            ? 'radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 70%)'
            : isConnected
            ? 'radial-gradient(circle, rgba(38,38,48,0.3) 0%, transparent 70%)'
            : 'transparent',
          boxShadow: isTraining ? '0 0 80px rgba(0,230,118,0.15)' : 'none',
        }}
      >
        {isTraining && (
          <div className="absolute inset-0 border border-accent/20 rounded-full animate-[spin_10s_linear_infinite]" />
        )}
        
        <div
          className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 relative bg-bg z-10"
          style={{
            borderColor: isTraining
              ? 'rgba(0,230,118,0.5)'
              : isConnected
              ? 'rgba(0,230,118,0.25)'
              : 'rgba(38,38,48,0.5)',
            boxShadow: isTraining
              ? '0 0 32px rgba(0,230,118,0.25), inset 0 0 20px rgba(0,230,118,0.1)'
              : '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative mb-1">
            <span
              className={`w-3.5 h-3.5 rounded-full inline-block ${
                isTraining ? 'bg-accent animate-pulse' : isConnected ? 'bg-accent' : 'bg-text-dim'
              }`}
              style={{
                boxShadow: isConnected ? '0 0 12px rgba(0,230,118,0.6)' : 'none',
              }}
            />
          </div>
          <span className="text-[9px] font-black tracking-[0.25em] text-text-muted mt-1 uppercase font-display">
            {isTraining ? 'LIVE' : isConnected ? 'STBY' : 'OFF'}
          </span>
        </div>
      </div>

      {isConnected && (
        <div className="mt-4 fade-in-up">
           <BatteryIndicator level={battery} size="lg" />
        </div>
      )}
    </div>
  );
}

export default function TrainingPage() {
  const { podStatus, loading: podLoading, isConnected, checkNow, battery, state: podState } = usePodStatus();
  const { stage, progress, error: syncError, startSync, reset: resetSync, isSyncing } = useSyncSession();
  
  const { liveEvents, clearEvents } = useLiveEvents(podState);
  
  const isTraining = podState === 'ARMED' || podState === 'RECORDING' || podState === 'OFFLINE_RECORDING';
  const isFinished = podState === 'DONE';
  const isIdle = podState === 'IDLE' || podState === 'OFFLINE';

  const isOfflineDrop = podState === 'OFFLINE_RECORDING';

  const [userReady, setUserReady] = useState(isTraining || isFinished);
  useEffect(() => {
    if (isTraining || isFinished) {
      setUserReady(true);
    }
  }, [isTraining, isFinished]);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isTraining) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      }
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isTraining]);

  const handleStart = async () => {
    try {
      await api.pod.startSession();
      setElapsed(0);
      clearEvents();
      checkNow();
    } catch (e) {
      console.error(e);
      alert('Failed to start session');
    }
  };

  const handleStop = async () => {
    try {
      await api.pod.stopSession();
      checkNow();
    } catch (e) {
      console.error(e);
      alert('Failed to stop session');
    }
  };

  const handleNewTraining = async () => {
    try {
      if (podStatus?.sessionId) {
         await api.pod.ackSession(podStatus.sessionId);
      }
    } catch (e) {
      console.warn(e);
    }
    setElapsed(0);
    resetSync();
    checkNow();
  };

  const getStatusLabel = () => {
    if (podLoading && !podStatus) return 'Searching for Axon Pod...';
    if (!isConnected) return 'Pod not detected. Power it on to begin.';
    if (!userReady && isConnected) return 'Device found. Tap Connect to link.';
    if (isSyncing) return 'Transferring High-Precision Data...';
    if (stage === SYNC_STAGES.COMPLETED) return 'Session fully synced and saved.';
    if (isTraining) return 'Session active. Pod recording...';
    if (isFinished) return 'Session complete. Sync to review metrics.';
    return 'Pod ready. Tap Start to begin session.';
  };

  return (
    <div className="page-enter pb-8 select-none relative">
      {isOfflineDrop && (
        <div className="absolute inset-0 z-50 bg-bg/80 backdrop-blur-sm flex flex-col items-center justify-center fade-in-up">
           <div className="w-16 h-16 bg-danger/10 border border-danger/30 rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse">
             ⚠️
           </div>
           <p className="font-bold text-text-primary text-lg">Signal Lost</p>
           <p className="text-text-muted text-xs text-center px-8 mt-2">
             Connection to Axon Pod temporarily dropped. Your pod is still recording. Ensure it's nearby.
           </p>
           <button onClick={checkNow} className="btn-secondary mt-6 px-6 py-2">Try Reconnect</button>
        </div>
      )}

      <div className="px-5 pt-7 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-text-primary font-display font-bold text-xl uppercase tracking-tight">Control Center</h1>
          <p className="text-text-muted text-[11px] font-medium opacity-80 mt-0.5">Device Operating System</p>
        </div>
        <div className={`px-2 py-0.5 rounded-pill border text-[10px] font-bold ${
          (isConnected && userReady) ? 'border-accent/30 text-accent bg-accent/5' : 'border-border text-text-muted bg-surface-2'
        }`}>
          {(isConnected && userReady) ? 'LINKED' : 'SEARCHING'}
        </div>
      </div>

      <div className="flex flex-col items-center mt-7 fade-in-up">
        <PodVisual 
          state={isTraining ? 'training' : (isConnected && userReady) ? 'connected' : 'offline'} 
          battery={battery} 
        />
      </div>

      <div className="mt-8 px-6 text-center">
        {!isIdle ? (
          <div className="fade-in-up">
            <p className="section-label mb-1">Session Duration</p>
            <p className="text-6xl font-black font-display text-text-primary tabular-nums tracking-tighter">
              {formatTimer(elapsed)}
            </p>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center italic">
            <p className="text-text-muted text-sm max-w-[200px] leading-relaxed">
              {getStatusLabel()}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 mt-6 h-32 flex flex-col justify-center">
        {isSyncing || stage === SYNC_STAGES.COMPLETED ? (
          <div className="fade-in-up">
            <SyncStatusCard overrideStage={stage} overrideProgress={progress} />
          </div>
        ) : isFinished ? (
          <div className="bg-surface-2/40 border border-border/40 rounded-card p-4 flex items-center gap-3 fade-in-up">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">📡</div>
            <div>
              <p className="text-text-primary font-bold text-sm leading-none">Session Ready</p>
              <p className="text-text-muted text-[11px] mt-1">Ready to download from pod SPIFFS</p>
            </div>
          </div>
        ) : (
          <div className="text-center px-8 fade-in-up">
             {isTraining ? (
               <div className="flex flex-col items-center justify-center bg-surface-2/40 border border-border/40 rounded-xl py-3 px-6 mx-auto inline-block">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                   <p className="text-accent font-display font-black text-2xl leading-none">{liveEvents.length}</p>
                 </div>
                 <p className="text-text-dim text-[9px] uppercase tracking-[0.2em] mt-1.5 font-bold">Live Events Captured</p>
               </div>
             ) : (
               <p className="text-text-dim text-[11px] leading-relaxed">
                 {userReady ? 'Your pod is ready. Press Start to initialize session context.' : 'Connect your Axon wearable pod to begin tracking your performance.'}
               </p>
             )}
          </div>
        )}
      </div>

      <div className="px-5 mt-6 flex flex-col gap-3 fade-in-up">
        {isIdle && (
          <>
            {!userReady ? (
              <button 
                onClick={() => {
                  setUserReady(true);
                  if (!isConnected) checkNow();
                }} 
                disabled={podLoading && !podStatus}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                {podLoading && !isConnected ? <Spinner size="sm" /> : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                Connect to Pod
              </button>
            ) : !isConnected ? (
               <button 
                 disabled
                 className="btn-primary w-full py-4 flex items-center justify-center gap-2 opacity-50"
               >
                 <Spinner size="sm" />
                 Connecting...
               </button>
            ) : (
              <button 
                id="btn-start-training"
                onClick={handleStart}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(0,230,118,0.2)]"
              >
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                Start Training Session
              </button>
            )}
          </>
        )}

        {isTraining && (
          <button 
            id="btn-stop-training"
            onClick={handleStop}
            className="w-full py-4 rounded-card font-display font-bold text-sm bg-danger group relative overflow-hidden transition-all active:scale-[0.98]"
            style={{ boxShadow: '0 8px 30px rgba(255,61,61,0.25)' }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-white">
              <div className="w-3 h-3 bg-white rounded-sm" />
              Finish Training
            </span>
          </button>
        )}

        {isFinished && !isSyncing && stage !== SYNC_STAGES.COMPLETED && (
          <>
            <button 
              id="btn-sync-now"
              onClick={startSync}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 2v6h-6M3 22v-6h6M21 13a9 9 0 1 1-3-7.7L21 8M3 11a9 9 0 1 1 3 7.7L3 16" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sync Session Now
            </button>
            <button onClick={handleNewTraining} className="btn-secondary w-full py-3 opacity-60">
              Discard Data
            </button>
          </>
        )}

        {stage === SYNC_STAGES.COMPLETED && (
          <>
            <div className="bg-accent/5 border border-accent/20 rounded-card p-4 text-center mb-1">
               <p className="text-accent font-bold text-sm">✓ Remote Cloud Save Complete</p>
               <p className="text-accent/60 text-[10px] mt-1 uppercase tracking-widest font-bold">Analysis Engine Running ⚡</p>
            </div>
            <button 
              className="btn-primary w-full py-4"
              onClick={() => window.location.hash = '#sessions'}
            >
              Review Performance Insights
            </button>
            <button onClick={handleNewTraining} className="btn-secondary w-full py-3">
              Start New Session
            </button>
          </>
        )}
      </div>
    </div>
  );
}
