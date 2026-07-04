/**
 * POD API SERVICE
 * Connects to the ESP32 Wearable Pod over local Wi-Fi.
 */

let POD_BASE_URL = import.meta.env.VITE_POD_BASE_URL || 'http://192.168.4.1';

export function setPodBaseUrl(url: string) {
  POD_BASE_URL = url;
}

/**
 * Fetch wrapper with AbortController for strict timeouts and retries.
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeoutMs = 2000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      return response;
    } catch (err: any) {
      clearTimeout(id);
      if (i === retries - 1) throw err;
      // short backoff
      await new Promise(r => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}

export const podApi = {
  /**
   * GET /ping
   * Simple connectivity check. Returns 200 OK.
   */
  async ping() {
    const res = await fetchWithRetry(`${POD_BASE_URL}/ping`, {}, 1, 1500);
    return res.text();
  },

  /**
   * GET /status
   * Returns connection state, battery, and session info.
   */
  async getStatus() {
    const res = await fetchWithRetry(`${POD_BASE_URL}/status`, {}, 2, 2000);
    return res.json();
  },

  /**
   * POST /session/start
   * Starts recording on the pod.
   */
  async startSession() {
    const res = await fetchWithRetry(`${POD_BASE_URL}/session/start`, { method: 'POST' });
    return res.json();
  },

  /**
   * POST /session/stop
   * Stops recording on the pod.
   */
  async stopSession() {
    const res = await fetchWithRetry(`${POD_BASE_URL}/session/stop`, { method: 'POST' });
    return res.json();
  },

  /**
   * GET /session/latest
   * Returns metadata about the last recorded session on the pod.
   */
  async getLatestSession() {
    const res = await fetchWithRetry(`${POD_BASE_URL}/session/latest`);
    return res.json();
  },

  /**
   * GET /session/events
   * Returns buffered IMU events (or latest chunk).
   */
  async getSessionEvents() {
    // Fast polling endpoint: 1 try, 1000ms timeout
    const res = await fetchWithRetry(`${POD_BASE_URL}/session/events`, {}, 1, 1000);
    return res.json();
  },

  /**
   * POST /session/ack
   * Acknowledges variables stored on pod so it clears past session data.
   */
  async ackSession(sessionId: string) {
    const res = await fetchWithRetry(`${POD_BASE_URL}/session/ack?sessionId=${encodeURIComponent(sessionId)}`, { method: 'POST' });
    return res.json();
  },

  /**
   * POST /wifi/config
   * Saves WiFi credentials to the ESP32.
   */
  async setWifiConfig(ssid: string, pass: string) {
    const res = await fetchWithRetry(`${POD_BASE_URL}/wifi/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, pass })
    }, 2, 3000);
    return res.json();
  }
};

/**
 * MOCK POD API
 * Simulates pod behavior for development without hardware.
 */
let mockState = 'IDLE';
let mockSessionId = '';
export const mockPodApi = {
  async ping() {
    await new Promise(r => setTimeout(r, 100));
    return "pong";
  },

  async getStatus() {
    await new Promise(r => setTimeout(r, 600));
    return {
      deviceId: 'axon-v1-001',
      firmware: '1.0.4',
      state: mockState,
      batteryPct: 82,
      pendingSync: mockState === 'DONE',
      sessionId: mockSessionId || 'UP001423_001',
      connected: true
    };
  },

  async startSession() {
    await new Promise(r => setTimeout(r, 400));
    if (mockState !== 'IDLE') throw new Error('Not IDLE');
    mockState = 'RECORDING';
    mockSessionId = 'S' + Date.now();
    return { ok: true, state: 'ARMED', sessionId: mockSessionId };
  },

  async stopSession() {
    await new Promise(r => setTimeout(r, 400));
    if (mockState !== 'RECORDING' && mockState !== 'ARMED') throw new Error('Not recording');
    mockState = 'DONE';
    return { ok: true, state: 'DONE', sessionId: mockSessionId };
  },

  async getLatestSession() {
    await new Promise(r => setTimeout(r, 800));
    return {
      sessionId: mockSessionId || 'UP001423_001',
      state: mockState,
      pending: mockState === 'DONE',
      metrics: {
        steps: 1234, distance: 863.8, maxSpeed: 18.2,
        sprints: 5, impacts: 12, duration: 3600.0,
        zones: { low: 120, med: 45, high: 15 }
      }
    };
  },

  async getSessionEvents() {
    await new Promise(r => setTimeout(r, 300));
    return [
      { timestamp: Date.now(), type: 'pass', peakAccel: Math.random() * 15 + 10, duration: 120 }
    ];
  },

  async ackSession(sessionId: string) {
    await new Promise(r => setTimeout(r, 400));
    if (mockSessionId !== sessionId) throw new Error('Session mismatch');
    mockState = 'IDLE';
    mockSessionId = '';
    return { ok: true, cleared: sessionId };
  },

  async setWifiConfig(ssid: string, pass: string) {
    await new Promise(r => setTimeout(r, 1000));
    return { ok: true };
  }
};

