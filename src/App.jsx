import { useState } from "react";
import TicTacToe from "./games/TicTacToe.jsx";
import Memory from "./games/Memory.jsx";
import Snake from "./games/Snake.jsx";
import Game2048 from "./games/Game2048.jsx";

const GAMES = [
  {
    slug: "tic-tac-toe",
    title: "إكس-أو",
    desc: "العب ضد كمبيوتر ذكي بخوارزمية ميني-ماكس في هذه اللعبة الكلاسيكية.",
    icon: "✖️",
    color: "#22d3ee",
  },
  {
    slug: "memory",
    title: "لعبة الذاكرة",
    desc: "اقلب البطاقات وطابق الأزواج بأقل عدد من الحركات.",
    icon: "🧠",
    color: "#f472b6",
  },
  {
    slug: "snake",
    title: "الثعبان",
    desc: "تحكم بالثعبان وكل الطعام لتنمو دون أن تصطدم بنفسك أو بالجدار.",
    icon: "🐍",
    color: "#34d399",
  },
  {
    slug: "2048",
    title: "2048",
    desc: "ادمج الأرقام المتشابهة للوصول إلى بلاطة 2048.",
    icon: "🔢",
    color: "#fbbf24",
  },
];

export default function App() {
  const [active, setActive] = useState(null);

  const renderGame = () => {
    const exit = () => setActive(null);
    switch (active) {
      case "tic-tac-toe":
        return <TicTacToe onExit={exit} />;
      case "memory":
        return <Memory onExit={exit} />;
      case "snake":
        return <Snake onExit={exit} />;
      case "2048":
        return <Game2048 onExit={exit} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" onClick={() => setActive(null)}>
          <div className="brand-mark">A</div>
          <div className="brand-name">أركيد</div>
        </div>
        <nav className="nav">
          {GAMES.map((g) => (
            <button
              key={g.slug}
              className={active === g.slug ? "active" : ""}
              onClick={() => setActive(g.slug)}
            >
              {g.title}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {active ? (
          renderGame()
        ) : (
          <>
            <section className="hero">
              <h1 className="display">أركيد الألعاب</h1>
              <p>أربع ألعاب كلاسيكية بنكهة عصرية. العب، سجّل اسمك، وتصدّر لوحة الأبطال.</p>
            </section>
            <div className="grid">
              {GAMES.map((g) => (
                <div
                  key={g.slug}
                  className="card"
                  style={{ "--accent-color": g.color }}
                  onClick={() => setActive(g.slug)}
                >
                  <div className="card-thumb" style={{ background: `linear-gradient(135deg, ${g.color}22, var(--bg-2))` }}>
                    {g.icon}
                  </div>
                  <div className="card-title">{g.title}</div>
                  <div className="card-desc">{g.desc}</div>
                  <div className="card-meta">
                    <span>العب الآن</span>
                    <b>→</b>
                  </div>
                </div>
              ))}
            </div>
            <p className="footer-note">صُنع بحب — نتائجك تُحفظ في Supabase</p>
          </>
        )}
      </main>
    </div>
  );
}
