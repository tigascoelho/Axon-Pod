import { useState } from 'react';

function Toggle({ id, checked, onChange }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-bg shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SettingsRow({ label, sub, right }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-text-primary text-sm font-medium">{label}</p>
        {sub && <p className="text-text-muted text-xs mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-enter pb-28">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-text-primary font-bold text-xl">Settings</h1>
        <p className="text-text-muted text-xs mt-0.5">App & device preferences</p>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Connection */}
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">Connection</p>
          <div className="card">
            <SettingsRow
              label="Backend URL"
              sub="FastAPI server address"
              right={
                <input
                  id="input-api-url"
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="bg-surface border border-border rounded-input px-3 py-1.5 text-xs text-text-primary font-mono w-40 focus:outline-none focus:border-accent transition-colors"
                />
              }
            />
            <SettingsRow
              label="Auto Refresh"
              sub="Poll server every 30s"
              right={
                <Toggle
                  id="toggle-auto-refresh"
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                />
              }
            />
          </div>
        </div>

        {/* Display */}
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">Display</p>
          <div className="card">
            <SettingsRow
              label="Notifications"
              sub="Alert on new session received"
              right={
                <Toggle
                  id="toggle-notifications"
                  checked={notifications}
                  onChange={setNotifications}
                />
              }
            />
            <SettingsRow
              label="High Contrast"
              sub="Brighter accent colours"
              right={
                <Toggle
                  id="toggle-high-contrast"
                  checked={highContrast}
                  onChange={setHighContrast}
                />
              }
            />
          </div>
        </div>

        {/* About */}
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">About</p>
          <div className="card">
            <SettingsRow
              label="Version"
              right={<span className="text-xs text-text-muted font-mono">1.0.0</span>}
            />
            <SettingsRow
              label="Device"
              right={<span className="text-xs text-text-muted">ESP32 · MPU-6050</span>}
            />
            <SettingsRow
              label="Encoding"
              right={<span className="text-xs text-text-muted font-mono">delta / scale=100</span>}
            />
            <SettingsRow
              label="Built with"
              right={<span className="text-xs text-text-muted">Vite + React + Recharts</span>}
            />
          </div>
        </div>

        {/* Save */}
        <button
          id="btn-save-settings"
          onClick={handleSave}
          className={`btn-primary w-full transition-all duration-300 ${saved ? 'bg-accent/70' : ''}`}
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>

        {/* Footer */}
        <p className="text-text-muted text-xs text-center pb-2">
          Antigravity Dashboard · Football Wearable Tech
        </p>
      </div>
    </div>
  );
}
