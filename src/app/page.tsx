"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, FileText, Send, Loader2, AlertCircle } from "lucide-react";
import { saveHistoryItem } from "@/utils/db";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const provider = localStorage.getItem("provider") || "OpenRouter";
    const encryptedKey = localStorage.getItem(`${provider.toLowerCase()}_api_key`);
    const targetLanguage = localStorage.getItem("target_language") || "Russian";
    const baseUrl = localStorage.getItem(`${provider.toLowerCase()}_base_url`) || "";
    const modelName = localStorage.getItem(`${provider.toLowerCase()}_model_name`) || "";

    if (!encryptedKey && provider !== "Custom") {
      setError(`Please set your ${provider} API key in Settings first.`);
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
          encryptedKey,
          provider,
          targetLanguage,
          baseUrl,
          modelName
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

  return (
    <div className="upload-container" style={{ maxWidth: '640px', margin: '0 auto' }}>
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
