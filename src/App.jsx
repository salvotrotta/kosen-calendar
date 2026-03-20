import { useState, useEffect, useCallback } from "react";

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
  blue:   "#003DA5",
  blueMid:"#0052CC",
  blueLight:"#E8EFFE",
  yellow: "#FFD700",
  yellowLight:"#FFF8CC",
  red:    "#CC0000",
  redLight:"#FFEAEA",
  white:  "#FFFFFF",
  gray50: "#F8F9FC",
  gray100:"#EEF0F5",
  gray200:"#D8DCE8",
  gray400:"#9098B0",
  gray700:"#3A4060",
  black:  "#1A1F35",
};

// ── initial data ──────────────────────────────────────────────────────────────
const TERRITORY = {
  "Settore Giglio":         ["Paramita","Shin"],
  "Settore Indaco":         ["Suono Meraviglioso","Girasole","Armonia"],
  "Settore Mai Sprezzante": ["Sole Meraviglioso","Nuova Aurora","Rinascita"],
  "Settore Oceano":         ["Fiore di Loto","Soli Splendenti"],
  "Settore Picco dell'Aquila":["Alba Nuova","Diamante"],
  "Settore Saito":          ["Nam","Ananda","Soku","Myoho","Niji"],
};

const MEETING_TYPES = [
  { id:"studio",   label:"Meeting Studio",   color: C.blue  },
  { id:"giovani",  label:"Meeting Giovani",   color: C.yellow},
  { id:"adulti",   label:"Meeting Adulti",    color: C.red   },
  { id:"speciale", label:"Meeting Speciale",  color: C.gray700},
];

const CHAPTER = "Capitolo Centrale";

const VIEW_PASSWORD = "sgikosen24";

// seed admins
const SEED_ADMINS = [
  { id:"a1", email:"giglio@kosen.it",  password:"admin123", name:"Marco Giglio",
    settore:"Settore Giglio", gruppo:"Paramita", capitolo: CHAPTER,
    luoghi:[{id:"l1",nome:"Sala Paramita",indirizzo:"Via Roma 12, Milano",citofono:"Scala B Int.3",lat:45.464,lng:9.190}]},
  { id:"a2", email:"indaco@kosen.it",  password:"admin123", name:"Lucia Indaco",
    settore:"Settore Indaco", gruppo:"Girasole", capitolo: CHAPTER,
    luoghi:[{id:"l2",nome:"Casa Lucia",indirizzo:"Corso Buenos Aires 40, Milano",citofono:"Int.7",lat:45.477,lng:9.209}]},
];

// seed events
const today = new Date();
const fmt = (d)=>d.toISOString().split("T")[0];
const SEED_EVENTS = [
  { id:"e1", titolo:"Studio del Gosho – Capitolo 3", tipo:"studio",
    capitolo:CHAPTER, settore:"Settore Giglio", gruppo:"Paramita",
    data:fmt(new Date(today.getFullYear(),today.getMonth(),today.getDate()+3)),
    oraInizio:"19:30", oraFine:"21:00",
    luogo:{nome:"Sala Paramita",indirizzo:"Via Roma 12, Milano",citofono:"Scala B Int.3",lat:45.464,lng:9.190},
    noteUrgenti:"", adminId:"a1", adminNome:"Marco Giglio", adminEmail:"giglio@kosen.it" },
  { id:"e2", titolo:"Meeting Giovani Mensile", tipo:"giovani",
    capitolo:CHAPTER, settore:"Settore Indaco", gruppo:"Girasole",
    data:fmt(new Date(today.getFullYear(),today.getMonth(),today.getDate()+7)),
    oraInizio:"18:00", oraFine:"20:00",
    luogo:{nome:"Casa Lucia",indirizzo:"Corso Buenos Aires 40, Milano",citofono:"Int.7",lat:45.477,lng:9.209},
    noteUrgenti:"Portare i libri di testo!", adminId:"a2", adminNome:"Lucia Indaco", adminEmail:"indaco@kosen.it" },
  { id:"e3", titolo:"Incontro Adulti – Testimonianze", tipo:"adulti",
    capitolo:CHAPTER, settore:"Settore Mai Sprezzante", gruppo:"Sole Meraviglioso",
    data:fmt(new Date(today.getFullYear(),today.getMonth(),today.getDate()+10)),
    oraInizio:"20:00", oraFine:"21:30",
    luogo:{nome:"Sala Meraviglioso",indirizzo:"Via Torino 88, Milano",citofono:"Piano 2",lat:45.461,lng:9.183},
    noteUrgenti:"", adminId:"a1", adminNome:"Marco Giglio", adminEmail:"giglio@kosen.it" },
];

// ── helpers ───────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2,9);

const monthNames = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const dayNames = ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];

function getMeetingType(id){ return MEETING_TYPES.find(t=>t.id===id)||MEETING_TYPES[0]; }
function getMeetingColor(id){
  const t = getMeetingType(id);
  return t.color;
}

function useLocalStorage(key, initial){
  const [val,setVal] = useState(()=>{
    try{ const s=localStorage.getItem(key); return s?JSON.parse(s):initial; }
    catch{ return initial; }
  });
  const set = useCallback(v=>{
    setVal(prev=>{
      const next = typeof v==="function"?v(prev):v;
      try{ localStorage.setItem(key,JSON.stringify(next)); }catch{}
      return next;
    });
  },[key]);
  return [val,set];
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

// Badge chip
function Chip({label,color,small}){
  const bg = color+"22";
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      background:bg, color:color, border:`1.5px solid ${color}40`,
      borderRadius:99, padding: small?"2px 8px":"4px 12px",
      fontSize: small?11:12, fontWeight:700, letterSpacing:.5,
    }}>{label}</span>
  );
}

// Icon button
function IconBtn({icon,onClick,color=C.blue,title,sm}){
  const s = sm?32:40;
  return (
    <button title={title} onClick={onClick} style={{
      width:s,height:s,borderRadius:s,border:"none",cursor:"pointer",
      background:"transparent", color:color,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:sm?15:18, transition:"background .15s",
    }}
    onMouseEnter={e=>e.currentTarget.style.background=color+"18"}
    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >{icon}</button>
  );
}

// Primary button
function Btn({children,onClick,variant="primary",disabled,full,sm,icon}){
  const styles = {
    primary:  {background:`linear-gradient(135deg,${C.blue},${C.blueMid})`, color:C.white, border:"none"},
    secondary:{background:C.white, color:C.blue, border:`2px solid ${C.blue}`},
    danger:   {background:C.red, color:C.white, border:"none"},
    yellow:   {background:C.yellow, color:C.black, border:"none"},
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{
      ...styles[variant],
      padding: sm?"6px 14px":"10px 22px",
      borderRadius:10, cursor:disabled?"not-allowed":"pointer",
      fontSize: sm?13:14, fontWeight:700,
      width: full?"100%":"auto",
      display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
      opacity:disabled?.5:1, transition:"opacity .2s, transform .1s",
      fontFamily:"inherit",
    }}
    onMouseDown={e=>!disabled&&(e.currentTarget.style.transform="scale(.97)")}
    onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
    >{icon&&<span>{icon}</span>}{children}</button>
  );
}

// Card
function Card({children,style,onClick}){
  return (
    <div onClick={onClick} style={{
      background:C.white, borderRadius:16,
      boxShadow:"0 2px 12px rgba(0,61,165,.07)",
      border:`1px solid ${C.gray100}`,
      overflow:"hidden", cursor:onClick?"pointer":"default",
      transition:"box-shadow .2s, transform .15s",
      ...style,
    }}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.boxShadow="0 6px 24px rgba(0,61,165,.13)")}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.boxShadow="0 2px 12px rgba(0,61,165,.07)")}
    >{children}</div>
  );
}

// Input field
function Field({label,type="text",value,onChange,required,readOnly,placeholder,options,rows}){
  const inputStyle = {
    width:"100%",padding:"10px 14px",borderRadius:10,
    border:`1.5px solid ${C.gray200}`, fontSize:14,
    background:readOnly?C.gray50:C.white,
    color:C.black, outline:"none", fontFamily:"inherit",
    transition:"border-color .2s", boxSizing:"border-box",
  };
  return (
    <div style={{marginBottom:16}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:700,color:C.gray700,marginBottom:5,letterSpacing:.5}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>}
      {type==="select"
        ? <select value={value} onChange={onChange} disabled={readOnly} style={{...inputStyle,appearance:"auto"}}>
            {options?.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
          </select>
        : type==="textarea"
        ? <textarea value={value} onChange={onChange} readOnly={readOnly} rows={rows||3}
            placeholder={placeholder} style={{...inputStyle,resize:"vertical"}}
            onFocus={e=>e.target.style.borderColor=C.blue}
            onBlur={e=>e.target.style.borderColor=C.gray200}/>
        : <input type={type} value={value} onChange={onChange} readOnly={readOnly}
            required={required} placeholder={placeholder} style={inputStyle}
            onFocus={e=>e.target.style.borderColor=C.blue}
            onBlur={e=>e.target.style.borderColor=C.gray200}/>
      }
    </div>
  );
}

// Modal
function Modal({open,onClose,title,children,wide}){
  if(!open) return null;
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(10,20,60,.45)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",
      padding:16, backdropFilter:"blur(4px)",
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card style={{width:"100%",maxWidth:wide?680:460,maxHeight:"90vh",overflowY:"auto",borderRadius:20}}>
        <div style={{padding:"20px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.gray100}`,paddingBottom:14}}>
          <h3 style={{margin:0,fontSize:17,color:C.black,fontWeight:800}}>{title}</h3>
          <IconBtn icon="✕" onClick={onClose} sm/>
        </div>
        <div style={{padding:24}}>{children}</div>
      </Card>
    </div>
  );
}

// Toast
function Toast({msg,type}){
  const colors={success:C.blue,error:C.red,info:C.gray700};
  if(!msg) return null;
  return (
    <div style={{
      position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:colors[type]||C.blue, color:C.white,
      padding:"12px 24px",borderRadius:12,fontWeight:700,fontSize:14,
      zIndex:2000,boxShadow:"0 8px 32px rgba(0,0,0,.2)",
      animation:"fadeIn .25s ease",
    }}>{msg}</div>
  );
}

// Event card (user view)
function EventCard({ev,onMap,onContact,bookmarks,onBookmark}){
  const mt = getMeetingType(ev.tipo);
  const bk = bookmarks.includes(ev.id);
  const dateStr = new Date(ev.data+"T12:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
  return (
    <Card style={{marginBottom:14}}>
      <div style={{height:5,background:mt.color,borderRadius:"16px 16px 0 0"}}/>
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              <Chip label={mt.label} color={mt.color} small/>
              <Chip label={ev.settore} color={C.blue} small/>
              <Chip label={ev.gruppo} color={C.gray700} small/>
            </div>
            <h3 style={{margin:"0 0 4px",fontSize:16,fontWeight:800,color:C.black}}>{ev.titolo}</h3>
            <p style={{margin:"0 0 6px",fontSize:13,color:C.gray700}}>
              📅 {dateStr} · {ev.oraInizio}–{ev.oraFine}
            </p>
            <p style={{margin:"0 0 4px",fontSize:13,color:C.gray700}}>
              📍 {ev.luogo.nome} · {ev.luogo.indirizzo}
            </p>
            {ev.luogo.citofono&&<p style={{margin:"0 0 4px",fontSize:13,color:C.gray700}}>🔔 Citofono: <b>{ev.luogo.citofono}</b></p>}
            {ev.noteUrgenti&&(
              <div style={{background:C.yellowLight,border:`1.5px solid ${C.yellow}`,borderRadius:8,padding:"7px 12px",marginTop:8}}>
                <span style={{fontSize:12,fontWeight:800,color:"#8B6000"}}>⚡ URGENTE: </span>
                <span style={{fontSize:12,color:C.black}}>{ev.noteUrgenti}</span>
              </div>
            )}
          </div>
          <button onClick={()=>onBookmark(ev.id)} style={{
            background:"none",border:"none",cursor:"pointer",fontSize:22,
            color: bk?C.yellow:C.gray200, flexShrink:0,
          }}>{bk?"★":"☆"}</button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          <Btn sm icon="🗺" onClick={()=>onMap(ev)}>Mappa</Btn>
          <Btn sm variant="secondary" icon="📞" onClick={()=>onContact(ev)}>Contatta</Btn>
        </div>
      </div>
    </Card>
  );
}

// Simple interactive map (Leaflet via CDN)
function LeafletMap({events,height=350}){
  const [loaded,setLoaded]=useState(false);
  const mapId = "kosen-map-"+Math.random().toString(36).slice(2,6);

  useEffect(()=>{
    if(document.getElementById("leaflet-css")) { setLoaded(true); return; }
    const link=document.createElement("link");
    link.id="leaflet-css"; link.rel="stylesheet";
    link.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload=()=>setLoaded(true);
    document.head.appendChild(script);
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    const L=window.L;
    const container=document.getElementById(mapId);
    if(!container||container._leaflet_id) return;
    const map=L.map(mapId).setView([45.464,9.190],12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:"© OpenStreetMap"
    }).addTo(map);
    events.forEach(ev=>{
      if(!ev.luogo?.lat) return;
      const mt=getMeetingType(ev.tipo);
      const icon=L.divIcon({
        className:"",
        html:`<div style="width:28px;height:28px;background:${mt.color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:800;">${ev.tipo[0].toUpperCase()}</div>`,
        iconSize:[28,28],iconAnchor:[14,14],
      });
      L.marker([ev.luogo.lat,ev.luogo.lng],{icon})
        .addTo(map)
        .bindPopup(`<b>${ev.titolo}</b><br>${ev.data} ${ev.oraInizio}<br>${ev.luogo.indirizzo}`);
    });
  },[loaded,events,mapId]);

  if(!loaded) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",background:C.gray50,borderRadius:16,color:C.gray400}}>Caricamento mappa…</div>;
  return <div id={mapId} style={{height,borderRadius:16,overflow:"hidden",border:`1px solid ${C.gray100}`}}/>;
}

// ── VIEWS ─────────────────────────────────────────────────────────────────────

// LOGIN screen
function LoginScreen({onLogin}){
  const [mode,setMode]=useState("user"); // "user"|"admin"|"super"
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");

  function handleLogin(){
    setError("");
    if(mode==="user"){
      if(password===VIEW_PASSWORD){ onLogin({role:"user"}); }
      else setError("Password non corretta.");
      return;
    }
    if(mode==="super"){
      if(email==="super@kosen.it"&&password==="super2024"){ onLogin({role:"super",email}); }
      else setError("Credenziali Super User errate.");
      return;
    }
    // admin
    const admin = SEED_ADMINS.find(a=>a.email===email&&a.password===password);
    if(admin){ onLogin({role:"admin",...admin}); }
    else setError("Email o password errata.");
  }

  return (
    <div style={{
      minHeight:"100vh",background:`linear-gradient(160deg,${C.blue} 0%,#001E6E 100%)`,
      display:"flex",alignItems:"center",justifyContent:"center",padding:24,
    }}>
      <div style={{width:"100%",maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{
            width:72,height:72,borderRadius:20,
            background:`linear-gradient(135deg,${C.yellow},${C.red})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:32,margin:"0 auto 16px",
            boxShadow:"0 8px 32px rgba(255,215,0,.35)",
          }}>🪷</div>
          <h1 style={{color:C.white,fontSize:26,fontWeight:900,margin:"0 0 4px",letterSpacing:-1}}>Kosen Calendar</h1>
          <p style={{color:"rgba(255,255,255,.6)",fontSize:14,margin:0}}>Soka Gakkai – Capitolo Centrale</p>
        </div>
        <Card style={{padding:28,borderRadius:20}}>
          {/* Mode tabs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:24,background:C.gray50,padding:4,borderRadius:12}}>
            {[["user","👥 Visualizza"],["admin","🔑 Admin"],["super","⚡ Super"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setError(""); setEmail("");setPassword("");}} style={{
                padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,
                background:mode===m?C.blue:"transparent",
                color:mode===m?C.white:C.gray400,
                transition:"all .2s",
              }}>{l}</button>
            ))}
          </div>
          {mode==="user"
            ? <Field label="Password Visualizzazione" type="password" value={password}
                onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
            : <>
                <Field label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@kosen.it"/>
                <Field label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
              </>
          }
          {error&&<p style={{color:C.red,fontSize:13,marginBottom:12,fontWeight:600}}>{error}</p>}
          <Btn full onClick={handleLogin} icon="→">Accedi</Btn>
          {mode==="user"&&<p style={{fontSize:11,color:C.gray400,textAlign:"center",marginTop:12}}>La password viene comunicata verbalmente dal responsabile</p>}
        </Card>
      </div>
    </div>
  );
}

// USER VIEW
function UserView({user,events,onLogout}){
  const [view,setView]=useState("list"); // list|calendar|map
  const [bookmarks,setBookmarks]=useLocalStorage("kosen_bookmarks",[]);
  const [filterSettore,setFilterSettore]=useState("tutti");
  const [filterTipo,setFilterTipo]=useState("tutti");
  const [showBookmarksOnly,setShowBookmarksOnly]=useState(false);
  const [contactModal,setContactModal]=useState(null);
  const [mapEv,setMapEv]=useState(null);
  const [calYear,setCalYear]=useState(new Date().getFullYear());
  const [calMonth,setCalMonth]=useState(new Date().getMonth());

  const today = new Date(); today.setHours(0,0,0,0);
  const futureEvents = events
    .filter(e=>new Date(e.data+"T12:00")>=today)
    .sort((a,b)=>a.data.localeCompare(b.data));

  const filtered = futureEvents.filter(e=>{
    if(filterSettore!=="tutti"&&e.settore!==filterSettore) return false;
    if(filterTipo!=="tutti"&&e.tipo!==filterTipo) return false;
    if(showBookmarksOnly&&!bookmarks.includes(e.id)) return false;
    return true;
  });

  function toggleBookmark(id){
    setBookmarks(b=>b.includes(id)?b.filter(x=>x!==id):[...b,id]);
  }

  function openMap(ev){
    if(!ev.luogo?.lat){alert("Coordinate non disponibili"); return;}
    const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${ev.luogo.lat},${ev.luogo.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${ev.luogo.lat},${ev.luogo.lng}`;
    window.open(url,"_blank");
  }

  // Calendar helpers
  function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
  function getFirstDay(y,m){ return new Date(y,m,1).getDay(); }

  const calEvents = events.filter(e=>{
    const d=new Date(e.data+"T12:00");
    return d.getFullYear()===calYear&&d.getMonth()===calMonth;
  });

  const Nav = (
    <div style={{
      position:"sticky",top:0,zIndex:100,background:C.white,
      borderBottom:`1px solid ${C.gray100}`,
      padding:"10px 16px",
      display:"flex",alignItems:"center",justifyContent:"space-between",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:24}}>🪷</span>
        <div>
          <div style={{fontWeight:900,fontSize:15,color:C.black,lineHeight:1}}>Kosen Calendar</div>
          <div style={{fontSize:11,color:C.gray400}}>Visualizzatore</div>
        </div>
      </div>
      <IconBtn icon="🚪" onClick={onLogout} title="Esci" color={C.red}/>
    </div>
  );

  const TabBar = (
    <div style={{
      position:"sticky",top:61,zIndex:99,background:C.white,
      borderBottom:`1px solid ${C.gray100}`,
      display:"flex",
    }}>
      {[["list","📋 Lista"],["calendar","📅 Calendario"],["map","🗺 Mappa"]].map(([v,l])=>(
        <button key={v} onClick={()=>setView(v)} style={{
          flex:1,padding:"12px 4px",border:"none",cursor:"pointer",background:"none",
          fontSize:13,fontWeight:view===v?800:500,color:view===v?C.blue:C.gray400,
          borderBottom:`3px solid ${view===v?C.blue:"transparent"}`,
          transition:"all .2s",
        }}>{l}</button>
      ))}
    </div>
  );

  const Filters = (
    <div style={{padding:"14px 16px",background:C.gray50,borderBottom:`1px solid ${C.gray100}`}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <select value={filterSettore} onChange={e=>setFilterSettore(e.target.value)} style={{
          padding:"7px 12px",borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,background:C.white,fontFamily:"inherit",
        }}>
          <option value="tutti">Tutti i Settori</option>
          {Object.keys(TERRITORY).map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTipo} onChange={e=>setFilterTipo(e.target.value)} style={{
          padding:"7px 12px",borderRadius:8,border:`1.5px solid ${C.gray200}`,fontSize:13,background:C.white,fontFamily:"inherit",
        }}>
          <option value="tutti">Tutti i Tipi</option>
          {MEETING_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button onClick={()=>setShowBookmarksOnly(b=>!b)} style={{
          padding:"7px 14px",borderRadius:8,border:`1.5px solid ${showBookmarksOnly?C.yellow:C.gray200}`,
          background:showBookmarksOnly?C.yellowLight:C.white,cursor:"pointer",fontSize:13,fontWeight:700,
          color:showBookmarksOnly?"#8B6000":C.gray700,fontFamily:"inherit",
        }}>★ Salvati</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:600,margin:"0 auto",minHeight:"100vh",background:C.gray50}}>
      {Nav}{TabBar}
      {view!=="map"&&Filters}

      {view==="list"&&(
        <div style={{padding:16}}>
          {filtered.length===0
            ? <div style={{textAlign:"center",padding:48,color:C.gray400}}>
                <div style={{fontSize:48,marginBottom:12}}>📭</div>
                <p>Nessun evento trovato</p>
              </div>
            : filtered.map(ev=>(
              <EventCard key={ev.id} ev={ev} bookmarks={bookmarks}
                onBookmark={toggleBookmark}
                onMap={()=>openMap(ev)}
                onContact={()=>setContactModal(ev)}/>
            ))
          }
        </div>
      )}

      {view==="calendar"&&(
        <div style={{padding:16}}>
          <Card style={{marginBottom:16}}>
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <IconBtn icon="‹" onClick={()=>{ if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} sm/>
              <span style={{fontWeight:800,fontSize:16,color:C.black}}>{monthNames[calMonth]} {calYear}</span>
              <IconBtn icon="›" onClick={()=>{ if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} sm/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,padding:"0 12px 12px"}}>
              {dayNames.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.gray400,padding:"4px 0"}}>{d}</div>)}
              {Array(getFirstDay(calYear,calMonth)).fill(null).map((_,i)=><div key={"e"+i}/>)}
              {Array(getDaysInMonth(calYear,calMonth)).fill(null).map((_,i)=>{
                const day=i+1;
                const dateStr=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const dayEvs = calEvents.filter(e=>e.data===dateStr);
                const isToday = new Date().toISOString().split("T")[0]===dateStr;
                return (
                  <div key={day} style={{
                    minHeight:44,borderRadius:10,padding:4,
                    background:isToday?C.blueLight:C.white,
                    border:`1.5px solid ${isToday?C.blue:C.gray100}`,
                    position:"relative",
                  }}>
                    <div style={{fontSize:12,fontWeight:isToday?800:500,color:isToday?C.blue:C.black,marginBottom:2}}>{day}</div>
                    {dayEvs.slice(0,2).map(e=>(
                      <div key={e.id} style={{
                        height:5,borderRadius:99,background:getMeetingColor(e.tipo),marginBottom:2,
                      }}/>
                    ))}
                    {dayEvs.length>2&&<div style={{fontSize:9,color:C.gray400}}>+{dayEvs.length-2}</div>}
                  </div>
                );
              })}
            </div>
          </Card>
          {/* Events this month */}
          <h3 style={{fontSize:14,fontWeight:800,color:C.gray700,marginBottom:12}}>
            Meeting di {monthNames[calMonth]}
          </h3>
          {calEvents.length===0
            ? <p style={{color:C.gray400,fontSize:14}}>Nessun meeting questo mese.</p>
            : calEvents.sort((a,b)=>a.data.localeCompare(b.data)).map(ev=>(
              <EventCard key={ev.id} ev={ev} bookmarks={bookmarks}
                onBookmark={toggleBookmark}
                onMap={()=>openMap(ev)}
                onContact={()=>setContactModal(ev)}/>
            ))
          }
        </div>
      )}

      {view==="map"&&(
        <div style={{padding:16}}>
          <h3 style={{fontSize:14,fontWeight:800,color:C.gray700,marginBottom:12}}>
            📍 Prossimi Meeting sulla Mappa
          </h3>
          <LeafletMap events={futureEvents} height={400}/>
          <div style={{marginTop:16,display:"flex",flexWrap:"wrap",gap:8}}>
            {MEETING_TYPES.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.gray700}}>
                <div style={{width:12,height:12,borderRadius:99,background:t.color}}/>
                {t.label}
              </div>
            ))}
          </div>
          <Card style={{marginTop:16,padding:14}}>
            <p style={{margin:0,fontSize:12,color:C.gray400,textAlign:"center"}}>
              🗺 La mappa dei confini dei Settori sarà disponibile dopo l'importazione dei dati GeoJSON territoriali.
            </p>
          </Card>
        </div>
      )}

      {/* Contact modal */}
      <Modal open={!!contactModal} onClose={()=>setContactModal(null)} title="Contatta il Responsabile">
        {contactModal&&(
          <div>
            <p style={{color:C.gray700,fontSize:14}}>Responsabile di <b>{contactModal.gruppo}</b>:</p>
            <p style={{fontWeight:800,fontSize:16,color:C.black}}>{contactModal.adminNome}</p>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <Btn full icon="📧" onClick={()=>window.open(`mailto:${contactModal.adminEmail}`)}>
                Email
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ADMIN VIEW
function AdminView({user,events,setEvents,onLogout}){
  const [view,setView]=useState("eventi");
  const [newEvModal,setNewEvModal]=useState(false);
  const [editEv,setEditEv]=useState(null);
  const [luogoModal,setLuogoModal]=useState(false);
  const [adminData,setAdminData]=useLocalStorage(`kosen_admin_${user.id}`,user);
  const [toast,setToast]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(null);

  function showToast(msg,type="success"){
    setToast({msg,type});
    setTimeout(()=>setToast(null),2500);
  }

  const myEvents = events.filter(e=>e.adminId===user.id);

  // Event form state
  const blank = {titolo:"",tipo:"studio",data:"",oraInizio:"",oraFine:"",luogoId:"",noteUrgenti:""};
  const [form,setForm]=useState(blank);
  const setF = (k,v)=>setForm(f=>({...f,[k]:v}));

  function openNew(){ setForm(blank); setEditEv(null); setNewEvModal(true); }
  function openEdit(ev){
    setForm({
      titolo:ev.titolo, tipo:ev.tipo, data:ev.data,
      oraInizio:ev.oraInizio, oraFine:ev.oraFine,
      luogoId: adminData.luoghi.findIndex(l=>l.indirizzo===ev.luogo.indirizzo),
      noteUrgenti:ev.noteUrgenti||"",
    });
    setEditEv(ev);
    setNewEvModal(true);
  }

  function saveEvent(){
    if(!form.titolo||!form.data||!form.oraInizio) return;
    const luogo = adminData.luoghi[parseInt(form.luogoId)||0] || adminData.luoghi[0];
    if(!luogo){ alert("Aggiungi almeno un luogo nel tuo profilo!"); return; }
    const ev = {
      id: editEv?.id||genId(),
      titolo:form.titolo, tipo:form.tipo,
      capitolo:user.capitolo, settore:user.settore, gruppo:user.gruppo,
      data:form.data, oraInizio:form.oraInizio, oraFine:form.oraFine,
      luogo, noteUrgenti:form.noteUrgenti,
      adminId:user.id, adminNome:adminData.name, adminEmail:adminData.email,
    };
    if(editEv){
      setEvents(es=>es.map(e=>e.id===ev.id?ev:e));
      showToast("Evento aggiornato!");
    } else {
      setEvents(es=>[...es,ev]);
      showToast("Evento creato!");
    }
    setNewEvModal(false);
  }

  function deleteEvent(id){
    setEvents(es=>es.filter(e=>e.id!==id));
    setDeleteConfirm(null);
    showToast("Evento eliminato","info");
  }

  // Luogo form
  const lBlank={nome:"",indirizzo:"",citofono:"",lat:"",lng:""};
  const [lForm,setLForm]=useState(lBlank);
  const setLF=(k,v)=>setLForm(f=>({...f,[k]:v}));

  function saveLuogo(){
    if(!lForm.nome||!lForm.indirizzo) return;
    const l={id:genId(),...lForm,lat:parseFloat(lForm.lat)||null,lng:parseFloat(lForm.lng)||null};
    setAdminData(d=>({...d,luoghi:[...(d.luoghi||[]),l]}));
    setLForm(lBlank);
    setLuogoModal(false);
    showToast("Luogo salvato!");
  }
  function deleteLuogo(id){
    setAdminData(d=>({...d,luoghi:d.luoghi.filter(l=>l.id!==id)}));
  }

  const Nav = (
    <div style={{
      background:`linear-gradient(135deg,${C.blue},#001E6E)`,
      padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>🪷</span>
        <div>
          <div style={{fontWeight:900,fontSize:15,color:C.white}}>Kosen Admin</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>
            {adminData.name} · {user.settore}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:4}}>
        <IconBtn icon="🚪" onClick={onLogout} color={C.yellow} title="Esci"/>
      </div>
    </div>
  );

  const TabBar = (
    <div style={{display:"flex",background:C.white,borderBottom:`1px solid ${C.gray100}`}}>
      {[["eventi","📋 I Miei Meeting"],["profilo","👤 Profilo & Luoghi"]].map(([v,l])=>(
        <button key={v} onClick={()=>setView(v)} style={{
          flex:1,padding:"13px 4px",border:"none",cursor:"pointer",background:"none",
          fontSize:13,fontWeight:view===v?800:500,color:view===v?C.blue:C.gray400,
          borderBottom:`3px solid ${view===v?C.blue:"transparent"}`,
        }}>{l}</button>
      ))}
    </div>
  );

  return (
    <div style={{maxWidth:600,margin:"0 auto",minHeight:"100vh",background:C.gray50}}>
      {Nav}{TabBar}

      {view==="eventi"&&(
        <div style={{padding:16}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <Btn icon="+" onClick={openNew}>Nuovo Meeting</Btn>
          </div>
          {myEvents.length===0
            ? <div style={{textAlign:"center",padding:48,color:C.gray400}}>
                <div style={{fontSize:48,marginBottom:12}}>📭</div>
                <p>Nessun meeting creato ancora</p>
                <Btn onClick={openNew}>Crea il primo meeting</Btn>
              </div>
            : myEvents.sort((a,b)=>a.data.localeCompare(b.data)).map(ev=>{
              const mt=getMeetingType(ev.tipo);
              const isPast = new Date(ev.data+"T12:00")<new Date();
              return (
                <Card key={ev.id} style={{marginBottom:12,opacity:isPast?.7:1}}>
                  <div style={{height:5,background:mt.color}}/>
                  <div style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
                          <Chip label={mt.label} color={mt.color} small/>
                          {isPast&&<Chip label="Passato" color={C.gray400} small/>}
                        </div>
                        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:800,color:C.black}}>{ev.titolo}</h3>
                        <p style={{margin:"0 0 2px",fontSize:13,color:C.gray700}}>
                          📅 {new Date(ev.data+"T12:00").toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short"})} · {ev.oraInizio}–{ev.oraFine}
                        </p>
                        <p style={{margin:0,fontSize:13,color:C.gray700}}>📍 {ev.luogo.nome}</p>
                        {ev.noteUrgenti&&<p style={{margin:"4px 0 0",fontSize:12,color:"#8B6000",fontWeight:700}}>⚡ {ev.noteUrgenti}</p>}
                      </div>
                      <div style={{display:"flex",gap:2}}>
                        <IconBtn icon="✏️" onClick={()=>openEdit(ev)} sm title="Modifica"/>
                        <IconBtn icon="🗑" onClick={()=>setDeleteConfirm(ev.id)} sm color={C.red} title="Elimina"/>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          }
        </div>
      )}

      {view==="profilo"&&(
        <div style={{padding:16}}>
          <Card style={{marginBottom:16,padding:20}}>
            <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:800,color:C.black}}>👤 Il Mio Profilo</h3>
            <div style={{display:"grid",gap:8}}>
              {[["Nome",adminData.name],["Email",adminData.email],["Capitolo",user.capitolo],["Settore",user.settore],["Gruppo",user.gruppo]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.gray100}`}}>
                  <span style={{fontSize:13,color:C.gray400,fontWeight:600}}>{k}</span>
                  <span style={{fontSize:13,color:C.black,fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.black}}>📍 Miei Luoghi</h3>
            <Btn sm onClick={()=>setLuogoModal(true)} icon="+">Aggiungi</Btn>
          </div>
          {(adminData.luoghi||[]).map(l=>(
            <Card key={l.id} style={{marginBottom:10,padding:"12px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <p style={{margin:"0 0 3px",fontWeight:800,fontSize:14,color:C.black}}>{l.nome}</p>
                  <p style={{margin:"0 0 2px",fontSize:13,color:C.gray700}}>📍 {l.indirizzo}</p>
                  {l.citofono&&<p style={{margin:0,fontSize:13,color:C.gray700}}>🔔 {l.citofono}</p>}
                  {l.lat&&<p style={{margin:"2px 0 0",fontSize:11,color:C.gray400}}>GPS: {l.lat}, {l.lng}</p>}
                </div>
                <IconBtn icon="🗑" onClick={()=>deleteLuogo(l.id)} sm color={C.red}/>
              </div>
            </Card>
          ))}
          {(adminData.luoghi||[]).length===0&&(
            <p style={{color:C.gray400,fontSize:14,textAlign:"center",padding:24}}>Nessun luogo salvato. Aggiungine uno!</p>
          )}
        </div>
      )}

      {/* New/Edit Event Modal */}
      <Modal open={newEvModal} onClose={()=>setNewEvModal(false)} title={editEv?"Modifica Meeting":"Nuovo Meeting"} wide>
        <Field label="Capitolo" value={user.capitolo} readOnly/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Settore" value={user.settore} readOnly/>
          <Field label="Gruppo" value={user.gruppo} readOnly/>
        </div>
        <Field label="Titolo / Argomento" value={form.titolo} onChange={e=>setF("titolo",e.target.value)} required placeholder="es. Studio del Gosho – Cap. 5"/>
        <Field label="Tipologia" type="select" value={form.tipo} onChange={e=>setF("tipo",e.target.value)}
          options={MEETING_TYPES.map(t=>({value:t.id,label:t.label}))}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <Field label="Data" type="date" value={form.data} onChange={e=>setF("data",e.target.value)} required/>
          <Field label="Inizio" type="time" value={form.oraInizio} onChange={e=>setF("oraInizio",e.target.value)} required/>
          <Field label="Fine" type="time" value={form.oraFine} onChange={e=>setF("oraFine",e.target.value)}/>
        </div>
        <Field label="Luogo" type="select" value={form.luogoId} onChange={e=>setF("luogoId",e.target.value)}
          options={(adminData.luoghi||[]).map((l,i)=>({value:i,label:l.nome+" – "+l.indirizzo}))}/>
        {form.luogoId!==""&&adminData.luoghi[parseInt(form.luogoId)]?.citofono&&(
          <div style={{background:C.blueLight,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.blue}}>
            🔔 Citofono: <b>{adminData.luoghi[parseInt(form.luogoId)].citofono}</b>
          </div>
        )}
        <div style={{background:C.yellowLight,border:`2px dashed ${C.yellow}`,borderRadius:12,padding:14,marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:800,color:"#8B6000",marginBottom:6}}>⚡ NOTE URGENTI (visibili in evidenza)</label>
          <textarea value={form.noteUrgenti} onChange={e=>setF("noteUrgenti",e.target.value)}
            rows={2} placeholder="es. Lavori in corso, parcheggiare in via X…"
            style={{width:"100%",border:"none",background:"transparent",resize:"vertical",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setNewEvModal(false)}>Annulla</Btn>
          <Btn onClick={saveEvent}>{editEv?"Salva Modifiche":"Crea Meeting"}</Btn>
        </div>
      </Modal>

      {/* Add location modal */}
      <Modal open={luogoModal} onClose={()=>setLuogoModal(false)} title="Aggiungi Luogo">
        <Field label="Nome del Luogo" value={lForm.nome} onChange={e=>setLF("nome",e.target.value)} required placeholder="es. Sala Riunioni, Casa mia…"/>
        <Field label="Indirizzo Completo" value={lForm.indirizzo} onChange={e=>setLF("indirizzo",e.target.value)} required placeholder="Via Roma 1, Milano"/>
        <Field label="Citofono / Istruzioni accesso" value={lForm.citofono} onChange={e=>setLF("citofono",e.target.value)} placeholder="es. Scala B, Int. 4"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Latitudine GPS" value={lForm.lat} onChange={e=>setLF("lat",e.target.value)} placeholder="45.4642"/>
          <Field label="Longitudine GPS" value={lForm.lng} onChange={e=>setLF("lng",e.target.value)} placeholder="9.1900"/>
        </div>
        <p style={{fontSize:11,color:C.gray400,marginBottom:16}}>💡 Puoi trovare le coordinate aprendo Google Maps e cliccando tasto destro sulla posizione.</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setLuogoModal(false)}>Annulla</Btn>
          <Btn onClick={saveLuogo}>Salva Luogo</Btn>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Conferma eliminazione">
        <p style={{color:C.gray700,fontSize:14,marginBottom:20}}>Sei sicuro di voler eliminare questo meeting? L'operazione non è reversibile.</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setDeleteConfirm(null)}>Annulla</Btn>
          <Btn variant="danger" onClick={()=>deleteEvent(deleteConfirm)}>Elimina</Btn>
        </div>
      </Modal>

      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
}

// SUPER USER VIEW
function SuperView({user,events,setEvents,onLogout}){
  const [admins,setAdmins]=useLocalStorage("kosen_admins",SEED_ADMINS);
  const [view,setView]=useState("dashboard");
  const [newAdminModal,setNewAdminModal]=useState(false);
  const [toast,setToast]=useState(null);
  const [form,setForm]=useState({name:"",email:"",password:"",capitolo:CHAPTER,settore:Object.keys(TERRITORY)[0],gruppo:""});
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  function showToast(msg,type="success"){ setToast({msg,type}); setTimeout(()=>setToast(null),2500); }

  const gruppiPerSettore = TERRITORY[form.settore]||[];

  function createAdmin(){
    if(!form.name||!form.email||!form.password||!form.gruppo) return;
    const a={id:genId(),...form,luoghi:[]};
    setAdmins(ads=>[...ads,a]);
    setNewAdminModal(false);
    setForm({name:"",email:"",password:"",capitolo:CHAPTER,settore:Object.keys(TERRITORY)[0],gruppo:""});
    showToast("Amministratore creato!");
  }

  function deleteAdmin(id){
    setAdmins(ads=>ads.filter(a=>a.id!==id));
    showToast("Amministratore rimosso","info");
  }

  const totalEvents = events.length;
  const futureEvents = events.filter(e=>new Date(e.data+"T12:00")>=new Date()).length;

  return (
    <div style={{maxWidth:700,margin:"0 auto",minHeight:"100vh",background:C.gray50}}>
      <div style={{
        background:`linear-gradient(135deg,${C.red},#8B0000)`,
        padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>⚡</span>
          <div>
            <div style={{fontWeight:900,fontSize:15,color:C.white}}>Super User Panel</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>Gestione Completa</div>
          </div>
        </div>
        <IconBtn icon="🚪" onClick={onLogout} color={C.yellow}/>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,padding:16}}>
        {[[admins.length,"Admin","👥",C.blue],[futureEvents,"Meeting Futuri","📅",C.yellow],[Object.keys(TERRITORY).length,"Settori","🗺",C.red]].map(([n,l,ic,c])=>(
          <Card key={l} style={{padding:"16px 12px",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:4}}>{ic}</div>
            <div style={{fontSize:26,fontWeight:900,color:c}}>{n}</div>
            <div style={{fontSize:11,color:C.gray400,fontWeight:700}}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Admin list */}
      <div style={{padding:"0 16px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.black}}>👥 Amministratori</h3>
          <Btn sm icon="+" onClick={()=>setNewAdminModal(true)}>Nuovo Admin</Btn>
        </div>
        {admins.map(a=>(
          <Card key={a.id} style={{marginBottom:10,padding:"12px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{margin:"0 0 3px",fontWeight:800,fontSize:14,color:C.black}}>{a.name}</p>
                <p style={{margin:"0 0 2px",fontSize:13,color:C.gray700}}>✉️ {a.email}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                  <Chip label={a.capitolo} color={C.blue} small/>
                  <Chip label={a.settore} color={C.red} small/>
                  <Chip label={a.gruppo} color={C.gray700} small/>
                </div>
              </div>
              <IconBtn icon="🗑" onClick={()=>deleteAdmin(a.id)} sm color={C.red}/>
            </div>
          </Card>
        ))}

        {/* All events */}
        <h3 style={{margin:"20px 0 12px",fontSize:15,fontWeight:800,color:C.black}}>📋 Tutti i Meeting ({totalEvents})</h3>
        {events.sort((a,b)=>a.data.localeCompare(b.data)).map(ev=>{
          const mt=getMeetingType(ev.tipo);
          return (
            <Card key={ev.id} style={{marginBottom:10}}>
              <div style={{height:4,background:mt.color}}/>
              <div style={{padding:"10px 14px"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:4}}>
                  <Chip label={mt.label} color={mt.color} small/>
                  <Chip label={ev.settore} color={C.blue} small/>
                </div>
                <p style={{margin:"0 0 2px",fontWeight:800,fontSize:14,color:C.black}}>{ev.titolo}</p>
                <p style={{margin:0,fontSize:13,color:C.gray700}}>
                  📅 {ev.data} · {ev.oraInizio}–{ev.oraFine} · {ev.luogo.nome}
                </p>
                <p style={{margin:"4px 0 0",fontSize:12,color:C.gray400}}>By: {ev.adminNome}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* New Admin Modal */}
      <Modal open={newAdminModal} onClose={()=>setNewAdminModal(false)} title="Crea Amministratore">
        <Field label="Nome Completo" value={form.name} onChange={e=>setF("name",e.target.value)} required/>
        <Field label="Email" type="email" value={form.email} onChange={e=>setF("email",e.target.value)} required/>
        <Field label="Password temporanea" type="password" value={form.password} onChange={e=>setF("password",e.target.value)} required/>
        <Field label="Capitolo" value={form.capitolo} readOnly/>
        <Field label="Settore" type="select" value={form.settore} onChange={e=>{setF("settore",e.target.value);setF("gruppo","");}}
          options={Object.keys(TERRITORY).map(s=>({value:s,label:s}))}/>
        <Field label="Gruppo" type="select" value={form.gruppo} onChange={e=>setF("gruppo",e.target.value)}
          options={[{value:"",label:"— Seleziona —"},...(TERRITORY[form.settore]||[]).map(g=>({value:g,label:g}))]}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setNewAdminModal(false)}>Annulla</Btn>
          <Btn onClick={createAdmin}>Crea Admin</Btn>
        </div>
      </Modal>

      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [session,setSession]=useLocalStorage("kosen_session",null);
  const [events,setEvents]=useLocalStorage("kosen_events",SEED_EVENTS);

  function handleLogin(user){ setSession(user); }
  function handleLogout(){ setSession(null); }

  if(!session) return <LoginScreen onLogin={handleLogin}/>;
  if(session.role==="super") return <SuperView user={session} events={events} setEvents={setEvents} onLogout={handleLogout}/>;
  if(session.role==="admin") return <AdminView user={session} events={events} setEvents={setEvents} onLogout={handleLogout}/>;
  return <UserView user={session} events={events} onLogout={handleLogout}/>;
}
