"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, FileText, Send, Loader2, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const toBase64 = (file: File): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handleProcess = async () => {
    const encryptedKey = localStorage.getItem("openrouter_api_key");
    if (!encryptedKey) {
      setError("Please set your API key in Settings first.");
      return;
    }

    if (!file && !manualText) {
      setError("Please select a file or enter text.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let fileBase64 = "";
      let fileType = "";
      if (file) {
        fileBase64 = await toBase64(file);
        fileType = file.type;
      }

      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileBase64, 
          fileType,
          text: manualText,
          encryptedKey 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process document");
      }

      // Store result in sessionStorage for the reader
      sessionStorage.setItem("processed_data", JSON.stringify(data));
      router.push("/reader");
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/app_logo.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '20px', boxShadow: 'var(--shadow)' }} />
      </div>
      <h1 className="title" style={{ textAlign: 'center' }}>Translate & Learn</h1>
      
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px' }}>
        <div className="input-group">
          <label style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>UPLOAD MATERIAL</label>
          <div 
            style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: '12px', 
              padding: '40px', 
              textAlign: 'center',
              cursor: 'pointer',
              background: file ? 'rgba(187, 134, 252, 0.05)' : 'transparent',
              transition: 'all 0.3s'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {file ? (
              <div style={{ color: 'var(--accent)' }}>
                <FileText size={48} style={{ margin: '0 auto 10px auto' }} />
                <p style={{ fontWeight: '600' }}>{file.name}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div style={{ opacity: 0.5 }}>
                <UploadIcon size={48} style={{ margin: '0 auto 10px auto' }} />
                <p>Click or drag PDF/Images here</p>
                <p style={{ fontSize: '0.7rem' }}>Max 20MB</p>
              </div>
            )}
            <input 
              id="file-input" 
              type="file" 
              accept="image/*,.pdf,.txt" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '20px 0', opacity: 0.3, fontWeight: 'bold' }}>OR</div>

        <div className="input-group">
          <label style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>PASTE TEXT</label>
          <textarea
            className="input-field"
            style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
            placeholder="Paste text you want to learn..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
        </div>

        {error && (
          <div style={{ color: '#ff4b2b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', height: '50px' }} 
          onClick={handleProcess}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} />
              Process Document
            </div>
          )}
        </button>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
