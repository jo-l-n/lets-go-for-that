import { useState, useEffect, useCallback, useRef } from "react";

const C = {
  navy: "#1B2A4A", gold: "#C9A84C", goldLight: "#F7F0DC", warm: "#8A8A8A",
  bg: "#F8F6F1", white: "#FFFFFF", green: "#3D7A4A", greenLight: "#E6F2E9",
  dark: "#2C2C2C", border: "#E8E4DC", blue: "#2563EB", blueLight: "#EFF6FF",
  orange: "#B45309", orangeLight: "#FEF3E2",
};

const KYLE_WEEKLY = [
  { day: "Monday", chores: [
    { task: "Dishes", freq: "daily" },
    { task: "Clean kitchen", freq: "daily" },
  ]},
  { day: "Tuesday", chores: [
    { task: "Dishes", freq: "daily" },
    { task: "Clean kitchen", freq: "daily" },
    { task: "Laundry", freq: "2x/wk" },
    { task: "Vacuum common areas & couch", freq: "weekly" },
    { task: "Backyard dog cleanup", freq: "weekly" },
  ]},
  { day: "Wednesday", chores: [
    { task: "Dishes", freq: "daily" },
    { task: "Clean kitchen", freq: "daily" },
    { task: "Mow", freq: "2x/wk" },
    { task: "Take out trash", freq: "weekly" },
    { task: "Take out recycling", freq: "weekly" },
  ]},
  { day: "Thursday", chores: [
    { task: "Dishes", freq: "daily" },
    { task: "Clean kitchen", freq: "daily" },
    { task: "Spot clean bathrooms", freq: "weekly" },
  ]},
  { day: "Friday", chores: [
    { task: "Dishes", freq: "daily" },
    { task: "Clean kitchen", freq: "daily" },
    { task: "Laundry", freq: "2x/wk" },
  ]},
  { day: "Saturday", chores: [
    { task: "Dishes", freq: "daily" },
    { task: "Clean kitchen", freq: "daily" },
  ]},
  { day: "Sunday", chores: [
    { task: "Dishes", freq: "daily" },
    { task: "Clean kitchen", freq: "daily" },
    { task: "Mow", freq: "2x/wk" },
  ]},
];

const KYLE_MONTHLY = ["Deep clean bathrooms", "Mop floors", "Vacuum bedrooms", "Wash bedding"];
const JO_MONTHLY = ["Rent", "Water", "Electric", "Gas", "Internet", "Change air filter"];

const KYLE_TRAINING = [
  { day: "Monday", sessions: [{ time: "AM", type: "MMA" }, { time: "PM", type: "MMA" }] },
  { day: "Tuesday", sessions: [{ time: "PM", type: "Weight Training w/ Jo" }] },
  { day: "Wednesday", sessions: [{ time: "AM", type: "MMA" }, { time: "PM", type: "MMA" }] },
  { day: "Thursday", sessions: [{ time: "PM", type: "Weight Training w/ Jo" }] },
  { day: "Friday", sessions: [{ time: "AM", type: "MMA" }, { time: "PM", type: "MMA" }] },
  { day: "Saturday", sessions: [{ time: "AM", type: "MMA" }] },
  { day: "Sunday", sessions: [] },
];

const JO_TRAINING = [
  { day: "Monday", sessions: [{ time: "", type: "Cardio" }] },
  { day: "Tuesday", sessions: [{ time: "PM", type: "Weight Training w/ Kyle (Home Gym)" }] },
  { day: "Wednesday", sessions: [{ time: "", type: "Cardio" }] },
  { day: "Thursday", sessions: [{ time: "PM", type: "Weight Training w/ Kyle (Home Gym)" }] },
  { day: "Friday", sessions: [{ time: "", type: "Cardio" }] },
  { day: "Saturday", sessions: [{ time: "AM", type: "Solo Gym (Home)" }] },
  { day: "Sunday", sessions: [] },
];

const SEASONAL_TASKS = [
  { task: "Deep clean fridge", season: "Every 3 months" },
  { task: "Clean windows", season: "Every 3 months" },
  { task: "Clean ceiling fans", season: "Every 3 months" },
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const ys = new Date(d.getFullYear(), 0, 4);
  const wn = Math.round(((d - ys) / 86400000 + ys.getDay() + 3) / 7);
  return d.getFullYear() + "-W" + String(wn).padStart(2, "0");
}

function getMonthId() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function getQuarterId() {
  const d = new Date();
  return d.getFullYear() + "-Q" + Math.ceil((d.getMonth() + 1) / 3);
}

function getWeekRange(wid) {
  const parts = wid.split("-W");
  const y = parseInt(parts[0]);
  const w = parseInt(parts[1]);
  const j4 = new Date(y, 0, 4);
  const dow = j4.getDay() || 7;
  const mon = new Date(j4);
  mon.setDate(j4.getDate() - dow + 1 + (w - 1) * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (dt) => dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return fmt(mon) + " \u2013 " + fmt(sun);
}

function getMonthName(mid) {
  const parts = mid.split("-");
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

import { fbGet, fbSet, fbListen } from './firebase.js';

async function sGet(key) {
  return await fbGet(key);
}

async function sSet(key, val) {
  await fbSet(key, val);
}

function Badge({ freq }) {
  const colors = {
    daily: { bg: "#E8ECF2", fg: C.navy },
    "2x/wk": { bg: "#FFF3D6", fg: "#8B6914" },
    weekly: { bg: C.greenLight, fg: C.green },
    monthly: { bg: C.blueLight, fg: C.blue },
    seasonal: { bg: C.orangeLight, fg: C.orange },
  };
  const s = colors[freq] || colors.daily;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: s.fg, background: s.bg,
      padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase",
    }}>
      {freq}
    </span>
  );
}

function Chk({ on, small }) {
  const sz = small ? 22 : 26;
  return (
    <div style={{
      width: sz, height: sz, minWidth: sz, borderRadius: 6,
      border: on ? "2px solid " + C.green : "2px solid #C8C4BC",
      background: on ? C.green : C.white,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {on && (
        <svg width={sz - 10} height={sz - 10} viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function Ring({ pct, size }) {
  const s = size || 48;
  const r = (s - 6) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  return (
    <svg width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="#EDEDED" strokeWidth={5} />
      <circle cx={s / 2} cy={s / 2} r={r} fill="none"
        stroke={pct === 100 ? C.green : C.gold}
        strokeWidth={5} strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset .5s ease" }}
      />
    </svg>
  );
}

function Progress({ pct, done, total, label }) {
  return (
    <div style={{
      background: C.white, borderRadius: 14, padding: "16px 18px", marginBottom: 18,
      border: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ position: "relative" }}>
        <Ring pct={pct} />
        <div style={{
          position: "absolute", top: 0, left: 0, width: 48, height: 48,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: pct === 100 ? C.green : C.navy,
        }}>
          {pct}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
          {done} of {total} {label || "tasks"}
        </div>
        <div style={{ fontSize: 12, color: C.warm, marginTop: 2 }}>
          {pct === 100 ? "All done!" : pct >= 50 ? "Over halfway" : "Let's get after it"}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("kyle");
  const [week, setWeek] = useState({});
  const [kMonth, setKMonth] = useState({});
  const [jMonth, setJMonth] = useState({});
  const [seasonal, setSeasonal] = useState({});
  const [added, setAdded] = useState({ items: [] });
  const [notes, setNotes] = useState({});
  const [hist, setHist] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [noteFor, setNoteFor] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [wid, setWid] = useState(getWeekId());
  const [kTrain, setKTrain] = useState({});
  const [jTrain, setJTrain] = useState({});
  const [grocery, setGrocery] = useState([]);
  const [grocInput, setGrocInput] = useState("");

  const nowWid = getWeekId();
  const nowMid = getMonthId();
  const nowQid = getQuarterId();
  const isCurr = wid === nowWid;
  const today = DAYS[new Date().getDay()];

  useEffect(() => {
    let alive = true;
    async function go() {
      setLoading(true);
      const wd = await sGet("week:" + wid) || {};
      const km = await sGet("kyle-month:" + nowMid) || {};
      const jm = await sGet("jo-month:" + nowMid) || {};
      const sd = await sGet("seasonal:" + nowQid) || {};
      const at = await sGet("added:" + wid) || { items: [] };
      const nt = await sGet("notes:" + wid) || {};
      const hi = await sGet("history-index") || [];
      const sk = await sGet("streak") || 0;
      const kt = await sGet("kyle-train:" + wid) || {};
      const jt = await sGet("jo-train:" + wid) || {};
      const gr = await sGet("grocery-list") || [];
      if (alive) {
        setWeek(wd); setKMonth(km); setJMonth(jm); setSeasonal(sd);
        setAdded(at); setNotes(nt); setHist(hi); setStreak(sk);
        setKTrain(kt); setJTrain(jt); setGrocery(gr); setLoading(false);
      }
    }
    go();

    // Real-time listeners for shared data
    const unsubs = [
      fbListen("grocery-list", (val) => { if (alive && val) setGrocery(val); }),
      fbListen("week:" + wid, (val) => { if (alive && val) setWeek(val); }),
      fbListen("kyle-train:" + wid, (val) => { if (alive && val) setKTrain(val); }),
      fbListen("jo-train:" + wid, (val) => { if (alive && val) setJTrain(val); }),
    ];

    return () => { alive = false; unsubs.forEach((u) => u()); };
  }, [wid, nowMid, nowQid]);

  const totalW = KYLE_WEEKLY.reduce((s, d) => s + d.chores.length, 0) + (added.items || []).length;
  const doneW = Object.entries(week).filter(([k, v]) => v && !k.startsWith("by:")).length;
  const pctW = totalW ? Math.round((doneW / totalW) * 100) : 0;

  const saveWeekData = useCallback(async (wd, at, nt) => {
    await sSet("week:" + wid, wd);
    await sSet("added:" + wid, at);
    await sSet("notes:" + wid, nt);
    const t = KYLE_WEEKLY.reduce((s, d) => s + d.chores.length, 0) + (at.items || []).length;
    const d = Object.entries(wd).filter(([k, v]) => v && !k.startsWith("by:")).length;
    const p = t ? Math.round((d / t) * 100) : 0;
    let hi = await sGet("history-index") || [];
    const idx = hi.findIndex((h) => h.weekId === wid);
    const entry = { weekId: wid, done: d, total: t, pct: p };
    if (idx >= 0) hi[idx] = entry; else hi.push(entry);
    hi.sort((a, b) => b.weekId.localeCompare(a.weekId));
    hi = hi.slice(0, 12);
    await sSet("history-index", hi);
    setHist(hi);
    let s = 0;
    for (const h of hi) { if (h.pct === 100) s++; else break; }
    await sSet("streak", s);
    setStreak(s);
  }, [wid]);

  function togW(key, who) {
    if (!isCurr) return;
    setWeek((prev) => {
      const n = { ...prev, [key]: !prev[key] };
      if (!prev[key] && who) n["by:" + key] = who;
      else delete n["by:" + key];
      saveWeekData(n, added, notes);
      return n;
    });
  }

  function togStore(sk, setter, idx) {
    setter((prev) => {
      const n = { ...prev, [idx]: !prev[idx] };
      sSet(sk, n);
      return n;
    });
  }

  function togTrain(who, di, si) {
    if (!isCurr) return;
    const key = di + "-" + si;
    const setter = who === "kyle" ? setKTrain : setJTrain;
    const sk = who + "-train:" + wid;
    setter((prev) => {
      const n = { ...prev, [key]: !prev[key] };
      sSet(sk, n);
      return n;
    });
  }

  function addItem(tab) {
    if (!input.trim()) return;
    if (tab === "kyle") {
      const u = { ...added, items: [...(added.items || []), { task: input.trim() }] };
      setAdded(u); setInput(""); saveWeekData(week, u, notes);
    } else {
      setJMonth((prev) => {
        const custom = [...(prev._custom || []), input.trim()];
        const n = { ...prev, _custom: custom };
        sSet("jo-month:" + nowMid, n);
        return n;
      });
      setInput("");
    }
  }

  function removeItem(tab, idx) {
    if (tab === "kyle") {
      const items = (added.items || []).filter((_, i) => i !== idx);
      const u = { ...added, items };
      const nw = { ...week };
      delete nw["added-" + idx];
      delete nw["by:added-" + idx];
      setAdded(u); setWeek(nw); saveWeekData(nw, u, notes);
    } else {
      setJMonth((prev) => {
        const custom = (prev._custom || []).filter((_, i) => i !== idx);
        const n = { ...prev, _custom: custom };
        delete n["custom-" + idx];
        sSet("jo-month:" + nowMid, n);
        return n;
      });
    }
  }

  function doSaveNote(key, text) {
    if (key.startsWith("jo:")) {
      setJMonth((prev) => {
        const n = { ...prev, ["note:" + key.slice(3)]: text };
        sSet("jo-month:" + nowMid, n);
        return n;
      });
    } else if (key.startsWith("km:")) {
      setKMonth((prev) => {
        const n = { ...prev, ["note:" + key.slice(3)]: text };
        sSet("kyle-month:" + nowMid, n);
        return n;
      });
    } else {
      const u = { ...notes, [key]: text };
      setNotes(u);
      saveWeekData(week, added, u);
    }
    setNoteFor(null);
    setNoteText("");
  }

  function navWeek(dir) {
    const parts = wid.split("-W");
    let y = parseInt(parts[0]);
    let w = parseInt(parts[1]) + dir;
    if (w < 1) { y--; w = 52; }
    if (w > 52) { y++; w = 1; }
    setWid(y + "-W" + String(w).padStart(2, "0"));
  }

  // Grocery
  function addGroc() {
    if (!grocInput.trim()) return;
    const u = [...grocery, { name: grocInput.trim(), checked: false, id: Date.now() }];
    setGrocery(u); setGrocInput(""); sSet("grocery-list", u);
  }
  function togGroc(id) {
    const u = grocery.map((i) => i.id === id ? { ...i, checked: !i.checked } : i);
    setGrocery(u); sSet("grocery-list", u);
  }
  function delGroc(id) {
    const u = grocery.filter((i) => i.id !== id);
    setGrocery(u); sSet("grocery-list", u);
  }
  function clearGroc() {
    const u = grocery.filter((i) => !i.checked);
    setGrocery(u); sSet("grocery-list", u);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.warm, fontFamily: "'DM Sans',sans-serif" }}>Loading...</div>
      </div>
    );
  }

  const kmDone = Object.entries(kMonth).filter(([k, v]) => v && !k.startsWith("note:") && !k.startsWith("by:")).length;
  const kmPct = Math.round((kmDone / KYLE_MONTHLY.length) * 100);
  const jmCustom = jMonth._custom || [];
  const jmTotal = JO_MONTHLY.length + jmCustom.length;
  const jmDone = JO_MONTHLY.filter((_, i) => jMonth[i]).length + jmCustom.filter((_, i) => jMonth["custom-" + i]).length;
  const jmPct = jmTotal ? Math.round((jmDone / jmTotal) * 100) : 0;
  const sDone = SEASONAL_TASKS.filter((_, i) => seasonal[i]).length;
  const sPct = Math.round((sDone / SEASONAL_TASKS.length) * 100);
  const grocChecked = grocery.filter((i) => i.checked).length;
  const grocUnchecked = grocery.filter((i) => !i.checked);

  const tabs = [
    ["kyle", "Kyle"], ["jo", "Jo"], ["groceries", "\uD83D\uDED2"],
    ["kyle-train", "Kyle \uD83C\uDFCB\uFE0F"], ["jo-train", "Jo \uD83C\uDFCB\uFE0F"],
    ["seasonal", "Seasonal"], ["history", "History"],
  ];

  const font = "'DM Sans','Avenir Next',sans-serif";
  const titleFont = "'Playfair Display',Georgia,serif";

  function card(children, extra) {
    return (
      <div style={{
        background: C.white, borderRadius: 14, marginBottom: 12,
        border: "1px solid " + C.border, overflow: "hidden", ...extra,
      }}>
        {children}
      </div>
    );
  }

  function cardHead(title, sub) {
    return (
      <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #F0ECE4" }}>
        <span style={{ fontFamily: titleFont, fontSize: 18, color: C.navy, fontWeight: 600 }}>{title}</span>
        {sub && <div style={{ fontSize: 11, color: C.warm, marginTop: 1 }}>{sub}</div>}
      </div>
    );
  }

  function inputRow(val, setVal, onSubmit, placeholder) {
    return (
      <div style={{ display: "flex", gap: 6, padding: "8px 6px 4px" }}>
        <input
          value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={placeholder || "Add a task..."}
          style={{
            flex: 1, border: "1px solid " + C.border, borderRadius: 6,
            padding: "8px 10px", fontSize: 13, fontFamily: font, outline: "none",
          }}
        />
        <button onClick={onSubmit} style={{
          background: C.navy, color: C.white, border: "none", borderRadius: 8,
          padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
        }}>Add</button>
      </div>
    );
  }

  function noteRow(nk) {
    if (noteFor !== nk) return null;
    return (
      <div style={{ padding: "4px 6px 10px 46px", display: "flex", gap: 6 }}>
        <input
          value={noteText} onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSaveNote(nk, noteText)}
          placeholder="Add a note..."
          style={{
            flex: 1, border: "1px solid " + C.border, borderRadius: 6,
            padding: "6px 10px", fontSize: 12, fontFamily: font, outline: "none",
          }}
        />
        <button onClick={() => doSaveNote(nk, noteText)} style={{
          background: C.navy, color: C.white, border: "none", borderRadius: 6,
          padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: font,
        }}>Save</button>
      </div>
    );
  }

  function taskRow(task, freq, checked, noteVal, nk, onTog, canEdit, doneBy) {
    return (
      <div key={nk}>
        <div
          onClick={canEdit ? onTog : undefined}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 6px",
            borderBottom: "1px solid #F5F3EE", cursor: canEdit ? "pointer" : "default",
            userSelect: "none", WebkitTapHighlightColor: "transparent",
          }}
        >
          <Chk on={checked} />
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: 14, fontWeight: 500, color: checked ? C.warm : C.dark,
              textDecoration: checked ? "line-through" : "none",
            }}>{task}</span>
            {doneBy && <span style={{ fontSize: 10, color: C.warm, marginLeft: 6 }}>{"\u2022"} {doneBy}</span>}
            {noteVal && <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>{"\uD83D\uDCDD"} {noteVal}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setNoteFor(noteFor === nk ? null : nk); setNoteText(noteVal || ""); }}
                style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", padding: "2px", color: noteVal ? C.gold : "#CCC" }}
              >{"\uD83D\uDCDD"}</button>
            )}
            {freq && <Badge freq={freq} />}
          </div>
        </div>
        {noteRow(nk)}
      </div>
    );
  }

  function weekNav() {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "0 4px" }}>
        <button onClick={() => navWeek(-1)} style={{ background: "none", border: "none", fontSize: 22, color: C.navy, cursor: "pointer", padding: "4px 8px" }}>{"\u2039"}</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{isCurr ? "This Week" : wid}</div>
          <div style={{ fontSize: 12, color: C.warm }}>{getWeekRange(wid)}</div>
        </div>
        <button onClick={() => navWeek(1)} style={{ background: "none", border: "none", fontSize: 22, color: C.navy, cursor: "pointer", padding: "4px 8px" }}>{"\u203A"}</button>
      </div>
    );
  }

  function trainView(schedule, data, who) {
    const tot = schedule.reduce((s, d) => s + d.sessions.length, 0);
    const dn = Object.entries(data).filter(([, v]) => v).length;
    const p = tot ? Math.round((dn / tot) * 100) : 0;
    return (
      <>
        {weekNav()}
        {!isCurr && (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <button onClick={() => setWid(nowWid)} style={{
              background: C.goldLight, border: "1px solid " + C.gold + "60", borderRadius: 8,
              padding: "6px 12px", fontSize: 11, fontWeight: 700, color: C.navy, cursor: "pointer", fontFamily: font,
            }}>This Week</button>
          </div>
        )}
        <Progress pct={p} done={dn} total={tot} label="sessions" />
        {schedule.map((dayData, di) => {
          const isToday = isCurr && dayData.day === today;
          const rest = dayData.sessions.length === 0;
          return card(
            <>
              <div style={{
                padding: "12px 16px", display: "flex", justifyContent: "space-between",
                alignItems: "center", borderBottom: rest ? "none" : "1px solid #F0ECE4",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: titleFont, fontSize: 18, color: C.navy, fontWeight: 600 }}>{dayData.day}</span>
                  {isToday && <span style={{ fontSize: 9, fontWeight: 700, color: C.white, background: C.gold, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, textTransform: "uppercase" }}>Today</span>}
                </div>
                {rest && <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Rest Day</span>}
              </div>
              {!rest && (
                <div style={{ padding: "4px 10px 8px" }}>
                  {dayData.sessions.map((sess, si) => {
                    const key = di + "-" + si;
                    const ch = !!data[key];
                    const label = (sess.time ? sess.time + " \u2014 " : "") + sess.type;
                    return (
                      <div key={si} onClick={() => togTrain(who, di, si)} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "9px 6px",
                        borderBottom: si < dayData.sessions.length - 1 ? "1px solid #F5F3EE" : "none",
                        cursor: isCurr ? "pointer" : "default", userSelect: "none",
                      }}>
                        <Chk on={ch} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: ch ? C.warm : C.dark, textDecoration: ch ? "line-through" : "none" }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>,
            { border: isToday ? "2px solid " + C.gold : "1px solid " + C.border }
          );
        })}
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, padding: "20px 16px 80px", maxWidth: 680, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Kyle & Jo</div>
        <h1 style={{ fontFamily: titleFont, fontSize: 26, color: C.navy, margin: "0 0 4px", fontWeight: 600 }}>Let's Go for That</h1>
      </div>

      {streak > 0 && (
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span style={{ background: C.goldLight, border: "1px solid " + C.gold + "50", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: C.navy }}>
            {"\uD83D\uDD25"} {streak} week{streak !== 1 ? "s" : ""} streak
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#EEEAE3", borderRadius: 10, padding: 3, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: "0 0 auto", padding: "8px 10px", borderRadius: 8, border: "none",
            background: view === k ? C.white : "transparent",
            color: view === k ? C.navy : C.warm, fontWeight: 600, fontSize: 11,
            cursor: "pointer", boxShadow: view === k ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            fontFamily: font, whiteSpace: "nowrap",
          }}>{l}</button>
        ))}
      </div>

      {/* ===== KYLE ===== */}
      {view === "kyle" && (
        <>
          {weekNav()}
          <Progress pct={pctW} done={doneW} total={totalW} />

          {KYLE_WEEKLY.map((dayData, dayIdx) => {
            const dayDone = dayData.chores.every((_, ci) => week[dayIdx + "-" + ci]);
            const dayCount = dayData.chores.filter((_, ci) => week[dayIdx + "-" + ci]).length;
            const isToday = isCurr && dayData.day === today;
            return card(
              <>
                <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #F0ECE4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: titleFont, fontSize: 18, color: C.navy, fontWeight: 600 }}>{dayData.day}</span>
                      {isToday && <span style={{ fontSize: 9, fontWeight: 700, color: C.white, background: C.gold, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, textTransform: "uppercase" }}>Today</span>}
                      {dayDone && <span style={{ fontSize: 14 }}>{"\u2705"}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.warm, marginTop: 1 }}>{dayData.chores.length} task{dayData.chores.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ fontSize: 12, color: dayDone ? C.green : C.warm, fontWeight: 600 }}>{dayCount}/{dayData.chores.length}</div>
                </div>
                <div style={{ padding: "4px 10px 8px" }}>
                  {dayData.chores.map((chore, ci) => {
                    const key = dayIdx + "-" + ci;
                    const nk = "task:" + key;
                    return taskRow(chore.task, chore.freq, !!week[key], notes[nk], nk, () => togW(key, "Kyle"), isCurr, week["by:" + key]);
                  })}
                </div>
              </>,
              { border: isToday ? "2px solid " + C.gold : "1px solid " + C.border, opacity: dayDone && !isToday ? 0.6 : 1 }
            );
          })}

          {card(<>{cardHead("Monthly", getMonthName(nowMid) + " \u2022 " + kmDone + "/" + KYLE_MONTHLY.length)}<div style={{ padding: "4px 10px 8px" }}>{KYLE_MONTHLY.map((task, i) => {
            const nk = "km:" + i;
            return taskRow(task, "monthly", !!kMonth[i], kMonth["note:" + i], nk, () => togStore("kyle-month:" + nowMid, setKMonth, i), true);
          })}</div></>)}

          {card(<>{cardHead("Add Task", "One-off items this week")}<div style={{ padding: "4px 10px 8px" }}>
            {(added.items || []).map((bt, i) => {
              const key = "added-" + i;
              const ch = !!week[key];
              return (
                <div key={i} onClick={() => togW(key, "")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", borderBottom: "1px solid #F5F3EE", cursor: isCurr ? "pointer" : "default", userSelect: "none" }}>
                  <Chk on={ch} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: ch ? C.warm : C.dark, textDecoration: ch ? "line-through" : "none" }}>{bt.task}</span>
                  {isCurr && <button onClick={(e) => { e.stopPropagation(); removeItem("kyle", i); }} style={{ background: "none", border: "none", fontSize: 16, color: "#CCC", cursor: "pointer" }}>{"\u00D7"}</button>}
                </div>
              );
            })}
            {(added.items || []).length === 0 && <div style={{ padding: "12px 6px", fontSize: 13, color: C.warm, fontStyle: "italic" }}>No added tasks this week</div>}
            {isCurr && inputRow(input, setInput, () => addItem("kyle"))}
          </div></>)}

          {isCurr && doneW > 0 && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => { setWeek({}); saveWeekData({}, added, notes); }} style={{
                background: "none", border: "1px solid #D0CCC4", borderRadius: 8,
                padding: "9px 22px", fontSize: 12, color: C.warm, fontWeight: 600, cursor: "pointer", fontFamily: font,
              }}>Reset Week</button>
            </div>
          )}

          <div style={{ marginTop: 22, padding: "14px 18px", background: C.goldLight, borderRadius: 12, border: "1px solid " + C.gold + "30" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>At a Glance</div>
            {["Every day: Dishes, Clean kitchen", "2x/week: Laundry (Tue, Fri)", "2x/week: Mow (Wed, Sun)", "Weekly: Vacuum common areas & couch (Tue)", "Weekly: Spot clean bathrooms (Thu) \u2022 Dog cleanup (Tue)", "Weekly: Trash + Recycling (Wed)"].map((l, i) => (
              <div key={i} style={{ fontSize: 12, color: C.dark, lineHeight: 1.7 }}>{l}</div>
            ))}
          </div>
        </>
      )}

      {/* ===== JO ===== */}
      {view === "jo" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Jo's Monthly</div>
            <div style={{ fontSize: 12, color: C.warm }}>{getMonthName(nowMid)}</div>
          </div>
          <Progress pct={jmPct} done={jmDone} total={jmTotal} />
          {card(<div style={{ padding: "4px 10px 8px" }}>
            {JO_MONTHLY.map((task, i) => {
              const nk = "jo:" + i;
              return taskRow(task, "monthly", !!jMonth[i], jMonth["note:" + i], nk, () => togStore("jo-month:" + nowMid, setJMonth, i), true);
            })}
            {jmCustom.map((task, i) => {
              const ck = "custom-" + i;
              return (
                <div key={ck} onClick={() => togStore("jo-month:" + nowMid, setJMonth, ck)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderBottom: "1px solid #F5F3EE", cursor: "pointer", userSelect: "none" }}>
                  <Chk on={!!jMonth[ck]} small />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: jMonth[ck] ? C.warm : C.dark, textDecoration: jMonth[ck] ? "line-through" : "none" }}>{task}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeItem("jo", i); }} style={{ background: "none", border: "none", fontSize: 16, color: "#CCC", cursor: "pointer" }}>{"\u00D7"}</button>
                </div>
              );
            })}
          </div>)}
          {card(<>{cardHead("Add Task")}<div style={{ padding: "4px 10px 8px" }}>{inputRow(input, setInput, () => addItem("jo"))}</div></>)}
        </>
      )}

      {/* ===== GROCERIES ===== */}
      {view === "groceries" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Grocery List</div>
            <div style={{ fontSize: 12, color: C.warm }}>{grocery.length} item{grocery.length !== 1 ? "s" : ""} {"\u2022"} Shared</div>
          </div>

          {card(<div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={grocInput} onChange={(e) => setGrocInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGroc()}
                placeholder="Add an item..." style={{ flex: 1, border: "1px solid " + C.border, borderRadius: 6, padding: "10px 12px", fontSize: 14, fontFamily: font, outline: "none" }} />
              <button onClick={addGroc} style={{ background: C.navy, color: C.white, border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Add</button>
            </div>
          </div>)}

          {grocery.length === 0 ? (
            card(<div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{"\uD83D\uDED2"}</div>
              <div style={{ fontSize: 14, color: C.warm }}>List is empty. Add some items!</div>
            </div>)
          ) : (
            <>
              {card(<div style={{ padding: "4px 10px 8px" }}>
                {grocUnchecked.map((item) => (
                  <div key={item.id} onClick={() => togGroc(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 6px", borderBottom: "1px solid #F5F3EE", cursor: "pointer", userSelect: "none" }}>
                    <Chk on={false} small />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: C.dark }}>{item.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); delGroc(item.id); }} style={{ background: "none", border: "none", fontSize: 16, color: "#CCC", cursor: "pointer" }}>{"\u00D7"}</button>
                  </div>
                ))}
                {grocChecked > 0 && grocUnchecked.length > 0 && <div style={{ borderBottom: "1px solid " + C.border, margin: "4px 0" }} />}
                {grocery.filter((i) => i.checked).map((item) => (
                  <div key={item.id} onClick={() => togGroc(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 6px", borderBottom: "1px solid #F5F3EE", cursor: "pointer", userSelect: "none", opacity: 0.5 }}>
                    <Chk on={true} small />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: C.warm, textDecoration: "line-through" }}>{item.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); delGroc(item.id); }} style={{ background: "none", border: "none", fontSize: 16, color: "#CCC", cursor: "pointer" }}>{"\u00D7"}</button>
                  </div>
                ))}
              </div>)}
              {grocChecked > 0 && (
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <button onClick={clearGroc} style={{ background: "none", border: "1px solid #D0CCC4", borderRadius: 8, padding: "9px 22px", fontSize: 12, color: C.warm, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
                    Clear {grocChecked} checked item{grocChecked !== 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== TRAINING ===== */}
      {view === "kyle-train" && trainView(KYLE_TRAINING, kTrain, "kyle")}
      {view === "jo-train" && trainView(JO_TRAINING, jTrain, "jo")}

      {/* ===== SEASONAL ===== */}
      {view === "seasonal" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Seasonal</div>
            <div style={{ fontSize: 12, color: C.warm }}>{nowQid.replace("-", " ")}</div>
          </div>
          <Progress pct={sPct} done={sDone} total={SEASONAL_TASKS.length} />
          {card(<div style={{ padding: "4px 10px 8px" }}>
            {SEASONAL_TASKS.map((item, i) => {
              const ch = !!seasonal[i];
              return (
                <div key={i} onClick={() => togStore("seasonal:" + nowQid, setSeasonal, i)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 4px",
                  borderBottom: i < SEASONAL_TASKS.length - 1 ? "1px solid #F5F3EE" : "none",
                  cursor: "pointer", userSelect: "none",
                }}>
                  <Chk on={ch} small />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: ch ? C.warm : C.dark, textDecoration: ch ? "line-through" : "none" }}>{item.task}</span>
                    <div style={{ fontSize: 11, color: C.warm, marginTop: 1 }}>{item.season}</div>
                  </div>
                  <Badge freq="seasonal" />
                </div>
              );
            })}
          </div>)}
        </>
      )}

      {/* ===== HISTORY ===== */}
      {view === "history" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Week-by-Week Progress</div>
            <div style={{ fontSize: 12, color: C.warm }}>{streak > 0 ? streak + " week streak \uD83D\uDD25" : "Tap a week to view details"}</div>
          </div>
          {hist.length === 0 ? (
            card(<div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{"\uD83D\uDCCB"}</div>
              <div style={{ fontSize: 14, color: C.warm }}>No history yet. Start checking off tasks!</div>
            </div>)
          ) : (
            <>
              {hist.map((h) => {
                const cur = h.weekId === nowWid;
                return (
                  <div key={h.weekId} onClick={() => { setWid(h.weekId); setView("kyle"); }} style={{
                    background: C.white, borderRadius: 12, marginBottom: 10, padding: "14px 18px",
                    border: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                  }}>
                    <div style={{ position: "relative" }}>
                      <Ring pct={h.pct} size={44} />
                      <div style={{ position: "absolute", top: 0, left: 0, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: h.pct === 100 ? C.green : C.navy }}>{h.pct}%</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{getWeekRange(h.weekId)}</span>
                        {cur && <span style={{ fontSize: 9, fontWeight: 700, color: C.white, background: C.gold, padding: "1px 6px", borderRadius: 3 }}>NOW</span>}
                      </div>
                      <div style={{ fontSize: 12, color: C.warm, marginTop: 1 }}>{h.done}/{h.total} tasks</div>
                    </div>
                    <div style={{ fontSize: 14, color: h.pct === 100 ? C.green : C.warm }}>{h.pct === 100 ? "\u2705" : "\u203A"}</div>
                  </div>
                );
              })}
              {hist.length >= 2 && (
                <div style={{ marginTop: 18, background: C.white, borderRadius: 14, padding: "16px 18px", border: "1px solid " + C.border }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Trend</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
                    {[...hist].reverse().slice(-8).map((h, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", background: h.pct === 100 ? C.green : h.pct >= 50 ? C.gold : "#E0DDD6", borderRadius: 4, height: Math.max(4, h.pct * 0.55) }} />
                        <div style={{ fontSize: 8, color: C.warm }}>{h.weekId.split("-W")[1]}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: C.warm }}>
                    <span>Oldest</span><span>This week</span>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
