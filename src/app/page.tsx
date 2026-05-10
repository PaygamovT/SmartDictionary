"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, FileText, Send, Loader2, AlertCircle, History, BookOpen, Trash2 } from "lucide-react";
import { saveHistoryItem, getHistoryItems, deleteHistoryItem } from "@/utils/db";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ id: string, title: string, timestamp: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    try {
      const items = await getHistoryItems();
      setHistory(items);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

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

      const docId = Date.now().toString();
      const docTitle = title.trim() || (file ? file.name : "Untitled Document");

      await saveHistoryItem({
        id: docId,
        title: docTitle,
        timestamp: Date.now(),
        data: data
      });

      sessionStorage.setItem("current_doc_id", docId);
      router.push("/reader");
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReadHistory = (id: string) => {
    sessionStorage.setItem("current_doc_id", id);
    router.push("/reader");
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteHistoryItem(id);
      await loadHistory();
    } catch (err) {
      console.error("Failed to delete history", err);
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
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>DOCUMENT TITLE (OPTIONAL)</label>
          <input
            type="text"
            className="input-field"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
            placeholder='e.g., "My Spring"'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

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
            onClick={() => fileInputRef.current?.click()}
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
              ref={fileInputRef}
              type="file" 
              accept="image/*,.pdf,.txt" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
              onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.value = "";
              }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Send size={18} />
              Process Document
            </div>
          )}
        </button>
      </div>

      {history.length > 0 && (
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} />
            Document History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map(item => (
              <div 
                key={item.id}
                onClick={() => handleReadHistory(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BookOpen size={20} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteHistory(item.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff4b2b',
                    opacity: 0.7,
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255, 75, 43, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'none'; }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
