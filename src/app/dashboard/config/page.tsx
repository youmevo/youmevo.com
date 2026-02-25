'use client';

import { useState, useEffect } from 'react';
import './config.css';

interface AppConfig {
  requireInvitationCode: boolean;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  const handleToggle = async (key: keyof AppConfig) => {
    if (!config || saving) return;
    const newValue = !config[key];
    setConfig({ ...config, [key]: newValue });
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) {
        setConfig({ ...config, [key]: !newValue });
      }
    } catch {
      setConfig({ ...config, [key]: !newValue });
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <main className="config-main">
      <h1>Configuration</h1>
      <div className="config-card">
        <div className="config-item">
          <div className="config-label">
            <h3>Code d&apos;invitation obligatoire</h3>
            <p>Les nouveaux utilisateurs doivent entrer un code d&apos;invitation pour s&apos;inscrire.</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.requireInvitationCode}
              onChange={() => handleToggle('requireInvitationCode')}
              disabled={saving}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>
    </main>
  );
}
