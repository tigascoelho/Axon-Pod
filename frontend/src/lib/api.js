const BASE = 'http://localhost:8000';

export async function fetchSessions() {
  const res = await fetch(`${BASE}/api/sessions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchSession(id) {
  const res = await fetch(`${BASE}/api/sessions/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
