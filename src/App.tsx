import React, { useState, useEffect, useRef } from 'react';

type Rank = 'S' | 'A' | 'B' | 'C';
type Theme = 'green' | 'red' | 'purple' | 'cyan';

interface Task {
  id: number;
  title: string;
  rank: Rank;
  category: string;
  dueDate: string;
  done: boolean;
  score?: number;
}

interface Habit {
  id: number;
  title: string;
  done: boolean;
  streak: number;
}

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

const RANK_WEIGHT: Record<Rank, number> = { S: 100, A: 70, B: 40, C: 15 };
const CATS = [
  'Work',
  'Health',
  'Personal',
  'Learning',
  'Finance',
  'Fitness',
  'Side Project',
];

const THEMES: Record<
  Theme,
  { primary: string; glow: string; text: string; name: string }
> = {
  green: {
    primary: '#00ff41',
    glow: 'rgba(0,255,65,0.5)',
    text: '#00ff41',
    name: 'CLASSIC_MATRIX',
  },
  red: {
    primary: '#ff0055',
    glow: 'rgba(255,0,85,0.5)',
    text: '#ff0055',
    name: 'NEON_TERROR',
  },
  purple: {
    primary: '#b026ff',
    glow: 'rgba(176,38,255,0.5)',
    text: '#e5b8ff',
    name: 'CYBER_PURPLE',
  },
  cyan: {
    primary: '#00cfff',
    glow: 'rgba(0,207,255,0.5)',
    text: '#00cfff',
    name: 'DEEP_CYAN',
  },
};

function daysLeft(dt: string | null): number | null {
  if (!dt) return null;
  const t1 = new Date(dt).setHours(0, 0, 0, 0);
  const t2 = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((t1 - t2) / 86400000);
}

function urgencyScore(t: Omit<Task, 'id' | 'done'>): number {
  const r = RANK_WEIGHT[t.rank] || 0;
  if (!t.dueDate) return r;
  const d = daysLeft(t.dueDate);
  if (d === null) return r;
  const ds = d <= 0 ? 200 : d === 1 ? 150 : d <= 3 ? 100 : d <= 7 ? 60 : 20;
  return r + ds;
}

const getLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
const getXpForNextLevel = (lvl: number) => Math.pow(lvl, 2) * 100;

function MatrixRain({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const chars =
      'アイウエオカキクケコサシスセソタチツテトABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let drops = Array(Math.floor(c.width / 16))
      .fill(0)
      .map(() => Math.random() * -50);

    const tick = () => {
      ctx.fillStyle = 'rgba(5,5,5,0.06)';
      ctx.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * 16;
        ctx.fillStyle = y < 40 ? '#ffffff' : THEMES[theme].primary;
        ctx.globalAlpha = y < 40 ? 0.9 : 0.3;
        ctx.font = '13px monospace';
        ctx.fillText(ch, i * 16, y);
        if (y > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.5;
      }
      ctx.globalAlpha = 1;
    };
    const id = setInterval(tick, 55);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);
  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.12,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function App() {
  // --- STATES & STORAGE ---
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('l2_theme') as Theme) || 'green'
  );
  const tc = THEMES[theme];

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('l2_tasks');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            title: 'Deploy system patch v2.0',
            rank: 'S',
            category: 'Side Project',
            dueDate: '2026-06-20',
            done: false,
          },
          {
            id: 2,
            title: 'Check crypto portfolio',
            rank: 'B',
            category: 'Finance',
            dueDate: '2026-06-18',
            done: false,
          },
        ];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('l2_habits');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, title: 'Coding drill (1hr)', done: false, streak: 3 },
          { id: 2, title: 'Gym / Cardio session', done: false, streak: 0 },
        ];
  });

  const [notes, setNotes] = useState<string>(
    () =>
      localStorage.getItem('l2_notes') ||
      '// SECURE SYSTEM DECK JOURNAL\n\n- Draft new ideas here...\n- Track passive insights.'
  );
  const [userXp, setUserXp] = useState<number>(
    () => Number(localStorage.getItem('l2_xp')) || 0
  );
  const [streak, setStreak] = useState<number>(
    () => Number(localStorage.getItem('l2_streak')) || 0
  );

  // --- FILTER & FORMS ---
  const [catF, setCatF] = useState<string>('All');
  const [rankF, setRankF] = useState<string>('All');
  const [time, setTime] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const blank: Omit<Task, 'id' | 'done'> = {
    title: '',
    rank: 'B',
    category: 'Work',
    dueDate: '',
  };
  const [draft, setDraft] = useState<Omit<Task, 'id' | 'done'>>(blank);

  // --- POMODORO STATE ---
  const [pomoSeconds, setPomoSeconds] = useState<number>(25 * 60);
  const [pomoActive, setPomoActive] = useState<boolean>(false);
  const [pomoMode, setPomoMode] = useState<'WORK' | 'BREAK'>('WORK');

  // --- SYNC EFFECTS ---
  useEffect(() => {
    localStorage.setItem('l2_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('l2_tasks', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem('l2_habits', JSON.stringify(habits));
  }, [habits]);
  useEffect(() => {
    localStorage.setItem('l2_notes', notes);
  }, [notes]);
  useEffect(() => {
    localStorage.setItem('l2_xp', userXp.toString());
  }, [userXp]);
  useEffect(() => {
    localStorage.setItem('l2_streak', streak.toString());
  }, [streak]);
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // --- HABIT DAILY RESET LOGIC ---
  useEffect(() => {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('l2_habit_date');
    if (lastReset !== today) {
      setHabits((prev) =>
        prev.map((h) => ({
          ...h,
          streak: h.done ? h.streak : 0, // break streak if not completed yesterday
          done: false,
        }))
      );
      localStorage.setItem('l2_habit_date', today);
    }
  }, []);

  // --- POMODORO TICKER ---
  useEffect(() => {
    let timer: any = null;
    if (pomoActive && pomoSeconds > 0) {
      timer = setInterval(() => setPomoSeconds((s) => s - 1), 1000);
    } else if (pomoActive && pomoSeconds === 0) {
      // Audio cue (System Beep via AudioContext)
      try {
        const ctx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}

      if (pomoMode === 'WORK') {
        setPomoMode('BREAK');
        setPomoSeconds(5 * 60);
        setUserXp((p) => p + 50); // XP Reward for finishing focus block
      } else {
        setPomoMode('WORK');
        setPomoSeconds(25 * 60);
      }
      setPomoActive(false);
    }
    return () => clearInterval(timer);
  }, [pomoActive, pomoSeconds, pomoMode]);

  // --- GEOLOCATION WEATHER ---
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          );
          const d = await r.json();
          setWeather(d.current_weather);
        } catch {}
      }
    );
  }, []);

  // --- RPG LEVEL LOGIC ---
  const currentLevel = getLevel(userXp);
  const xpRequiredForNext = getXpForNextLevel(currentLevel);
  const xpCurrentLevelBase = getXpForNextLevel(currentLevel - 1);
  const xpPercent = Math.min(
    100,
    Math.max(
      0,
      ((userXp - xpCurrentLevelBase) /
        (xpRequiredForNext - xpCurrentLevelBase)) *
        100
    )
  );

  // --- DATA COMPUTATION ---
  const scored = [...tasks]
    .map((t) => ({ ...t, score: urgencyScore(t) }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const urgent = scored.filter((t) => !t.done).slice(0, 2);
  const shown = scored.filter(
    (t) =>
      (catF === 'All' || t.category === catF) &&
      (rankF === 'All' || t.rank === rankF)
  );

  // --- HANDLERS ---
  const toggleTask = (id: number) => {
    setTasks((p) =>
      p.map((t) => {
        if (t.id === id) {
          const nextState = !t.done;
          const reward = urgencyScore(t);
          setUserXp((v) => Math.max(0, v + (nextState ? reward : -reward)));
          setStreak((s) => (nextState ? s + 1 : Math.max(0, s - 1)));
          return { ...t, done: nextState };
        }
        return t;
      })
    );
  };

  const saveTask = () => {
    if (!draft.title.trim()) return;
    if (editId) {
      setTasks((p) =>
        p.map((t) =>
          t.id === editId ? { ...draft, id: editId, done: t.done } : t
        )
      );
      setEditId(null);
    } else {
      setTasks((p) => [...p, { ...draft, id: Date.now(), done: false }]);
    }
    setDraft(blank);
    setShowAdd(false);
  };

  const addHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('hTitle') as string;
    if (!title.trim()) return;
    setHabits((p) => [...p, { id: Date.now(), title, done: false, streak: 0 }]);
    e.currentTarget.reset();
  };

  const toggleHabit = (id: number) => {
    setHabits((p) =>
      p.map((h) => {
        if (h.id === id) {
          const nextDone = !h.done;
          return {
            ...h,
            done: nextDone,
            streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      })
    );
  };

  // --- DYNAMIC CYBER STYLES ---
  const G = {
    app: {
      minHeight: '100vh',
      background: '#050505',
      color: tc.text,
      fontFamily: "'Courier New',monospace",
      padding: '14px',
      position: 'relative',
    } as React.CSSProperties,
    scan: {
      position: 'fixed',
      inset: 0,
      backgroundImage:
        'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.15) 2px,rgba(0,0,0,.15) 4px)',
      pointerEvents: 'none',
      zIndex: 1,
    } as React.CSSProperties,
    panel: (accent = tc.primary) =>
      ({
        background: `rgba(0,0,0,0.6)`,
        border: `1px solid ${accent}25`,
        borderRadius: '2px',
        padding: '14px',
        marginBottom: '10px',
        boxShadow: `0 0 12px ${accent}03`,
      } as React.CSSProperties),
    ptitle: (accent = tc.primary) =>
      ({
        fontSize: '9px',
        letterSpacing: '3px',
        color: `${accent}88`,
        marginBottom: '10px',
        paddingBottom: '6px',
        borderBottom: `1px solid ${accent}15`,
        fontWeight: 'bold',
      } as React.CSSProperties),
    btn: (active: boolean, accent = tc.primary) =>
      ({
        background: active ? `${accent}18` : 'transparent',
        border: `1px solid ${active ? accent : `${accent}33`}`,
        color: accent,
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: '9px',
        letterSpacing: '1px',
        fontFamily: 'monospace',
        outline: 'none',
      } as React.CSSProperties),
    inp: {
      background: 'rgba(0,0,0,0.4)',
      border: `1px solid ${tc.primary}44`,
      color: tc.text,
      padding: '6px 10px',
      fontFamily: 'monospace',
      fontSize: '11px',
      outline: 'none',
      boxSizing: 'border-box',
    } as React.CSSProperties,
  };

  const formatPomo = () => {
    const m = Math.floor(pomoSeconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (pomoSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <style>{`
        body { margin: 0; background: #050505; }
        textarea::placeholder, input::placeholder { color: ${tc.primary}33 !important; }
        select { background:#050505; border:1px solid ${tc.primary}44; color:${tc.text}; font-family:monospace; font-size:10px; padding:4px; outline:none; }
      `}</style>

      <MatrixRain theme={theme} />
      <div style={G.scan} />

      <div style={G.app}>
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* ── TOP HEADER PANEL ── */}
          <div
            style={{
              ...G.panel(),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  letterSpacing: '6px',
                  textShadow: `0 0 8px ${tc.primary}`,
                }}
              >
                LIFE.OS // {tc.name}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px' }}>
                CORE SYSTEM OVERHAUL V2.0 // MULTI-GRID LOG
              </div>
            </div>

            {/* Theme Switcher */}
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span
                style={{ fontSize: '9px', opacity: 0.4, marginRight: '5px' }}
              >
                COLOR MAP:
              </span>
              {(['green', 'red', 'purple', 'cyan'] as Theme[]).map((t) => (
                <button
                  key={t}
                  style={G.btn(theme === t, THEMES[t].primary)}
                  onClick={() => setTheme(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {time.toTimeString().slice(0, 8)}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.5 }}>
                {time.toDateString().toUpperCase()}
              </div>
            </div>
          </div>

          {/* ── DASHBOARD GRID ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            {/* PROFILE PANEL */}
            <div style={G.panel()}>
              <div style={G.ptitle()}>// SYSTEM AGENT DATA</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  LEVEL {currentLevel}
                </span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>
                  XP: {userXp} / {xpRequiredForNext}
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  background: `${tc.primary}11`,
                  borderRadius: '2px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${xpPercent}%`,
                    height: '100%',
                    background: tc.primary,
                    boxShadow: `0 0 8px ${tc.primary}`,
                    transition: 'width .3s',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                }}
              >
                <span style={{ color: '#ff8800' }}>
                  🔥 {streak} ACTIVE STREAK
                </span>
                <span>
                  WEATHER:{' '}
                  {weather
                    ? `${Math.round(weather.temperature)}°C`
                    : 'SCANNING...'}
                </span>
              </div>
            </div>

            {/* POMODORO TIMER WIDGET */}
            <div
              style={G.panel(
                pomoActive
                  ? pomoMode === 'WORK'
                    ? '#ff8800'
                    : tc.primary
                  : tc.primary
              )}
            >
              <div style={G.ptitle()}>// POMODORO FOCUS MATRIX</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      letterSpacing: '2px',
                    }}
                  >
                    {formatPomo()}
                  </div>
                  <div
                    style={{
                      fontSize: '8px',
                      color: pomoMode === 'WORK' ? '#ff8800' : tc.primary,
                      letterSpacing: '2px',
                      marginTop: '2px',
                    }}
                  >
                    [[ MODE: {pomoMode} ]]
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    style={G.btn(pomoActive)}
                    onClick={() => setPomoActive(!pomoActive)}
                  >
                    {pomoActive ? '[ PAUSE ]' : '[ ENGAGE ]'}
                  </button>
                  <button
                    style={G.btn(false)}
                    onClick={() => {
                      setPomoActive(false);
                      setPomoSeconds(25 * 60);
                      setPomoMode('WORK');
                    }}
                  >
                    [ RESET ]
                  </button>
                </div>
              </div>
            </div>

            {/* HABIT TRACKER PANEL */}
            <div style={G.panel()}>
              <div style={G.ptitle()}>
                // DAILY HABITS CONTROL (AUTO-RESET ACTIVE)
              </div>
              <form
                onSubmit={addHabit}
                style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}
              >
                <input
                  name="hTitle"
                  style={{
                    ...G.inp,
                    flex: 1,
                    padding: '3px 6px',
                    fontSize: '10px',
                  }}
                  placeholder="NEW DAILY PROTOCOL..."
                />
                <button type="submit" style={G.btn(true)}>
                  [ + ]
                </button>
              </form>
              <div style={{ maxHeight: '85px', overflowY: 'auto' }}>
                {habits.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      padding: '4px 0',
                      borderBottom: `1px solid ${tc.primary}11`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleHabit(h.id)}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          border: `1px solid ${tc.primary}`,
                          background: h.done
                            ? `${tc.primary}44`
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                        }}
                      >
                        {h.done && '✓'}
                      </div>
                      <span
                        style={{
                          textDecoration: h.done ? 'line-through' : 'none',
                          opacity: h.done ? 0.5 : 1,
                        }}
                      >
                        {h.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#ff8800' }}>
                      ⚡ {h.streak}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CRITICAL MISSIONS ── */}
          {urgent.length > 0 && (
            <div
              style={{
                ...G.panel('#ff0055'),
                border: '1px solid rgba(255,0,85,0.25)',
              }}
            >
              <div style={G.ptitle('#ff0055')}>
                ⚠️ HIGH REWARD CRITICAL TARGETS
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '10px',
                }}
              >
                {urgent.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(255,0,85,0.03)',
                      border: '1px solid rgba(255,0,85,0.15)',
                      padding: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '11px' }}>
                        {t.title}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          color: '#ff0055',
                          border: '1px solid #ff0055',
                          padding: '0 4px',
                        }}
                      >
                        {t.rank}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '8px',
                        marginTop: '6px',
                        opacity: 0.6,
                      }}
                    >
                      <span>{t.category.toUpperCase()}</span>
                      <span>+{t.score} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAIN TASK MANAGER & JOURNAL GRID ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: '10px',
            }}
          >
            {/* QUEST LOG */}
            <div style={G.panel()}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div style={G.ptitle()}>// MASTER QUEST LOG</div>
                <button
                  style={G.btn(showAdd)}
                  onClick={() => {
                    setShowAdd(!showAdd);
                    setEditId(null);
                    setDraft(blank);
                  }}
                >
                  {showAdd ? '[ ABORT ]' : '[ + INJECT QUEST ]'}
                </button>
              </div>

              {showAdd && (
                <div
                  style={{
                    border: `1px solid ${tc.primary}33`,
                    padding: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <input
                    style={{ ...G.inp, width: '100%', marginBottom: '6px' }}
                    placeholder="VECTOR TITLE..."
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                  <div
                    style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}
                  >
                    <select
                      value={draft.rank}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          rank: e.target.value as Rank,
                        }))
                      }
                    >
                      {['S', 'A', 'B', 'C'].map((r) => (
                        <option key={r} value={r}>
                          {r}-RANK
                        </option>
                      ))}
                    </select>
                    <select
                      value={draft.category}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, category: e.target.value }))
                      }
                    >
                      {CATS.map((c) => (
                        <option key={c} value={c}>
                          {c.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      style={{ ...G.inp, padding: '2px 5px', fontSize: '10px' }}
                      value={draft.dueDate}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, dueDate: e.target.value }))
                      }
                    />
                    <button
                      style={G.btn(true)}
                      onClick={saveTask}
                      type="button"
                    >
                      [ SAVE ]
                    </button>
                  </div>
                </div>
              )}

              {/* FILTERS */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                }}
              >
                {['All', ...CATS].map((c) => (
                  <button
                    key={c}
                    style={G.btn(catF === c)}
                    onClick={() => setCatF(c)}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* TASKS LIST */}
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {shown.map((t) => {
                  const d = daysLeft(t.dueDate);
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '6px 0',
                        borderBottom: `1px solid ${tc.primary}11`,
                        opacity: t.done ? 0.4 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleTask(t.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span
                        style={{
                          fontSize: '9px',
                          border: `1px solid ${tc.primary}44`,
                          padding: '0 3px',
                        }}
                      >
                        {t.rank}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          textDecoration: t.done ? 'line-through' : 'none',
                        }}
                      >
                        {t.title}
                      </span>
                      <span style={{ fontSize: '8px', opacity: 0.4 }}>
                        {t.category.toUpperCase()}
                      </span>
                      {d !== null && (
                        <span
                          style={{
                            fontSize: '8px',
                            color: d <= 0 ? '#ff0055' : 'inherit',
                          }}
                        >
                          {d <= 0 ? 'OVERDUE' : `T-${d}d`}
                        </span>
                      )}
                      <button
                        onClick={() =>
                          setTasks((p) => p.filter((x) => x.id !== t.id))
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ff0055',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CYBER JOURNAL PANEL */}
            <div style={G.panel()}>
              <div style={G.ptitle()}>
                // SECURE SYSTEM JOURNAL / NOTES (AUTO-SAVE)
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '285px',
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${tc.primary}22`,
                  color: tc.text,
                  fontFamily: "'Courier New', monospace",
                  fontSize: '11px',
                  padding: '10px',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Initialize encrypted neural logs..."
              />
            </div>
          </div>

          <div
            style={{
              fontSize: '8px',
              opacity: 0.2,
              textAlign: 'center',
              marginTop: '15px',
              letterSpacing: '2px',
            }}
          >
            LIFE.OS v2.0 // ALL MODULES FIRED AND STABLE // ENCRYPTION AES-256
            LOGGED
          </div>
        </div>
      </div>
    </>
  );
}
