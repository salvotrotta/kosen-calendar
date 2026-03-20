import { useState, useEffect, useCallback, useRef } from "react";

// ── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  blue: "#003DA5", blueMid: "#0052CC", blueLight: "#E8EFFE",
  yellow: "#FFD700", yellowLight: "#FFF8CC",
  red: "#CC0000",
  white: "#FFFFFF",
  gray50: "#F8F9FC", gray100: "#EEF0F5", gray200: "#D8DCE8",
  gray400: "#9098B0", gray700: "#3A4060", black: "#1A1F35",
  green: "#1A7A4A", greenLight: "#E6F5ED",
  purple: "#6B21A8", purpleLight: "#F3E8FF",
  orange: "#C05400",
};

// ── ROLES ─────────────────────────────────────────────────────────────────────
// pending   → appena registrato, in attesa di approvazione Super User
// membro    → membro semplice, solo visualizzazione + preferiti
// resp_gruppo  → responsabile di gruppo (= admin di gruppo)
// resp_settore → responsabile di settore
// resp_capitolo→ responsabile di capitolo
// admin     → alias legacy per resp_gruppo (compatibilità seed)
// super     → super user

const ROLES = [
  { id: "pending", label: "In attesa", color: C.orange, icon: "⏳" },
  { id: "membro", label: "Membro", color: C.purple, icon: "🌸" },
  { id: "resp_gruppo", label: "Resp. Gruppo", color: C.blue, icon: "👥" },
  { id: "resp_settore", label: "Resp. Settore", color: C.green, icon: "🏘" },
  { id: "resp_capitolo", label: "Resp. Capitolo", color: C.red, icon: "🏛" },
];

function getRole(id) { return ROLES.find(r => r.id === id) || ROLES[0]; }
// Which roles can create events?
function canCreateEvents(role) { return ["resp_gruppo", "resp_settore", "resp_capitolo", "admin"].includes(role); }

// ── MEETING TYPES ─────────────────────────────────────────────────────────────
const ALL_MEETING_TYPES = [
  {
    id: "zadankai", label: "Zadankai", color: "#0077B6", icon: "🏡",
    desc: "Meeting di gruppo", ruoloMin: "resp_gruppo"
  },
  {
    id: "studio", label: "Studio", color: C.blue, icon: "📖",
    desc: "Meeting di studio", ruoloMin: "resp_settore"
  },
  {
    id: "uomini", label: "Meeting Uomini", color: C.green, icon: "🔵",
    desc: "Meeting degli uomini", ruoloMin: "resp_settore"
  },
  {
    id: "donne", label: "Meeting Donne", color: C.purple, icon: "🔴",
    desc: "Meeting delle donne", ruoloMin: "resp_settore"
  },
  {
    id: "giovani", label: "Meeting Giovani", color: "#D4A017", icon: "⭐",
    desc: "Meeting dei giovani", ruoloMin: "resp_capitolo"
  },
  {
    id: "speciale", label: "Evento Speciale", color: C.red, icon: "✨",
    desc: "Evento straordinario", ruoloMin: "resp_capitolo"
  },
];

// Hierarchy order for permission checks
const ROLE_LEVEL = { resp_gruppo: 1, admin: 1, resp_settore: 2, resp_capitolo: 3, super: 4 };

function getRoleLevel(role) { return ROLE_LEVEL[role] || 0; }

// Returns true if a given role can create a given meeting type
function canCreateType(role, tipoId) {
  const tipo = ALL_MEETING_TYPES.find(t => t.id === tipoId);
  if (!tipo) return false;
  return getRoleLevel(role) >= getRoleLevel(tipo.ruoloMin);
}

// Returns all types a role can create
function getAllowedTypes(role) {
  return ALL_MEETING_TYPES.filter(t => canCreateType(role, t.id));
}

// ── TERRITORY ─────────────────────────────────────────────────────────────────
const CAPITOLI = {
  "Capitolo Pavia": {
    disponibile: true,
    territory: {
      "Settore Giglio": ["Paramita", "Shin"],
      "Settore Indaco": ["Suono Meraviglioso", "Girasole", "Armonia"],
      "Settore Mai Sprezzante": ["Sole Meraviglioso", "Nuova Aurora", "Rinascita"],
      "Settore Oceano": ["Fiore di Loto", "Soli Splendenti"],
      "Settore Picco dell'Aquila": ["Alba Nuova", "Diamante"],
      "Settore Saito": ["Nam", "Ananda", "Soku", "Myoho", "Niji"],
    },
  },
  "Capitolo Voghera": { disponibile: false, territory: {} },
};
const TERRITORY = CAPITOLI["Capitolo Pavia"].territory;
const VIEW_PASSWORD = "sgikosen24";

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    id: "a1", email: "giglio@kosen.it", password: "admin123", name: "Marco Giglio",
    role: "resp_gruppo", capitolo: "Capitolo Pavia", settore: "Settore Giglio", gruppo: "Paramita",
    tipiAbilitati: ["studio", "giovani", "uomini", "donne", "speciale"],
    luoghi: [{ id: "l1", nome: "Sala Paramita", via: "Via Roma", civico: "12", comune: "Pavia", citofono: "Scala B Int.3" }],
    approved: true
  },
  {
    id: "a2", email: "indaco@kosen.it", password: "admin123", name: "Lucia Indaco",
    role: "resp_gruppo", capitolo: "Capitolo Pavia", settore: "Settore Indaco", gruppo: "Girasole",
    tipiAbilitati: ["studio", "giovani", "donne"],
    luoghi: [{ id: "l2", nome: "Casa Lucia", via: "Corso Cavour", civico: "40", comune: "Pavia", citofono: "Int.7" }],
    approved: true
  },
  {
    id: "m1", email: "mario@kosen.it", password: "membro123", name: "Mario Rossi",
    role: "membro", capitolo: "Capitolo Pavia", settore: "Settore Giglio", gruppo: "Paramita",
    tipiAbilitati: [], luoghi: [], approved: true
  },
  {
    id: "m2", email: "anna@kosen.it", password: "membro123", name: "Anna Bianchi",
    role: "membro", capitolo: "Capitolo Pavia", settore: "Settore Indaco", gruppo: "Girasole",
    tipiAbilitati: [], luoghi: [], approved: true
  },
];

const fmt = (d) => d.toISOString().split("T")[0];
const today = new Date();
const SEED_EVENTS = [
  {
    id: "e1", titolo: "Studio del Gosho – Cap. 3", tipo: "studio",
    capitolo: "Capitolo Pavia", settore: "Settore Giglio", gruppo: "Paramita",
    data: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)),
    oraInizio: "19:30", oraFine: "21:00",
    luogo: { nome: "Sala Paramita", via: "Via Roma", civico: "12", comune: "Pavia", citofono: "Scala B Int.3" },
    note: "", adminId: "a1", adminNome: "Marco Giglio", adminEmail: "giglio@kosen.it"
  },
  {
    id: "e2", titolo: "Meeting Giovani Mensile", tipo: "giovani",
    capitolo: "Capitolo Pavia", settore: "Settore Indaco", gruppo: "Girasole",
    data: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)),
    oraInizio: "18:00", oraFine: "20:00",
    luogo: { nome: "Casa Lucia", via: "Corso Cavour", civico: "40", comune: "Pavia", citofono: "Int.7" },
    note: "Portare i libri di testo!", adminId: "a2", adminNome: "Lucia Indaco", adminEmail: "indaco@kosen.it"
  },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);
const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
function getMeetingType(id) { return ALL_MEETING_TYPES.find(t => t.id === id) || ALL_MEETING_TYPES[0]; }
function getMeetingColor(id) { return getMeetingType(id).color; }

// ── EMAILJS CONFIG ────────────────────────────────────────────────────────────
const EJS = {
  serviceId: "service_ns5yfrr",
  templateId: "template_6pap8s2",
  publicKey: "v7Go8yUq7-a0O_q9w",
};
const APP_URL = "https://kosen-calendar.netlify.app";
const TOKEN_TTL = 30 * 60 * 1000; // 30 minuti in ms

// Carica EmailJS SDK (una sola volta)
function loadEmailJS() {
  return new Promise((resolve, reject) => {
    if (window.emailjs) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload = () => { window.emailjs.init(EJS.publicKey); resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Genera token, salvalo e restituisci il link
function createResetToken(email) {
  const token = genId() + genId() + genId();
  const tokens = JSON.parse(localStorage.getItem("kosen_reset_tokens") || "{}");
  tokens[token] = { email: email.toLowerCase().trim(), expires: Date.now() + TOKEN_TTL };
  localStorage.setItem("kosen_reset_tokens", JSON.stringify(tokens));
  return `${APP_URL}?reset=${token}`;
}

// Verifica token → restituisce email o null
function verifyResetToken(token) {
  try {
    const tokens = JSON.parse(localStorage.getItem("kosen_reset_tokens") || "{}");
    const entry = tokens[token];
    if (!entry) return null;
    if (Date.now() > entry.expires) return null;
    return entry.email;
  } catch { return null; }
}

// Invalida token dopo uso
function invalidateToken(token) {
  try {
    const tokens = JSON.parse(localStorage.getItem("kosen_reset_tokens") || "{}");
    delete tokens[token];
    localStorage.setItem("kosen_reset_tokens", JSON.stringify(tokens));
  } catch { }
}

// Invia email di reset via EmailJS
async function sendResetEmail(toEmail, userName, resetLink) {
  await loadEmailJS();
  return window.emailjs.send(EJS.serviceId, EJS.templateId, {
    to_email: toEmail,
    user_name: userName || "utente",
    reset_link: resetLink,
  });
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  const set = useCallback(v => {
    setVal(prev => { const next = typeof v === "function" ? v(prev) : v; try { localStorage.setItem(key, JSON.stringify(next)); } catch { } return next; });
  }, [key]);
  return [val, set];
}

function getAllUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem("kosen_users") || "[]");
    return [...stored, ...SEED_USERS.filter(s => !stored.find(u => u.email === s.email))];
  } catch { return SEED_USERS; }
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function Chip({ label, color, small, icon }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: color + "22", color, border: `1.5px solid ${color}40`, borderRadius: 99, padding: small ? "2px 8px" : "4px 12px", fontSize: small ? 11 : 12, fontWeight: 700, letterSpacing: .3 }}>{icon && icon + " "}{label}</span>;
}

function IconBtn({ icon, onClick, color = C.blue, title, sm }) {
  const s = sm ? 32 : 40;
  return <button title={title} onClick={onClick} style={{ width: s, height: s, borderRadius: s, border: "none", cursor: "pointer", background: "transparent", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sm ? 15 : 18, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = color + "18"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{icon}</button>;
}

function Btn({ children, onClick, variant = "primary", disabled, full, sm, icon }) {
  const styles = {
    primary: { background: `linear-gradient(135deg,${C.blue},${C.blueMid})`, color: C.white, border: "none" },
    secondary: { background: C.white, color: C.blue, border: `2px solid ${C.blue}` },
    danger: { background: C.red, color: C.white, border: "none" },
    ghost: { background: "transparent", color: C.blue, border: `1.5px solid ${C.blue}44` },
  };
  return <button disabled={disabled} onClick={onClick} style={{ ...styles[variant], padding: sm ? "7px 16px" : "10px 22px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontSize: sm ? 13 : 14, fontWeight: 700, width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: disabled ? .5 : 1, transition: "opacity .2s, transform .1s", fontFamily: "inherit" }} onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(.97)")} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>{icon && <span>{icon}</span>}{children}</button>;
}

function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background: C.white, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,61,165,.07)", border: `1px solid ${C.gray100}`, overflow: "hidden", cursor: onClick ? "pointer" : "default", transition: "box-shadow .2s", ...style }} onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,61,165,.13)")} onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,61,165,.07)")}>{children}</div>;
}

function Field({ label, type = "text", value, onChange, required, readOnly, placeholder, options, rows, hint }) {
  const base = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, fontSize: 14, background: readOnly ? C.gray50 : C.white, color: C.black, outline: "none", fontFamily: "inherit", transition: "border-color .2s", boxSizing: "border-box" };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray700, marginBottom: 5, letterSpacing: .5 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>}
      {type === "select"
        ? <select value={value} onChange={onChange} disabled={readOnly} style={{ ...base, appearance: "auto" }}>{options?.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>
        : type === "textarea"
          ? <textarea value={value} onChange={onChange} readOnly={readOnly} rows={rows || 3} placeholder={placeholder} style={{ ...base, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.gray200} />
          : <input type={type} value={value} onChange={onChange} readOnly={readOnly} required={required} placeholder={placeholder} style={base} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.gray200} />
      }
      {hint && <p style={{ fontSize: 11, color: C.gray400, margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,60,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <Card style={{ width: "100%", maxWidth: wide ? 700 : 460, maxHeight: "90vh", overflowY: "auto", borderRadius: 20 }}>
        <div style={{ padding: "20px 24px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.gray100}`, position: "sticky", top: 0, background: C.white, zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: C.black, fontWeight: 800 }}>{title}</h3>
          <IconBtn icon="✕" onClick={onClose} sm />
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </Card>
    </div>
  );
}

function Toast({ msg, type }) {
  const colors = { success: C.blue, error: C.red, info: C.gray700, warning: C.orange };
  if (!msg) return null;
  return <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: colors[type] || C.blue, color: C.white, padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 2000, boxShadow: "0 8px 32px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>{msg}</div>;
}

// ── FULL MAP ──────────────────────────────────────────────────────────────────
// Helper: compose full address string from luogo object
function luogoAddr(l) { if (!l) return ""; const parts = [l.via, l.civico].filter(Boolean).join(" "); return [parts, l.comune].filter(Boolean).join(", "); }

function LeafletMap({ events, height = 380 }) {
  const id = useRef("fm-" + genId());
  const [ready, setReady] = useState(!!window.L);
  useEffect(() => { if (window.L) { setReady(true); return; } const ex = document.getElementById("leaflet-css"); if (!ex) { const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet"; l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(l); } const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.onload = () => setReady(true); document.head.appendChild(s); }, []);
  useEffect(() => { if (!ready) return; const L = window.L; const el = document.getElementById(id.current); if (!el || el._leaflet_id) return; const m = L.map(id.current).setView([45.185, 9.157], 12); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(m); events.forEach(ev => { if (!ev.luogo) return; const mt = getMeetingType(ev.tipo); const icon = L.divIcon({ className: "", html: `<div style="width:30px;height:30px;background:${mt.color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;font-weight:800;">${ev.tipo[0].toUpperCase()}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }); const addr = luogoAddr(ev.luogo); const lat = ev.luogo.lat || (ev.luogo.comune ? 45.185 : null); const lng = ev.luogo.lng || (ev.luogo.comune ? 9.157 : null); if (!lat || !lng) return; L.marker([lat, lng], { icon }).addTo(m).bindPopup(`<b>${ev.titolo}</b><br>${ev.data} ${ev.oraInizio}<br>${ev.luogo.nome}${addr ? ": " + addr : ""}`); }); }, [ready, events]);
  if (!ready) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: C.gray50, borderRadius: 16, color: C.gray400 }}>Caricamento mappa…</div>;
  return <div id={id.current} style={{ height, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.gray100}` }} />;
}

// ── RSVP STORE ────────────────────────────────────────────────────────────────
// Shape: { [eventId]: [ {userId, name} ] }
// Stored in localStorage key "kosen_rsvp" — shared across all users on this device.
// In a real app this would be a server; here we use localStorage as shared store.
function useRsvp() {
  const [rsvp, setRsvp] = useLocalStorage("kosen_rsvp", {});
  function join(eventId, userId, name) {
    setRsvp(r => {
      const list = r[eventId] || [];
      if (list.find(x => x.userId === userId)) return r; // already joined
      return { ...r, [eventId]: [...list, { userId, name }] };
    });
  }
  function leave(eventId, userId) {
    setRsvp(r => {
      const list = (r[eventId] || []).filter(x => x.userId !== userId);
      return { ...r, [eventId]: list };
    });
  }
  function isJoined(eventId, userId) { return !!(rsvp[eventId] || []).find(x => x.userId === userId); }
  function getList(eventId) { return rsvp[eventId] || []; }
  return { join, leave, isJoined, getList };
}

// ── EVENT CARD ────────────────────────────────────────────────────────────────
function EventCard({ ev, onMap, onContact, bookmarks, onBookmark, user, rsvp }) {
  const mt = getMeetingType(ev.tipo);
  const bk = (bookmarks || []).includes(ev.id);
  const dateStr = new Date(ev.data + "T12:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  const [showParticipants, setShowParticipants] = useState(false);

  const canJoin = user && user.role && user.role !== "user"; // guests can't join
  const joined = rsvp && canJoin ? rsvp.isJoined(ev.id, user.id) : false;
  const list = rsvp ? rsvp.getList(ev.id) : [];

  // Determine display name for this user's join entry
  function getDisplayName() {
    if (!user) return "Ospite";
    // showName pref is stored in prefs key
    const pref = (() => { try { return JSON.parse(localStorage.getItem(`kosen_pref_${user.id}`)) || {}; } catch { return {}; } })();
    return pref.showName === false ? null : user.name; // null = anonymous
  }

  function handleJoin() {
    if (!rsvp || !canJoin) return;
    if (joined) {
      rsvp.leave(ev.id, user.id);
    } else {
      const displayName = getDisplayName();
      rsvp.join(ev.id, user.id, displayName);
    }
  }

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ height: 5, background: mt.color, borderRadius: "16px 16px 0 0" }} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              <Chip label={mt.icon + " " + mt.label} color={mt.color} small />
              <Chip label={ev.settore} color={C.blue} small />
              <Chip label={ev.gruppo} color={C.gray700} small />
            </div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: C.black }}>{ev.titolo}</h3>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: C.gray700 }}>📅 {dateStr} · {ev.oraInizio}–{ev.oraFine}</p>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: C.gray700 }}>📍 {ev.luogo.nome}{luogoAddr(ev.luogo) ? " · " + luogoAddr(ev.luogo) : ""}</p>
            {ev.luogo.citofono && <p style={{ margin: "0 0 4px", fontSize: 13, color: C.gray700 }}>🔔 <b>{ev.luogo.citofono}</b></p>}
            {ev.note && <div style={{ background: C.yellowLight, border: `1.5px solid ${C.yellow}`, borderRadius: 8, padding: "7px 12px", marginTop: 8 }}><span style={{ fontSize: 12, fontWeight: 800, color: "#8B6000" }}>📝 NOTE: </span><span style={{ fontSize: 12, color: C.black }}>{ev.note}</span></div>}
          </div>
          <button onClick={() => onBookmark && onBookmark(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: bk ? C.yellow : C.gray200, flexShrink: 0 }}>{bk ? "★" : "☆"}</button>
        </div>

        {/* JOIN SECTION */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: C.gray50, borderRadius: 12, border: `1px solid ${C.gray100}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🙋</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.black }}>
                {list.length} {list.length === 1 ? "partecipante" : "partecipanti"}
              </span>
              {list.length > 0 && (
                <button onClick={() => setShowParticipants(p => !p)} style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, textDecoration: "underline" }}>
                  {showParticipants ? "nascondi" : "vedi"}
                </button>
              )}
            </div>
            {canJoin
              ? <button onClick={handleJoin} style={{
                padding: "6px 18px", borderRadius: 99, border: "none", cursor: "pointer",
                fontWeight: 800, fontSize: 13, fontFamily: "inherit",
                background: joined ? C.gray100 : C.blue,
                color: joined ? C.gray700 : C.white,
                transition: "all .2s",
                boxShadow: joined ? "none" : "0 2px 8px rgba(0,61,165,.25)",
              }}>
                {joined ? "✓ Ci sei" : "Join"}
              </button>
              : <span style={{ fontSize: 12, color: C.gray400, fontStyle: "italic" }}>Accedi per partecipare</span>
            }
          </div>

          {/* Participants list */}
          {showParticipants && list.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.gray200}` }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {list.map((p, i) => (
                  <div key={p.userId} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: C.white, border: `1px solid ${C.gray200}`,
                    borderRadius: 99, padding: "3px 10px", fontSize: 12,
                    color: C.gray700, fontWeight: 600,
                  }}>
                    <span style={{ fontSize: 10, color: p.name ? C.blue : C.gray400 }}>●</span>
                    {p.name || "Anonimo"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Btn sm icon="🗺" onClick={() => onMap(ev)}>Mappa</Btn>
          <Btn sm variant="secondary" icon="📞" onClick={() => onContact(ev)}>Contatta</Btn>
        </div>
      </div>
    </Card>
  );
}

// ── FORGOT PASSWORD MODAL ─────────────────────────────────────────────────────
function ForgotPasswordModal({ open, onClose }) {
  const [fpEmail, setFpEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function handleSend() {
    setErr("");
    if (!fpEmail.trim()) { setErr("Inserisci la tua email."); return; }
    const all = getAllUsers();
    const u = all.find(x => x.email === fpEmail.trim().toLowerCase());
    if (!u) {
      // Security: don't reveal if email exists — show same success message
      setDone(true); return;
    }
    setSending(true);
    try {
      const link = createResetToken(u.email);
      await sendResetEmail(u.email, u.name, link);
      setDone(true);
    } catch (e) {
      setErr("Errore nell'invio. Riprova tra qualche minuto.");
    } finally { setSending(false); }
  }

  function handleClose() {
    setFpEmail(""); setDone(false); setErr(""); setSending(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Password dimenticata?">
      {done
        ? <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
          <h3 style={{ color: C.green, margin: "0 0 10px" }}>Email inviata!</h3>
          <p style={{ fontSize: 13, color: C.gray700, lineHeight: 1.6, marginBottom: 20 }}>
            Se l'email è registrata, riceverai un link per resettare la password.<br />
            <b>Il link è valido 30 minuti.</b>
          </p>
          <p style={{ fontSize: 12, color: C.gray400, marginBottom: 20 }}>
            Controlla anche la cartella spam.
          </p>
          <Btn onClick={handleClose}>Chiudi</Btn>
        </div>
        : <>
          <p style={{ fontSize: 13, color: C.gray700, marginBottom: 16, lineHeight: 1.6 }}>
            Inserisci la tua email. Ti invieremo un link per impostare una nuova password.
          </p>
          <Field label="Email" type="email" value={fpEmail}
            onChange={e => setFpEmail(e.target.value)}
            placeholder="nome@esempio.it" required />
          {err && <p style={{ color: C.red, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={handleClose}>Annulla</Btn>
            <Btn onClick={handleSend} disabled={sending} icon={sending ? "⏳" : "📧"}>
              {sending ? "Invio in corso…" : "Invia Link"}
            </Btn>
          </div>
        </>
      }
    </Modal>
  );
}

// ── RESET PASSWORD PAGE (shown when ?reset=token in URL) ──────────────────────
function ResetPasswordPage({ token, onDone }) {
  const email = verifyResetToken(token);
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function handleSave() {
    setErr("");
    if (newPw.length < 6) { setErr("La password deve essere di almeno 6 caratteri."); return; }
    if (newPw !== confirm) { setErr("Le password non coincidono."); return; }
    try {
      const stored = JSON.parse(localStorage.getItem("kosen_users") || "[]");
      const idx = stored.findIndex(u => u.email === email);
      if (idx >= 0) {
        stored[idx].password = newPw;
        localStorage.setItem("kosen_users", JSON.stringify(stored));
      }
      // also update seed-based users if needed (edge case)
      invalidateToken(token);
      setOk(true);
    } catch { setErr("Errore. Riprova."); }
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${C.blue} 0%,#001E6E 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${C.yellow},${C.red})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px", boxShadow: `0 8px 32px ${C.yellow}55` }}>🪷</div>
          <h1 style={{ color: C.white, fontSize: 22, fontWeight: 900, margin: "0 0 4px", letterSpacing: -1 }}>Kosen Calendar</h1>
        </div>
        <Card style={{ borderRadius: 20, padding: 28 }}>
          {!email
            ? <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
              <h3 style={{ color: C.red, margin: "0 0 10px" }}>Link non valido o scaduto</h3>
              <p style={{ fontSize: 13, color: C.gray700, marginBottom: 20, lineHeight: 1.6 }}>
                Il link di reset è scaduto (validità 30 min) o è già stato usato.<br />
                Richiedi un nuovo link dalla schermata di login.
              </p>
              <Btn onClick={onDone}>Torna al Login</Btn>
            </div>
            : ok
              ? <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ color: C.green, margin: "0 0 10px" }}>Password aggiornata!</h3>
                <p style={{ fontSize: 13, color: C.gray700, marginBottom: 20 }}>Ora puoi accedere con la nuova password.</p>
                <Btn onClick={onDone} icon="→">Vai al Login</Btn>
              </div>
              : <>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: C.black }}>🔓 Nuova Password</h2>
                <p style={{ fontSize: 13, color: C.gray400, marginBottom: 20 }}>Account: <b style={{ color: C.gray700 }}>{email}</b></p>
                <Field label="Nuova password" type="password" value={newPw}
                  onChange={e => setNewPw(e.target.value)} required placeholder="min. 6 caratteri" />
                <Field label="Conferma password" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" />
                {err && <p style={{ color: C.red, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</p>}
                <Btn full onClick={handleSave} icon="🔑">Salva Nuova Password</Btn>
              </>
          }
        </Card>
      </div>
    </div>
  );
}

// ── AUTH SCREEN (Login + Register) ───────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rConfirm, setRConfirm] = useState("");
  const [rCapitolo, setRCapitolo] = useState("Capitolo Pavia");
  const [rSettore, setRSettore] = useState(Object.keys(TERRITORY)[0]);
  const [rGruppo, setRGruppo] = useState("");
  const [gPassword, setGPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  function reset() { setError(""); setSuccess(""); }

  function handleLogin() {
    reset();
    if (email === "super@kosen.it") {
      if (password === "super2024") onLogin({ role: "super", email, name: "Super User" });
      else setError("Credenziali errate.");
      return;
    }
    const all = getAllUsers();
    const u = all.find(x => x.email === email && x.password === password);
    if (!u) { setError("Email o password errata."); return; }
    if (!u.approved || u.role === "pending") { setError("Il tuo account è in attesa di approvazione."); return; }
    onLogin({ ...u, role: u.role === "admin" ? "resp_gruppo" : u.role });
  }

  function handleRegister() {
    reset();
    if (!rName.trim() || !rEmail.trim() || !rPassword || !rGruppo) { setError("Compila tutti i campi obbligatori."); return; }
    if (rPassword !== rConfirm) { setError("Le password non coincidono."); return; }
    if (rPassword.length < 6) { setError("La password deve essere di almeno 6 caratteri."); return; }
    const all = getAllUsers();
    if (all.find(u => u.email === rEmail.trim().toLowerCase())) { setError("Email già registrata."); return; }
    const newUser = {
      id: genId(), email: rEmail.trim().toLowerCase(), password: rPassword,
      name: rName.trim(), role: "pending",
      capitolo: rCapitolo, settore: rSettore, gruppo: rGruppo,
      tipiAbilitati: [], luoghi: [], approved: false,
    };
    try {
      const stored = JSON.parse(localStorage.getItem("kosen_users") || "[]");
      localStorage.setItem("kosen_users", JSON.stringify([...stored, newUser]));
    } catch { }
    setSuccess("Registrazione completata! Il tuo account è in attesa di approvazione.");
    setRName(""); setREmail(""); setRPassword(""); setRConfirm(""); setRGruppo("");
  }

  const capInfo = CAPITOLI[rCapitolo];
  const gruppiDisp = (capInfo?.disponibile ? capInfo.territory[rSettore] : []) || [];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${C.blue} 0%,#001E6E 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg,${C.yellow},${C.red})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px", boxShadow: `0 8px 32px ${C.yellow}55` }}>🪷</div>
          <h1 style={{ color: C.white, fontSize: 26, fontWeight: 900, margin: "0 0 4px", letterSpacing: -1 }}>Kosen Calendar</h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, margin: 0 }}>Soka Gakkai · Capitolo Pavia</p>
        </div>
        <Card style={{ borderRadius: 20, overflow: "visible" }}>
          {/* Tabs: solo Accedi e Registrati */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "20px 20px 0" }}>
            {[["login", "🔑 Accedi"], ["register", "✍️ Registrati"]].map(([t, l]) => (
              <button key={t} onClick={() => { setTab(t); reset(); }} style={{
                padding: "12px 8px", border: "none", cursor: "pointer", background: "none",
                fontWeight: 800, fontSize: 15, fontFamily: "inherit",
                color: tab === t ? C.blue : C.gray400,
                borderBottom: `3px solid ${tab === t ? C.blue : "transparent"}`,
                transition: "all .2s",
              }}>{l}</button>
            ))}
          </div>
          <div style={{ padding: "20px 24px 24px" }}>

            {/* ── ACCEDI ── */}
            {tab === "login" && (<>
              <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@esempio.it" />
              <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              {error && <p style={{ color: C.red, fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>{error}</p>}
              <Btn full onClick={handleLogin} icon="→">Accedi</Btn>
              <button onClick={() => setForgotOpen(true)} style={{ display: "block", margin: "12px auto 0", fontSize: 12, color: C.gray400, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                Password dimenticata?
              </button>
              {/* Guest */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.gray100}` }}>
                <p style={{ fontSize: 12, color: C.gray400, margin: "0 0 10px", textAlign: "center" }}>Accesso ospite (sola lettura)</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="password" value={gPassword} onChange={e => setGPassword(e.target.value)} placeholder="Password ospite"
                    onKeyDown={e => e.key === "Enter" && (gPassword === VIEW_PASSWORD ? onLogin({ role: "user" }) : setError("Password ospite errata."))}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  <Btn sm variant="ghost" onClick={() => { reset(); if (gPassword === VIEW_PASSWORD) onLogin({ role: "user" }); else setError("Password ospite errata."); }}>Entra</Btn>
                </div>
              </div>
            </>)}

            {/* ── REGISTRATI ── */}
            {tab === "register" && (<>
              {success
                ? <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <h3 style={{ color: C.green, marginBottom: 8 }}>Registrazione completata!</h3>
                  <p style={{ fontSize: 13, color: C.gray700, marginBottom: 20, lineHeight: 1.6 }}>{success}</p>
                  <Btn variant="secondary" onClick={() => { setTab("login"); setSuccess(""); }}>Vai al Login</Btn>
                </div>
                : <>
                  <Field label="Nome e Cognome" value={rName} onChange={e => setRName(e.target.value)} required placeholder="Mario Rossi" />
                  <Field label="Email" type="email" value={rEmail} onChange={e => setREmail(e.target.value)} required placeholder="mario@esempio.it" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Password" type="password" value={rPassword} onChange={e => setRPassword(e.target.value)} required placeholder="min. 6 caratteri" />
                    <Field label="Conferma" type="password" value={rConfirm} onChange={e => setRConfirm(e.target.value)} required placeholder="••••••••" />
                  </div>
                  <div style={{ background: C.gray50, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.gray700, margin: "0 0 12px", letterSpacing: .5 }}>📍 APPARTENENZA TERRITORIALE</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {Object.entries(CAPITOLI).map(([cap, info]) => (
                        <button key={cap} onClick={() => { if (info.disponibile) { setRCapitolo(cap); setRSettore(Object.keys(info.territory)[0] || ""); setRGruppo(""); } }} style={{ padding: "10px 8px", borderRadius: 10, border: `2px solid ${rCapitolo === cap ? C.blue : C.gray200}`, background: rCapitolo === cap ? C.blueLight : C.white, cursor: info.disponibile ? "pointer" : "not-allowed", opacity: info.disponibile ? 1 : .6, textAlign: "center", fontFamily: "inherit", transition: "all .15s" }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: rCapitolo === cap ? C.blue : C.black }}>{cap}</div>
                          {!info.disponibile && <div style={{ fontSize: 10, color: C.gray400, marginTop: 2 }}>🔜 Presto disp.</div>}
                        </button>
                      ))}
                    </div>
                    {capInfo?.disponibile && <>
                      <Field label="Settore" type="select" value={rSettore} onChange={e => { setRSettore(e.target.value); setRGruppo(""); }} options={Object.keys(capInfo.territory).map(s => ({ value: s, label: s }))} />
                      <Field label="Gruppo" type="select" value={rGruppo} onChange={e => setRGruppo(e.target.value)} required options={[{ value: "", label: "— Seleziona il tuo gruppo —" }, ...gruppiDisp.map(g => ({ value: g, label: g }))]} />
                    </>}
                  </div>
                  <div style={{ background: C.blueLight, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.blue }}>
                    ℹ️ Dopo la registrazione il tuo account sarà <b>in attesa di approvazione</b>.
                  </div>
                  {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</p>}
                  <Btn full onClick={handleRegister} icon="✍️">Crea Account</Btn>
                </>
              }
            </>)}

          </div>
        </Card>
      </div>

      {/* Forgot password modal */}
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}

// ── SHARED CALENDAR/LIST LOGIC ───────────────────────────────────────────────

function CalendarView({ events, bookmarks, setBookmarks, user, extraFilters, accentColor, stickyTop = 61, rsvp }) {
  const [view, setView] = useState("list");
  const [filterSettore, setFilterSettore] = useState("tutti");
  const [filterTipo, setFilterTipo] = useState("tutti");
  const [filterMese, setFilterMese] = useState("tutti");
  const [showBk, setShowBk] = useState(false);
  const [contactModal, setContactModal] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const accent = accentColor || C.blue;
  const now = new Date(); now.setHours(0, 0, 0, 0);

  // Build base event list (future only)
  let base = events.filter(e => new Date(e.data + "T12:00") >= now).sort((a, b) => a.data.localeCompare(b.data));
  if (extraFilters) base = extraFilters(base);

  // Apply common filters
  function applyFilters(list) {
    let r = [...list];
    if (!extraFilters && filterSettore !== "tutti") r = r.filter(e => e.settore === filterSettore);
    if (filterTipo !== "tutti") r = r.filter(e => e.tipo === filterTipo);
    if (filterMese !== "tutti") {
      const [y, m] = filterMese.split("-").map(Number);
      r = r.filter(e => { const d = new Date(e.data + "T12:00"); return d.getFullYear() === y && d.getMonth() === m; });
    }
    if (showBk && bookmarks) r = r.filter(e => bookmarks.includes(e.id));
    return r;
  }

  const filtered = applyFilters(base);

  // For the interactive calendar grid: all events in selected month (no future filter)
  function getDays(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function getFirst(y, m) { return new Date(y, m, 1).getDay(); }
  const calEvs = applyFilters(events.filter(e => { const d = new Date(e.data + "T12:00"); return d.getFullYear() === calYear && d.getMonth() === calMonth; }));

  function openMapNav(ev) {
    if (!ev.luogo?.lat) { alert("Coordinate non disponibili"); return; }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.open(ios ? `maps://maps.apple.com/?daddr=${ev.luogo.lat},${ev.luogo.lng}` : `https://www.google.com/maps/dir/?api=1&destination=${ev.luogo.lat},${ev.luogo.lng}`, "_blank");
  }

  // Months dropdown: generate next 12 months
  const monthOpts = [{ value: "tutti", label: "Tutti i Mesi" }];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthOpts.push({ value: `${d.getFullYear()}-${d.getMonth()}`, label: `${monthNames[d.getMonth()]} ${d.getFullYear()}` });
  }

  const selStyle = { padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.gray200}`, fontSize: 13, background: C.white, fontFamily: "inherit", flex: 1, minWidth: 0 };

  const Filters = (
    <div style={{ padding: "10px 16px", background: C.gray50, borderBottom: `1px solid ${C.gray100}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {!extraFilters && (
        <select value={filterSettore} onChange={e => setFilterSettore(e.target.value)} style={selStyle}>
          <option value="tutti">Tutti i Settori</option>
          {Object.keys(TERRITORY).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={selStyle}>
        <option value="tutti">Tutti i Tipi</option>
        {ALL_MEETING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <select value={filterMese} onChange={e => setFilterMese(e.target.value)} style={selStyle}>
        {monthOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {setBookmarks && <button onClick={() => setShowBk(b => !b)} style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${showBk ? C.yellow : C.gray200}`, background: showBk ? C.yellowLight : C.white, cursor: "pointer", fontSize: 13, fontWeight: 700, color: showBk ? "#8B6000" : C.gray700, fontFamily: "inherit", whiteSpace: "nowrap" }}>★{bookmarks?.length > 0 ? " " + bookmarks.length : ""}</button>}
    </div>
  );

  return (
    <>
      {/* Tab bar */}
      <div style={{ position: "sticky", top: stickyTop, zIndex: 99, background: C.white, borderBottom: `1px solid ${C.gray100}`, display: "flex" }}>
        {[["list", "📋 Lista"], ["calendar", "📅 Calendario"], ["map", "🗺 Mappa"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "12px 4px", border: "none", cursor: "pointer", background: "none", fontSize: 13, fontWeight: view === v ? 800 : 500, color: view === v ? accent : C.gray400, borderBottom: `3px solid ${view === v ? accent : "transparent"}`, transition: "all .2s" }}>{l}</button>
        ))}
      </div>

      {/* Filters: always visible on all 3 views */}
      {Filters}

      {/* LIST */}
      {view === "list" && (
        <div style={{ padding: 16 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", padding: 48, color: C.gray400 }}><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><p>Nessun evento trovato</p></div>
            : filtered.map(ev => <EventCard key={ev.id} ev={ev} bookmarks={bookmarks || []} onBookmark={id => setBookmarks && setBookmarks(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id])} onMap={() => openMapNav(ev)} onContact={() => setContactModal(ev)} user={user} rsvp={rsvp} />)
          }
        </div>
      )}

      {/* CALENDAR GRID */}
      {view === "calendar" && (
        <div style={{ padding: 16 }}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <IconBtn icon="‹" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} sm />
              <span style={{ fontWeight: 800, fontSize: 16, color: C.black }}>{monthNames[calMonth]} {calYear}</span>
              <IconBtn icon="›" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} sm />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, padding: "0 12px 12px" }}>
              {dayNames.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.gray400, padding: "4px 0" }}>{d}</div>)}
              {Array(getFirst(calYear, calMonth)).fill(null).map((_, i) => <div key={"e" + i} />)}
              {Array(getDays(calYear, calMonth)).fill(null).map((_, i) => {
                const day = i + 1;
                const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const de = calEvs.filter(e => e.data === ds);
                const isT = new Date().toISOString().split("T")[0] === ds;
                const isBk = de.some(e => bookmarks?.includes(e.id));
                return <div key={day} style={{ minHeight: 44, borderRadius: 10, padding: 4, background: isT ? C.blueLight : C.white, border: `1.5px solid ${isT ? accent : isBk ? C.yellow : C.gray100}` }}>
                  <div style={{ fontSize: 12, fontWeight: isT ? 800 : 500, color: isT ? accent : C.black, marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
                    <span>{day}</span>{isBk && <span style={{ fontSize: 9, color: C.yellow }}>★</span>}
                  </div>
                  {de.slice(0, 2).map(e => <div key={e.id} style={{ height: 5, borderRadius: 99, background: getMeetingColor(e.tipo), marginBottom: 2 }} />)}
                  {de.length > 2 && <div style={{ fontSize: 9, color: C.gray400 }}>+{de.length - 2}</div>}
                </div>;
              })}
            </div>
          </Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: C.gray700, marginBottom: 12 }}>Meeting di {monthNames[calMonth]}</h3>
          {calEvs.length === 0 ? <p style={{ color: C.gray400, fontSize: 14 }}>Nessun meeting questo mese.</p>
            : calEvs.sort((a, b) => a.data.localeCompare(b.data)).map(ev => <EventCard key={ev.id} ev={ev} bookmarks={bookmarks || []} onBookmark={id => setBookmarks && setBookmarks(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id])} onMap={() => openMapNav(ev)} onContact={() => setContactModal(ev)} user={user} rsvp={rsvp} />)
          }
        </div>
      )}

      {/* MAP — shows filtered events as pins */}
      {view === "map" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.gray700, margin: 0 }}>
              📍 {filtered.length} {filtered.length === 1 ? "meeting" : "meeting"} sulla mappa
            </h3>
          </div>
          <LeafletMap events={filtered} height={400} />
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_MEETING_TYPES.map(t => <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.gray700 }}><div style={{ width: 12, height: 12, borderRadius: 99, background: t.color }} />{t.label}</div>)}
          </div>
        </div>
      )}

      <Modal open={!!contactModal} onClose={() => setContactModal(null)} title="Contatta il Responsabile">
        {contactModal && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.gray50, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${C.blue},${C.blueMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>
              <div>
                <p style={{ margin: "0 0 3px", fontWeight: 800, fontSize: 15, color: C.black }}>{contactModal.adminNome}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.gray400 }}>Responsabile di <b style={{ color: C.gray700 }}>{contactModal.gruppo}</b></p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contactModal.adminTel && (
                <Btn full icon="💬" onClick={() => window.open(`https://wa.me/${contactModal.adminTel.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao ${contactModal.adminNome}, ti scrivo riguardo all'evento: ${contactModal.titolo}`)}`)}>
                  WhatsApp
                </Btn>
              )}
              <Btn full variant="secondary" icon="📧" onClick={() => window.open(`mailto:${contactModal.adminEmail}?subject=${encodeURIComponent("Info evento: " + contactModal.titolo)}`)}>
                Email
              </Btn>
            </div>
            {!contactModal.adminTel && <p style={{ fontSize: 11, color: C.gray400, textAlign: "center", marginTop: 12 }}>Il responsabile non ha inserito un numero WhatsApp</p>}
          </div>
        )}
      </Modal>
    </>
  );
}

// ── NAV HELPERS ───────────────────────────────────────────────────────────────

// ── SHARED PROFILE MODAL ──────────────────────────────────────────────────────
// Used by both MemberView and ResponsabileView.
// Handles: view info, edit phone, change password, showName toggle, bookmarks
function ProfileModal({ open, onClose, user, prefs, setP, bookmarks, setBookmarks, events, luoghi, setLuogoModal, adminData, setAdminData }) {
  const role = getRole(user.role);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState(false);
  const [telEdit, setTelEdit] = useState(false);
  const [tel, setTel] = useState(adminData?.telefono || "");

  function saveTel() {
    if (adminData && setAdminData) {
      setAdminData(d => ({ ...d, telefono: tel }));
    } else {
      // For members: save in kosen_users
      try {
        const stored = JSON.parse(localStorage.getItem("kosen_users") || "[]");
        const idx = stored.findIndex(u => u.id === user.id);
        if (idx >= 0) { stored[idx].telefono = tel; localStorage.setItem("kosen_users", JSON.stringify(stored)); }
      } catch { }
    }
    setTelEdit(false);
  }

  function changePassword() {
    setPwError(""); setPwOk(false);
    const all = getAllUsers();
    const u = all.find(x => x.id === user.id);
    if (!u) { setPwError("Utente non trovato."); return; }
    if (u.password !== pwForm.current) { setPwError("La password attuale non è corretta."); return; }
    if (pwForm.next.length < 6) { setPwError("La nuova password deve essere di almeno 6 caratteri."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Le nuove password non coincidono."); return; }
    try {
      const stored = JSON.parse(localStorage.getItem("kosen_users") || "[]");
      const idx = stored.findIndex(x => x.id === user.id);
      if (idx >= 0) {
        stored[idx].password = pwForm.next;
        localStorage.setItem("kosen_users", JSON.stringify(stored));
        setPwOk(true);
        setPwForm({ current: "", next: "", confirm: "" });
      } else {
        setPwError("Questo account non può cambiare password da qui. Usa Reset dal login.");
      }
    } catch { setPwError("Errore. Riprova."); }
  }

  const currentTel = adminData?.telefono || "";

  return (
    <Modal open={open} onClose={onClose} title="Il Mio Profilo" wide>
      {/* Identity card */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 14, background: C.gray50, borderRadius: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${role.color},${role.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{role.icon}</div>
        <div><p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 16, color: C.black }}>{user.name}</p><Chip label={role.label} color={role.color} small /></div>
      </div>

      {/* Info rows */}
      {[["Email", user.email], ["Capitolo", user.capitolo], ["Settore", user.settore], ["Gruppo", user.gruppo]].map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.gray100}` }}>
          <span style={{ fontSize: 13, color: C.gray400, fontWeight: 600 }}>{k}</span>
          <span style={{ fontSize: 13, color: C.black, fontWeight: 700 }}>{v}</span>
        </div>
      ))}

      {/* Phone */}
      <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.gray100}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.gray400, fontWeight: 600 }}>📱 Cellulare (WhatsApp)</span>
          {!telEdit && <button onClick={() => { setTel(currentTel); setTelEdit(true); }} style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{currentTel ? "Modifica" : "+ Aggiungi"}</button>}
        </div>
        {!telEdit && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: currentTel ? C.black : C.gray400, fontWeight: currentTel ? 700 : 400 }}>
            {currentTel || "Non inserito"}
          </p>
        )}
        {telEdit && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="+39 333 123 4567"
              style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${C.blue}`, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            <Btn sm onClick={saveTel}>Salva</Btn>
            <Btn sm variant="secondary" onClick={() => setTelEdit(false)}>✕</Btn>
          </div>
        )}
      </div>

      {/* showName toggle */}
      {prefs && setP && (
        <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.gray100}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, color: C.gray400, fontWeight: 600 }}>👁 Visibilità negli eventi</span>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: C.gray700 }}>{prefs.showName !== false ? "Il tuo nome è visibile ai partecipanti" : "Appari come «Anonimo»"}</p>
            </div>
            <button onClick={() => setP("showName", prefs.showName === false ? true : false)} style={{
              padding: "5px 16px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 12,
              background: prefs.showName !== false ? C.blue : C.gray200,
              color: prefs.showName !== false ? C.white : C.gray700,
              transition: "all .2s",
            }}>{prefs.showName !== false ? "ON" : "OFF"}</button>
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {bookmarks && setBookmarks && (
        <div style={{ background: C.yellowLight, border: `1.5px solid ${C.yellow}`, borderRadius: 12, padding: "12px 14px", marginTop: 16, marginBottom: 16 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#8B6000", fontSize: 13 }}>★ Preferiti ({bookmarks.length})</p>
          {bookmarks.length === 0
            ? <p style={{ fontSize: 13, color: "#8B6000", margin: 0 }}>Nessun evento salvato. Tocca ☆ per aggiungerlo.</p>
            : <>
              {events.filter(e => bookmarks.includes(e.id)).slice(0, 5).map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderTop: `1px solid ${C.yellow}44` }}>
                  <span style={{ fontSize: 13, color: C.black, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.titolo}</span>
                  <button onClick={() => setBookmarks(b => b.filter(x => x !== e.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B6000", fontSize: 16, marginLeft: 8 }}>★</button>
                </div>
              ))}
              {bookmarks.length > 0 && <button onClick={() => setBookmarks([])} style={{ marginTop: 8, fontSize: 12, color: "#8B6000", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>Cancella tutti</button>}
            </>
          }
        </div>
      )}

      {/* Luoghi (responsabili only) */}
      {luoghi !== undefined && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>📍 Miei Luoghi</h3>
            {setLuogoModal && <Btn sm icon="+" onClick={() => { onClose(); setLuogoModal(true); }}>Aggiungi</Btn>}
          </div>
          {(luoghi || []).map(l => (
            <Card key={l.id} style={{ marginBottom: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 14 }}>{l.nome}</p>
                  <p style={{ margin: "0 0 2px", fontSize: 13, color: C.gray700 }}>📍 {[l.via, l.civico].filter(Boolean).join(" ")}{l.comune ? ", " + l.comune : ""}</p>
                  {l.citofono && <p style={{ margin: 0, fontSize: 13, color: C.gray700 }}>🔔 {l.citofono}</p>}
                </div>
                {setAdminData && <IconBtn icon="🗑" onClick={() => setAdminData(d => ({ ...d, luoghi: d.luoghi.filter(x => x.id !== l.id) }))} sm color={C.red} />}
              </div>
            </Card>
          ))}
          {(luoghi || []).length === 0 && <p style={{ color: C.gray400, fontSize: 14, textAlign: "center", padding: 20 }}>Nessun luogo salvato.</p>}
        </>
      )}

      {/* Visibilità toggle for responsabili (no bookmarks) */}
      {prefs && setP && !bookmarks && (
        <div style={{ marginTop: 16, background: C.blueLight, border: `1.5px solid ${C.blue}44`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 800, color: C.blue, fontSize: 13 }}>👁 Visibilità negli eventi</p>
          <button onClick={() => setP("showName", !(prefs.showName !== false))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `2px solid ${prefs.showName !== false ? C.blue : C.gray200}`, background: prefs.showName !== false ? C.white : C.gray50, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: prefs.showName !== false ? C.black : C.gray400 }}>{prefs.showName !== false ? "Nome visibile" : "Partecipazione anonima"}</div>
              <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{prefs.showName !== false ? "Il tuo nome appare nella lista partecipanti" : "Appari come «Anonimo»"}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 12px", borderRadius: 99, background: prefs.showName !== false ? C.blue : C.gray200, color: prefs.showName !== false ? C.white : C.gray700, marginLeft: 12, flexShrink: 0 }}>{prefs.showName !== false ? "ON" : "OFF"}</span>
          </button>
        </div>
      )}

      {/* Change Password */}
      <div style={{ marginTop: 16, background: C.gray50, border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 13, color: C.gray700 }}>🔑 Cambia Password</p>
        {pwOk && <p style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✅ Password aggiornata!</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["current", "Password attuale", "••••••••"], ["next", "Nuova password", "min. 6 caratteri"], ["confirm", "Conferma", "••••••••"]].map(([k, l, ph]) => (
            <div key={k}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.gray400, marginBottom: 4, letterSpacing: .5 }}>{l}</label>
              <input type="password" value={pwForm[k]} onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        {pwError && <p style={{ color: C.red, fontSize: 12, fontWeight: 600, marginTop: 8 }}>{pwError}</p>}
        <div style={{ marginTop: 12 }}>
          <Btn sm onClick={changePassword} icon="🔑">Aggiorna Password</Btn>
        </div>
      </div>
    </Modal>
  );
}


function NavBtn({ icon, label, onClick, color = C.blue }) {
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "background .15s" }}
      onMouseEnter={e => e.currentTarget.style.background = color + "18"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: .3 }}>{label}</span>
    </button>
  );
}
function NavExitBtn({ onLogout }) { return <NavBtn icon="🚪" label="Esci" onClick={onLogout} color={C.red} />; }
function NavProfileBtn({ onClick, color = C.blue }) { return <NavBtn icon="👤" label="Profilo" onClick={onClick} color={color} />; }
function NavLogoHome() {
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <span style={{ fontSize: 24 }}>🪷</span>
    </button>
  );
}

// ── GUEST VIEW ────────────────────────────────────────────────────────────────
function GuestView({ events, onLogout }) {
  const [bk] = useLocalStorage("kosen_bk_guest", []);
  const rsvp = useRsvp();
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", minHeight: "100vh", background: C.gray50 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.white, borderBottom: `1px solid ${C.gray100}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontSize: 24 }}>🪷</span>
          <div style={{ textAlign: "left" }}><div style={{ fontWeight: 900, fontSize: 15, color: C.black, lineHeight: 1 }}>Kosen Calendar</div><div style={{ fontSize: 11, color: C.gray400 }}>Ospite · Capitolo Pavia</div></div>
        </button>
        <NavExitBtn onLogout={onLogout} />
      </div>
      <CalendarView events={events} bookmarks={bk} setBookmarks={null} user={null} rsvp={rsvp} />
    </div>
  );
}

// ── MEMBER VIEW ───────────────────────────────────────────────────────────────
function MemberView({ user, events, onLogout }) {
  const [bookmarks, setBookmarks] = useLocalStorage(`kosen_bk_${user.id}`, []);
  const [prefs, setPrefs] = useLocalStorage(`kosen_pref_${user.id}`, { mioFiltro: false, showName: true });
  const [profileOpen, setProfileOpen] = useState(false);
  const setP = (k, v) => setPrefs(p => ({ ...p, [k]: v }));
  const role = getRole(user.role);
  const rsvp = useRsvp();

  function extraFilters(evs) { return prefs.mioFiltro ? evs.filter(e => e.settore === user.settore) : evs; }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", minHeight: "100vh", background: C.gray50 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.white, borderBottom: `1px solid ${C.gray100}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontSize: 24 }}>🪷</span>
          <div style={{ textAlign: "left" }}><div style={{ fontWeight: 900, fontSize: 15, color: C.black, lineHeight: 1 }}>{user.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}><Chip label={role.label} color={role.color} small /></div></div>
        </button>
        <div style={{ display: "flex", gap: 2 }}>
          <NavProfileBtn onClick={() => setProfileOpen(true)} color={C.blue} />
          <NavExitBtn onLogout={onLogout} />
        </div>
      </div>

      {/* Smart filter toggle */}
      <div style={{ padding: "10px 16px", background: C.gray50, borderBottom: `1px solid ${C.gray100}` }}>
        <button onClick={() => setP("mioFiltro", !prefs.mioFiltro)} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: `2px solid ${prefs.mioFiltro ? C.blue : C.gray200}`, background: prefs.mioFiltro ? C.blueLight : C.white, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: prefs.mioFiltro ? C.blue : C.gray700 }}>🏠 Solo il mio Settore & Gruppo</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: prefs.mioFiltro ? C.blue : C.gray100, color: prefs.mioFiltro ? C.white : C.gray400 }}>{prefs.mioFiltro ? "ON" : "OFF"}</span>
        </button>
        {prefs.mioFiltro && <div style={{ background: C.blueLight, borderRadius: 8, padding: "7px 12px", marginTop: 8, fontSize: 12, color: C.blue, fontWeight: 700 }}>📍 {user.settore} · {user.gruppo}</div>}
      </div>

      <CalendarView events={events} bookmarks={bookmarks} setBookmarks={setBookmarks} user={user} extraFilters={prefs.mioFiltro ? extraFilters : null} rsvp={rsvp} />

      {/* Profile modal — shared component */}
      <ProfileModal
        open={profileOpen} onClose={() => setProfileOpen(false)}
        user={user} prefs={prefs} setP={setP}
        bookmarks={bookmarks} setBookmarks={setBookmarks} events={events}
        adminData={null} setAdminData={null}
      />
    </div>
  );
}

// ── RESPONSABILE VIEW (resp_gruppo / resp_settore / resp_capitolo) ─────────────
function ResponsabileView({ user, events, setEvents, onLogout }) {
  const [tab, setTab] = useState("pubblica");
  const [newEvModal, setNewEvModal] = useState(false);
  const [editEv, setEditEv] = useState(null);
  const [luogoModal, setLuogoModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminData, setAdminData] = useLocalStorage(`kosen_admin_${user.id}`, user);
  const [prefs, setPrefs] = useLocalStorage(`kosen_pref_${user.id}`, { showName: true });
  const setP = (k, v) => setPrefs(p => ({ ...p, [k]: v }));
  const [toast, setToast] = useState(null);
  const [bookmarks, setBookmarks] = useLocalStorage(`kosen_bk_${user.id}`, []);
  const rsvp = useRsvp();

  const role = getRole(user.role);
  function showToast(m, t = "success") { setToast({ msg: m, type: t }); setTimeout(() => setToast(null), 2500); }

  // Which events can this responsabile manage?
  function isMyEvent(ev) {
    if (user.role === "resp_capitolo") return ev.capitolo === user.capitolo;
    if (user.role === "resp_settore") return ev.settore === user.settore;
    return ev.adminId === user.id; // resp_gruppo
  }
  const myEvents = events.filter(isMyEvent);

  // Compute allowed types based on role (no more tipiAbilitati config)
  const allowedTypes = getAllowedTypes(user.role);

  // Step 1: type selector modal
  const [typeSelModal, setTypeSelModal] = useState(false);

  // Event form
  const blank = { titolo: "", tipo: "", data: "", oraInizio: "", oraFine: "", luogoIdx: "", note: "" };
  const [form, setForm] = useState(blank);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function openNew() { setTypeSelModal(true); }

  function selectType(tipoId) {
    setTypeSelModal(false);
    setForm({ ...blank, tipo: tipoId });
    setEditEv(null);
    setNewEvModal(true);
  }

  function openEdit(ev) {
    const idx = adminData.luoghi.findIndex(l => l.nome === ev.luogo.nome && l.via === ev.luogo.via);
    setForm({ titolo: ev.titolo, tipo: ev.tipo, data: ev.data, oraInizio: ev.oraInizio, oraFine: ev.oraFine, luogoIdx: idx >= 0 ? idx.toString() : "", note: ev.note || "" });
    setEditEv(ev);
    setNewEvModal(true);
  }

  function saveEvent() {
    if (!form.titolo || !form.data || !form.oraInizio) { showToast("Compila i campi obbligatori", "error"); return; }
    const luogo = adminData.luoghi[parseInt(form.luogoIdx) || 0] || adminData.luoghi[0];
    if (!luogo) { showToast("Aggiungi un luogo nel profilo!", "error"); return; }
    const ev = { id: editEv?.id || genId(), titolo: form.titolo, tipo: form.tipo, capitolo: user.capitolo, settore: user.settore, gruppo: user.gruppo, data: form.data, oraInizio: form.oraInizio, oraFine: form.oraFine, luogo, note: form.note, adminId: user.id, adminNome: adminData.name, adminEmail: adminData.email, adminTel: adminData.telefono || "" };
    if (editEv) { setEvents(es => es.map(e => e.id === ev.id ? ev : e)); showToast("Aggiornato!"); }
    else { setEvents(es => [...es, ev]); showToast("Evento creato!"); }
    setNewEvModal(false);
  }

  // Luogo form
  const lBlank = { nome: "", via: "", civico: "", comune: "", citofono: "" };
  const [lForm, setLForm] = useState(lBlank);
  function saveLuogo() {
    if (!lForm.nome || !lForm.via || !lForm.comune) { showToast("Nome, via e comune sono obbligatori", "error"); return; }
    setAdminData(d => ({ ...d, luoghi: [...(d.luoghi || []), { id: genId(), ...lForm }] }));
    setLForm(lBlank); setLuogoModal(false); showToast("Luogo salvato!");
  }

  const selLuogo = adminData.luoghi[parseInt(form.luogoIdx)];

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", minHeight: "100vh", background: C.gray50 }}>
      {/* Nav */}
      <div style={{ background: `linear-gradient(135deg,${role.color},${role.color}cc)`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontSize: 22 }}>🪷</span>
          <div style={{ textAlign: "left" }}><div style={{ fontWeight: 900, fontSize: 15, color: C.white }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{role.icon} {role.label} · {user.settore}</div></div>
        </button>
        <div style={{ display: "flex", gap: 2 }}>
          <NavBtn icon="👤" label="Profilo" onClick={() => setProfileOpen(true)} color="rgba(255,255,255,.9)" />
          <NavBtn icon="🚪" label="Esci" onClick={onLogout} color="rgba(255,255,255,.9)" />
        </div>
      </div>

      {/* Tabs — "Pubblica" instead of "Meeting", no "Profilo" tab */}
      <div style={{ display: "flex", background: C.white, borderBottom: `1px solid ${C.gray100}` }}>
        {[["pubblica", "📋 Pubblica"], ["calendario", "📅 Calendario"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: "12px 4px", border: "none", cursor: "pointer", background: "none", fontSize: 12, fontWeight: tab === v ? 800 : 500, color: tab === v ? role.color : C.gray400, borderBottom: `3px solid ${tab === v ? role.color : "transparent"}`, transition: "all .2s" }}>{l}</button>
        ))}
      </div>

      {/* PUBBLICA — list of my managed events */}
      {tab === "pubblica" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 12, color: C.gray400, fontWeight: 600 }}>Tipi che puoi creare:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {allowedTypes.map(t => <Chip key={t.id} label={t.label} color={t.color} small icon={t.icon} />)}
              </div>
            </div>
            <Btn icon="+" onClick={openNew}>Nuovo Meeting</Btn>
          </div>
          {myEvents.length === 0
            ? <div style={{ textAlign: "center", padding: 40, color: C.gray400 }}><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><p>Nessun meeting pubblicato</p><Btn variant="secondary" onClick={openNew} icon="+">Crea il primo</Btn></div>
            : myEvents.sort((a, b) => a.data.localeCompare(b.data)).map(ev => {
              const mt = getMeetingType(ev.tipo);
              const past = new Date(ev.data + "T12:00") < new Date();
              return (
                <Card key={ev.id} style={{ marginBottom: 12, opacity: past ? .7 : 1 }}>
                  <div style={{ height: 5, background: mt.color }} />
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                        <Chip label={mt.icon + " " + mt.label} color={mt.color} small />
                        {past && <Chip label="Passato" color={C.gray400} small />}
                      </div>
                      <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 800, color: C.black }}>{ev.titolo}</h3>
                      <p style={{ margin: "0 0 2px", fontSize: 13, color: C.gray700 }}>📅 {new Date(ev.data + "T12:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })} · {ev.oraInizio}–{ev.oraFine}</p>
                      <p style={{ margin: 0, fontSize: 13, color: C.gray700 }}>📍 {ev.luogo.nome}{luogoAddr(ev.luogo) ? " · " + luogoAddr(ev.luogo) : ""}</p>
                      {ev.note && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8B6000", fontWeight: 700 }}>📝 {ev.note}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      <IconBtn icon="✏️" onClick={() => openEdit(ev)} sm />
                      <IconBtn icon="🗑" onClick={() => setDelConfirm(ev.id)} sm color={C.red} />
                    </div>
                  </div>
                </Card>
              );
            })
          }
        </div>
      )}

      {/* CALENDAR TAB */}
      {tab === "calendario" && (
        <CalendarView events={events} bookmarks={bookmarks} setBookmarks={setBookmarks} user={user} accentColor={role.color} stickyTop={109} rsvp={rsvp} />
      )}

      {/* PROFILE MODAL (triggered from nav) — shared component */}
      <ProfileModal
        open={profileOpen} onClose={() => setProfileOpen(false)}
        user={user} prefs={prefs} setP={setP}
        bookmarks={null} setBookmarks={null} events={events}
        luoghi={adminData.luoghi || []} setLuogoModal={setLuogoModal}
        adminData={adminData} setAdminData={setAdminData}
      />

      {/* TYPE SELECTOR MODAL */}
      <Modal open={typeSelModal} onClose={() => setTypeSelModal(false)} title="Scegli il tipo di meeting">
        <p style={{ fontSize: 13, color: C.gray700, marginBottom: 16 }}>Seleziona la tipologia che vuoi creare. I tipi in grigio richiedono un ruolo superiore.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ALL_MEETING_TYPES.map(t => {
            const allowed = canCreateType(user.role, t.id);
            return (
              <button key={t.id} onClick={() => allowed && selectType(t.id)} disabled={!allowed} style={{
                padding: "16px 12px", borderRadius: 14, border: `2px solid ${allowed ? t.color : C.gray100}`,
                background: allowed ? t.color + "12" : C.gray50, cursor: allowed ? "pointer" : "not-allowed",
                opacity: allowed ? 1 : .42, textAlign: "left", fontFamily: "inherit", transition: "all .15s",
              }}
                onMouseEnter={e => allowed && (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                <div style={{ fontSize: 26, marginBottom: 7 }}>{t.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: allowed ? t.color : C.gray400, marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: allowed ? C.gray700 : C.gray400, marginBottom: 4 }}>{t.desc}</div>
                {!allowed && <div style={{ fontSize: 10, color: C.orange, fontWeight: 700 }}>⚠ Richiede: {getRole(t.ruoloMin).label}</div>}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* NEW/EDIT EVENT */}
      <Modal open={newEvModal} onClose={() => setNewEvModal(false)} title={editEv ? "Modifica Meeting" : "Nuovo Meeting"} wide>
        {form.tipo && (() => {
          const mt = getMeetingType(form.tipo); return (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: mt.color + "12", border: `2px solid ${mt.color}44`, borderRadius: 14, padding: "12px 16px", marginBottom: 20 }}>
              <span style={{ fontSize: 28 }}>{mt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: mt.color }}>{mt.label}</div>
                <div style={{ fontSize: 11, color: C.gray700 }}>{mt.desc}</div>
              </div>
              {!editEv && <button onClick={() => { setNewEvModal(false); setTypeSelModal(true); }} style={{ fontSize: 12, color: C.blue, background: "none", border: `1px solid ${C.blue}44`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, whiteSpace: "nowrap" }}>Cambia ↩</button>}
            </div>
          );
        })()}
        <Field label="Capitolo" value={user.capitolo} readOnly />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Settore" value={user.settore} readOnly />
          <Field label="Gruppo" value={user.gruppo} readOnly />
        </div>
        <Field label="Titolo / Argomento" value={form.titolo} onChange={e => setF("titolo", e.target.value)} required placeholder="es. Studio del Gosho…" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Data" type="date" value={form.data} onChange={e => setF("data", e.target.value)} required />
          <Field label="Inizio" type="time" value={form.oraInizio} onChange={e => setF("oraInizio", e.target.value)} required />
          <Field label="Fine" type="time" value={form.oraFine} onChange={e => setF("oraFine", e.target.value)} />
        </div>
        {(adminData.luoghi || []).length === 0
          ? <div style={{ background: C.yellowLight, border: `1.5px solid ${C.yellow}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#8B6000" }}>⚠️ Vai su <b>Profilo</b> per aggiungere un luogo prima di creare un meeting.</div>
          : <Field label="Luogo" type="select" value={form.luogoIdx} onChange={e => setF("luogoIdx", e.target.value)}
            options={[{ value: "", label: "— Seleziona luogo —" }, ...(adminData.luoghi || []).map((l, i) => ({ value: i.toString(), label: l.nome + (luogoAddr(l) ? " – " + luogoAddr(l) : "") }))]} />
        }
        {selLuogo && <>
          {selLuogo.citofono && <div style={{ background: C.blueLight, borderRadius: 10, padding: "9px 14px", marginBottom: 8, fontSize: 13, color: C.blue }}>🔔 Citofono: <b>{selLuogo.citofono}</b></div>}
          {luogoAddr(selLuogo) && <div style={{ background: C.gray50, borderRadius: 10, padding: "9px 14px", marginBottom: 8, fontSize: 13, color: C.gray700 }}>📍 {luogoAddr(selLuogo)}</div>}
        </>}
        <div style={{ background: C.gray50, border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: C.gray700, marginBottom: 6 }}>📝 NOTE</label>
          <textarea value={form.note} onChange={e => setF("note", e.target.value)} rows={2} placeholder="Informazioni aggiuntive…" style={{ width: "100%", border: "none", background: "transparent", resize: "vertical", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setNewEvModal(false)}>Annulla</Btn>
          <Btn onClick={saveEvent}>{editEv ? "Salva Modifiche" : "Pubblica Meeting"}</Btn>
        </div>
      </Modal>

      {/* ADD LUOGO */}
      <Modal open={luogoModal} onClose={() => setLuogoModal(false)} title="Aggiungi Luogo">
        <Field label="Nome del Luogo" value={lForm.nome} onChange={e => setLForm(f => ({ ...f, nome: e.target.value }))} required placeholder="es. Sala Riunioni, Casa mia…" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
          <Field label="Via / Corso / Piazza" value={lForm.via} onChange={e => setLForm(f => ({ ...f, via: e.target.value }))} required placeholder="es. Via Roma" />
          <Field label="N°" value={lForm.civico} onChange={e => setLForm(f => ({ ...f, civico: e.target.value }))} placeholder="12" />
        </div>
        <Field label="Comune" value={lForm.comune} onChange={e => setLForm(f => ({ ...f, comune: e.target.value }))} required placeholder="es. Pavia" />
        <Field label="Citofono / Istruzioni accesso" value={lForm.citofono} onChange={e => setLForm(f => ({ ...f, citofono: e.target.value }))} placeholder="es. Scala B, Int. 4" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setLuogoModal(false)}>Annulla</Btn>
          <Btn onClick={saveLuogo}>Salva Luogo</Btn>
        </div>
      </Modal>

      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Conferma eliminazione">
        <p style={{ color: C.gray700, fontSize: 14, marginBottom: 20 }}>Eliminare questo meeting?</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setDelConfirm(null)}>Annulla</Btn>
          <Btn variant="danger" onClick={() => { setEvents(es => es.filter(e => e.id !== delConfirm)); setDelConfirm(null); showToast("Eliminato", "info"); }}>Elimina</Btn>
        </div>
      </Modal>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── SUPER VIEW ────────────────────────────────────────────────────────────────
function SuperView({ user, events, setEvents, onLogout }) {
  const [users, setUsers] = useLocalStorage("kosen_users", SEED_USERS);
  const [tab, setTab] = useState("pending");
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState(null);
  function showToast(m, t = "success") { setToast({ msg: m, type: t }); setTimeout(() => setToast(null), 2500); }

  // Merge seed users (not overriding stored ones)
  const allUsers = [...users, ...SEED_USERS.filter(s => !users.find(u => u.email === s.email))];
  const pending = allUsers.filter(u => !u.approved || u.role === "pending");
  const active = allUsers.filter(u => u.approved && u.role !== "pending");

  function saveUser(updated) {
    const exists = users.find(u => u.id === updated.id);
    if (exists) setUsers(us => us.map(u => u.id === updated.id ? updated : u));
    else setUsers(us => [...us, updated]);
    setEditUser(null);
    showToast("Utente aggiornato!");
  }

  function deleteUser(id) { setUsers(us => us.filter(u => u.id !== id)); showToast("Utente rimosso", "info"); }

  // Quick approve with default role
  function approveUser(u) {
    saveUser({ ...u, role: "membro", approved: true });
    showToast(`${u.name} approvato come Membro`);
  }

  const futureEvCount = events.filter(e => new Date(e.data + "T12:00") >= new Date()).length;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", minHeight: "100vh", background: C.gray50 }}>
      <div style={{ background: `linear-gradient(135deg,${C.red},#8B0000)`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>⚡</span><div><div style={{ fontWeight: 900, fontSize: 15, color: C.white }}>Super User Panel</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>Gestione Completa</div></div></div>
        <IconBtn icon="🚪" onClick={onLogout} color={C.yellow} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, padding: 16 }}>
        {[[pending.length, "In Attesa", "⏳", C.orange], [active.length, "Attivi", "✅", C.green], [futureEvCount, "Meeting", "📅", C.blue], [Object.keys(TERRITORY).length, "Settori", "🗺", C.red]].map(([n, l, ic, c]) => (
          <Card key={l} style={{ padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 3 }}>{ic}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{n}</div>
            <div style={{ fontSize: 10, color: C.gray400, fontWeight: 700 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.white, borderBottom: `1px solid ${C.gray100}` }}>
        {[["pending", `⏳ In attesa${pending.length > 0 ? " (" + pending.length + ")" : ""}`], ["active", "✅ Utenti attivi"], ["events", "📋 Meeting"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: "12px 4px", border: "none", cursor: "pointer", background: "none", fontSize: 12, fontWeight: tab === v ? 800 : 500, color: tab === v ? (v === "pending" && pending.length > 0 ? C.orange : C.blue) : C.gray400, borderBottom: `3px solid ${tab === v ? (v === "pending" && pending.length > 0 ? C.orange : C.blue) : "transparent"}`, transition: "all .2s" }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 40px" }}>

        {/* ── PENDING ── */}
        {tab === "pending" && (
          <>
            {pending.length === 0
              ? <div style={{ textAlign: "center", padding: 40, color: C.gray400 }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><p>Nessuna richiesta in attesa</p></div>
              : <>
                <p style={{ fontSize: 13, color: C.gray700, marginBottom: 16 }}>Questi utenti si sono registrati e attendono che venga assegnato loro un ruolo.</p>
                {pending.map(u => (
                  <Card key={u.id} style={{ marginBottom: 12, padding: "14px 16px", border: `1.5px solid ${C.orange}44` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>⏳</span>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.black }}>{u.name}</p>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: 13, color: C.gray700 }}>✉️ {u.email}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          <Chip label={u.capitolo} color={C.blue} small />
                          <Chip label={u.settore} color={C.purple} small />
                          <Chip label={u.gruppo} color={C.gray700} small />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        <Btn sm onClick={() => setEditUser(u)} icon="⚙️">Assegna</Btn>
                        <Btn sm variant="secondary" onClick={() => approveUser(u)}>Approva</Btn>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            }
          </>
        )}

        {/* ── ACTIVE USERS ── */}
        {tab === "active" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.black }}>Utenti attivi ({active.length})</h3>
            </div>
            {active.map(u => {
              const r = getRole(u.role);
              const tipi = (u.tipiAbilitati || []).map(id => ALL_MEETING_TYPES.find(t => t.id === id)).filter(Boolean);
              return (
                <Card key={u.id} style={{ marginBottom: 10, padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16 }}>{r.icon}</span>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.black }}>{u.name}</p>
                        <Chip label={r.label} color={r.color} small />
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 13, color: C.gray700 }}>✉️ {u.email}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: tipi.length ? 6 : 0 }}>
                        <Chip label={u.capitolo} color={C.blue} small />
                        <Chip label={u.settore} color={C.purple} small />
                        <Chip label={u.gruppo} color={C.gray700} small />
                      </div>
                      {tipi.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{tipi.map(t => <Chip key={t.id} label={t.label} color={t.color} small />)}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      <IconBtn icon="✏️" onClick={() => setEditUser(u)} sm title="Modifica" />
                      <IconBtn icon="🗑" onClick={() => deleteUser(u.id)} sm color={C.red} title="Rimuovi" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}

        {/* ── EVENTS ── */}
        {tab === "events" && (
          <>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: C.black }}>📋 Tutti i Meeting ({events.length})</h3>
            {events.sort((a, b) => a.data.localeCompare(b.data)).map(ev => {
              const mt = getMeetingType(ev.tipo);
              return (
                <Card key={ev.id} style={{ marginBottom: 10 }}>
                  <div style={{ height: 4, background: mt.color }} />
                  <div style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}><Chip label={mt.label} color={mt.color} small /><Chip label={ev.settore} color={C.blue} small /></div>
                    <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 14, color: C.black }}>{ev.titolo}</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.gray700 }}>📅 {ev.data} · {ev.oraInizio}–{ev.oraFine} · {ev.luogo.nome}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: C.gray400 }}>By: {ev.adminNome}</p>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* ── EDIT USER MODAL ── */}
      {editUser && <EditUserModal user={editUser} onSave={saveUser} onClose={() => setEditUser(null)} />}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── EDIT USER MODAL ───────────────────────────────────────────────────────────
function EditUserModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user.name, email: user.email, password: user.password,
    role: user.role === "pending" ? "membro" : user.role,
    capitolo: user.capitolo || "Capitolo Pavia",
    settore: user.settore || Object.keys(TERRITORY)[0],
    gruppo: user.gruppo || "",
    tipiAbilitati: user.tipiAbilitati || [],
    approved: true,
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function toggleTipo(id) { setForm(f => ({ ...f, tipiAbilitati: f.tipiAbilitati.includes(id) ? f.tipiAbilitati.filter(x => x !== id) : [...f.tipiAbilitati, id] })); }

  const cap = CAPITOLI[form.capitolo];
  const territory = cap?.disponibile ? cap.territory : {};
  const showTipi = ["resp_gruppo", "resp_settore", "resp_capitolo"].includes(form.role);

  return (
    <Modal open onClose={onClose} title="Modifica Utente / Assegna Ruolo" wide>
      <Field label="Nome" value={form.name} onChange={e => setF("name", e.target.value)} required />
      <Field label="Email" type="email" value={form.email} readOnly />
      <Field label="Password" type="password" value={form.password} onChange={e => setF("password", e.target.value)} />

      {/* Ruolo */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray700, marginBottom: 8, letterSpacing: .5 }}>Ruolo <span style={{ color: C.red }}>*</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ROLES.filter(r => r.id !== "pending").map(r => (
            <button key={r.id} onClick={() => setF("role", r.id)} style={{ padding: "10px 14px", borderRadius: 12, border: `2px solid ${form.role === r.id ? r.color : C.gray200}`, background: form.role === r.id ? r.color + "18" : C.white, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, transition: "all .15s" }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: form.role === r.id ? r.color : C.black }}>{r.label}</div>
              </div>
              {form.role === r.id && <span style={{ marginLeft: "auto", fontSize: 13, color: r.color }}>✓</span>}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10, padding: "10px 14px", background: C.gray50, borderRadius: 10, fontSize: 12, color: C.gray700 }}>
          {form.role === "membro" && "🌸 Accesso in lettura al calendario con preferiti personalizzati."}
          {form.role === "resp_gruppo" && "👥 Può creare e gestire meeting per il suo gruppo."}
          {form.role === "resp_settore" && "🏘 Può gestire tutti i meeting del suo settore."}
          {form.role === "resp_capitolo" && "🏛 Può gestire tutti i meeting del capitolo."}
        </div>
      </div>

      {/* Capitolo */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray700, marginBottom: 8, letterSpacing: .5 }}>Capitolo</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(CAPITOLI).map(([c, info]) => (
            <button key={c} onClick={() => { if (info.disponibile) { setF("capitolo", c); setF("settore", Object.keys(info.territory)[0] || ""); setF("gruppo", ""); } }} style={{ padding: "10px", borderRadius: 10, border: `2px solid ${form.capitolo === c ? C.blue : C.gray200}`, background: form.capitolo === c ? C.blueLight : C.white, cursor: info.disponibile ? "pointer" : "not-allowed", opacity: info.disponibile ? 1 : .6, textAlign: "center", fontFamily: "inherit", transition: "all .15s" }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: form.capitolo === c ? C.blue : C.black }}>{c}</div>
              {!info.disponibile && <div style={{ fontSize: 10, color: C.gray400, marginTop: 2 }}>🔜 Presto disp.</div>}
            </button>
          ))}
        </div>
      </div>
      {cap?.disponibile && <>
        <Field label="Settore" type="select" value={form.settore} onChange={e => { setF("settore", e.target.value); setF("gruppo", ""); }} options={Object.keys(territory).map(s => ({ value: s, label: s }))} />
        <Field label="Gruppo" type="select" value={form.gruppo} onChange={e => setF("gruppo", e.target.value)} options={[{ value: "", label: "— Seleziona —" }, ...(territory[form.settore] || []).map(g => ({ value: g, label: g }))]} />
      </>}

      {/* Tipi abilitati (solo per responsabili) */}
      {showTipi && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gray700, marginBottom: 8, letterSpacing: .5 }}>Tipi di Meeting Abilitati</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ALL_MEETING_TYPES.map(t => {
              const on = form.tipiAbilitati.includes(t.id);
              return <button key={t.id} onClick={() => toggleTipo(t.id)} style={{ padding: "9px 12px", borderRadius: 10, textAlign: "left", fontFamily: "inherit", border: `2px solid ${on ? t.color : C.gray200}`, background: on ? t.color + "18" : C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all .15s" }}>
                <div style={{ width: 12, height: 12, borderRadius: 99, background: on ? t.color : C.gray200, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: on ? t.color : C.gray700, flex: 1 }}>{t.label}</span>
                {on && <span style={{ fontSize: 12 }}>✓</span>}
              </button>;
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Annulla</Btn>
        <Btn onClick={() => onSave({ ...user, ...form })}>Salva</Btn>
      </div>
    </Modal>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useLocalStorage("kosen_session", null);
  const [events, setEvents] = useLocalStorage("kosen_events", SEED_EVENTS);

  // Check for reset token in URL query string
  const resetToken = new URLSearchParams(window.location.search).get("reset");
  if (resetToken) {
    return <ResetPasswordPage token={resetToken} onDone={() => {
      // Remove ?reset=... from URL and show login
      window.history.replaceState({}, "", window.location.pathname);
      window.location.reload();
    }} />;
  }

  if (!session) return <AuthScreen onLogin={setSession} />;

  const role = session.role;
  const logout = () => setSession(null);

  if (role === "super") return <SuperView user={session} events={events} setEvents={setEvents} onLogout={logout} />;
  if (canCreateEvents(role)) return <ResponsabileView user={session} events={events} setEvents={setEvents} onLogout={logout} />;
  if (role === "membro") return <MemberView user={session} events={events} onLogout={logout} />;
  return <GuestView events={events} onLogout={logout} />;
}