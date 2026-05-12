"use client";

import { useState, useEffect } from "react";
import { encryptKey } from "@/utils/crypto";
import { Shield, Key, Trash2, Save, CheckCircle, Moon, Sun, Languages, Cpu } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [targetLanguage, setTargetLanguage] = useState("Russian");
  const [provider, setProvider] = useState("OpenRouter");
  const [baseUrl, setBaseUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getPlaceholderUrl = (p: string) => {
    switch(p) {
      case "OpenRouter": return "https://openrouter.ai/api/v1";
      case "OpenAI": return "https://api.openai.com/v1";
      case "Anthropic": return "https://api.anthropic.com/v1";
      case "MiniMax": return "https://api.minimax.io/v1";
      default: return "https://api.yourprovider.com/v1";
    }
  };

  const getPlaceholderModel = (p: string) => {
    switch(p) {
      case "OpenRouter": return "google/gemini-3.1-flash-lite-preview";
      case "OpenAI": return "gpt-4o";
      case "Anthropic": return "claude-3-5-sonnet-20240620";
      case "MiniMax": return "MiniMax-M2.7";
      default: return "openai/gpt-5";
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedLang = localStorage.getItem("target_language") || "Russian";
    const savedProvider = localStorage.getItem("provider") || "OpenRouter";
    const savedBaseUrl = localStorage.getItem(`${savedProvider.toLowerCase()}_base_url`) || "";
    const savedModel = localStorage.getItem(`${savedProvider.toLowerCase()}_model_name`) || "";
    
    setTheme(savedTheme);
    setTargetLanguage(savedLang);
    setProvider(savedProvider);
    setBaseUrl(savedBaseUrl);
    setModelName(savedModel);
    
    // Check if API key exists for this provider
    const savedKey = localStorage.getItem(`${savedProvider.toLowerCase()}_api_key`);
    if (savedKey) {
      setIsSaved(true);
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLanguageChange = (newLang: string) => {
    setTargetLanguage(newLang);
    localStorage.setItem("target_language", newLang);
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    localStorage.setItem("provider", newProvider);
    
    // Load provider-specific settings
    const savedBaseUrl = localStorage.getItem(`${newProvider.toLowerCase()}_base_url`) || "";
    setBaseUrl(savedBaseUrl);
    
    const savedModel = localStorage.getItem(`${newProvider.toLowerCase()}_model_name`) || "";
    setModelName(savedModel);

    // Reset key status when switching providers
    const savedKey = localStorage.getItem(`${newProvider.toLowerCase()}_api_key`);
    setIsSaved(!!savedKey);
    setApiKey("");
  };

  const handleSave = () => {
    // Save provider-specific key
    if (apiKey) {
      const encrypted = encryptKey(apiKey);
      localStorage.setItem(`${provider.toLowerCase()}_api_key`, encrypted);
      setIsSaved(true);
      setApiKey("");
    }

    // Save provider-specific settings
    localStorage.setItem(`${provider.toLowerCase()}_base_url`, baseUrl);
    localStorage.setItem(`${provider.toLowerCase()}_model_name`, modelName);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDeleteKey = () => {
    localStorage.removeItem(`${provider.toLowerCase()}_api_key`);
    setIsSaved(false);
  };

  return (
    <div className="settings-container" style={{ paddingBottom: '100px' }}>
      <h1 className="title">Settings</h1>
      
      {/* Appearance Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          {theme === 'dark' ? <Moon style={{ color: 'var(--accent)' }} /> : <Sun style={{ color: 'var(--accent)' }} />}
          <h2 style={{ fontSize: '1.2rem' }}>Appearance</h2>
        </div>
        <div className="input-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>THEME</label>
          <select 
            className="input-field" 
            value={theme} 
            onChange={(e) => handleThemeChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      {/* Language Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Languages style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.2rem' }}>Translation</h2>
        </div>
        <div className="input-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>TARGET LANGUAGE</label>
          <select 
            className="input-field" 
            value={targetLanguage} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="Russian">Russian</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Arabic">Arabic</option>
            <option value="Hindi">Hindi</option>
            <option value="Portuguese">Portuguese</option>
          </select>
        </div>
      </div>

      {/* Provider Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Cpu style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.2rem' }}>AI Provider</h2>
        </div>
        
        <div className="input-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>PROVIDER</label>
          <select 
            className="input-field" 
            value={provider} 
            onChange={(e) => handleProviderChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="OpenRouter">OpenRouter</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
            <option value="MiniMax">MiniMax</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="input-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>BASE URL</label>
          <input
            type="text"
            className="input-field"
            placeholder={getPlaceholderUrl(provider)}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>MODEL NAME</label>
          <input
            type="text"
            className="input-field"
            placeholder={getPlaceholderModel(provider)}
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>
            {provider.toUpperCase()} API KEY
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              className="input-field"
              style={{ width: '100%', paddingLeft: '40px' }}
              placeholder={isSaved ? "••••••••••••••••••••" : "Enter your API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isSaved}
            />
            <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {isSaved && (
            <button className="btn" style={{ background: '#ff4b2b', color: '#fff', flex: 1 }} onClick={handleDeleteKey}>
              <Trash2 size={18} />
              Delete Key
            </button>
          )}
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={!apiKey && !baseUrl && !modelName && !isSaved}>
            <Save size={18} />
            Save Settings
          </button>
        </div>

        {showSuccess && (
          <div style={{ marginTop: '16px', color: '#03dac6', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '0.9rem' }}>
            <CheckCircle size={16} />
            Settings saved successfully!
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>About</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.6 }}>
          Interactive Dictionary v1.1.2
          <br />
          Built with Next.js & Universal Provider Support.
        </p>
      </div>
    </div>
  );
}
