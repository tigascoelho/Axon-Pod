import { useState } from 'react';
import { useSessions } from '../hooks/useSessions';
import Spinner from '../components/Spinner';

function intensityColor(val) {
  if (val >= 90) return '#FF3D3D';
  if (val >= 70) return '#FFB300';
  if (val >= 50) return '#00E676';
  return '#60a5fa';
}

function formatDateLabel(dateStr) {
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    return { day, month };
  } catch {
    return { day: '?', month: '???' };
  }
}

/* ═══════════════════════════════════
   SESSIONS LIST PAGE
   ═══════════════════════════════════ */
export default function SessionsPage() {
  const { sessions, loading, error, isEmpty } = useSessions();
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <SessionDetail session={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="page-enter pb-8 select-none">
      {/* Header */}
      <div className="px-5 pt-7 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-text-primary font-display font-bold text-xl uppercase tracking-tight">Sessions</h1>
          <p className="text-text-muted text-[11px] font-medium opacity-80 mt-0.5">Performance History</p>
        </div>
        {!loading && !error && (
          <div className="chip-accent px-2 py-0.5 border border-accent/20 bg-accent/5">{sessions.length} recorded</div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Spinner size="lg" />
          <p className="text-text-muted text-[10px] mt-4 uppercase tracking-[0.2em] animate-pulse">Retrieving Cloud Data</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
           <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-3xl mb-4 grayscale">📡</div>
           <p className="text-text-primary font-bold">Connection Error</p>
           <p className="text-text-muted text-[11px] mt-2 leading-relaxed">{error}</p>
           <button onClick={() => window.location.reload()} className="btn-secondary mt-6 px-6 py-2 text-xs uppercase font-black">Reconnect</button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 border border-border">
            ⚽
          </div>
          <p className="text-text-primary font-bold">No High-Intensity Data</p>
          <p className="text-text-muted text-xs mt-2 leading-relaxed">
            Record and sync a training session with your Axon Pod to see detailed performance metrics here.
          </p>
        </div>
      )}

      {/* Session list */}
      <div className="flex flex-col gap-3 px-4 mt-3">
        {sessions.map((s, idx) => {
          const { day, month } = formatDateLabel(s.date);
          const ic = intensityColor(s.intensity);
          const isProcessing = s.status === 'processing';
          const isReady = s.status === 'ready' || !s.status;

          return (
            <button
              key={s.id}
              onClick={() => isReady && setSelected(s)}
              disabled={isProcessing}
              className={`card-interactive flex items-center gap-3 text-left relative overflow-hidden transition-all duration-300 ${
                isProcessing ? 'opacity-70 bg-surface/40' : 'fade-in-up'
              }`}
              style={{ animationDelay: `${Math.min(idx * 0.05, 0.3)}s` }}
            >
              {isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
              )}

              {/* Date block */}
              <div
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 border transition-colors ${
                  isProcessing ? 'bg-surface-2 border-border/40' : 'bg-accent/5 border-accent/20'
                }`}
              >
                {isProcessing ? (
                  <div className="spinner w-4 h-4 border-2 border-border/40 border-t-accent rounded-full" />
                ) : (
                  <>
                    <span className="text-accent font-black text-lg leading-none font-display">{day}</span>
                    <span className="text-accent text-[8px] font-bold uppercase tracking-wider">{month}</span>
                  </>
                )}
              </div>

              <div className="w-px h-10 bg-border shrink-0 opacity-40" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-text-primary font-bold text-sm truncate">{isProcessing ? 'Processing Session...' : s.type}</span>
                  {s.isNew && (
                    <span className="bg-accent px-1.5 py-0.5 rounded-pill text-[7px] text-black font-black uppercase">New</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-text-muted text-[10px] font-medium tracking-wide">
                    {isProcessing ? 'Syncing to Engine' : `⏱ ${s.duration} · ${s.time}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black font-display ${isProcessing ? 'text-text-dim' : ''}`} style={{ color: isProcessing ? undefined : ic }}>
                    {isProcessing ? '--' : s.intensity}
                  </span>
                  <span className="text-[7px] text-text-muted font-black tracking-widest uppercase">INT</span>
                </div>
                {!isProcessing && (
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                     <path d="M9 18L15 12L9 6" stroke="#6b6b7b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                   </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SessionDetail({ session, onBack }) {
  const s = session;
  const ic = intensityColor(s.intensity);
  const batColor = s.battery >= 60 ? '#00E676' : s.battery >= 30 ? '#FFB300' : '#FF3D3D';

  return (
    <div className="page-enter pb-8 select-none">
      <div className="px-5 pt-7 pb-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-muted transition-colors shrink-0"
          style={{ background: 'rgba(26,26,34,0.5)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-text-primary font-display font-bold text-lg truncate uppercase tracking-tight">{s.type}</h1>
          <p className="text-text-muted text-[10px] font-bold tracking-widest uppercase opacity-60">{s.date} at {s.time}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 mt-4 fade-in-up">
        {[
          { label: 'Duration', value: s.duration, color: '#f0f0f5' },
          { label: 'Intensity', value: s.intensity, color: ic },
          { label: 'Battery', value: `${s.battery}%`, color: batColor },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-card p-3 text-center border"
            style={{ background: 'rgba(26,26,34,0.6)', borderColor: 'rgba(38,38,48,0.4)' }}
          >
            <p className="text-2xl font-black font-display leading-none" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] font-black mt-2">{item.label}</p>
          </div>
        ))}
      </div>

      {s.highlight && (
        <div className="mx-4 mt-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div
            className="rounded-card p-4 flex items-center gap-4 border overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(26,26,34,0.8) 100%)',
              borderColor: 'rgba(255,215,0,0.15)',
            }}
          >
             <div className="absolute top-0 right-0 p-1 opacity-10">
               <span className="text-4xl">🏆</span>
             </div>
            <span className="text-3xl filter drop-shadow-lg">{s.highlight.icon}</span>
            <div>
              <p className="text-[9px] text-accent uppercase tracking-[0.2em] font-black mb-1">Key Insight</p>
              <p className="text-text-primary text-sm font-bold leading-tight">{s.highlight.text}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-4 mt-5 fade-in-up" style={{ animationDelay: '0.15s' }}>
        <p className="section-label mb-3">Athletic Performance Data</p>
        <div className="card-elevated border-border/40">
          {[
            { label: 'Passes', value: s.stats.passes, icon: '🎯', color: '#60a5fa' },
            { label: 'Shots', value: s.stats.shots, icon: '⚽', color: '#FFB300' },
            { label: 'Dribbles', value: s.stats.dribbles, icon: '🌀', color: '#00E676' },
            { label: 'Sprints', value: s.stats.sprints, icon: '⚡', color: '#FF3D3D' },
            { label: 'Distance', value: s.stats.distance, icon: '📍', color: '#a78bfa' },
          ].map((item, idx) => (
            <div
              key={item.label}
              className={`flex items-center justify-between py-3.5 ${
                idx < 4 ? 'border-b border-border/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg opacity-80">{item.icon}</span>
                <span className="text-text-secondary text-sm font-semibold">{item.label}</span>
              </div>
              <span className="text-lg font-black font-display" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label uppercase tracking-[0.2em] font-semibold">Activity Heatmap</p>
          <span className="text-[9px] text-accent font-black tracking-widest uppercase">Live Replay</span>
        </div>
        <div
          className="rounded-card overflow-hidden border relative bg-surface"
          style={{
            borderColor: 'rgba(38,38,48,0.5)',
            height: '220px',
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 320 220" fill="none" className="absolute inset-0">
            <rect x="8" y="8" width="304" height="204" rx="4" stroke="#262630" strokeWidth="1" fill="none" />
            <line x1="160" y1="8" x2="160" y2="212" stroke="#262630" strokeWidth="1" />
            <circle cx="160" cy="110" r="35" stroke="#262630" strokeWidth="1" fill="none" />
            <circle cx="160" cy="110" r="2" fill="#262630" />
            <rect x="8" y="60" width="55" height="100" rx="2" stroke="#262630" strokeWidth="1" fill="none" />
            <rect x="257" y="60" width="55" height="100" rx="2" stroke="#262630" strokeWidth="1" fill="none" />
            <rect x="8" y="80" width="25" height="60" rx="2" stroke="#262630" strokeWidth="0.8" fill="none" />
            <rect x="287" y="80" width="25" height="60" rx="2" stroke="#262630" strokeWidth="0.8" fill="none" />
            <ellipse cx="200" cy="90" rx="55" ry="45" fill="#00E676" fillOpacity="0.1" />
            <ellipse cx="220" cy="80" rx="35" ry="30" fill="#00E676" fillOpacity="0.15" />
            <ellipse cx="260" cy="110" rx="40" ry="35" fill="#FFB300" fillOpacity="0.08" />
            <ellipse cx="140" cy="130" rx="45" ry="40" fill="#00E676" fillOpacity="0.06" />
            {[
              [195, 85], [210, 75], [230, 90], [185, 100], [250, 80],
              [200, 110], [170, 95], [220, 65], [240, 105], [215, 95],
              [155, 80], [145, 120], [175, 105], [260, 85], [190, 70],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#00E676" fillOpacity={0.4 + Math.random() * 0.4} />
            ))}
          </svg>
          <div className="absolute bottom-4 left-4 flex gap-2">
             <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/5 text-[8px] font-bold text-text-secondary uppercase tracking-widest">Zone Analysis</div>
          </div>
        </div>
      </div>
    </div>
  );
}
