"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Send, Loader2, AlertCircle, FileText, X, Sparkles } from "lucide-react";
import { saveHistoryItem } from "@/utils/db";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      setError("Please attach a file or enter text.");
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
      const docTitle = file ? file.name : (manualText ? manualText.trim().slice(0, 30) + "..." : "Untitled Document");

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Empty state / center content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={56} style={{ opacity: 0.15, margin: '0 auto 16px' }} />
          <h1 className="title" style={{ textAlign: 'center', fontSize: '1.8rem' }}>Translate & Learn</h1>
          <p style={{ opacity: 0.35, fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
            Paste text or attach a document to extract and translate every word with AI.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ 
          color: '#ff4b2b', 
          padding: '10px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          fontSize: '0.85rem',
          background: 'rgba(255, 75, 43, 0.08)',
          borderRadius: '10px',
          marginBottom: '12px'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Attached file chip */}
      {file && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 12px',
          background: 'rgba(187, 134, 252, 0.08)',
          border: '1px solid rgba(187, 134, 252, 0.2)',
          borderRadius: '10px',
          marginBottom: '8px',
          fontSize: '0.85rem',
        }}>
          <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ color: 'var(--accent)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
          <span style={{ opacity: 0.4, fontSize: '0.75rem', flexShrink: 0 }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <button 
            onClick={removeFile}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgba(255,255,255,0.4)', 
              cursor: 'pointer', 
              padding: '2px',
              display: 'flex',
              marginLeft: 'auto',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Chat-style input bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '8px',
        padding: '10px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '14px',
        marginBottom: '16px',
      }}>
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'none',
            border: 'none',
            color: file ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>

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

        {/* Text input */}
        <textarea
          ref={textareaRef}
          style={{ 
            flex: 1, 
            background: 'none', 
            border: 'none', 
            color: 'var(--foreground)', 
            fontSize: '0.9rem',
            resize: 'none',
            outline: 'none',
            minHeight: '24px',
            maxHeight: '200px',
            lineHeight: '1.5',
            padding: '4px 0',
            fontFamily: 'inherit',
          }}
          placeholder="Paste text you want to learn..."
          value={manualText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {/* Send button */}
        <button
          className="btn btn-primary"
          onClick={handleProcess}
          disabled={loading || (!file && !manualText)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '10px',
            flexShrink: 0,
            opacity: (!file && !manualText) ? 0.4 : 1,
          }}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
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
