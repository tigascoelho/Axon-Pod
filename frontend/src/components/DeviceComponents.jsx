import React from 'react';
import { useDevice, DEVICE_STATES, SYNC_STAGES } from '../lib/DeviceContext';
import PodSelector from './PodSelector';

/* ── BATTERY INDICATOR ── */
export function BatteryIndicator({ level, size = 'sm' }) {
  // TRANCA DE SEGURANÇA: Garante que o nível é sempre um número válido entre 0 e 100
  const safeLevel = (typeof level === 'number' && !isNaN(level)) ? Math.min(100, Math.max(0, level)) : 0;
  const color = safeLevel >= 60 ? '#00E676' : safeLevel >= 30 ? '#FFB300' : '#FF3D3D';
  const width = size === 'lg' ? 28 : 22;
  const height = size === 'lg' ? 14 : 12;

  return (
    <div className="flex items-center gap-1.5">
      <svg width={width} height={height} viewBox="0 0 22 12" fill="none">
        <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
        <rect 
          x="2" y="2" 
          width={Math.max(1, Math.round((safeLevel / 100) * 15))} 
          height="8" rx="1.5"
          fill={color} 
        />
        <path d="M19.5 4V8" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {size === 'lg' ? (
        <span className="text-sm font-black font-display" style={{ color }}>{safeLevel}%</span>
      ) : (
        <span className="text-[10px] font-bold text-text-secondary">{safeLevel}%</span>
      )}
    </div>
  );
}

/* ── POD STATUS BADGE ── */
export function PodStatusBadge() {
  const { deviceState, batteryLevel } = useDevice();
  const isOnline = deviceState !== DEVICE_STATES.OFFLINE && deviceState !== DEVICE_STATES.CONNECTING;

  return (
    <div className="flex items-center gap-3 bg-surface/40 backdrop-blur-md px-2.5 py-1.5 rounded-pill border border-border/50">
      <BatteryIndicator level={batteryLevel} />
      <div className="w-px h-3 bg-border" />
      <div className="relative flex items-center gap-1.5">
        <span 
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-accent' : 'bg-danger'}`} 
          style={{ boxShadow: isOnline ? '0 0 8px rgba(0,230,118,0.6)' : '0 0 8px rgba(255,61,61,0.6)' }}
        />
        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
          {deviceState === DEVICE_STATES.OFFLINE ? 'Disconnected' : deviceState === DEVICE_STATES.CONNECTING ? 'Connecting' : 'Pod Linked'}
        </span>
      </div>
    </div>
  );
}

/* ── SYNC STATUS CARD ── */
export function SyncStatusCard({ onSync }) {
  const { deviceState, syncStage, syncProgress, startSync } = useDevice();

  if (deviceState !== DEVICE_STATES.SYNCING && syncStage === SYNC_STAGES.IDLE) return null;

  return (
    <div className="card-elevated gradient-animate" style={{ 
      background: 'linear-gradient(135deg, #16161c 0%, #0d1a12 100%)',
      border: '1px solid rgba(0,230,118,0.2)'
    }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-1">Live Synchronization</p>
          <h3 className="text-text-primary font-display font-bold text-base">
            {syncStage === SYNC_STAGES.CHECKING && 'Initializing Link...'}
            {syncStage === SYNC_STAGES.DOWNLOADING && 'Downloading Dataset'}
            {syncStage === SYNC_STAGES.UPLOADING && 'Cloud Persistence'}
            {syncStage === SYNC_STAGES.COMPLETED && 'Sync Successful'}
          </h3>
        </div>
        {syncStage === SYNC_STAGES.COMPLETED ? (
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">✓</div>
        ) : (
          <div className="spinner w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full" />
        )}
      </div>

      <SyncProgressStepper stage={syncStage} progress={syncProgress} />
      
      {syncStage !== SYNC_STAGES.COMPLETED && (
        <p className="text-[10px] text-text-muted text-center mt-4 italic">
          Keep your device close to the pod until the transfer is finished.
        </p>
      )}
    </div>
  );
}

/* ── SYNC PROGRESS STEPPER ── */
export function SyncProgressStepper({ stage, progress }) {
  const stages = [
    { key: SYNC_STAGES.CHECKING, label: 'Link' },
    { key: SYNC_STAGES.DOWNLOADING, label: 'Fetch' },
    { key: SYNC_STAGES.UPLOADING, label: 'Save' },
  ];

  const getIdx = (s) => {
    if (s === SYNC_STAGES.COMPLETED) return 3;
    if (s === SYNC_STAGES.IDLE) return 0;
    return stages.findIndex(item => item.key === s);
  };

  const currentIdx = getIdx(stage);

  return (
    <div className="mt-2 text-center">
      <div className="flex items-center justify-between mb-2">
        {stages.map((s, i) => {
          const isActive = i === currentIdx;
          const isDone = i < currentIdx || stage === SYNC_STAGES.COMPLETED;
          return (
            <div key={s.key} className="flex flex-col items-center flex-1">
              <div className={`w-2 h-2 rounded-full mb-1 transition-all duration-500 ${
                isDone ? 'bg-accent' : isActive ? 'bg-accent animate-pulse' : 'bg-surface-2 border border-border'
              }`} />
              <span className={`text-[8px] font-bold tracking-widest uppercase ${
                isDone || isActive ? 'text-text-primary' : 'text-text-muted'
              }`}>{s.label}</span>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden relative border border-border/30">
        <div 
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ 
            width: stage === SYNC_STAGES.COMPLETED 
              ? '100%' 
              : stage === SYNC_STAGES.DOWNLOADING 
                ? `${(typeof progress === 'number' && !isNaN(progress)) ? progress : 0}%` 
                : currentIdx > 1 
                  ? '100%' 
                  : currentIdx > 0 
                    ? '33%' 
                    : '5%' 
          }}
        />
      </div>
      {stage === SYNC_STAGES.DOWNLOADING && (
        <span className="text-[10px] text-accent font-black font-display absolute right-0 -mt-5 pr-4 animate-pulse">
          {progress}%
        </span>
      )}
    </div>
  );
}

/* ── PENDING SESSION BANNER ── */
export function PendingSessionBanner() {
  const { syncPending, startSync, deviceState } = useDevice();

  if (!syncPending || deviceState === DEVICE_STATES.SYNCING) return null;

  return (
    <div className="mx-4 mt-2 fade-in-up">
      <button 
        onClick={startSync}
        className="w-full flex items-center justify-between p-3 rounded-card border-none overflow-hidden relative group transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(90deg, #FFB300 0%, #FF8F00 100%)',
          boxShadow: '0 4px 15px rgba(255,179,0,0.3)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-black">
            📡
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-black/60 uppercase tracking-widest">Action Required</p>
            <p className="text-sm font-bold text-black leading-tight">1 Session Pending Sync</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-lg border border-black/10">
          <span className="text-[9px] font-black text-black uppercase">Sync Now</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="group-hover:translate-x-0.5 transition-transform">
            <path d="M5 12h14M15 17l5-5-5-5" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        
        {/* Animated shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      </button>
    </div>
  );
}

/* ── DEVICE PANEL (for Profile) ── */
export function DevicePanel() {
  const { deviceState, batteryLevel, lastSync, connectPod } = useDevice();
  const isOnline = deviceState === DEVICE_STATES.CONNECTED;

  return (
    <div className="card border-border/40 relative overflow-hidden">
      {/* Glow background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 transition-colors duration-1000 ${isOnline ? 'bg-accent' : 'bg-danger'}`} />

      <div className="flex items-center gap-4 mb-5 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
          isOnline ? 'bg-accent/10 border-accent/30' : 'bg-surface-2 border-border'
        }`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill={isOnline ? '#00E676' : '#6b6b7b'} />
            <path d="M16.24 7.76a5.99 5.99 0 010 8.49m-8.48-.01a5.99 5.99 0 010-8.49" 
              stroke={isOnline ? '#00E676' : '#6b6b7b'} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" 
              stroke={isOnline ? '#00E676' : '#6b6b7b'} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
          </svg>
        </div>
        <div>
          <h3 className="text-text-primary font-display font-bold text-base">Axon Pod v2</h3>
          <p className="text-text-muted text-xs">ID: AXN-8842-XJ</p>
          <div className="flex items-center gap-2 mt-1">
             <span className={`chip ${isOnline ? 'chip-accent' : 'chip-danger'}`}>
               {deviceState === DEVICE_STATES.OFFLINE ? 'Disconnected' : deviceState === DEVICE_STATES.CONNECTING ? 'Connecting...' : 'Active'}
             </span>
             <span className="text-[10px] text-text-dim font-mono">FW: v1.4.2</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
        <div className="bg-surface-2/40 border border-border/30 rounded-xl p-3">
          <p className="section-label mb-2">Battery</p>
          <BatteryIndicator level={batteryLevel} size="lg" />
        </div>
        <div className="bg-surface-2/40 border border-border/30 rounded-xl p-3">
          <p className="section-label mb-2">Status</p>
           <p className="text-sm font-bold text-text-primary">
             {isOnline ? 'Signal Strong' : 'Search Range'}
           </p>
           <p className="text-[10px] text-text-muted mt-0.5">Last sync {lastSync}</p>
        </div>
      </div>

      <div className="flex gap-2 relative z-10">
        {!isOnline && (
          <button 
            onClick={openPodSelector}
            className="btn-primary flex-1 py-3 text-xs"
          >
            Connect Pod
          </button>
        )}
        <button className="btn-secondary flex-1 py-3 text-xs">
          Device Info
        </button>
        <button className="btn-secondary w-12 h-12 flex items-center justify-center p-0 shrink-0">
          ⚙️
        </button>
      </div>
        <PodSelector open={showPodSelector} onClose={closePodSelector} onConnect={connectToPodHost} />
    </div>
  );
}
