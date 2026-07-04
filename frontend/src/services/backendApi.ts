/**
 * BACKEND API SERVICE
 * Connects to the cloud backend (Supabase/REST).
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || '';

export const backendApi = {
  async getSessions() {
    const res = await fetch(`${BACKEND_URL}/sessions`);
    if (!res.ok) throw new Error('Could not fetch sessions');
    return res.json();
  },

  async getProgress(period: 'weekly' | 'monthly') {
    const res = await fetch(`${BACKEND_URL}/progress?period=${period}`);
    if (!res.ok) throw new Error('Could not fetch progress');
    return res.json();
  },

  async getRecords() {
    const res = await fetch(`${BACKEND_URL}/records`);
    if (!res.ok) throw new Error('Could not fetch records');
    return res.json();
  },

  async getProfile() {
    const res = await fetch(`${BACKEND_URL}/profile`);
    if (!res.ok) throw new Error('Could not fetch profile');
    return res.json();
  },

  async updateProfile(profile: any) {
    const res = await fetch(`${BACKEND_URL}/profile`, {
      method: 'POST',
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async uploadSession(sessionData: any) {
    const res = await fetch(`${BACKEND_URL}/sessions/upload`, {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
    if (!res.ok) throw new Error('Failed to upload session');
    return res.json();
  }
};

/**
 * MOCK BACKEND API
 * Returns standard demo data for UI development.
 */
export const mockBackendApi = {
  async getSessions() {
    await new Promise(r => setTimeout(r, 600));
    // Pull from localStorage if available (sync simulation)
    const extra = JSON.parse(localStorage.getItem('ag_extra_sessions') || '[]');
    return [...extra, ...DEMO_SESSIONS];
  },

  async getProgress(period: 'weekly' | 'monthly') {
    await new Promise(r => setTimeout(r, 500));
    return period === 'weekly' ? WEEKLY_DATA : MONTHLY_DATA;
  },

  async getRecords() {
    await new Promise(r => setTimeout(r, 400));
    return RECORDS;
  },

  async getProfile() {
    await new Promise(r => setTimeout(r, 300));
    const saved = localStorage.getItem('ag_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  },

  async updateProfile(profile: any) {
    await new Promise(r => setTimeout(r, 800));
    localStorage.setItem('ag_profile', JSON.stringify(profile));
    return { success: true };
  },

  async uploadSession(sessionData: any) {
    await new Promise(r => setTimeout(r, 1500));
    // Simulate persistence
    const newSession = {
      ...sessionData,
      id: Date.now(),
      status: 'ready'
    };
    const extra = JSON.parse(localStorage.getItem('ag_extra_sessions') || '[]');
    localStorage.setItem('ag_extra_sessions', JSON.stringify([newSession, ...extra]));
    return { success: true, session: newSession };
  }
};

/* ── MOCK DATA STORAGE ── */

const DEMO_SESSIONS = [
  {
    id: 1, date: '2026-04-13', time: '18:30', duration: '1h 15m',
    type: 'Full Training', intensity: 92, battery: 78,
    stats: { passes: 142, shots: 18, dribbles: 34, sprints: 22, distance: '8.4 km' },
    highlight: { icon: '🔥', text: 'New sprint speed record: 31.2 km/h' },
    status: 'ready'
  },
  {
    id: 2, date: '2026-04-11', time: '10:00', duration: '52m',
    type: 'Shooting Drill', intensity: 78, battery: 85,
    stats: { passes: 64, shots: 36, dribbles: 12, sprints: 8, distance: '3.8 km' },
    highlight: { icon: '🎯', text: 'Best shooting accuracy: 72% on target' },
    status: 'ready'
  },
  {
    id: 3, date: '2026-04-09', time: '16:45', duration: '1h 30m',
    type: 'Match Simulation', intensity: 95, battery: 62,
    stats: { passes: 198, shots: 12, dribbles: 48, sprints: 31, distance: '10.2 km' },
    highlight: { icon: '⚡', text: 'Highest intensity session this month' },
    status: 'ready'
  }
];

const WEEKLY_DATA = [
  { week: 'W1', sessions: 3, shots: 42, passes: 180, dribbles: 28, intensity: 72, distance: 18.4 },
  { week: 'W2', sessions: 4, shots: 56, passes: 210, dribbles: 35, intensity: 78, distance: 24.1 },
  { week: 'W3', sessions: 3, shots: 38, passes: 195, dribbles: 42, intensity: 75, distance: 19.8 },
  { week: 'W4', sessions: 5, shots: 72, passes: 280, dribbles: 48, intensity: 84, distance: 32.5 },
  { week: 'W5', sessions: 4, shots: 64, passes: 245, dribbles: 52, intensity: 82, distance: 28.2 },
  { week: 'W6', sessions: 4, shots: 68, passes: 260, dribbles: 56, intensity: 86, distance: 30.1 },
];

const MONTHLY_DATA = [
  { month: 'Jan', sessions: 12, shots: 156, passes: 680, dribbles: 98, intensity: 70, distance: 72.3 },
  { month: 'Feb', sessions: 14, shots: 184, passes: 780, dribbles: 120, intensity: 75, distance: 84.1 },
  { month: 'Mar', sessions: 16, shots: 210, passes: 890, dribbles: 148, intensity: 80, distance: 96.8 },
  { month: 'Apr', sessions: 10, shots: 142, passes: 620, dribbles: 102, intensity: 82, distance: 65.4 },
];

const RECORDS = [
  { label: 'Top Sprint Speed', value: '31.2 km/h', date: 'Apr 13', icon: '⚡', color: '#FF3D3D' },
  { label: 'Longest Session', value: '1h 42m', date: 'Mar 28', icon: '⏱', color: '#FFB300' },
  { label: 'Most Passes', value: '198', date: 'Apr 9', icon: '🎯', color: '#60a5fa' },
  { label: 'Highest Intensity', value: '95', date: 'Apr 9', icon: '🔥', color: '#FF3D3D' },
  { label: 'Best Distance', value: '10.2 km', date: 'Apr 9', icon: '📍', color: '#a78bfa' },
  { label: 'Most Dribbles', value: '56', date: 'Apr 5', icon: '🌀', color: '#00E676' },
];

const DEFAULT_PROFILE = {
  playerName: 'Player',
  jersey: '10',
  position: 'CAM',
  foot: 'Right',
  stats: { shot: 72, pass: 68, dribble: 75, speed: 80, defense: 55, physical: 65 },
};
