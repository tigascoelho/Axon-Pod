const SCALE = 100;

export function decodeSamples(baseline, deltas) {
  let cur = { ...baseline };
  return deltas.map((d) => {
    cur = {
      ax: cur.ax + d[0] / SCALE,
      ay: cur.ay + d[1] / SCALE,
      az: cur.az + d[2] / SCALE,
      gx: cur.gx + d[3] / SCALE,
      gy: cur.gy + d[4] / SCALE,
      gz: cur.gz + d[5] / SCALE,
    };
    return { ...cur };
  });
}

export function magnitude(s) {
  return Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2);
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Downsample an array to at most maxPoints evenly spaced items */
export function downsample(arr, maxPoints = 200) {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, i) => arr[Math.floor(i * step)]);
}

/** Detect spikes (magnitude > threshold) */
export function detectSpikes(samples, threshold = 15) {
  return samples.reduce((acc, s, i) => {
    const mag = magnitude(s);
    if (mag > threshold) acc.push({ index: i, mag });
    return acc;
  }, []);
}

/** Basic stats */
export function computeStats(samples) {
  if (!samples.length) return { max: 0, avg: 0, spikes: 0 };
  const mags = samples.map(magnitude);
  const max = Math.max(...mags);
  const avg = mags.reduce((a, b) => a + b, 0) / mags.length;
  const spikes = mags.filter((m) => m > 15).length;
  return { max: +max.toFixed(2), avg: +avg.toFixed(2), spikes };
}
