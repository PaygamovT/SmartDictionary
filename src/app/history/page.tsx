"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Clock, FileText, Pencil, Check, X } from "lucide-react";
import { getHistoryItems, deleteHistoryItem, renameHistoryItem } from "@/utils/db";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<{ id: string; title: string; timestamp: number }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleReadHistory = (id: string) => {
    if (editingId) return;
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

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const confirmEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId || !editValue.trim()) return;
    try {
      await renameHistoryItem(editingId, editValue.trim());
      setEditingId(null);
      setEditValue("");
      await loadHistory();
    } catch (err) {
      console.error("Failed to rename", err);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div>
      <h1 className="title">History</h1>

      {history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Clock size={56} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
          <p style={{ opacity: 0.5, fontSize: '1rem' }}>No documents processed yet.</p>
          <p style={{ opacity: 0.3, fontSize: '0.85rem', marginTop: '8px' }}>
            Upload a document to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleReadHistory(item.id)}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                cursor: editingId === item.id ? 'default' : 'pointer',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                if (editingId !== item.id) {
                  e.currentTarget.style.borderColor = 'rgba(187, 134, 252, 0.3)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(187, 134, 252, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FileText size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        className="input-field"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.95rem' }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmEdit(e as unknown as React.MouseEvent);
                          if (e.key === 'Escape') cancelEdit(e as unknown as React.MouseEvent);
                        }}
                      />
                      <button
                        onClick={confirmEdit}
                        style={{
                          background: 'var(--accent)',
                          border: 'none',
                          color: '#000',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          borderRadius: '6px',
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          borderRadius: '6px',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.4, marginTop: '2px' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {editingId !== item.id && (
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => startEditing(item.id, item.title, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent)';
                      e.currentTarget.style.background = 'rgba(187, 134, 252, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteHistory(item.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ff4b2b';
                      e.currentTarget.style.background = 'rgba(255, 75, 43, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
