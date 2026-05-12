"use client";

import { useState, useEffect } from "react";
import { Trash2, HelpCircle, RefreshCw } from "lucide-react";

export default function FlashcardsPage() {
  const [favorites, setFavorites] = useState<{ id: number, word: string, translation: string }[]>([]);
  const [flippedIds, setFlippedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFlip = (id: number) => {
    const newFlipped = new Set(flippedIds);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlippedIds(newFlipped);
  };

  const deleteCard = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <div className="flashcards-container">
      <h1 className="title">Flashcards</h1>
      
      {favorites.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <HelpCircle size={48} style={{ opacity: 0.3, margin: '0 auto 10px auto' }} />
          <p>No cards saved yet. Go to Reader and star some words!</p>
        </div>
      ) : (
        <div className="cards-grid">
          {favorites.map((fav) => (
            <div 
              key={fav.id} 
              className={`card-scene ${flippedIds.has(fav.id) ? 'is-flipped' : ''}`}
              onClick={() => toggleFlip(fav.id)}
            >
              <div className="card-inner glass-panel">
                {/* FRONT */}
                <div className="card-face card-front">
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <button onClick={(e) => deleteCard(e, fav.id)} className="delete-btn">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="card-content">
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--accent)' }}>{fav.word}</h3>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Click to flip</p>
                  </div>
                </div>
                
                {/* BACK */}
                <div className="card-face card-back">
                  <div className="card-content">
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{fav.translation}</h3>
                    <RefreshCw size={16} style={{ opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 20px;
        }
        .card-scene {
          height: 200px;
          perspective: 1000px;
          cursor: pointer;
        }
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
          border: none;
        }
        .card-scene.is-flipped .card-inner {
          transform: rotateY(180deg);
        }
        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .card-back {
          transform: rotateY(180deg);
          background: rgba(187, 134, 252, 0.1);
        }
        .delete-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: color 0.3s;
        }
        .delete-btn:hover {
          color: #ff4b2b;
        }
      `}</style>
    </div>
  );
}
