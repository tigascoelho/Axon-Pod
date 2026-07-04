import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RadarChart from '../components/RadarChart';
import { PodStatusBadge, PendingSessionBanner, SyncStatusCard } from '../components/DeviceComponents';
import { useProfile } from '../hooks/useProfile';
import Spinner from '../components/Spinner';

const STAT_META = [
  { key: 'speed',    short: 'PAC', label: 'Pace'      },
  { key: 'shot',     short: 'SHO', label: 'Shooting'  },
  { key: 'pass',     short: 'PAS', label: 'Passing'   },
  { key: 'dribble',  short: 'DRI', label: 'Dribbling' },
  { key: 'defense',  short: 'DEF', label: 'Defending' },
  { key: 'physical', short: 'PHY', label: 'Physical'  },
];

const INSIGHTS = [
  { icon: '🔥', title: 'Hot Streak', text: 'Your pace rating increased by 8 points over the last 3 sessions. Keep pushing!' },
  { icon: '🏆', title: 'Top Performer', text: 'Your dribbling is in the top 15% compared to your training history.' },
  { icon: '⚡', title: 'Speed Demon', text: 'You hit a new personal best sprint speed in your last session.' },
  { icon: '🎯', title: 'Sharpshooter', text: 'Shooting accuracy improved by 12% this week. On target!' },
  { icon: '💪', title: 'Iron Will', text: 'You completed 5 consecutive sessions without dropping physical stats.' },
];

function computeOvr(stats) {
  if (!stats) return 0;
  const weights = { shot: 0.22, pass: 0.18, dribble: 0.18, speed: 0.20, defense: 0.12, physical: 0.10 };
  return Math.round(
    Object.entries(weights).reduce((sum, [k, w]) => sum + (stats[k] || 0) * w, 0)
  );
}

function ovrTier(ovr) {
  if (ovr >= 85) return { color: '#FFD700', bg: 'rgba(255,215,0,0.10)',  border: 'rgba(255,215,0,0.30)',  label: 'ELITE' };
  if (ovr >= 75) return { color: '#00E676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.25)', label: 'PRO' };
  if (ovr >= 65) return { color: '#FFB300', bg: 'rgba(255,179,0,0.08)', border: 'rgba(255,179,0,0.25)', label: 'RISING' };
  return             { color: '#FF3D3D', bg: 'rgba(255,61,61,0.08)',  border: 'rgba(255,61,61,0.25)',  label: 'ROOKIE' };
}

function valColor(val) {
  if (val >= 80) return '#00E676';
  if (val >= 65) return '#FFB300';
  return '#FF3D3D';
}

function JerseyBadge({ number }) {
  return (
    <div
      className="relative shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center border"
      style={{
        background: 'linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(0,230,118,0.04) 100%)',
        borderColor: 'rgba(0,230,118,0.25)',
      }}
    >
      <svg width="20" height="16" viewBox="0 0 24 20" fill="none" className="mb-0.5">
        <path
          d="M8 1L1 4V9L3 10V19H21V10L23 9V4L16 1H8Z"
          stroke="#00E676"
          strokeWidth="1.2"
          fill="rgba(0,230,118,0.06)"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-accent font-black text-[9px] leading-none absolute bottom-1.5">
        {number}
      </span>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, loading, error } = useProfile();
  const [insight] = useState(() => INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Spinner size="lg" />
        <p className="text-text-muted text-xs mt-4 animate-pulse">Initializing Athlete Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-10 text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-3xl mb-4">⚠️</div>
        <p className="text-text-primary font-bold">Failed to load performance profile</p>
        <p className="text-text-muted text-xs mt-2">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary mt-6 px-6">Retry Connection</button>
      </div>
    );
  }

  const { stats, position, playerName, jersey } = profile || {};
  const safeStats = {
  speed: stats?.speed || 0,
  shot: stats?.shot || 0,
  pass: stats?.pass || 0,
  dribble: stats?.dribble || 0,
  defense: stats?.defense || 0,
  physical: stats?.physical || 0,
  };
  const ovr = computeOvr(safeStats);
  const tier = ovrTier(ovr);

  return (
    <div className="page-enter pb-8 select-none">
      {/* ── TOP BAR ── */}
      <div className="px-5 pt-8 pb-1">
        {/* ROW 1: Axon Tracker & Battery */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <p className="text-[9px] text-text-muted tracking-[0.25em] font-bold uppercase">
            Axon Tracker
          </p>
          <PodStatusBadge />
        </div>

        {/* ROW 2: Jersey, Player Name, and OVR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <JerseyBadge number={jersey} />
            <div>
              <h1 className="text-text-primary font-display font-extrabold text-xl leading-tight">
                {playerName}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="chip-accent">{position}</span>
                <span className="chip" style={{
                  background: tier.bg,
                  color: tier.color,
                  border: `1px solid ${tier.border}`,
                }}>
                  {tier.label}
                </span>
              </div>
            </div>
          </div>

          <div
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl border shrink-0 shadow-lg"
            style={{ background: tier.bg, borderColor: tier.border }}
          >
            <span className="text-[7px] font-bold tracking-[0.15em]" style={{ color: tier.color }}>OVR</span>
            <span className="text-xl font-black leading-none font-display" style={{ color: tier.color }}>{ovr}</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2">
        <SyncStatusCard />
      </div>
      <PendingSessionBanner />

      {/* ── RADAR HERO CARD ── */}
      <div
        className="mx-4 mt-4 relative overflow-hidden rounded-card fade-in-up"
        style={{
          background: 'linear-gradient(165deg, #111116 0%, #0a1410 50%, #111116 100%)',
          border: '1px solid rgba(0,230,118,0.12)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="absolute top-0 left-0 w-14 h-14 border-t-2 border-l-2 rounded-tl-card" style={{ borderColor: 'rgba(0,230,118,0.18)' }} />
        <div className="absolute top-0 right-0 w-14 h-14 border-t-2 border-r-2 rounded-tr-card" style={{ borderColor: 'rgba(0,230,118,0.18)' }} />
        <div className="absolute bottom-0 left-0 w-14 h-14 border-b-2 border-l-2 rounded-bl-card" style={{ borderColor: 'rgba(0,230,118,0.18)' }} />
        <div className="absolute bottom-0 right-0 w-14 h-14 border-b-2 border-r-2 rounded-tr-card" style={{ borderColor: 'rgba(0,230,118,0.18)' }} />

        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #00E676, #00E676 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, #00E676, #00E676 1px, transparent 1px, transparent 28px)',
          }}
        />

        <div className="flex justify-center py-5 relative z-10 scale-in">
          <RadarChart stats={safeStats} size={280} />
        </div>
      </div>

      {/* ── STAT BARS ── */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2 fade-in-up">
        {STAT_META.map((s) => {
          const val = safeStats[s.key];
          const barColor = valColor(val);
          return (
            <div
              key={s.key}
              className="rounded-xl p-2.5 border"
              style={{
                background: 'rgba(26,26,34,0.6)',
                borderColor: 'rgba(38,38,48,0.5)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] text-text-muted font-bold tracking-[0.15em]">{s.short}</span>
                <span className="text-xs font-black font-display" style={{ color: barColor }}>{val}</span>
              </div>
              <div className="h-1 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${val}%`,
                    background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                    boxShadow: `0 0 8px ${barColor}40`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── INSIGHT CARD ── */}
      <div className="mx-4 mt-4 fade-in-up">
        <div
          className="rounded-card p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,34,0.8) 0%, rgba(20,20,28,0.9) 100%)',
            borderColor: 'rgba(38,38,48,0.5)',
            boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)' }}>
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-bold text-sm font-display">{insight.title}</p>
              <p className="text-text-muted text-xs mt-0.5 leading-relaxed">{insight.text}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-5 fade-in-up">
        <button
          id="btn-start-training"
          onClick={() => navigate('/training')}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 shadow-[0_8px_30px_rgba(0,230,118,0.25)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#08080a" strokeWidth="2" />
            <polygon points="10,8 16,12 10,16" fill="#08080a" />
          </svg>
          <span className="text-base font-bold tracking-wide">Start Training</span>
        </button>
      </div>
    </div>
  );
}
