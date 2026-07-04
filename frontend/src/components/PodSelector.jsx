import React, { useState } from 'react';
import { api } from '../services/dataSource';

export default function PodSelector({ open, onClose, onConnect }) {
  const [scanning, setScanning] = useState(false);
  const [hostInput, setHostInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleDetect = async () => {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const pong = await api.pod.ping();
      setResult({ host: 'default', info: pong });
    } catch (e) {
      setError('No pod detected at default address');
    } finally {
      setScanning(false);
    }
  };

  const handleConnectManual = () => {
    if (!hostInput) return setError('Enter host (e.g. http://192.168.4.1)');
    onConnect(hostInput.trim());
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
      <div className="bg-bg w-[92%] max-w-md rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Find and connect to Pod</h3>
          <button onClick={onClose} className="text-sm opacity-60">Close</button>
        </div>

        <div className="mb-3">
          <p className="text-[12px] text-text-muted">Try auto-detect or enter the pod HTTP host manually.</p>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={handleDetect} className="btn-secondary flex-1 py-2" disabled={scanning}>
            {scanning ? 'Scanning...' : 'Detect Default Pod'}
          </button>
          <button onClick={() => { setHostInput('http://192.168.4.1'); setError(null); }} className="btn-secondary py-2">Use Common IP</button>
        </div>

        <div className="mb-3">
          <input value={hostInput} onChange={(e) => setHostInput(e.target.value)} placeholder="http://192.168.4.1" className="w-full p-2 rounded border border-border bg-surface-2" />
        </div>

        {result && (
          <div className="mb-3 p-2 rounded bg-accent/5 border border-accent/10">Detected pod: {JSON.stringify(result)}</div>
        )}
        {error && (
          <div className="mb-3 text-sm text-danger">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary py-2">Cancel</button>
          <button onClick={handleConnectManual} className="btn-primary py-2">Connect</button>
        </div>
      </div>
    </div>
  );
}
