"use client";

import { useState, useEffect } from "react";
import { encryptKey } from "@/utils/crypto";
import { Shield, Key, Trash2, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (savedKey) {
      setIsSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey) return;
    const encrypted = encryptKey(apiKey);
    localStorage.setItem("openrouter_api_key", encrypted);
    setIsSaved(true);
    setApiKey("");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = () => {
    localStorage.removeItem("openrouter_api_key");
    setIsSaved(false);
  };

  return (
    <div className="settings-container">
      <h1 className="title">Settings</h1>
      
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Shield style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.2rem' }}>API Security</h2>
        </div>
        
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
          Your OpenRouter API key is encrypted and stored locally on your device. It is never sent to our servers.
        </p>

        <div className="input-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>
            OPENROUTER API KEY
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              className="input-field"
              style={{ width: '100%', paddingLeft: '40px' }}
              placeholder={isSaved ? "••••••••••••••••••••" : "sk-or-v1-..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isSaved}
            />
            <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          </div>
        </div>

        {isSaved ? (
          <button className="btn" style={{ background: '#ff4b2b', color: '#fff', width: '100%' }} onClick={handleDelete}>
            <Trash2 size={18} />
            Delete Key
          </button>
        ) : (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={!apiKey}>
            <Save size={18} />
            Save Key
          </button>
        )}

        {showSuccess && (
          <div style={{ marginTop: '16px', color: '#03dac6', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '0.9rem' }}>
            <CheckCircle size={16} />
            Key saved successfully!
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>About</h2>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
          Interactive Dictionary v1.0.0
          <br />
          Built with Next.js & Gemini 3.1 Flash Lite.
        </p>
      </div>
    </div>
  );
}
