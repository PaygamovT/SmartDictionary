"use client";

import { useState, useEffect, useRef } from "react";
import { parseAnnotatedTextToParagraphs, ParagraphData, Token } from "@/utils/parser";
import { X, Info, Heart } from "lucide-react";
import { getHistoryItem } from "@/utils/db";

export default function ReaderPage() {
  const [data, setData] = useState<{ annotated_text: string } | null>(null);
  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([]);
  const [title, setTitle] = useState<string>("");
  const [selectedWord, setSelectedWord] = useState<{ token: Token, rect: DOMRect } | null>(null);
  const [favorites, setFavorites] = useState<{ id: number, word: string, translation: string }[]>([]);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDoc = async () => {
      const docId = sessionStorage.getItem("current_doc_id");
      if (docId) {
        const item = await getHistoryItem(docId);
        if (item && item.data) {
          setData(item.data);
          setParagraphs(parseAnnotatedTextToParagraphs(item.data.annotated_text));
          setTitle(item.title);
          return;
        }
      }
      
      const stored = sessionStorage.getItem("processed_data");
      if (stored) {
        const parsedData = JSON.parse(stored);
        setData(parsedData);
        setParagraphs(parseAnnotatedTextToParagraphs(parsedData.annotated_text));
      }
    };
    
    loadDoc();

    const savedFavs = localStorage.getItem("favorites");
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }
  }, []);

  const handleWordClick = (e: React.MouseEvent, token: Token) => {
    if (!token.isWord) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({ token, rect });
  };

  const addToFavorites = () => {
    if (!selectedWord || !data) return;
    
    const translation = selectedWord.token.translation;
    const newFav = {
      id: Date.now(),
      word: selectedWord.token.text,
      translation: translation || "No translation",
    };
    
    const updated = [...favorites, newFav];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setSelectedWord(null);
  };

  const isFavorite = (token: Token) => {
    return favorites.some(f => f.word === token.text && f.translation === token.translation);
  };

  return (
    <div className="reader-container">
      <h1 className="title">{title || "Reader"}</h1>
      
      {!data && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Info size={48} style={{ opacity: 0.3, margin: '0 auto 10px auto' }} />
          <p>No document loaded. Go to Upload first.</p>
        </div>
      )}

      {data && (
        <div className="glass-panel" style={{ padding: '24px', lineHeight: '1.8', fontSize: '1.1rem' }}>
          {paragraphs.map((p, pIdx) => (
            <div key={pIdx} style={{ marginBottom: '20px' }}>
              {p.tokens.map((t, tIdx) => (
                <span
                  key={tIdx}
                  className={t.isWord ? `word clickable ${isFavorite(t) ? 'favorite' : ''}` : 'word'}
                  onClick={(e) => t.isWord && handleWordClick(e, t)}
                >
                  {t.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {selectedWord && (
        <div 
          ref={popoverRef}
          className="glass-panel popover"
          style={{
            position: 'fixed',
            top: `${selectedWord.rect.top - 120}px`,
            left: `${Math.min(window.innerWidth - 220, Math.max(20, selectedWord.rect.left - 100))}px`,
            width: '200px',
            padding: '16px',
            zIndex: 2000,
            animation: 'fadeInUp 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.9rem' }}>{selectedWord.token.text}</span>
            <button onClick={() => setSelectedWord(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.5 }}>
              <X size={14} />
            </button>
          </div>
          
          <div style={{ fontSize: '1rem', marginBottom: '16px' }}>
            {selectedWord.token.translation || "No translation"}
          </div>

          <button 
            className="btn" 
            style={{ 
              width: '100%', 
              fontSize: '0.8rem', 
              background: isFavorite(selectedWord.token) ? 'rgba(187, 134, 252, 0.2)' : 'var(--accent)',
              color: isFavorite(selectedWord.token) ? 'var(--accent)' : '#000'
            }}
            onClick={addToFavorites}
            disabled={isFavorite(selectedWord.token)}
          >
            <Heart size={14} fill={isFavorite(selectedWord.token) ? "currentColor" : "none"} />
            {isFavorite(selectedWord.token) ? 'In Favorites' : 'Add to Cards'}
          </button>
        </div>
      )}

    </div>
  );
}
