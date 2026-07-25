import { useState, useEffect, useCallback, useRef } from "react";
import { useLeaderboard } from "../hooks/useLeaderboard.js";

const SIZE = 4;
const COLORS = {
  2: "#1e293b",
  4: "#334155",
  8: "#0e7490",
  16: "#0891b2",
  32: "#22d3ee",
  64: "#f472b6",
  128: "#ec4899",
  256: "#fbbf24",
  512: "#f59e0b",
  1024: "#34d399",
  2048: "#10b981",
};

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandom(grid) {
  const empties = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empties.push([r, c]);
  if (empties.length === 0) return grid;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const g = grid.map((row) => row.slice());
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return g;
}

function slide(row) {
  const arr = row.filter((v) => v);
  let gained = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      gained += arr[i];
      arr[i + 1] = 0;
    }
  }
  const res = arr.filter((v) => v);
  while (res.length < SIZE) res.push(0);
  return { row: res, gained };
}

function move(grid, dir) {
  let total = 0;
  let changed = false;
  const g = grid.map((r) => r.slice());

  const transform = (grid, d) => {
    if (d === "left") return grid;
    if (d === "right") return grid.map((r) => r.slice().reverse());
    if (d === "up") return grid[0].map((_, c) => grid.map((r) => r[c]));
    if (d === "down") return grid[0].map((_, c) => grid.map((r) => r[c]).reverse());
    return grid;
  };
  const restore = (grid, d) => {
    if (d === "left") return grid;
    if (d === "right") return grid.map((r) => r.slice().reverse());
    if (d === "up") return grid[0].map((_, c) => grid.map((r) => r[c]));
    if (d === "down") return grid[0].map((_, c) => grid.map((r) => r[c])).map((r) => r.slice().reverse());
    return grid;
  };

  const t = transform(g, dir);
  const moved = t.map((row) => {
    const { row: r, gained } = slide(row);
    total += gained;
    return r;
  });
  const out = restore(moved, dir);

  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (out[r][c] !== g[r][c]) changed = true;

  return { grid: out, gained: total, changed };
}

function canMove(grid) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
}

export default function Game2048({ onExit }) {
  const [grid, setGrid] = useState(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [showName, setShowName] = useState(false);
  const [newCell, setNewCell] = useState(null);
  const { scores, submit } = useLeaderboard("2048");
  const touch = useRef(null);

  const doMove = useCallback(
    (dir) => {
      if (over) return;
      setGrid((g) => {
        const { grid: ng, gained, changed } = move(g, dir);
        if (!changed) return g;
        const withNew = addRandom(ng);
        setScore((s) => {
          const ns = s + gained;
          setBest((b) => Math.max(b, ns));
          return ns;
        });
        if (!canMove(withNew)) {
          setOver(true);
          setShowName(true);
        }
        return withNew;
      });
    },
    [over]
  );

  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
        a: "left",
        d: "right",
        w: "up",
        s: "down",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
    touch.current = null;
  };

  const reset = () => {
    setGrid(addRandom(addRandom(emptyGrid())));
    setScore(0);
    setOver(false);
    setShowName(false);
  };

  const handleSubmit = (name) => {
    submit(name, score);
    setShowName(false);
    reset();
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <button className="back-btn" onClick={onExit}>→ رجوع</button>
        <div className="panel-title">2048</div>
      </div>

      <div className="status-row">
        <div className="stat">
          <div className="stat-label">النقاط</div>
          <div className="stat-value">{score}</div>
        </div>
        <div className="stat">
          <div className="stat-label">الأفضل</div>
          <div className="stat-value win">{best}</div>
        </div>
      </div>

      <div
        className="grid2048"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="cells2048">
          {grid.flat().map((v, i) => (
            <div
              key={i}
              className={`cell2048 ${v === newCell ? "new" : ""}`}
              style={{
                background: COLORS[v] || "transparent",
                color: v > 4 ? "#0a0e1a" : "#f1f5f9",
                fontSize: v >= 1024 ? 18 : v >= 128 ? 22 : 26,
              }}
            >
              {v || ""}
            </div>
          ))}
        </div>
      </div>

      <div className="center" style={{ marginBottom: 12 }}>
        {over ? (
          <p style={{ color: "var(--error)", fontWeight: 700 }}>انتهت اللعبة! نقاطك: {score}</p>
        ) : (
          <p className="muted">اسحب أو استخدم الأسهم لدمج الأرقام</p>
        )}
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
          onCancel={() => setShowName(false)}
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
        <h3>انتهت اللعبة</h3>
        <p>سجلت {score} نقطة. أدخل اسمك:</p>
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
