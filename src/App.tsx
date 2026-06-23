// LIFE.OS Monitor app shell: dashboard state, persistence, scoring, and UI panels.
import React, { useEffect, useMemo, useRef, useState } from "react";

type Rank = "S" | "A" | "B" | "C";
type Theme = "green" | "red" | "purple" | "cyan";

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

interface XPSnapshot {
  ts: number;
  xp: number;
  level: number;
  streak: number;
}

interface FocusEntry {
  ts: number;
  type: "work" | "break";
  durationSec: number;
  completed: boolean;
}

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

interface LifeOsBackup {
  schema: "life-os-monitor.backup.v1";
  exportedAt: string;
  data: {
    tasks: Task[];
    habits: Habit[];
    notes: string;
    userXp: number;
    streak: number;
    theme: Theme;
    habitDate: string | null;
    xp_history: XPSnapshot[];
    focus_log: FocusEntry[];
  };
}

interface OmbiWebState {
  tasks: Task[];
  habits: Habit[];
  notes: string;
  userXp: number;
  streak: number;
  xpHistory: XPSnapshot[];
  focusLog: FocusEntry[];
}

const RANK_WEIGHT: Record<Rank, number> = { S: 100, A: 70, B: 40, C: 15 };
const RANK_COLOR: Record<Rank, string>  = { S: "#ef4444", A: "#f97316", B: "#22c55e", C: "#06b6d4" };
const CATS = ["Work", "Health", "Personal", "Learning", "Finance", "Fitness", "Side Project"];
const STORAGE_KEYS = ["l2_theme", "l2_tasks", "l2_habits", "l2_notes", "l2_xp", "l2_streak", "l2_habit_date", "l2_xp_history", "l2_focus_log", "l2_ombi_webhook"] as const;

const THEMES: Record<Theme, { primary: string; bgGradient: string }> = {
  green:  { primary: "#22c55e", bgGradient: "rgba(34,197,94,0.02)" },
  red:    { primary: "#ef4444", bgGradient: "rgba(239,68,68,0.02)" },
  purple: { primary: "#a855f7", bgGradient: "rgba(168,85,247,0.02)" },
  cyan:   { primary: "#06b6d4", bgGradient: "rgba(6,182,212,0.02)" },
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function loadNumber(key: string, fallback = 0): number {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

function daysLeft(dt: string | null): number | null {
  if (!dt) return null;
  const t1 = new Date(dt).setHours(0, 0, 0, 0);
  const t2 = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((t1 - t2) / 86400000);
}

function urgencyScore(t: Omit<Task, "id" | "done">): number {
  const baseRankScore = RANK_WEIGHT[t.rank] || 0;
  if (!t.dueDate) return baseRankScore;
  const dueDate = new Date(`${t.dueDate}T23:59:59`);
  const hoursLeft = (dueDate.getTime() - Date.now()) / 3600000;
  const timePressure = hoursLeft < 24 ? 3.0 :
                       hoursLeft < 72 ? 1.8 :
                       hoursLeft < 168 ? 1.2 : 1.0;
  return Math.round(baseRankScore * timePressure);
}

function syncToOMBiWEB(state: OmbiWebState, webhookUrl: string): string {
  void state;
  void webhookUrl;
  // TODO: POST to webhookUrl with the current LIFE.OS state snapshot.
  return "Synced locally — n8n endpoint not configured";
}

const getLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
const getXpForNextLevel = (lvl: number) => Math.pow(lvl, 2) * 100;

function MatrixRain({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let drops = Array(Math.floor(c.width / 20)).fill(0).map(() => Math.random() * -50);
    
    const tick = () => {
      ctx.fillStyle = "rgba(10,11,15,0.08)";
      ctx.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * 20;
        ctx.fillStyle = THEMES[theme].primary;
        ctx.globalAlpha = y < 40 ? 0.6 : 0.12;
        ctx.font = "12px monospace";
        ctx.fillText(ch, i * 20, y);
        if (y > c.height && Math.random() > 0.98) drops[i] = 0;
        drops[i] += 0.4;
      }
      ctx.globalAlpha = 1;
    };
    const id = setInterval(tick, 60);
    return () => { clearInterval(id); window.removeEventListener("resize", resize); };
  }, [theme]);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("l2_theme") as Theme | null;
    return saved && saved in THEMES ? saved : "green";
  });
  const tc = THEMES[theme];

  const [tasks, setTasks] = useState<Task[]>(() => loadJson<Task[]>("l2_tasks", [
    { id: 1, title: "Deploy system patch v2.5", rank: "S", category: "Side Project", dueDate: "2026-06-20", done: false },
    { id: 2, title: "Analyze financial assets", rank: "B", category: "Finance", dueDate: "2026-06-18", done: false },
  ]));

  const [habits, setHabits] = useState<Habit[]>(() => loadJson<Habit[]>("l2_habits", [
    { id: 1, title: "Coding drill (1hr)", done: false, streak: 3 },
    { id: 2, title: "Gym / Cardio session", done: false, streak: 0 },
  ]));

  const [notes, setNotes] = useState<string>(() => localStorage.getItem("l2_notes") || "// SYSTEM SECURE JOURNAL\n- Draft new items here...\n- Insights auto-saved.");
  const [userXp, setUserXp] = useState<number>(() => loadNumber("l2_xp"));
  const [streak, setStreak] = useState<number>(() => loadNumber("l2_streak"));
  const [xpHistory, setXpHistory] = useState<XPSnapshot[]>(() => loadJson<XPSnapshot[]>("l2_xp_history", []));
  const [focusLog, setFocusLog] = useState<FocusEntry[]>(() => loadJson<FocusEntry[]>("l2_focus_log", []));
  const [ombiWebhook, setOmbiWebhook] = useState<string>(() => localStorage.getItem("l2_ombi_webhook") || "");
  const [ombiOpen, setOmbiOpen] = useState<boolean>(true);
  const [ombiStatus, setOmbiStatus] = useState<string>("Node offline — local-only mode.");

  const [catF, setCatF] = useState<string>("All");
  const [rankF, setRankF] = useState<string>("All");
  const [time, setTime] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [dataStatus, setDataStatus] = useState<string>("Ready to export, import, or reset local data.");
  const importRef = useRef<HTMLInputElement>(null);

  const blank: Omit<Task, "id" | "done"> = { title:"", rank:"B", category:"Work", dueDate:"" };
  const [draft, setDraft] = useState<Omit<Task, "id" | "done">>(blank);

  const [pomoSeconds, setPomoSeconds] = useState<number>(25 * 60);
  const [pomoActive, setPomoActive] = useState<boolean>(false);
  const [pomoMode, setPomoMode] = useState<"WORK" | "BREAK">("WORK");

  useEffect(() => { localStorage.setItem("l2_theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("l2_tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("l2_habits", JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem("l2_notes", notes); }, [notes]);
  useEffect(() => { localStorage.setItem("l2_xp", userXp.toString()); }, [userXp]);
  useEffect(() => { localStorage.setItem("l2_streak", streak.toString()); }, [streak]);
  useEffect(() => { localStorage.setItem("l2_xp_history", JSON.stringify(xpHistory)); }, [xpHistory]);
  useEffect(() => { localStorage.setItem("l2_focus_log", JSON.stringify(focusLog)); }, [focusLog]);
  useEffect(() => { localStorage.setItem("l2_ombi_webhook", ombiWebhook); }, [ombiWebhook]);
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastResetTimestamp = localStorage.getItem("l2_habit_date");
    const lastResetStr = lastResetTimestamp ? new Date(lastResetTimestamp).toDateString() : null;
    const needsReset = todayStr !== lastResetStr;
    if (needsReset) {
      setHabits(prev => prev.map(h => ({ ...h, streak: h.done ? h.streak : 0, done: false })));
      localStorage.setItem("l2_habit_date", Date.now().toString());
    }
  }, []);

  useEffect(() => {
    let timer: number | null = null;
    if (pomoActive && pomoSeconds > 0) {
      timer = window.setInterval(() => setPomoSeconds(s => s - 1), 1000);
    } else if (pomoActive && pomoSeconds === 0) {
      try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioContextCtor) {
          const ctx = new AudioContextCtor();
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 0.25);
        }
      } catch {
        // Audio is optional and may be blocked until the user interacts with the page.
      }

      const completedMode = pomoMode;
      const completedDuration = completedMode === "WORK" ? 25 * 60 : 5 * 60;
      const focusType: FocusEntry["type"] = completedMode === "WORK" ? "work" : "break";
      setFocusLog(prev => [...prev, { ts: Date.now(), type: focusType, durationSec: completedDuration, completed: true }].slice(-90));
      if (completedMode === "WORK") {
        const nextXp = userXp + 50;
        setPomoMode("BREAK"); setPomoSeconds(5 * 60); setUserXp(nextXp);
        setXpHistory(prev => [...prev, { ts: Date.now(), xp: nextXp, level: getLevel(nextXp), streak }].slice(-90));
      } else {
        setPomoMode("WORK"); setPomoSeconds(25 * 60);
      }
      setPomoActive(false);
    }
    return () => { if (timer !== null) window.clearInterval(timer); };
  }, [pomoActive, pomoSeconds, pomoMode]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(async ({ coords: { latitude: lat, longitude: lon } }) => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const d = await r.json(); setWeather(d.current_weather);
      } catch {
        setWeather(null);
      }
    }, () => setWeather(null), { timeout: 5000 });
  }, []);

  const formatPomo = () => {
    const minutes = Math.floor(pomoSeconds / 60).toString().padStart(2, "0");
    const seconds = (pomoSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const todayFocus = focusLog.filter(entry => new Date(entry.ts).toDateString() === new Date().toDateString() && entry.completed && entry.type === "work");
  const todayFocusMinutes = Math.round(todayFocus.reduce((sum, entry) => sum + entry.durationSec, 0) / 60);
  const xpDelta = xpHistory.length >= 2 ? xpHistory[xpHistory.length - 1].xp - xpHistory[xpHistory.length - 2].xp : null;
  const questCompletionRate = xpHistory.length >= 3 ? Math.round((xpHistory.slice(1).filter((snap, index) => snap.xp > xpHistory[index].xp).length / (xpHistory.length - 1)) * 100) : null;

  const currentLevel = getLevel(userXp);
  const xpRequiredForNext = getXpForNextLevel(currentLevel);
  const xpCurrentLevelBase = getXpForNextLevel(currentLevel - 1);
  const xpPercent = Math.min(100, Math.max(0, ((userXp - xpCurrentLevelBase) / (xpRequiredForNext - xpCurrentLevelBase)) * 100));

  const scored = useMemo(() => [...tasks].map(t => ({ ...t, score: urgencyScore(t) })).sort((a,b) => (b.score || 0) - (a.score || 0)), [tasks]);
  const urgent = scored.filter(t => !t.done).slice(0, 2);
  const shown  = scored.filter(t => (catF === "All" || t.category === catF) && (rankF === "All" || t.rank === rankF));

  const toggleTask = (id: number) => {
    setTasks(p => p.map(t => {
      if (t.id === id) {
        const nextState = !t.done;
        const reward = urgencyScore(t);
        const nextXp = Math.max(0, userXp + (nextState ? reward : -reward));
        const nextStreak = nextState ? streak + 1 : Math.max(0, streak - 1);
        setUserXp(nextXp);
        setStreak(nextStreak);
        setXpHistory(prev => [...prev, { ts: Date.now(), xp: nextXp, level: getLevel(nextXp), streak: nextStreak }].slice(-90));
        return { ...t, done: nextState };
      }
      return t;
    }));
  };

  const beginEditTask = (task: Task) => {
    setEditId(task.id);
    setDraft({ title: task.title, rank: task.rank, category: task.category, dueDate: task.dueDate });
    setShowAdd(true);
  };

  const saveTask = () => {
    if (!draft.title.trim()) return;
    if (editId) {
      setTasks(p => p.map(t => t.id === editId ? { ...draft, id: editId, done: t.done } : t)); setEditId(null);
    } else {
      setTasks(p => [...p, { ...draft, id: Date.now(), done: false }]);
    }
    setDraft(blank); setShowAdd(false);
  };

  const exportLifeOsData = () => {
    const backup: LifeOsBackup = {
      schema: "life-os-monitor.backup.v1",
      exportedAt: new Date().toISOString(),
      data: {
        tasks,
        habits,
        notes,
        userXp,
        streak,
        theme,
        habitDate: localStorage.getItem("l2_habit_date"),
        xp_history: xpHistory,
        focus_log: focusLog,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `life-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setDataStatus("Backup exported as JSON. Keep it somewhere safe before resetting browser data.");
  };

  const importLifeOsData = async (file: File | undefined) => {
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text()) as Partial<LifeOsBackup>;
      if (backup.schema !== "life-os-monitor.backup.v1" || !backup.data) {
        setDataStatus("Import failed: this is not a LIFE.OS backup v1 file.");
        return;
      }
      const nextTheme = backup.data.theme && backup.data.theme in THEMES ? backup.data.theme : "green";
      const nextTasks = Array.isArray(backup.data.tasks) ? backup.data.tasks : [];
      const nextHabits = Array.isArray(backup.data.habits) ? backup.data.habits : [];
      const nextNotes = typeof backup.data.notes === "string" ? backup.data.notes : "";
      const nextXp = Number.isFinite(backup.data.userXp) ? backup.data.userXp : 0;
      const nextStreak = Number.isFinite(backup.data.streak) ? backup.data.streak : 0;
      const nextXpHistory = Array.isArray(backup.data.xp_history) ? backup.data.xp_history.slice(-90) : [];
      const nextFocusLog = Array.isArray(backup.data.focus_log) ? backup.data.focus_log.slice(-90) : [];

      setTheme(nextTheme);
      setTasks(nextTasks);
      setHabits(nextHabits);
      setNotes(nextNotes);
      setUserXp(nextXp);
      setStreak(nextStreak);
      setXpHistory(nextXpHistory);
      setFocusLog(nextFocusLog);
      if (backup.data.habitDate) {
        localStorage.setItem("l2_habit_date", backup.data.habitDate);
      } else {
        localStorage.removeItem("l2_habit_date");
      }
      setDataStatus(`Imported backup from ${backup.exportedAt ?? "an unknown time"}. Review quests and habits before continuing.`);
    } catch {
      setDataStatus("Import failed: the selected file could not be read as valid JSON.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const resetLifeOsData = () => {
    const confirmed = window.confirm("Reset all LIFE.OS local data on this browser? Export a backup first if you need to keep it.");
    if (!confirmed) return;
    STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    setTheme("green");
    setTasks([]);
    setHabits([]);
    setNotes("// SYSTEM SECURE JOURNAL\n- Fresh local data store initialized.");
    setUserXp(0);
    setStreak(0);
    setXpHistory([]);
    setFocusLog([]);
    setOmbiWebhook("");
    setCatF("All");
    setRankF("All");
    setShowAdd(false);
    setEditId(null);
    setDataStatus("Local LIFE.OS data reset on this browser. Import a backup to recover previous data.");
  };

  const handleOmbiSync = () => {
    const message = syncToOMBiWEB({ tasks, habits, notes, userXp, streak, xpHistory, focusLog }, ombiWebhook);
    setOmbiStatus(message);
  };

  const addHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get("hTitle") as string;
    if (!title.trim()) return;
    setHabits(p => [...p, { id: Date.now(), title, done: false, streak: 0 }]);
    e.currentTarget.reset();
  };

  const toggleHabit = (id: number) => {
    setHabits(p => p.map(h => {
      if (h.id === id) {
        const nextDone = !h.done;
        return { ...h, done: nextDone, streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1) };
      }
      return h;
    }));
  };

  const G = {
    app:  { minHeight:"100vh", background:"#0a0b10", color:"#e5e7eb", fontFamily:"system-ui, -apple-system, sans-serif", padding:"20px", position:"relative" } as React.CSSProperties,
    scan: { position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))", backgroundSize:"100% 4px, 6px 100%", pointerEvents:"none", zIndex:1 } as React.CSSProperties,
    panel: (accent = tc.primary) => ({ background:`#11131e`, border:`1px solid ${accent}33`, borderRadius:"6px", padding:"16px", marginBottom:"12px", boxShadow:`0 4px 20px rgba(0,0,0,0.4)` }) as React.CSSProperties,
    ptitle:(accent = tc.primary) => ({ fontSize:"11px", fontFamily:"monospace", letterSpacing:"1px", color:accent, marginBottom:"12px", paddingBottom:"6px", borderBottom:`1px solid #1f2335`, fontWeight:"bold" }) as React.CSSProperties,
    btn:  (active: boolean, accent = tc.primary) => ({ background: active?`${accent}22`:"#1a1d2e", border:`1px solid ${active?accent:"#2e344f"}`, color:active?accent:"#9ca3af", padding:"5px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"11px", fontWeight:500, fontFamily:"system-ui", transition:"all 0.15s ease" }),
    inp:  { background:"#161925", border:`1px solid #2e344f`, color:"#ffffff", padding:"8px 12px", borderRadius:"4px", fontFamily:"system-ui", fontSize:"13px", outline:"none", boxSizing:"border-box" } as React.CSSProperties,
  };

  return (
    <>
      <style>{`
        body { margin: 0; background: #0a0b10; }
        textarea::placeholder, input::placeholder { color: #4b5563 !important; }
        select { background:#161925; border:1px solid #2e344f; color:#ffffff; font-size:12px; padding:6px; border-radius:4px; outline:none; }
        button:hover { filter: brightness(1.15); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0b10; }
        ::-webkit-scrollbar-thumb { background: #2e344f; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${tc.primary}; }
      `}</style>

      <MatrixRain theme={theme} />
      <div style={G.scan} />
      
      <div style={G.app}>
        <div style={{ position:"relative", zIndex:2, maxWidth:"1200px", margin:"0 auto" }}>

          {/* ── HEADER PANEL ── */}
          <div style={{ ...G.panel(), display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"16px", borderLeft:`4px solid ${tc.primary}` }}>
            <div>
              <div style={{ fontSize:"22px", fontWeight:"bold", letterSpacing:"2px", color:"#ffffff" }}>LIFE.OS // <span style={{color:tc.primary, fontFamily:"monospace"}}>SYSTEM ACTIVE</span></div>
              <div style={{ fontSize:"11px", color:"#9ca3af", marginTop:"2px" }}>Control Deck v2.5 • Optimized Workspace Grid</div>
            </div>
            
            {/* Theme Switches */}
            <div style={{ display:"flex", gap:"6px", alignItems:"center", background:"#161925", padding:"4px", borderRadius:"6px", border:"1px solid #2e344f" }}>
              {(["green", "red", "purple", "cyan"] as Theme[]).map(t => (
                <button key={t} style={{ ...G.btn(theme === t, THEMES[t].primary), padding:"3px 8px", fontSize:"10px" }} onClick={() => setTheme(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ textAlign:"right", fontFamily:"monospace" }}>
              <div style={{ fontSize:"20px", fontWeight:"bold", color:"#ffffff" }}>{time.toTimeString().slice(0,8)}</div>
              <div style={{ fontSize:"10px", color:"#6b7280" }}>{time.toDateString().toUpperCase()}</div>
            </div>
          </div>

          {/* ── MIDDLE GRID ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:"12px", marginBottom:"12px" }}>
            
            {/* AGENT STATUS */}
            <div style={G.panel()}>
              <div style={G.ptitle()}>// PROFILE STATUS</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"6px" }}>
                <span style={{ fontSize:"18px", fontWeight:"bold", color:"#ffffff" }}>LEVEL {currentLevel}</span>
                <span style={{ fontSize:"11px", color:"#9ca3af", fontFamily:"monospace" }}>{userXp} / {xpRequiredForNext} XP</span>
              </div>
              <div style={{ height:"6px", background:`#1e2235`, borderRadius:"3px", marginBottom:"12px", overflow:"hidden" }}>
                <div style={{ width:`${xpPercent}%`, height:"100%", background:tc.primary, boxShadow:`0 0 10px ${tc.primary}`, transition:"width .4s ease" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:"#9ca3af" }}>
                <span style={{ color:"#f97316", fontWeight:600 }}>🔥 {streak} Day Streak</span>
                <span style={{fontFamily:"monospace"}}>Δ {xpDelta === null ? "—" : `${xpDelta >= 0 ? "+" : ""}${xpDelta} XP`}</span>
                <span style={{fontFamily:"monospace"}}>{weather ? `ENV: ${Math.round(weather.temperature)}°C` : "SCANNING REGION..."}</span>
              </div>
            </div>

            {/* POMODORO TIMER */}
            <div style={G.panel(pomoActive ? (pomoMode==="WORK"?"#f97316":tc.primary) : tc.primary)}>
              <div style={G.ptitle()}>// POMODORO FOCUS FIELD</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:"32px", fontWeight:"bold", fontFamily:"monospace", color:"#ffffff" }}>{formatPomo()}</div>
                  <div style={{ fontSize:"10px", color:pomoMode==="WORK"?"#f97316":tc.primary, fontWeight:"bold", letterSpacing:"1px", marginTop:"2px", fontFamily:"monospace" }}>
                    ● STATUS: {pomoMode} LAYER
                  </div>
                  <div style={{ fontSize:"11px", color:"#9ca3af", marginTop:"6px", fontFamily:"monospace" }}>Today: {todayFocus.length} {todayFocus.length === 1 ? "session" : "sessions"}, {todayFocusMinutes} minutes focus</div>
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  <button style={G.btn(pomoActive)} onClick={() => setPomoActive(!pomoActive)}>
                    {pomoActive ? "Pause" : "Engage"}
                  </button>
                  <button style={G.btn(false)} onClick={() => { setPomoActive(false); setPomoSeconds(25*60); setPomoMode("WORK"); }}>
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* HABIT TRACKER */}
            <div style={G.panel()}>
              <div style={G.ptitle()}>// DAILY PROTOCOLS</div>
              <form onSubmit={addHabit} style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
                <input name="hTitle" style={{ ...G.inp, flex:1, padding:"5px 10px", fontSize:"12px" }} placeholder="New daily goal..." />
                <button type="submit" style={G.btn(true)}>+</button>
              </form>
              <div style={{ maxHeight:"100px", overflowY:"auto", paddingRight:"4px" }}>
                {habits.length === 0 && <div style={{fontSize:"11px", color:"#4b5563"}}>No protocols injected yet.</div>}
                {habits.map(h => (
                  <div key={h.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:"13px", padding:"6px 0", borderBottom:`1px solid #1f2335` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }} onClick={() => toggleHabit(h.id)}>
                      <div style={{ width:"14px", height:"14px", borderRadius:"3px", border:`1px solid ${h.done?tc.primary:"#4b5563"}`, background:h.done?`${tc.primary}33`:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:tc.primary }}>
                        {h.done && "✓"}
                      </div>
                      <span style={{ textDecoration:h.done?"line-through":"none", color:h.done?"#4b5563":"#e5e7eb" }}>{h.title}</span>
                    </div>
                    <span style={{ fontSize:"11px", color:"#f97316", fontFamily:"monospace" }}>⚡ {h.streak}d</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DATA PORTABILITY */}
            <div style={G.panel("#06b6d4")}>
              <div style={G.ptitle("#06b6d4")}>// DATA VAULT</div>
              <p style={{ fontSize:"12px", color:"#9ca3af", lineHeight:1.5, marginBottom:"10px" }}>
                Export before moving browsers or resetting storage. Import restores quests, habits, notes, XP, streak, theme, habit date, XP history, and focus log.
              </p>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"8px" }}>
                <button style={G.btn(true, "#06b6d4")} onClick={exportLifeOsData}>Export JSON</button>
                <button style={G.btn(false, "#06b6d4")} onClick={() => importRef.current?.click()}>Import JSON</button>
                <button style={G.btn(false, "#ef4444")} onClick={resetLifeOsData}>Reset Local Data</button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={e => void importLifeOsData(e.target.files?.[0])}
                  style={{ display:"none" }}
                />
              </div>
              <div style={{ fontSize:"11px", color:"#6b7280", fontFamily:"monospace", lineHeight:1.4 }}>{dataStatus}</div>
            </div>

          </div>

          {/* ── CRITICAL HEAT ZONE ── */}
          {urgent.length > 0 && (
            <div style={{ ...G.panel("#ef4444"), border:"1px solid rgba(239,68,68,0.2)" }}>
              <div style={G.ptitle("#ef4444")}>⚠️ INSTANT THREAT TARGETS (HIGH REWARD)</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"10px" }}>
                {urgent.map(t => (
                  <div key={t.id} style={{ background:"#16131a", border:"1px solid rgba(239,68,68,0.2)", padding:"10px", borderRadius:"4px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontWeight:500, fontSize:"13px", color:"#ffffff" }}>{t.title}</span>
                      <span style={{ fontSize:"10px", color:"#ef4444", fontWeight:"bold", fontFamily:"monospace", background:"rgba(239,68,68,0.1)", padding:"1px 6px", borderRadius:"3px" }}>{t.rank}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", marginTop:"8px", color:"#9ca3af" }}>
                      <span>{t.category}</span>
                      <span style={{fontFamily:"monospace", color:tc.primary}}>+{t.score} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LOG MANAGEMENT & WRITING ZONE ── */}
          <div style={{ display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap:"12px" }}>
            
            {/* QUEST LOG */}
            <div style={G.panel()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <div style={G.ptitle()}>// MASTER QUEST DECK</div>
                <button style={G.btn(showAdd)} onClick={() => { setShowAdd(!showAdd); setEditId(null); setDraft(blank); }}>
                  {showAdd ? "Close Panel" : "Inject Quest"}
                </button>
              </div>

              {showAdd && (
                <div style={{ background:"#161925", border:`1px solid #2e344f`, padding:"12px", borderRadius:"6px", marginBottom:"12px" }}>
                  <input style={{ ...G.inp, width:"100%", marginBottom:"8px" }} placeholder="Quest line description..." value={draft.title} onChange={e=>setDraft(p=>({...p,title:e.target.value}))} />
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
                    <select value={draft.rank} onChange={e=>setDraft(p=>({...p,rank:e.target.value as Rank}))}>
                      {["S","A","B","C"].map(r=><option key={r} value={r}>{r}-RANK Threat</option>)}
                    </select>
                    <select value={draft.category} onChange={e=>setDraft(p=>({...p,category:e.target.value}))}>
                      {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="date" style={{ ...G.inp, padding:"4px 8px", fontSize:"12px" }} value={draft.dueDate} onChange={e=>setDraft(p=>({...p,dueDate:e.target.value}))} />
                    <button style={{...G.btn(true), padding:"6px 14px"}} onClick={saveTask} type="button">Confirm</button>
                  </div>
                </div>
              )}

              {/* FILTERS */}
              <div style={{ display:"flex", gap:"5px", marginBottom:"8px", flexWrap:"wrap" }}>
                <button style={G.btn(catF==="All")} onClick={()=>setCatF("All")}>ALL</button>
                {CATS.map(c => <button key={c} style={G.btn(catF===c)} onClick={()=>setCatF(c)}>{c.toUpperCase()}</button>)}
              </div>
              <div style={{ display:"flex", gap:"5px", marginBottom:"12px", flexWrap:"wrap" }}>
                <button style={G.btn(rankF==="All")} onClick={()=>setRankF("All")}>ALL RANKS</button>
                {(["S", "A", "B", "C"] as Rank[]).map(r => <button key={r} style={G.btn(rankF===r, RANK_COLOR[r])} onClick={()=>setRankF(r)}>{r}-RANK</button>)}
              </div>

              {/* TASKS LOG */}
              <div style={{ maxHeight:"260px", overflowY:"auto" }}>
                {shown.length === 0 && <div style={{fontSize:"12px", color:"#4b5563", paddingBlock:"8px"}}>No matching vector data found.</div>}
                {shown.map(t => {
                  const d = daysLeft(t.dueDate);
                  return (
                    <div key={t.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"8px 0", borderBottom:`1px solid #1f2335`, opacity:t.done?0.35:1, transition:"opacity 0.2s" }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} style={{ width:"15px", height:"15px", cursor:"pointer" }} />
                      <span style={{ fontSize:"10px", color:RANK_COLOR[t.rank], fontWeight:"bold", fontFamily:"monospace", background:`${RANK_COLOR[t.rank]}15`, padding:"1px 5px", borderRadius:"3px", width:"14px", textAlign:"center" }}>{t.rank}</span>
                      <span style={{ flex:1, fontSize:"13px", textDecoration:t.done?"line-through":"none", color:t.done?"#4b5563":"#ffffff" }}>{t.title}</span>
                      {questCompletionRate !== null && <span style={{ fontSize:"10px", color:"#ec4899", background:"rgba(236,72,153,0.12)", border:"1px solid rgba(236,72,153,0.25)", padding:"1px 6px", borderRadius:"999px", fontFamily:"monospace" }}>{questCompletionRate}% on-time</span>}
                      <span style={{ fontSize:"11px", color:"#9ca3af", background:"#161925", padding:"1px 6px", borderRadius:"4px" }}>{t.category}</span>
                      {d !== null && <span style={{ fontSize:"11px", fontFamily:"monospace", color:d<=0?"#ef4444":"#6b7280" }}>{d<=0?"OVERDUE":`${d}d left`}</span>}
                      <button onClick={() => beginEditTask(t)} style={{ background:"transparent", border:"none", color:tc.primary, cursor:"pointer", fontSize:"11px", padding:"0 4px" }}>EDIT</button>
                      <button onClick={() => setTasks(p=>p.filter(x=>x.id!==t.id))} style={{ background:"transparent", border:"none", color:"#ef4444", cursor:"pointer", fontSize:"16px", padding:"0 4px" }} aria-label={`Delete ${t.title}`}>×</button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CYBER JOURNAL */}
            <div style={G.panel()}>
              <div style={G.ptitle()}>// DECK NEURAL LOG (AUTO-SAVING)</div>
              <textarea
                style={{
                  width: "100%",
                  height: "295px",
                  background: "#161925",
                  border: `1px solid #2e344f`,
                  color: "#e5e7eb",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  padding: "12px",
                  borderRadius: "6px",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box"
                }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your logs, thoughts, or passive scratchings here..."
              />
            </div>

          </div>

          <div style={{ fontSize:"10px", color:"#4b5563", fontFamily:"monospace", textAlign:"center", marginTop:"20px", letterSpacing:"1px" }}>
            LIFE.OS v2.5 // PRODUCTION GRID ONLINE // ACTIVE SESSION STABLE
          </div>

        </div>
      </div>

      <div style={{ position:"fixed", right:"18px", bottom:"18px", zIndex:50, width:ombiOpen ? "320px" : "180px", background:"#18181b", border:"1px solid rgba(168,85,247,0.3)", borderRadius:"10px", boxShadow:"0 18px 50px rgba(0,0,0,0.55)", padding:"12px", color:"#e5e7eb" }}>
        <button onClick={() => setOmbiOpen(open => !open)} style={{ width:"100%", background:"transparent", border:"none", color:"#e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", padding:0 }}>
          <span style={{ fontSize:"13px", fontWeight:800, letterSpacing:"1px", background:"linear-gradient(90deg, #a855f7, #ec4899, #f97316)", WebkitBackgroundClip:"text", color:"transparent" }}>OMBiWEB ⬡ Node</span>
          <span style={{ fontSize:"11px", color:"#a855f7" }}>{ombiOpen ? "Hide" : "Show"}</span>
        </button>
        {ombiOpen && (
          <div style={{ marginTop:"10px", display:"grid", gap:"8px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", fontFamily:"monospace", color:"#9ca3af" }}>
              <span>Connection</span><span style={{ color:"#ef4444" }}>offline</span>
            </div>
            <label style={{ display:"grid", gap:"4px", fontSize:"11px", color:"#9ca3af" }}>
              Webhook URL
              <input value={ombiWebhook} onChange={e => setOmbiWebhook(e.target.value)} placeholder="https://n8n.example/webhook/..." style={{ ...G.inp, width:"100%", fontSize:"12px" }} />
            </label>
            <button onClick={handleOmbiSync} style={{ ...G.btn(true, "#a855f7"), padding:"8px 12px" }}>Sync</button>
            <div style={{ fontSize:"11px", color:"#6b7280", fontFamily:"monospace", lineHeight:1.4 }}>{ombiStatus}</div>
          </div>
        )}
      </div>
    </>
  );
}
