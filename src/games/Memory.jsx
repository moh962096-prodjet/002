import { useState, useEffect, useCallback } from "react";
import { useLeaderboard } from "../hooks/useLeaderboard.js";

const EMOJIS = ["🚀", "🌟", "🎮", "🎯", "🎲", "🏆", "⚡", "🔥"];

function shuffle() {
  const pairs = [...EMOJIS, ...EMOJIS];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

export default function Memory({ onExit }) {
  const [cards, setCards] = useState(shuffle);
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [showName, setShowName] = useState(false);
  const { scores, submit } = useLeaderboard("memory");

  const score = Math.max(0, 100 - moves * 2);

  const handle = (i) => {
    if (cards[i].flipped || cards[i].matched || flipped.length === 2) return;
    const next = cards.map((c, idx) => (idx === i ? { ...c, flipped: true } : c));
    setCards(next);
    const newFlipped = [...flipped, i];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (next[a].emoji === next[b].emoji) {
        setTimeout(() => {
          setCards((cs) =>
            cs.map((c, idx) =>
              idx === a || idx === b ? { ...c, matched: true } : c
            )
          );
          setMatched((m) => m + 1);
          setFlipped([]);
        }, 450);
      } else {
        setTimeout(() => {
          setCards((cs) =>
            cs.map((c, idx) =>
              idx === a || idx === b ? { ...c, flipped: false } : c
            )
          );
          setFlipped([]);
        }, 800);
      }
    }
  };

  const reset = () => {
    setCards(shuffle());
    setFlipped([]);
    setMoves(0);
    setMatched(0);
  };

  const finished = matched === EMOJIS.length;
  useEffect(() => {
    if (finished) setShowName(true);
  }, [finished]);

  const handleSubmit = (name) => {
    submit(name, score);
    setShowName(false);
    reset();
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <button className="back-btn" onClick={onExit}>→ رجوع</button>
        <div className="panel-title">لعبة الذاكرة</div>
      </div>

      <div className="status-row">
        <div className="stat">
          <div className="stat-label">الحركات</div>
          <div className="stat-value">{moves}</div>
        </div>
        <div className="stat">
          <div className="stat-label">مطابقات</div>
          <div className="stat-value win">{matched}/{EMOJIS.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">النقاط</div>
          <div className="stat-value">{score}</div>
        </div>
      </div>

      <div className="memory-board">
        {cards.map((c, i) => (
          <button
            key={c.id}
            className={`mem-card ${c.flipped || c.matched ? "flipped" : ""} ${
              c.matched ? "matched" : ""
            }`}
            onClick={() => handle(i)}
            disabled={c.matched}
          >
            {c.flipped || c.matched ? c.emoji : ""}
          </button>
        ))}
      </div>

      <div className="center" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={reset}>إعادة</button>
      </div>

      <div className="leaderboard">
        <h3>أفضل النتائج</h3>
        {scores.length === 0 ? (
          <p className="empty">لا توجد نتائج بعد</p>
        ) : (
          scores.map((s, i) => (
            <div key={i} className={`lb-row ${i === 0 ? "top" : ""}`}>
              <span className="lb-rank">{i + 1}</span>
              <span>{s.player_name}</span>
              <span className="lb-score">{s.score}</span>
            </div>
          ))
        )}
      </div>

      {showName && (
        <NameModal
          score={score}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowName(false);
            reset();
          }}
        />
      )}
    </div>
  );
}

function NameModal({ score, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>أحسنت!</h3>
        <p>أنهيت اللعبة بـ {score} نقطة. أدخل اسمك:</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك"
          maxLength={20}
          onKeyDown={(e) => e.key === "Enter" && name && onSubmit(name)}
        />
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
          <button className="btn btn-primary" disabled={!name} onClick={() => onSubmit(name)}>
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
