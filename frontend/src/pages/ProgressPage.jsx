import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useProgress } from '../hooks/useProgress';
import Spinner from '../components/Spinner';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs rounded-xl border"
      style={{
        background: 'rgba(26,26,34,0.95)',
        borderColor: 'rgba(38,38,48,0.6)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p className="text-text-muted mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function TrendBadge({ data, key_ }) {
  if (!data || data.length < 2) return null;
  const prev = data[data.length - 2][key_];
  const curr = data[data.length - 1][key_];
  const diff = curr - prev;
  const pct = prev !== 0 ? ((diff / prev) * 100).toFixed(0) : 0;
  const up = diff >= 0;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-pill"
      style={{
        background: up ? 'rgba(0,230,118,0.10)' : 'rgba(255,61,61,0.10)',
        color: up ? '#00E676' : '#FF3D3D',
        border: `1px solid ${up ? 'rgba(0,230,118,0.2)' : 'rgba(255,61,61,0.2)'}`,
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(Number(pct))}%
    </span>
  );
}

export default function ProgressPage() {
  const [period, setPeriod] = useState('weekly');
  const { data, records, loading, error } = useProgress(period);
  
  const xKey = period === 'weekly' ? 'week' : 'month';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Spinner size="lg" />
        <p className="text-text-muted text-[10px] mt-4 uppercase tracking-[0.2em] animate-pulse">Analyzing Performance Trends</p>
      </div>
    );
  }

  if (error) {
     return (
       <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
         <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-3xl mb-4 grayscale">📈</div>
         <p className="text-text-primary font-bold">Progress Data Unavailable</p>
         <p className="text-text-muted text-[11px] mt-2 leading-relaxed">{error}</p>
         <button onClick={() => window.location.reload()} className="btn-secondary mt-6 px-6 py-2 text-xs uppercase font-black">Retry</button>
       </div>
     );
  }

  const totalSessions = data.reduce((a, d) => a + d.sessions, 0);
  const totalDistance = data.reduce((a, d) => a + d.distance, 0).toFixed(1);
  const avgIntensity = data.length > 0 ? Math.round(data.reduce((a, d) => a + d.intensity, 0) / data.length) : 0;

  const METRICS = [
    { key: 'shots',    label: 'Shots',    color: '#FFB300' },
    { key: 'passes',   label: 'Passes',   color: '#60a5fa' },
    { key: 'dribbles', label: 'Dribbles', color: '#00E676' },
    { key: 'intensity',label: 'Intensity',color: '#FF3D3D' },
  ];

  return (
    <div className="page-enter pb-8 select-none">
      <div className="px-5 pt-7 pb-2">
        <h1 className="text-text-primary font-display font-bold text-xl">Progress</h1>
        <p className="text-text-muted text-xs mt-0.5">Track your development over time</p>
      </div>

      <div className="mx-4 mt-3 flex rounded-card bg-surface-2 p-1 gap-1 fade-in-up">
        {['weekly', 'monthly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 capitalize ${
              period === p
                ? 'bg-card text-accent shadow-sm'
                : 'text-text-muted'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mx-4 mt-4 fade-in-up">
        {[
          { label: 'Sessions', value: totalSessions, color: '#00E676' },
          { label: 'Distance', value: `${totalDistance} km`, color: '#60a5fa' },
          { label: 'Avg Int.', value: avgIntensity, color: avgIntensity >= 80 ? '#FF3D3D' : '#FFB300' },
        ].map(p => (
          <div
            key={p.label}
            className="rounded-card p-3 text-center border"
            style={{ background: 'rgba(26,26,34,0.6)', borderColor: 'rgba(38,38,48,0.4)' }}
          >
            <p className="text-lg font-black font-display" style={{ color: p.color }}>{p.value}</p>
            <p className="text-[8px] text-text-muted uppercase tracking-[0.15em] font-semibold mt-0.5">{p.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mx-4 mt-5">
        {METRICS.map((m, idx) => (
          <div
            key={m.key}
            className={`card fade-in-up`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-text-primary font-bold text-sm font-display">{m.label}</p>
                <p className="text-text-muted text-[11px] mt-0.5">
                  Last: <span className="font-bold" style={{ color: m.color }}>
                    {data[data.length - 1]?.[m.key] || 0}
                  </span>
                </p>
              </div>
              <TrendBadge data={data} key_={m.key} />
            </div>

            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={m.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey={xKey}
                    tick={{ fill: '#6b6b7b', fontSize: 9, fontFamily: 'Inter' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6b6b7b', fontSize: 9, fontFamily: 'Inter' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: m.color, strokeWidth: 1, strokeDasharray: '4 2' }} />
                  <Area
                    type="monotoneX"
                    dataKey={m.key}
                    stroke={m.color}
                    fill={`url(#grad-${m.key})`}
                    strokeWidth={2}
                    dot={{ fill: m.color, r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: m.color, r: 5, stroke: '#08080a', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}

        <div className="card fade-in-up">
          <div className="mb-3">
            <p className="text-text-primary font-bold text-sm font-display">Training Consistency</p>
            <p className="text-text-muted text-[11px] mt-0.5">Sessions per {period === 'weekly' ? 'week' : 'month'}</p>
          </div>
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }} barCategoryGap="30%">
                <XAxis
                  dataKey={xKey}
                  tick={{ fill: '#6b6b7b', fontSize: 9, fontFamily: 'Inter' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b6b7b', fontSize: 9, fontFamily: 'Inter' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="sessions" fill="#00E676" fillOpacity={0.7} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-6 fade-in-up">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-semibold mb-3">Personal Records</p>
        <div className="grid grid-cols-2 gap-2">
          {records.map((r) => (
            <div
              key={r.label}
              className="rounded-card p-3 border"
              style={{ background: 'rgba(26,26,34,0.5)', borderColor: 'rgba(38,38,48,0.4)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{r.icon}</span>
                <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">{r.label}</span>
              </div>
              <p className="text-lg font-black font-display" style={{ color: r.color }}>{r.value}</p>
              <p className="text-[10px] text-text-dim mt-0.5">{r.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
