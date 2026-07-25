import { useState } from "react";
import { useLeaderboard } from "../hooks/useLeaderboard.js";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calcWinner(b) {
  for (const [a, c, d] of LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line: [a, c, d] };
  }
  if (b.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

function bestMove(board, ai) {
  const human = ai === "X" ? "O" : "X";
  const empties = board.map((v, i) => (v ? null : i)).filter(Boolean);

  let best = -Infinity;
  let move = empties[0];
  for (const i of empties) {
    const b = board.slice();
    b[i] = ai;
    const score = minimax(b, 0, false, ai, human);
    if (score > best) {
      best = score;
      move = i;
    }
  }
  return move;
}

function minimax(board, depth, max, ai, human) {
  const res = calcWinner(board);
  if (res) {
    if (res.winner === ai) return 10 - depth;
    if (res.winner === human) return depth - 10;
    return 0;
  }
  const empties = board.map((v, i) => (v ? null : i)).filter(Boolean);
  if (max) {
    let best = -Infinity;
    for (const i of empties) {
      const b = board.slice();
      b[i] = ai;
      best = Math.max(best, minimax(b, depth + 1, false, ai, human));
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empties) {
      const b = board.slice();
      b[i] = human;
      best = Math.min(best, minimax(b, depth + 1, true, ai, human));
    }
    return best;
  }
}

export default function TicTacToe({ onExit }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [showName, setShowName] = useState(false);
  const [pendingScore, setPendingScore] = useState(0);
  const { scores, submit } = useLeaderboard("tic-tac-toe");

  const result = calcWinner(board);

  const play = (i) => {
    if (board[i] || result) return;
    const b = board.slice();
    b[i] = "X";
    let next = calcWinner(b);
    if (!next) {
      const ai = bestMove(b, "O");
      if (ai != null) b[ai] = "O";
      next = calcWinner(b);
    }
    setBoard(b);
    setXTurn(!xTurn);
    if (next) {
      if (next.winner === "X") {
        setStats((s) => ({ ...s, wins: s.wins + 1 }));
        const score = 10;
        setPendingScore((p) => p + score);
      } else if (next.winner === "O") {
        setStats((s) => ({ ...s, losses: s.losses + 1 }));
      } else {
        setStats((s) => ({ ...s, draws: s.draws + 1 }));
        setPendingScore((p) => p + 3);
      }
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setXTurn(true);
  };

  const finish = () => {
    if (pendingScore > 0) setShowName(true);
  };

  const handleSubmit = (name) => {
    submit(name, pendingScore);
    setShowName(false);
    setPendingScore(0);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <button className="back-btn" onClick={onExit}>→ رجوع</button>
        <div className="panel-title">إكس-أو</div>
      </div>

      <div className="status-row">
        <div className="stat">
          <div className="stat-label">فوز</div>
          <div className="stat-value win">{stats.wins}</div>
        </div>
        <div className="stat">
          <div className="stat-label">خسارة</div>
          <div className="stat-value lose">{stats.losses}</div>
        </div>
        <div className="stat">
          <div className="stat-label">تعادل</div>
          <div className="stat-value">{stats.draws}</div>
        </div>
        <div className="stat">
          <div className="stat-label">نقاط</div>
          <div className="stat-value">{pendingScore}</div>
        </div>
      </div>

      <div className="ttt-board">
        {board.map((v, i) => (
          <button
            key={i}
            className={`ttt-cell ${v === "X" ? "x" : ""} ${v === "O" ? "o" : ""} ${
              result && result.line.includes(i) ? "win" : ""
            } ${v ? "filled" : ""}`}
            onClick={() => play(i)}
            disabled={!!v || !!result || !xTurn}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="center" style={{ marginBottom: 18 }}>
        {result ? (
          result.winner === "draw" ? (
            <p className="muted">تعادل!</p>
          ) : result.winner === "X" ? (
            <p style={{ color: "var(--success)", fontWeight: 700 }}>فزت!</p>
          ) : (
            <p style={{ color: "var(--error)", fontWeight: 700 }}>خسرت!</p>
          )
        ) : (
          <p className="muted">{xTurn ? "دورك (X)" : "يفكر الكمبيوتر..."}</p>
        )}
      </div>

      <div className="center" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={reset}>جولة جديدة</button>
        <button className="btn btn-primary" onClick={finish} disabled={pendingScore === 0}>
          حفظ النتيجة
        </button>
      </div>

      <Leaderboard scores={scores} />

      {showName && (
        <NameModal
          score={pendingScore}
          onSubmit={handleSubmit}
          onCancel={() => setShowName(false)}
        />
      )}
    </div>
  );
}

function Leaderboard({ scores }) {
  return (
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
  );
}

function NameModal({ score, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>نتيجة رائعة!</h3>
        <p>سجلت {score} نقطة. أدخل اسمك لحفظها:</p>
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
