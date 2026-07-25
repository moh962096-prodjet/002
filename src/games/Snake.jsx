import { useState, useEffect, useRef, useCallback } from "react";
import { useLeaderboard } from "../hooks/useLeaderboard.js";

const SIZE = 20;
const CELL = 18;
const SPEED = 130;

function randFood(snake) {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function Snake({ onExit }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [showName, setShowName] = useState(false);
  const { scores, submit } = useLeaderboard("snake");

  const state = useRef({
    snake: [{ x: 10, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 5, y: 5 },
  });

  const start = useCallback(() => {
    state.current = {
      snake: [{ x: 10, y: 10 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randFood([{ x: 10, y: 10 }]),
    };
    setScore(0);
    setOver(false);
    setRunning(true);
  }, []);

  const tick = useCallback(() => {
    const s = state.current;
    s.dir = s.nextDir;
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

    if (
      head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE ||
      s.snake.some((p) => p.x === head.x && p.y === head.y)
    ) {
      setRunning(false);
      setOver(true);
      setShowName(true);
      return;
    }

    const newSnake = [head, ...s.snake];
    if (head.x === s.food.x && head.y === s.food.y) {
      setScore((sc) => sc + 1);
      s.food = randFood(newSnake);
    } else {
      newSnake.pop();
    }
    s.snake = newSnake;
    draw();
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const s = state.current;
    ctx.fillStyle = "#1a2236";
    ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);

    // food
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // snake
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#22d3ee" : "#0891b2";
      ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, SPEED);
    return () => clearInterval(id);
  }, [running, tick]);

  useEffect(() => {
    const onKey = (e) => {
      const d = state.current.dir;
      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (!nd) return;
      if (nd.x === -d.x && nd.y === -d.y) return;
      state.current.nextDir = nd;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = (name) => {
    submit(name, score);
    setShowName(false);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <button className="back-btn" onClick={onExit}>→ رجوع</button>
        <div className="panel-title">الثعبان</div>
      </div>

      <div className="status-row">
        <div className="stat">
          <div className="stat-label">الطول</div>
          <div className="stat-value">{score + 1}</div>
        </div>
        <div className="stat">
          <div className="stat-label">النقاط</div>
          <div className="stat-value">{score}</div>
        </div>
      </div>

      <div className="snake-wrap">
        <canvas
          ref={canvasRef}
          width={SIZE * CELL}
          height={SIZE * CELL}
          tabIndex={0}
        />
      </div>

      <div className="center" style={{ marginBottom: 12 }}>
        {over ? (
          <p style={{ color: "var(--error)", fontWeight: 700 }}>انتهت اللعبة! نقاطك: {score}</p>
        ) : running ? (
          <p className="muted">استخدم الأسهم أو WASD للتحكم</p>
        ) : (
          <p className="muted">اضغط ابدأ للعب</p>
        )}
      </div>

      <div className="center" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={start}>
          {over ? "إعادة" : "ابدأ"}
        </button>
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
