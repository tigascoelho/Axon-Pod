import { useState, useEffect } from 'react';
import RadarChart from '../components/RadarChart';
import { DevicePanel } from '../components/DeviceComponents';
import { useProfile } from '../hooks/useProfile';
import Spinner from '../components/Spinner';

const POSITIONS = ['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','CF'];

export default function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (profile) setEditData(profile);
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Spinner size="lg" />
        <p className="text-text-muted text-[10px] mt-4 uppercase tracking-[0.2em] animate-pulse">Loading Profile</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
         <p className="text-text-primary font-bold">Error loading profile</p>
         <p className="text-text-muted text-[11px] mt-2">{error}</p>
      </div>
    );
  }

  const handleSave = async () => {
    await updateProfile(editData);
    setIsEditing(false);
  };

  const stats = profile.stats;

  return (
    <div className="page-enter pb-8 select-none">
      {/* Header */}
      <div className="px-5 pt-7 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-text-primary font-display font-bold text-xl uppercase tracking-tight">Profile</h1>
          <p className="text-text-muted text-[11px] font-medium opacity-80 mt-0.5">Athlete Settings & Calibration</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-1.5 rounded-pill text-[10px] font-black uppercase tracking-widest transition-all ${
            isEditing ? 'bg-accent text-black' : 'bg-surface-2 text-text-muted border border-border/50'
          }`}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      {/* Hero Stats Card */}
      <div className="mx-4 mt-4 card-elevated border-border/40 overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-4 opacity-5">
            <span className="text-6xl font-display font-black">{profile.jersey}</span>
         </div>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center shrink-0">
             <span className="text-4xl">👤</span>
          </div>
          <div className="flex-1 min-w-0">
             {isEditing ? (
               <input
                 type="text"
                 value={editData.playerName}
                 onChange={e => setEditData({...editData, playerName: e.target.value})}
                 className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-text-primary font-bold text-lg w-full focus:border-accent outline-none"
               />
             ) : (
               <h2 className="text-text-primary font-display font-black text-2xl truncate">{profile.playerName}</h2>
             )}
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <select
                  value={editData.position}
                  onChange={e => setEditData({...editData, position: e.target.value})}
                  className="bg-surface-2 border border-border rounded-lg px-2 py-0.5 text-text-muted text-[10px] appearance-none"
                >
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <span className="chip-accent px-2 py-0.5">{profile.position}</span>
              )}
              <span className="text-text-muted text-[10px] font-bold tracking-widest line-clamp-1">UK SQUAD • 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Sliders / Radar Summary */}
      <div className="mx-4 mt-6 fade-in-up">
        <p className="section-label">Performance Baseline</p>
        <div className="card mt-3">
          <div className="flex justify-center py-2 opacity-80">
            <RadarChart stats={stats} size={180} />
          </div>
          
          {isEditing && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-4 pt-4 border-t border-border/20">
              {Object.entries(stats).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">{k}</p>
                    <p className="text-[10px] text-accent font-black">{editData.stats[k]}</p>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={editData.stats[k]}
                    onChange={e => setEditData({
                      ...editData,
                      stats: { ...editData.stats, [k]: parseInt(e.target.value) }
                    })}
                    className="w-full h-1 bg-surface-2 rounded-full appearance-none cursor-pointer accent-accent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device management panel */}
      <div className="px-4 mt-6 flex flex-col gap-3 fade-in-up">
        <p className="section-label">Device Management</p>
        <DevicePanel />
      </div>

      {/* Global settings */}
      <div className="mx-4 mt-6 fade-in-up">
        <p className="section-label">App Settings</p>
        <div className="card-elevated px-0 py-1 border-border/30 mt-3">
          {[
            { label: 'Cloud Synchronization', value: 'Auto', icon: '☁️' },
            { label: 'Unit System', value: 'Metric (km/h)', icon: '⚖️' },
            { label: 'Data Privacy', value: 'Squad Only', icon: '🔒' },
            { label: 'Notifications', value: 'On', icon: '🔔' },
          ].map((item, idx) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-4 py-4 active:bg-white/[0.02] transition-colors ${
                idx < 3 ? 'border-b border-border/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="opacity-60">{item.icon}</span>
                <span className="text-text-secondary text-sm font-semibold">{item.label}</span>
              </div>
              <span className="text-text-muted text-[11px] font-bold">{item.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* App Version */}
      <div className="mt-8 mb-4 text-center">
        <p className="text-[10px] text-text-dim uppercase tracking-[0.3em] font-black">Axon Tracker OS v2.4.1</p>
      </div>
    </div>
  );
}
