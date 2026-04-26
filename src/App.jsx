import { useState, useEffect, useCallback, useRef } from "react";
import {
  Phone, Mail, Search, Plus, Copy, Check,
  Download, Upload, Users, TrendingUp, Calendar,
  MapPin, User, X, ArrowRight, AlertCircle,
  ChevronDown, ChevronUp, Trophy, Flame, Crown, Zap, Target, Edit3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ─── Firebase ─────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCN4YkWkCtCO9CaijAQiTpXx5qlzDrqfYc",
  authDomain: "outreach-hq-8675d.firebaseapp.com",
  projectId: "outreach-hq-8675d",
  storageBucket: "outreach-hq-8675d.firebasestorage.app",
  messagingSenderId: "831502627079",
  appId: "1:831502627079:web:e44984ca9432960d7115a2",
  measurementId: "G-2D850Z2497"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const writeTimers = {};
const saveToFirestore = (key, data) => {
  if (writeTimers[key]) clearTimeout(writeTimers[key]);
  writeTimers[key] = setTimeout(() => {
    setDoc(doc(db, "outreach", key), { data }, { merge: true }).catch(console.error);
  }, 500);
};

// ─── Theme ────────────────────────────────────────
const K = {
  bg:'#06080f', card:'#0c0f1d', cardHover:'#111530',
  text:'#e8eaf4', muted:'#5a5f82', accent:'#4f8fff',
  border:'#161a30', green:'#34d399', yellow:'#fbbf24', red:'#f87171',
  surface:'#090b16', orange:'#f59e0b', pilot:'#f59e0b', learn:'#6b7094',
};

const STATUS_CFG = {
  'ikke-kontaktet':   { label:'Ikke kontaktet',   color:K.muted,  bg:'#14162a', icon:'○' },
  'sendt-epost':      { label:'Sendt epost',       color:K.yellow, bg:'#1f1c0e', icon:'✉' },
  'interessert':      { label:'Interessert',        color:K.green,  bg:'#0a1f19', icon:'✓' },
  'møte-booket':      { label:'Møte booket',        color:K.green,  bg:'#0a1f19', icon:'★' },
  'gatekeeper':       { label:'Gatekeeper',         color:K.yellow, bg:'#1f1c0e', icon:'⚑' },
  'takket-nei':       { label:'Takket nei',         color:K.red,    bg:'#1f0e0e', icon:'✕' },
  'mobilsvar':        { label:'Mobilsvar',          color:K.yellow, bg:'#1f1c0e', icon:'☎' },
  'ingen-svar-epost': { label:'Ingen svar (epost)', color:K.yellow, bg:'#1f1c0e', icon:'…' },
  'oppfølging':       { label:'Oppfølging',         color:K.accent, bg:'#0e1225', icon:'↻' },
};

const ROLE_CFG = {
  pilot:   { label:'Pilot',   color:K.pilot, bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', icon:'🎯' },
  learn:   { label:'Læring',  color:K.learn, bg:'rgba(107,112,148,0.1)', border:'rgba(107,112,148,0.2)', icon:'📚' },
  dropped: { label:'Droppet', color:K.red,   bg:'rgba(248,113,113,0.06)', border:'rgba(248,113,113,0.15)', icon:'—' },
};

const CATEGORIES = ['Regnskap','Jus','Psykologi','Tannlege','Fysio','Frisør','Annet'];
const DISCOVERY_QS = [
  'Hvordan ser en vanlig mandag ut hos dere?',
  'Når tok noe admin lengre tid enn det burde?',
  'Hvor mange timer i uka går til det?',
  'Har dere prøvd å løse det? Hva skjedde?',
  'Hvem internt ville måttet være med?',
];
const mkId = () => Math.random().toString(36).slice(2,10);

// Role assignment based on category + status
function autoRole(c) {
  if (c.category === 'Frisør') return 'dropped';
  if (c.category === 'Regnskap' || c.category === 'Jus') return 'pilot';
  if (['Tannlege','Fysio','Psykologi'].includes(c.category)) return 'learn';
  return 'pilot';
}

const DEFAULT_CANDIDATES = [
  // PILOT — Regnskap
  { id:mkId(), name:'Aketo Regnskap', dl:'Marius Fjellheim Nyman', phone:'92 35 51 36', email:'', category:'Regnskap', channel:'telefon', planned:'Man 09:30', address:'Inkognitogata 33A', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot' },
  { id:mkId(), name:'Unikum Regnskap', dl:'Truls Uppheim', phone:'', email:'post@unikumregnskap.no', category:'Regnskap', channel:'epost', planned:'Man 10:30', address:'Munkedamsveien 45', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot' },
  { id:mkId(), name:'Ecora Regnskap', dl:'Nam Vo', phone:'90 09 74 10', email:'post@ecora.no', category:'Regnskap', channel:'epost', planned:'', address:'', owner:'Ulrik', status:'sendt-epost', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[{action:'Sendt epost',date:'2026-04-22',by:'Ulrik'}], lastContacted:'2026-04-22', lastUpdatedBy:'Ulrik', lastUpdatedAt:'2026-04-22', role:'pilot' },
  // NEW Regnskap
  { id:mkId(), name:'Sagene Regnskap AS', dl:'Verifiser på proff.no', phone:'', email:'post@sagene-regnskap.no', category:'Regnskap', channel:'epost', planned:'', address:'Sagene', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'Lite byrå, sentralt på Sagene, sannsynlig 2-4 ansatte', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot', needsVerify:true },
  { id:mkId(), name:'Frogner Regnskapsbyrå', dl:'Verifiser på proff.no', phone:'', email:'', category:'Regnskap', channel:'telefon', planned:'', address:'Frogner', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'Etablert vest-Oslo-byrå, antatt 4-6 ansatte', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot', needsVerify:true },
  { id:mkId(), name:'Grünerløkka Regnskap AS', dl:'Verifiser på proff.no', phone:'', email:'', category:'Regnskap', channel:'epost', planned:'', address:'Grünerløkka', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'Yngre demografi, kjent for å betjene småbedrifter og kafeer', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot', needsVerify:true },
  { id:mkId(), name:'Aksel Regnskap', dl:'Aksel (eier-drevet)', phone:'', email:'post@akselregnskap.no', category:'Regnskap', channel:'epost', planned:'', address:'Oslo', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'Solo eller 2-personers, eier-navngitt byrå', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot', needsVerify:true },
  { id:mkId(), name:'Vesta Regnskap AS', dl:'Verifiser', phone:'', email:'', category:'Regnskap', channel:'telefon', planned:'', address:'Oslo', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'Plassholder — erstatt med faktisk lokal kandidat fra proff.no', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot', needsVerify:true },
  // PILOT — Jus
  { id:mkId(), name:'Suleiman & Co', dl:'Verifiser på proff.no', phone:'21 39 04 54', email:'', category:'Jus', channel:'telefon', planned:'Tirs 09:30', address:'C.J. Hambros plass 2d', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'pilot' },
  // LEARN — Helse
  { id:mkId(), name:'Kognito psykisk helse', dl:'Sten-Rune Roland', phone:'23 90 50 70', email:'post@kognito.no', category:'Psykologi', channel:'epost', planned:'Man 10:30', address:'Tullins gate 2', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'learn' },
  { id:mkId(), name:'Lian & Fjell', dl:'Erlend / Sofie', phone:'21 45 60 30', email:'post@lianogfjell.no', category:'Psykologi', channel:'epost', planned:'Tirs 10:30', address:'Keysers gate 5', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'learn' },
  { id:mkId(), name:'Sanner Tannklinikk', dl:'Sjekk proff.no', phone:'22 37 41 74', email:'', category:'Tannlege', channel:'telefon', planned:'Man 09:30', address:'Sannergata 38', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'learn' },
  { id:mkId(), name:'Grünerløkkas Hus Tannlegesenter', dl:'Alexander Salvador', phone:'22 38 20 18', email:'post@grunerlokkashus.no', category:'Tannlege', channel:'epost', planned:'Man 10:45', address:'Schleppegrells gt. 32', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'learn' },
  { id:mkId(), name:'Oslo Sentrum Tannklinikk', dl:'Zlatko Petrovic', phone:'21 38 60 65', email:'post@oslosentrumtannklinikk.no', category:'Tannlege', channel:'epost', planned:'', address:'', owner:'Ulrik', status:'sendt-epost', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[{action:'Sendt epost',date:'2026-04-22',by:'Ulrik'}], lastContacted:'2026-04-22', lastUpdatedBy:'Ulrik', lastUpdatedAt:'2026-04-22', role:'learn' },
  { id:mkId(), name:'Løkkaklinikken', dl:'Karianne', phone:'41 84 79 29', email:'', category:'Fysio', channel:'telefon', planned:'Tirs 09:30', address:'Thorvald Meyers gt. 18', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'learn' },
  { id:mkId(), name:'Behandlerverket', dl:'Sigbjørn / Bent Roar', phone:'53 75 55 55', email:'post@behandlerverket.no', category:'Fysio', channel:'epost', planned:'Tirs 11:00', address:'Calmeyers gate 8B', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'learn' },
  // DROPPED
  { id:mkId(), name:'Saxofón Frisør', dl:'Simon / Adam', phone:'45 55 58 98', email:'', category:'Frisør', channel:'epost', planned:'', address:'Fredensborgveien 22A', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'Frisør droppet — smalere fokus', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, role:'dropped' },
  { id:mkId(), name:'Sentralstasjonen Fysio', dl:'Lene Bjoland Harstad', phone:'22 40 35 70', email:'', category:'Fysio', channel:'telefon', planned:'', address:'', owner:'Ulrik', status:'takket-nei', fitScore:0, painPoints:['','',''], nextStep:'', notes:'Sa nei — respektert', gatekeeper:'', callAttempts:0, history:[{action:'Takket nei',date:'2026-04-22',by:'Ulrik'}], lastContacted:'2026-04-22', lastUpdatedBy:'Ulrik', lastUpdatedAt:'2026-04-22', role:'dropped' },
];

// ─── Migration: add role to existing data ─────────
function migrateData(data) {
  let changed = false;
  const migrated = data.map(c => {
    if (!c.role) {
      changed = true;
      // Special cases
      if (c.name === 'Saxofón Frisør') return { ...c, role:'dropped' };
      if (c.name === 'Sentralstasjonen Fysio') return { ...c, role:'dropped' };
      return { ...c, role: autoRole(c) };
    }
    return c;
  });
  return { data: migrated, changed };
}

// ─── Helpers ──────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = d => { if(!d) return '—'; const p=d.split('-'); return `${p[2]}.${p[1]}`; };
const firstName = name => (name||'').split(/[\s\/]/)[0];
const needsVerify = c => c.needsVerify || (c.dl||'').toLowerCase().includes('verifiser') || (c.phone||'')==='';

// ─── Tiny Components ─────────────────────────────
function Badge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['ikke-kontaktet'];
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, fontSize:12, color:cfg.color, background:cfg.bg, fontWeight:600, whiteSpace:'nowrap', border:`1px solid ${cfg.color}22` }}>
    <span style={{fontSize:11}}>{cfg.icon}</span> {cfg.label}
  </span>;
}

function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role] || ROLE_CFG.pilot;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:8, fontSize:11, color:cfg.color, background:cfg.bg, fontWeight:700, border:`1px solid ${cfg.border}`, textTransform:'uppercase', letterSpacing:0.5 }}>
    {cfg.icon} {cfg.label}
  </span>;
}

function CopyBtn({ text }) {
  const [ok, set] = useState(false);
  return <button onClick={() => { navigator.clipboard?.writeText(text).then(() => { set(true); setTimeout(()=>set(false),2000); }); }}
    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:10, border:`1px solid ${ok?K.green:K.border}`, background:ok?'rgba(52,211,153,0.12)':K.card, color:ok?K.green:K.text, cursor:'pointer', fontSize:13, fontWeight:500, transition:'all .2s' }}>
    {ok ? <><Check size={14}/> Kopiert!</> : <><Copy size={14}/> Kopier</>}
  </button>;
}

function Section({ title, icon, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return <div style={{ marginBottom:20, background:K.card, borderRadius:14, border:`1px solid ${K.border}`, overflow:'hidden' }}>
    <button onClick={() => setOpen(!open)} style={{ width:'100%', padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'transparent', border:'none', cursor:'pointer', color:K.text }}>
      <span style={{ display:'flex', alignItems:'center', gap:10, fontSize:15, fontWeight:700 }}>{icon} {title}</span>
      {open ? <ChevronUp size={18} color={K.muted}/> : <ChevronDown size={18} color={K.muted}/>}
    </button>
    {open && <div style={{ padding:'0 22px 20px' }}>{children}</div>}
  </div>;
}

function VerifyBanner() {
  return <div style={{ padding:'10px 16px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, marginBottom:16, display:'flex', alignItems:'center', gap:10, fontSize:13, color:K.yellow, fontWeight:600 }}>
    <AlertCircle size={16}/> VERIFISER PÅ PROFF.NO FØR KONTAKT
  </div>;
}

// ─── Email Gen (role-aware) ───────────────────────
function genEmail(c, user, type) {
  const fn = firstName(c.dl), u = user||'Elian';
  if (type==='interessert') return `Hei ${fn},\n\nBare en rask bekreftelse på at vi snakkes [DAG] kl [TID]. Jeg tar med kaffe og spørsmål — ingenting annet.\n\nSes da!\n\n${u}`;
  if (type==='møte-booket') return `Hei ${fn},\n\nTakk for praten. Det du sa om [KONKRET DETALJ] satte fingeren på noe vi skal grave i.\n\nIngen pitch, ingen vedlegg — bare en takk.\n\n${u}`;
  if (type==='takket-nei') return `Hei ${fn},\n\nTakk for at du var rett frem. Kort spørsmål: da du sa dere ikke trenger det — var det fordi dere har løst det annerledes, eller fordi det rett og slett ikke er et problem hos dere? Spør bare fordi jeg lærer av hvert svar.\n\n${u}`;

  // LEARN email (helse) — eksplisitt ærlig
  if (c.role === 'learn') {
    return `Hei ${fn},\n\nJeg heter ${u}, er 20 år, og prøver å forstå bransjen før vi velger hvor vi skal bygge. Vi har faktisk ikke noen plan om å selge dere noe — vi er bare nysgjerrige på hverdagen.\n\nKonkret: vi snakker med folk som driver ${c.category?.toLowerCase()||'små'}praksiser i Oslo for å lære hvordan admin-arbeidet ser ut, og hva som tar mest tid.\n\nHar du 15 minutter en dag denne uka? Gjerne over en kaffe i nærheten av ${c.address||'sentrum'}.\n\n${u}`;
  }

  // PILOT email (regnskap/jus) — fokusert på unntakshåndtering
  return `Hei ${fn},\n\nJeg heter ${u}, er 20 år, og prøver å forstå hvordan hverdagen faktisk ser ut i et ${c.category?.toLowerCase()||'lite'} byrå. Vi selger ingenting enda — vi prøver å forstå.\n\nVi ser på unntakshåndtering og dokumentflyt — manglende dokumentasjon, orgnummeroppslag, ruting av avvik. Ikke autonom bokføring — det fikser Tripletex selv. Vi prøver å forstå hvor smerten faktisk ligger.\n\nHar du 15 minutter en dag denne uka? Gjerne over en kaffe i nærheten av ${c.address||'sentrum'}.\n\n${u}`;
}

// ─── XP System ────────────────────────────────────
function getXP(candidates, person) {
  let xp = 0;
  candidates.filter(c => c.owner === person).forEach(c => {
    if (c.status === 'sendt-epost') xp += 10;
    if (c.status === 'interessert') xp += 30;
    if (c.status === 'møte-booket') xp += 50;
    if (c.status === 'gatekeeper') xp += 5;
    if (c.status === 'takket-nei') xp += 8;
    if (c.status === 'mobilsvar') xp += 3;
    if (c.status === 'ingen-svar-epost') xp += 5;
    if (c.status === 'oppfølging') xp += 15;
    if (c.fitScore > 0) xp += c.fitScore;
    if (c.painPoints?.some(p => p.trim())) xp += 10;
    if (c.notes?.trim()) xp += 5;
  });
  return xp;
}
function getLevel(xp) {
  if (xp >= 500) return { level:5, title:'Outreach-maskin', next:999, emoji:'👑' };
  if (xp >= 300) return { level:4, title:'Samtalestarter', next:500, emoji:'🔥' };
  if (xp >= 150) return { level:3, title:'Telefon-kriger', next:300, emoji:'⚡' };
  if (xp >= 50)  return { level:2, title:'Nysgjerrig', next:150, emoji:'💡' };
  return { level:1, title:'Nybegynner', next:50, emoji:'🌱' };
}
function getStreak(candidates, person) {
  const dates = [...new Set(candidates.filter(c => c.owner===person && c.lastContacted).map(c => c.lastContacted))].sort().reverse();
  if (!dates.length) return 0;
  let streak = 0; const d = new Date();
  for (let i = 0; i < 30; i++) {
    const ds = d.toISOString().slice(0,10);
    if (dates.includes(ds)) { streak++; d.setDate(d.getDate()-1); }
    else if (i === 0) { d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

// ═══════════════════════════════════════════════════
export default function OutreachHQ() {
  const [identity, setIdentity] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pilot');
  const [showDropped, setShowDropped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [wantToWork, setWantToWork] = useState({});
  const [synced, setSynced] = useState(false);
  const [detailTab, setDetailTab] = useState('info');
  const [wedge, setWedge] = useState(null);
  const [editWedge, setEditWedge] = useState(false);
  const skipNextSync = useRef(false);

  useEffect(() => { try { const s = localStorage.getItem('outreach:identity'); if(s) setIdentity(s); } catch(e){} }, []);

  // Load wedge statement
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "outreach", "wedge"), (snap) => {
      const d = snap.data();
      setWedge(d?.data || 'Vi hjelper små regnskapsbyråer fjerne unntakshåndtering\nslik at de kan fokusere på faktisk regnskapsarbeid.');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "outreach", "candidates"), (snap) => {
      if (skipNextSync.current) { skipNextSync.current = false; return; }
      const d = snap.data();
      if (d?.data && Array.isArray(d.data) && d.data.length > 0) {
        // Migrate: add role if missing
        const { data: migrated, changed } = migrateData(d.data);
        setCandidates(migrated);
        if (changed) saveToFirestore('candidates', migrated);
      }
      else if (!snap.exists()) { setCandidates(DEFAULT_CANDIDATES); saveToFirestore('candidates', DEFAULT_CANDIDATES); }
      setLoading(false); setSynced(true);
    }, () => { setCandidates(DEFAULT_CANDIDATES); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "outreach", "wanttowork"), (snap) => { const d = snap.data(); if(d?.data) setWantToWork(d.data); });
    return () => unsub();
  }, []);

  const saveCandidates = useCallback((data) => { setCandidates(data); skipNextSync.current = true; saveToFirestore('candidates', data); }, []);
  const saveIdentity = (name) => { setIdentity(name); try { localStorage.setItem('outreach:identity', name); } catch(e){} };

  const updateCandidate = useCallback((id, updates) => {
    setCandidates(prev => {
      const next = prev.map(c => {
        if (c.id !== id) return c;
        const u = { ...c, ...updates, lastUpdatedBy: identity, lastUpdatedAt: today() };
        if (updates.status && updates.status !== c.status) {
          u.history = [...(c.history||[]), { action: STATUS_CFG[updates.status]?.label||updates.status, date: today(), by: identity }];
          u.lastContacted = today();
        }
        return u;
      });
      skipNextSync.current = true; saveToFirestore('candidates', next); return next;
    });
  }, [identity]);

  const addCandidate = (c) => { saveCandidates([...candidates, c]); setShowAdd(false); };

  const saveWedge = (text) => { setWedge(text); saveToFirestore('wedge', text); };

  // ─── Identity Picker ───────────────────────────
  if (!identity) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`radial-gradient(ellipse at 50% 20%, #0d1230, ${K.bg})`, fontFamily:'"Inter",-apple-system,sans-serif' }}>
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontSize:48, fontWeight:900, color:K.text, marginBottom:4, letterSpacing:-2 }}>Outreach HQ</div>
        <p style={{ color:K.muted, fontSize:16, marginBottom:48 }}>Hvem er du?</p>
        <div style={{ display:'flex', gap:20, justifyContent:'center' }}>
          {['Elian','Ulrik'].map(n => (
            <button key={n} onClick={() => saveIdentity(n)} style={{
              padding:'22px 56px', borderRadius:16, border:`1px solid rgba(79,143,255,0.4)`, background:'rgba(79,143,255,0.06)',
              color:K.accent, fontSize:22, cursor:'pointer', fontWeight:700, transition:'all .3s',
            }}
            onMouseEnter={e => { e.target.style.background='rgba(79,143,255,0.15)'; e.target.style.boxShadow='0 0 40px rgba(79,143,255,0.2)'; }}
            onMouseLeave={e => { e.target.style.background='rgba(79,143,255,0.06)'; e.target.style.boxShadow='none'; }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading || !candidates) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:K.bg, fontFamily:'"Inter",-apple-system,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:`3px solid ${K.border}`, borderTopColor:K.accent, borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 18px' }}/>
        <p style={{ color:K.muted, fontSize:15 }}>Laster...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ─── Computed ──────────────────────────────────
  const F = '"Inter",-apple-system,sans-serif';
  const active = candidates.find(c => c.id === activeId);
  const pilots = candidates.filter(c => c.role === 'pilot');
  const learns = candidates.filter(c => c.role === 'learn');
  const pilotContacted = pilots.filter(c => c.status !== 'ikke-kontaktet');
  const pilotInterested = pilots.filter(c => c.status === 'interessert' || c.status === 'møte-booket');
  const pilotMeetings = pilots.filter(c => c.status === 'møte-booket');
  const pilotHitRate = pilotContacted.length > 0 ? Math.round((pilotInterested.length / pilotContacted.length) * 100) : 0;
  const learnContacted = learns.filter(c => c.status !== 'ikke-kontaktet');
  const learnKeywords = learns.filter(c => c.painPoints?.some(p => p.trim())).length;
  const nextUp = candidates.find(c => c.status === 'ikke-kontaktet' && c.owner === identity && c.role !== 'dropped');

  // Filter logic
  const filtered = candidates.filter(c => {
    if (c.role === 'dropped' && !showDropped) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.dl.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'pilot') return c.role === 'pilot';
    if (filter === 'pilot-aktive') return c.role === 'pilot' && (c.status === 'ikke-kontaktet' || c.status === 'sendt-epost' || c.status === 'mobilsvar' || c.status === 'ingen-svar-epost' || c.status === 'oppfølging');
    if (filter === 'pilot-interessert') return c.role === 'pilot' && (c.status === 'interessert' || c.status === 'møte-booket');
    if (filter === 'learn') return c.role === 'learn';
    if (filter === 'mine') return c.owner === identity && c.role !== 'dropped';
    if (filter === 'alle') return true;
    return c.role !== 'dropped';
  });

  const industryStats = CATEGORIES.filter(c => c !== 'Annet' && c !== 'Frisør').map(cat => {
    const inCat = candidates.filter(c => c.category === cat && c.role !== 'dropped');
    const cc = inCat.filter(c => c.status !== 'ikke-kontaktet');
    const ci = inCat.filter(c => c.status === 'interessert' || c.status === 'møte-booket');
    const af = inCat.filter(c => c.fitScore > 0).reduce((s,c) => s + c.fitScore, 0) / (inCat.filter(c=>c.fitScore>0).length || 1);
    return { cat, total:inCat.length, contacted:cc.length, interested:ci.length, avgFit:Math.round(af*10)/10, want:wantToWork[cat]||false, isPilot:cat==='Regnskap'||cat==='Jus' };
  }).filter(s => s.total > 0);

  const thisWeek = candidates.filter(c => c.lastContacted && new Date(c.lastContacted) >= new Date(Date.now()-7*24*60*60*1000));
  const daysSince = (() => { const dates = candidates.filter(c=>c.lastContacted).map(c=>new Date(c.lastContacted)); return dates.length ? Math.floor((Date.now()-Math.max(...dates))/(24*60*60*1000)) : 99; })();

  const exportData = () => { const d=JSON.stringify({candidates,wantToWork,wedge,exportDate:today()},null,2); const b=new Blob([d],{type:'application/json'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`outreach-backup-${today()}.json`; a.click(); URL.revokeObjectURL(u); };
  const importData = () => { const inp=document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange=async(e)=>{const f=e.target.files[0]; if(!f) return; try{const d=JSON.parse(await f.text()); if(d.candidates) saveCandidates(d.candidates); if(d.wantToWork){setWantToWork(d.wantToWork);saveToFirestore('wanttowork',d.wantToWork);} if(d.wedge) saveWedge(d.wedge);}catch(err){console.error(err);}}; inp.click(); };

  const tabBtn = (t) => ({ padding:'10px 20px', borderRadius:10, border:'none', cursor:'pointer', fontSize:14, fontWeight:tab===t?700:500, background:tab===t?'rgba(79,143,255,0.12)':'transparent', color:tab===t?K.accent:K.muted, transition:'all .2s', whiteSpace:'nowrap', fontFamily:F });
  const inp = { width:'100%', padding:'12px 16px', borderRadius:10, border:`1px solid ${K.border}`, background:K.surface, fontSize:14, fontFamily:F, color:K.text, boxSizing:'border-box', outline:'none', transition:'border-color .2s' };
  const focusIn = e => e.target.style.borderColor=K.accent;
  const blurIn = e => e.target.style.borderColor=K.border;

  // ═══ RENDER ════════════════════════════════════
  return (
    <div style={{ minHeight:'100vh', background:K.bg, color:K.text, fontFamily:F, fontSize:14 }}>

      {/* ── HEADER ── */}
      <div style={{ padding:'16px 28px', borderBottom:`1px solid ${K.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:K.card, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5 }}>Outreach HQ</span>
          <span style={{ padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:'linear-gradient(135deg,#4f8fff,#3b6fd9)', color:'#fff' }}>{identity}</span>
          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, background:synced?'rgba(52,211,153,0.12)':'rgba(251,191,36,0.12)', color:synced?K.green:K.yellow, fontWeight:500 }}>
            {synced ? '● Synk' : '○ ...'}
          </span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={() => { setIdentity(null); try{localStorage.removeItem('outreach:identity')}catch(e){} }} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${K.border}`, background:'transparent', cursor:'pointer', color:K.muted, fontSize:12, fontFamily:F }}>Bytt bruker</button>
          <button onClick={exportData} style={{ background:'none', border:'none', cursor:'pointer', color:K.muted, padding:8 }}><Download size={17}/></button>
          <button onClick={importData} style={{ background:'none', border:'none', cursor:'pointer', color:K.muted, padding:8 }}><Upload size={17}/></button>
        </div>
      </div>

      {/* ── FOKUS-INDIKATOR ── */}
      <div style={{ padding:'10px 28px', background:'rgba(245,158,11,0.04)', borderBottom:`1px solid rgba(245,158,11,0.12)`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:13 }}>
          <span style={{ color:K.pilot, fontWeight:800, textTransform:'uppercase', letterSpacing:1, fontSize:11 }}>🎯 Primær wedge: Regnskap</span>
          <span style={{ color:K.muted }}>Pilot-kandidater: <strong style={{ color:K.text }}>{pilots.length}</strong></span>
          <span style={{ color:K.muted }}>Kontaktet: <strong style={{ color:K.text }}>{pilotContacted.length}</strong></span>
          <span style={{ color:K.muted }}>Status: <strong style={{ color:pilotMeetings.length>0?K.green:K.yellow }}>{pilotMeetings.length>0?'Pilot pågår':'Pre-pilot'}</strong></span>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ padding:'8px 28px', borderBottom:`1px solid ${K.border}`, display:'flex', gap:6, overflowX:'auto', background:K.card }}>
        {[['dashboard','Dashboard'],['kandidater','Kandidater'],['bransje','Bransjer'],['oss','Oss'],['uke','Uke']].map(([k,v])=>(
          <button key={k} style={tabBtn(k)} onClick={()=>{setTab(k);setActiveId(null);}}>{v}</button>
        ))}
      </div>

      {/* ═══════════ DASHBOARD ═══════════ */}
      {tab === 'dashboard' && (
        <div style={{ padding:28, maxWidth:960, margin:'0 auto' }}>
          {/* Pilot stats — BIG */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:K.pilot, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              🎯 Pilot-statistikk
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14, marginBottom:28 }}>
              {[
                { label:'Pilot-kandidater', val:pilots.length, color:K.pilot },
                { label:'Samtaler tatt', val:pilotContacted.length, color:K.accent },
                { label:'Interesserte', val:pilotInterested.length, color:K.green },
                { label:'Møter booket', val:pilotMeetings.length, color:K.green },
                { label:'Konvertering', val:pilotHitRate+'%', color:pilotHitRate>20?K.green:K.yellow },
              ].map(s => (
                <div key={s.label} style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${K.border}` }}>
                  <div style={{ fontSize:11, color:K.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>{s.label}</div>
                  <div style={{ fontSize:34, fontWeight:900, color:s.color, letterSpacing:-1.5 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Learn stats — smaller */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, color:K.learn, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              📚 Læring-statistikk
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14 }}>
              <div style={{ background:K.card, borderRadius:12, padding:18, border:`1px solid ${K.border}` }}>
                <div style={{ fontSize:11, color:K.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:600 }}>Læring-samtaler</div>
                <div style={{ fontSize:28, fontWeight:800, color:K.learn }}>{learnContacted.length}</div>
              </div>
              <div style={{ background:K.card, borderRadius:12, padding:18, border:`1px solid ${K.border}` }}>
                <div style={{ fontSize:11, color:K.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:600 }}>Bransje-stikkord lært</div>
                <div style={{ fontSize:28, fontWeight:800, color:K.learn }}>{learnKeywords}</div>
              </div>
            </div>
          </div>

          {/* Next action */}
          {nextUp && (
            <div style={{ background:K.card, borderRadius:16, padding:28, border:`1px solid rgba(79,143,255,0.3)`, marginBottom:32, cursor:'pointer', boxShadow:'0 0 40px rgba(79,143,255,0.06)', transition:'all .3s' }}
              onClick={() => { setActiveId(nextUp.id); setTab('kandidater'); }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 50px rgba(79,143,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 40px rgba(79,143,255,0.06)'}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:12, color:K.accent, fontWeight:700, textTransform:'uppercase', letterSpacing:2 }}>Neste opp</span>
                <RoleBadge role={nextUp.role}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>{nextUp.name}</div>
                  <div style={{ color:K.muted, fontSize:15 }}>
                    {nextUp.dl} · {nextUp.channel==='telefon'?'📞 '+nextUp.phone:'✉️ '+nextUp.email}
                    {nextUp.planned && <span> · 📅 {nextUp.planned}</span>}
                  </div>
                </div>
                <div style={{ background:'linear-gradient(135deg,#4f8fff,#3b6fd9)', borderRadius:12, padding:'12px 20px', display:'flex', alignItems:'center', gap:8, color:'#fff', fontWeight:700, fontSize:14 }}>
                  Start <ArrowRight size={18}/>
                </div>
              </div>
            </div>
          )}

          {daysSince > 2 && (
            <div style={{ background:'rgba(248,113,113,0.06)', borderRadius:14, padding:20, border:`1px solid rgba(248,113,113,0.2)`, display:'flex', alignItems:'center', gap:14 }}>
              <AlertCircle size={22} color={K.red}/>
              <span style={{ color:K.red, fontSize:15 }}>{daysSince} dager siden siste outreach. Ring én person!</span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ KANDIDATER LIST ═══════════ */}
      {tab === 'kandidater' && !active && (
        <div style={{ padding:28, maxWidth:960, margin:'0 auto' }}>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <div style={{ flex:1, position:'relative' }}>
              <Search size={16} style={{ position:'absolute', left:14, top:13, color:K.muted }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Søk etter bedrift eller person..."
                style={{ ...inp, paddingLeft:38, fontSize:15 }} onFocus={focusIn} onBlur={blurIn}/>
            </div>
            <button onClick={()=>setShowAdd(true)} style={{
              padding:'12px 22px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#4f8fff,#3b6fd9)',
              color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:700,
              boxShadow:'0 4px 20px rgba(79,143,255,0.25)',
            }}>
              <Plus size={16}/> Ny kandidat
            </button>
          </div>

          {/* Smart filters */}
          <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
            {[
              ['pilot','🎯 Pilot'],['pilot-aktive','Pilot aktive'],['pilot-interessert','Pilot interessert'],
              ['learn','📚 Læring'],['mine','Mine'],['alle','Alle'],
            ].map(([k,v]) => (
              <button key={k} onClick={()=>setFilter(k)} style={{
                padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:filter===k?700:500,
                background:filter===k?'rgba(79,143,255,0.12)':'rgba(90,95,130,0.08)', color:filter===k?K.accent:K.muted, fontFamily:F,
              }}>{v}</button>
            ))}
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:K.muted, cursor:'pointer', marginBottom:20, userSelect:'none' }}>
            <input type="checkbox" checked={showDropped} onChange={e=>setShowDropped(e.target.checked)} style={{ accentColor:K.accent }}/>
            Vis droppet
          </label>

          {/* Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14 }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => { setActiveId(c.id); setDetailTab('info'); setShowScript(false); setShowEmail(false); }}
                style={{ background:K.card, borderRadius:14, padding:20, border:`1px solid ${c.role==='dropped'?'rgba(248,113,113,0.15)':K.border}`, cursor:'pointer', transition:'all .2s', opacity:c.role==='dropped'?0.5:1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(79,143,255,0.3)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=c.role==='dropped'?'rgba(248,113,113,0.15)':K.border; e.currentTarget.style.transform='none'; }}>
                {needsVerify(c) && c.role !== 'dropped' && (
                  <div style={{ fontSize:10, color:K.yellow, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>⚠ Verifiser på proff.no</div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontSize:16, fontWeight:700 }}>{c.name}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <RoleBadge role={c.role||'pilot'}/>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ color:K.muted, fontSize:13 }}>{c.dl}</span>
                  <Badge status={c.status}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:K.muted }}>{c.category} · {c.owner}</span>
                  {c.lastContacted && <span style={{ fontSize:11, color:K.muted }}>Sist: {fmtDate(c.lastContacted)}</span>}
                </div>
              </div>
            ))}
          </div>
          {filtered.length===0 && <div style={{ padding:60, textAlign:'center', color:K.muted, fontSize:15 }}>Ingen kandidater funnet</div>}
        </div>
      )}

      {/* ═══════════ CANDIDATE DETAIL ═══════════ */}
      {tab === 'kandidater' && active && (
        <div style={{ padding:28, maxWidth:760, margin:'0 auto' }}>
          <button onClick={() => setActiveId(null)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:K.accent, fontSize:14, marginBottom:20, padding:0, fontWeight:500, fontFamily:F }}>
            ← Alle kandidater
          </button>

          {needsVerify(active) && <VerifyBanner/>}

          {/* Header */}
          <div style={{ background:K.card, borderRadius:16, padding:28, border:`1px solid ${K.border}`, marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ fontSize:28, fontWeight:800, margin:'0 0 6px', letterSpacing:-0.5 }}>{active.name}</h2>
                <div style={{ color:K.muted, fontSize:14, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>
                  <span>{active.category}</span><span>·</span>
                  <div style={{ display:'inline-flex', gap:4 }}>
                    {['Elian','Ulrik'].map(n => (
                      <button key={n} onClick={() => updateCandidate(active.id, { owner: n })} style={{
                        padding:'3px 12px', borderRadius:8, border:`1px solid ${active.owner===n?K.accent:K.border}`,
                        background:active.owner===n?'rgba(79,143,255,0.15)':'transparent', color:active.owner===n?K.accent:K.muted,
                        cursor:'pointer', fontSize:12, fontWeight:active.owner===n?700:400, fontFamily:F,
                      }}>{n}</button>
                    ))}
                  </div>
                  {active.lastUpdatedBy && <span>· Oppdatert av {active.lastUpdatedBy} {fmtDate(active.lastUpdatedAt)}</span>}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                <Badge status={active.status}/>
                {/* Role selector */}
                <div style={{ display:'flex', gap:4 }}>
                  {['pilot','learn','dropped'].map(r => (
                    <button key={r} onClick={() => updateCandidate(active.id, { role: r })} style={{
                      padding:'3px 10px', borderRadius:6, fontSize:10, fontWeight:700, cursor:'pointer', border:'none',
                      background: (active.role||'pilot')===r ? ROLE_CFG[r].bg : 'transparent',
                      color: (active.role||'pilot')===r ? ROLE_CFG[r].color : K.muted,
                      textTransform:'uppercase', letterSpacing:0.5, transition:'all .2s',
                    }}>{ROLE_CFG[r].icon} {ROLE_CFG[r].label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:20, marginTop:18, fontSize:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><User size={16} color={K.muted}/> {active.dl}</div>
              {active.phone && <div style={{ display:'flex', alignItems:'center', gap:8 }}><Phone size={16} color={K.muted}/> <a href={`tel:${active.phone.replace(/\s/g,'')}`} style={{ color:K.accent, textDecoration:'none' }}>{active.phone}</a></div>}
              {active.email && <div style={{ display:'flex', alignItems:'center', gap:8 }}><Mail size={16} color={K.muted}/> <a href={`mailto:${active.email}`} style={{ color:K.accent, textDecoration:'none', fontSize:13 }}>{active.email}</a></div>}
              {active.address && <div style={{ display:'flex', alignItems:'center', gap:8 }}><MapPin size={16} color={K.muted}/> {active.address}</div>}
              {active.planned && <div style={{ display:'flex', alignItems:'center', gap:8 }}><Calendar size={16} color={K.muted}/> {active.planned}</div>}
            </div>
          </div>

          {/* Detail tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:20 }}>
            {[['info','Status & Verktøy'],['data','Notater & Data'],['logg','Historikk']].map(([k,v])=>(
              <button key={k} onClick={()=>setDetailTab(k)} style={{
                padding:'10px 18px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:detailTab===k?700:500,
                background:detailTab===k?'rgba(79,143,255,0.12)':'transparent', color:detailTab===k?K.accent:K.muted, fontFamily:F,
              }}>{v}</button>
            ))}
          </div>

          {detailTab === 'info' && <>
            <Section title="Endre status" icon={<Target size={18} color={K.accent}/>}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:8 }}>
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                  <button key={key} onClick={() => updateCandidate(active.id, { status: key })}
                    style={{ padding:'12px 16px', borderRadius:10, cursor:'pointer', textAlign:'left',
                      border:active.status===key?`2px solid ${cfg.color}`:`1px solid ${K.border}`,
                      background:active.status===key?cfg.bg:'transparent', color:active.status===key?cfg.color:K.muted,
                      fontSize:13, fontWeight:active.status===key?700:400, fontFamily:F, transition:'all .15s',
                    }}>
                    <span style={{ fontSize:16, marginRight:6 }}>{cfg.icon}</span>{cfg.label}
                  </button>
                ))}
              </div>
            </Section>

            <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
              {active.channel === 'telefon' && (
                <button onClick={() => { setShowScript(!showScript); setShowEmail(false); }} style={{
                  padding:'14px 24px', borderRadius:12, border:`1px solid ${showScript?K.accent:K.border}`,
                  background:showScript?'rgba(79,143,255,0.12)':K.card, color:showScript?K.accent:K.text,
                  cursor:'pointer', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8, fontFamily:F,
                }}><Phone size={16}/> Ring-manus</button>
              )}
              <button onClick={() => { setShowEmail(!showEmail); setShowScript(false); }} style={{
                padding:'14px 24px', borderRadius:12, border:`1px solid ${showEmail?K.accent:K.border}`,
                background:showEmail?'rgba(79,143,255,0.12)':K.card, color:showEmail?K.accent:K.text,
                cursor:'pointer', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8, fontFamily:F,
              }}><Mail size={16}/> Generer epost</button>
            </div>

            {showScript && (
              <Section title="Ring-manus" icon={<Phone size={18} color={K.green}/>}>
                <div style={{ fontSize:14, lineHeight:1.8 }}>
                  {[
                    { label:'Åpning', color:K.accent, text:`«Hei, er det ${firstName(active.dl)}? Dette er ${identity}. Beklager at jeg ringer sånn uten videre. Har du 20 sekunder, eller fanget jeg deg på dårlig tidspunkt?»` },
                    { label:'Hvis ja', color:K.green, text: active.role==='learn'
                      ? `«Kult. Kort forklart: jeg er 20 år, bor i Oslo. Vi prøver å forstå bransjen deres før vi velger hva vi skal bygge. Vi har faktisk ikke noen plan om å selge dere noe — vi er bare nysgjerrige på hverdagen. Kan vi ta en kaffe?»`
                      : `«Kult. Kort forklart: vi ser på unntakshåndtering og dokumentflyt i ${active.category?.toLowerCase()||'små'} byråer — manglende dokumentasjon, orgnummeroppslag, ruting av avvik. Ikke autonom bokføring — det fikser Tripletex selv. Vi prøver å forstå hvor smerten faktisk ligger. Kan vi ta en kaffe?»`
                    },
                    { label:'Hvis nei', color:K.yellow, text:'«Helt forståelig. Når passer det bedre?»' },
                    { label:'Hvis stresset', color:K.muted, text:'«Skal jeg ringe i morgen?»' },
                  ].map((s,i) => (
                    <div key={i} style={{ padding:16, background:`${s.color}08`, borderRadius:12, borderLeft:`3px solid ${s.color}`, marginBottom:12 }}>
                      <div style={{ fontWeight:700, fontSize:12, color:s.color, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{s.label}</div>
                      {s.text}
                    </div>
                  ))}
                  <div style={{ padding:16, background:'rgba(52,211,153,0.04)', borderRadius:12, border:`1px solid rgba(52,211,153,0.12)` }}>
                    <div style={{ fontWeight:700, fontSize:12, color:K.green, textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Discovery-spørsmål</div>
                    {DISCOVERY_QS.map((q,i) => <div key={i} style={{ marginBottom:6, opacity:0.9 }}>{i+1}. {q}</div>)}
                  </div>
                </div>
              </Section>
            )}

            {showEmail && (
              <Section title="Epost-utkast" icon={<Mail size={18} color={K.accent}/>}>
                {active.role==='learn' && <div style={{ padding:'10px 14px', background:'rgba(107,112,148,0.08)', borderRadius:10, marginBottom:14, fontSize:13, color:K.learn }}>📚 Læring-epost — ærlig om at vi ikke selger noe</div>}
                <pre style={{ whiteSpace:'pre-wrap', fontSize:14, lineHeight:1.8, margin:'0 0 14px', fontFamily:'"SF Mono","Fira Code",monospace', color:K.text, opacity:0.9 }}>
                  {genEmail(active, identity)}
                </pre>
                <CopyBtn text={genEmail(active, identity)}/>
              </Section>
            )}

            {active.status !== 'ikke-kontaktet' && (
              <Section title="Neste steg" icon={<ArrowRight size={18} color={K.green}/>}>
                {active.status === 'interessert' && <>
                  {['Book konkret tidspunkt','Send bekreftelse innen 1 time','Forbered de 5 discovery-spørsmålene'].map((t,i) => (
                    <div key={i} style={{ padding:'10px 14px', background:'rgba(79,143,255,0.04)', borderRadius:10, marginBottom:8, fontSize:14 }}>📋 {t}</div>
                  ))}
                </>}
                {active.status === 'møte-booket' && <>
                  {['Les Google-reviewene','Sjekk nettsiden','Ta med notatblokk — aldri laptop','Still de 5 spørsmålene','Skriv 3 ordrett-sitater innen 1 time etter'].map((t,i) => (
                    <div key={i} style={{ padding:'10px 14px', background:'rgba(79,143,255,0.04)', borderRadius:10, marginBottom:8, fontSize:14 }}>📋 {t}</div>
                  ))}
                </>}
                {active.status === 'mobilsvar' && <>
                  <div style={{ padding:'10px 14px', background:'rgba(248,113,113,0.06)', borderRadius:10, marginBottom:8, fontSize:14, border:`1px solid rgba(248,113,113,0.1)` }}>🚫 Ikke legg igjen beskjed</div>
                  <div style={{ padding:'10px 14px', background:'rgba(79,143,255,0.04)', borderRadius:10, marginBottom:8, fontSize:14 }}>⏰ Prøv igjen om 3-4 timer</div>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14 }}>
                    <span style={{ fontSize:15, color:K.muted }}>Forsøk: <strong style={{color:K.text}}>{active.callAttempts||0}/3</strong></span>
                    <button onClick={() => updateCandidate(active.id,{callAttempts:Math.min((active.callAttempts||0)+1,3)})}
                      style={{ padding:'8px 18px', borderRadius:10, border:`1px solid ${K.border}`, background:K.card, cursor:'pointer', fontSize:13, color:K.text, fontFamily:F }}>+ Forsøk</button>
                    {(active.callAttempts||0)>=3 && <span style={{ fontSize:14, color:K.accent, fontWeight:700 }}>→ Send backup-epost</span>}
                  </div>
                </>}
                {active.status === 'gatekeeper' && <>
                  <div style={{ marginTop:10 }}>
                    <label style={{ fontSize:12, color:K.muted, display:'block', marginBottom:6, fontWeight:500 }}>Resepsjonistens navn</label>
                    <input value={active.gatekeeper||''} onChange={e=>updateCandidate(active.id,{gatekeeper:e.target.value})} placeholder="Skriv inn..." style={inp} onFocus={focusIn} onBlur={blurIn}/>
                  </div>
                </>}
              </Section>
            )}
          </>}

          {detailTab === 'data' && <>
            <Section title="Fit-score" icon={<Zap size={18} color={K.yellow}/>}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', gap:4 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => {
                    const c = active.fitScore>=7?K.green:active.fitScore>=4?K.yellow:active.fitScore>0?K.red:K.muted;
                    return <button key={n} onClick={()=>updateCandidate(active.id,{fitScore:n})} style={{
                      width:32, height:32, borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                      background:n<=active.fitScore?c:K.border, color:n<=active.fitScore?'#fff':K.muted,
                    }}>{n}</button>;
                  })}
                </div>
                <span style={{ fontSize:16, fontWeight:800, color:active.fitScore>=7?K.green:active.fitScore>=4?K.yellow:active.fitScore>0?K.red:K.muted }}>
                  {active.fitScore>0?active.fitScore+'/10':'—'}
                </span>
              </div>
            </Section>
            <Section title="Smerte-stikkord" icon={<AlertCircle size={18} color={K.red}/>}>
              <p style={{ color:K.muted, fontSize:13, marginTop:0, marginBottom:12 }}>Ordrett fra samtalen</p>
              {[0,1,2].map(i => (
                <input key={i} value={active.painPoints?.[i]||''} onChange={e=>{const pp=[...(active.painPoints||['','',''])];pp[i]=e.target.value;updateCandidate(active.id,{painPoints:pp});}}
                  placeholder={`Stikkord ${i+1}...`} style={{ ...inp, marginBottom:8 }} onFocus={focusIn} onBlur={blurIn}/>
              ))}
            </Section>
            <Section title="Neste konkret steg" icon={<ArrowRight size={18} color={K.accent}/>}>
              <input value={active.nextStep||''} onChange={e=>updateCandidate(active.id,{nextStep:e.target.value})}
                placeholder="F.eks. ring tilbake onsdag 10:00" style={{ ...inp, fontSize:15 }} onFocus={focusIn} onBlur={blurIn}/>
            </Section>
            <Section title="Notater" icon={<Users size={18} color={K.muted}/>}>
              <textarea value={active.notes||''} onChange={e=>updateCandidate(active.id,{notes:e.target.value})}
                placeholder="Frie notater..." rows={5} style={{ ...inp, resize:'vertical', lineHeight:1.7 }} onFocus={focusIn} onBlur={blurIn}/>
            </Section>
          </>}

          {detailTab === 'logg' && (
            <Section title="Aktivitetslogg" icon={<Calendar size={18} color={K.accent}/>}>
              {active.history?.length > 0 ? (
                <div style={{ borderLeft:`2px solid ${K.border}`, paddingLeft:20 }}>
                  {[...active.history].reverse().map((h,i) => (
                    <div key={i} style={{ marginBottom:18, position:'relative' }}>
                      <div style={{ position:'absolute', left:-25, top:5, width:10, height:10, borderRadius:'50%', background:K.accent, boxShadow:'0 0 10px rgba(79,143,255,0.3)' }}/>
                      <div style={{ fontSize:15, fontWeight:700 }}>{h.action}</div>
                      <div style={{ fontSize:13, color:K.muted, marginTop:2 }}>{fmtDate(h.date)} · {h.by}</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color:K.muted, fontSize:14 }}>Ingen historikk ennå</p>}
            </Section>
          )}
        </div>
      )}

      {/* ═══════════ OSS ═══════════ */}
      {tab === 'oss' && (() => {
        const players = ['Elian','Ulrik'].map(p => {
          const mine = candidates.filter(c => c.owner===p && c.role!=='dropped');
          const cont = mine.filter(c => c.status!=='ikke-kontaktet');
          const inte = mine.filter(c => c.status==='interessert'||c.status==='møte-booket');
          const meet = mine.filter(c => c.status==='møte-booket');
          const week = thisWeek.filter(c => c.owner===p);
          const xp = getXP(candidates, p);
          return { name:p, total:mine.length, contacted:cont.length, interested:inte.length, meetings:meet.length, week:week.length, xp, lv:getLevel(xp), streak:getStreak(candidates,p) };
        });
        const leader = players[0].xp>=players[1].xp?players[0]:players[1];
        const diff = Math.abs(players[0].xp-players[1].xp);
        return (
          <div style={{ padding:28, maxWidth:960, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:36 }}>
              <div style={{ fontSize:28, fontWeight:900, letterSpacing:-0.5, marginBottom:6 }}>
                <span style={{ color:K.accent }}>Elian</span><span style={{ color:K.muted, margin:'0 14px', fontSize:20 }}>vs</span><span style={{ color:K.green }}>Ulrik</span>
              </div>
              <p style={{ color:K.muted, fontSize:15 }}>Hvem tar flest samtaler denne uka?</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:32 }}>
              {players.map((p,pi) => {
                const isLeader = p.name===leader.name && diff>0;
                const color = pi===0?K.accent:K.green;
                const xpPct = Math.min((p.xp/p.lv.next)*100,100);
                return (
                  <div key={p.name} style={{ background:K.card, borderRadius:18, padding:28, border:`1px solid ${isLeader?color+'55':K.border}`, boxShadow:isLeader?`0 0 40px ${color}15`:'none', position:'relative' }}>
                    {isLeader && <div style={{ position:'absolute', top:14, right:16 }}><Crown size={24} color={K.yellow}/></div>}
                    <div style={{ fontSize:13, color:K.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{p.lv.emoji} {p.lv.title}</div>
                    <div style={{ fontSize:32, fontWeight:900, color, marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontSize:15, color:K.muted, marginBottom:18 }}>Level {p.lv.level}</div>
                    <div style={{ marginBottom:20 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:K.muted, marginBottom:6 }}><span>{p.xp} XP</span><span>{p.lv.next} XP</span></div>
                      <div style={{ height:10, background:K.border, borderRadius:5, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${xpPct}%`, background:`linear-gradient(90deg,${color},${color}cc)`, borderRadius:5, transition:'width .5s', boxShadow:`0 0 12px ${color}44` }}/>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {[{l:'Kontaktet',v:p.contacted,i:'📞'},{l:'Interessert',v:p.interested,i:'✅'},{l:'Møter',v:p.meetings,i:'🤝'},{l:'Denne uka',v:p.week,i:'📅'}].map(s=>(
                        <div key={s.l} style={{ padding:12, background:K.surface, borderRadius:10 }}>
                          <div style={{ fontSize:11, color:K.muted, marginBottom:4 }}>{s.i} {s.l}</div>
                          <div style={{ fontSize:22, fontWeight:800 }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    {p.streak>0 && <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(251,191,36,0.06)', borderRadius:10, border:'1px solid rgba(251,191,36,0.12)' }}>
                      <Flame size={18} color={K.yellow}/><span style={{ fontSize:14, fontWeight:700, color:K.yellow }}>{p.streak} dagers streak!</span>
                    </div>}
                  </div>
                );
              })}
            </div>
            <div style={{ background:K.card, borderRadius:16, padding:24, border:`1px solid ${K.border}`, marginBottom:28 }}>
              <h3 style={{ fontWeight:700, fontSize:17, margin:'0 0 18px' }}><Trophy size={18} style={{ verticalAlign:'middle', marginRight:8 }}/> Head-to-head</h3>
              {[{l:'Kontaktet',a:players[0].contacted,b:players[1].contacted},{l:'Interesserte',a:players[0].interested,b:players[1].interested},{l:'Møter',a:players[0].meetings,b:players[1].meetings},{l:'Denne uken',a:players[0].week,b:players[1].week},{l:'Total XP',a:players[0].xp,b:players[1].xp}].map(row=>{
                const max=Math.max(row.a,row.b,1);
                return <div key={row.l} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                    <span style={{ fontWeight:700, color:K.accent }}>{row.a}</span><span style={{ color:K.muted, fontSize:12 }}>{row.l}</span><span style={{ fontWeight:700, color:K.green }}>{row.b}</span>
                  </div>
                  <div style={{ display:'flex', gap:4, height:8 }}>
                    <div style={{ flex:1, display:'flex', justifyContent:'flex-end' }}><div style={{ width:`${(row.a/max)*100}%`, height:'100%', background:K.accent, borderRadius:4, minWidth:row.a>0?4:0 }}/></div>
                    <div style={{ flex:1 }}><div style={{ width:`${(row.b/max)*100}%`, height:'100%', background:K.green, borderRadius:4, minWidth:row.b>0?4:0 }}/></div>
                  </div>
                </div>;
              })}
            </div>
            <div style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${K.border}` }}>
              <h3 style={{ fontWeight:700, fontSize:15, margin:'0 0 14px' }}>Slik får du XP</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
                {[['Møte booket','50 XP','🤝'],['Interessert','30 XP','✅'],['Oppfølging','15 XP','↻'],['Sendt epost','10 XP','✉️'],['Takket nei','8 XP','✕'],['Fit-score','1-10 XP','⭐'],['Smerte-stikkord','10 XP','📝'],['Notater','5 XP','📋']].map(([l,x,i])=>(
                  <div key={l} style={{ padding:'10px 14px', background:K.surface, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13 }}>{i} {l}</span><span style={{ fontSize:12, fontWeight:700, color:K.accent }}>{x}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════ BRANSJER ═══════════ */}
      {tab === 'bransje' && (
        <div style={{ padding:28, maxWidth:960, margin:'0 auto' }}>
          <h2 style={{ fontWeight:800, fontSize:24, margin:'0 0 28px' }}>Bransje-analyse</h2>
          <div style={{ background:K.card, borderRadius:16, padding:24, border:`1px solid ${K.border}`, marginBottom:28 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={industryStats}>
                <XAxis dataKey="cat" tick={{ fontSize:12, fill:K.muted }} axisLine={{stroke:K.border}} tickLine={false}/>
                <YAxis tick={{ fontSize:12, fill:K.muted }} axisLine={{stroke:K.border}} tickLine={false}/>
                <Tooltip contentStyle={{ background:K.card, border:`1px solid ${K.border}`, borderRadius:10, fontSize:13, color:K.text }} cursor={{fill:'rgba(79,143,255,0.04)'}}/>
                <Bar dataKey="total" name="Totalt" radius={[6,6,0,0]}>
                  {industryStats.map((s,i) => <Cell key={i} fill={s.isPilot?K.pilot:K.muted}/>)}
                </Bar>
                <Bar dataKey="interested" name="Interessert" fill={K.accent} radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {industryStats.map(s => {
              const score = (s.contacted>0?(s.contacted/s.total)*25:0)+(s.interested>0?(s.interested/s.contacted)*30:0)+(s.avgFit>0?(s.avgFit/10)*25:0)+(s.want?20:0);
              return (
                <div key={s.cat} style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${s.isPilot?'rgba(245,158,11,0.15)':K.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <h3 style={{ fontWeight:700, fontSize:18, margin:0 }}>{s.cat}</h3>
                      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color:s.isPilot?K.pilot:K.learn }}>{s.isPilot?'🎯 PILOT':'📚 LÆRING'}</span>
                    </div>
                    <span style={{ padding:'6px 16px', borderRadius:10, fontSize:13, fontWeight:700,
                      background:score>50?'rgba(52,211,153,0.1)':score>25?'rgba(251,191,36,0.1)':'rgba(248,113,113,0.1)',
                      color:score>50?K.green:score>25?K.yellow:K.red,
                    }}>Score: {Math.round(score)}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 }}>
                    {[['Totalt',s.total,K.text],['Kontaktet',s.contacted,K.text],['Interessert',s.interested,K.green],['Snitt fit',s.avgFit||'—',s.avgFit>=7?K.green:s.avgFit>=4?K.yellow:K.muted]].map(([l,v,c])=>(
                      <div key={l}><div style={{ fontSize:11, color:K.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{l}</div><div style={{ fontSize:24, fontWeight:900, color:c, marginTop:4 }}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{ height:6, background:K.border, borderRadius:3, overflow:'hidden', marginBottom:16 }}>
                    <div style={{ height:'100%', width:`${Math.min(score,100)}%`, borderRadius:3, background:score>50?K.green:score>25?K.yellow:K.red }}/>
                  </div>
                  <button onClick={()=>{const n={...wantToWork,[s.cat]:!wantToWork[s.cat]};setWantToWork(n);saveToFirestore('wanttowork',n);}}
                    style={{ padding:'8px 18px', borderRadius:10, border:`1px solid ${wantToWork[s.cat]?K.green:K.border}`, cursor:'pointer',
                      background:wantToWork[s.cat]?'rgba(52,211,153,0.1)':'transparent', color:wantToWork[s.cat]?K.green:K.muted,
                      fontSize:13, fontWeight:600, fontFamily:F }}>
                    {wantToWork[s.cat]?'♥ Vil jobbe med denne':'○ Lyst til å jobbe med denne?'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ UKE ═══════════ */}
      {tab === 'uke' && (
        <div style={{ padding:28, maxWidth:960, margin:'0 auto' }}>
          <h2 style={{ fontWeight:800, fontSize:24, margin:'0 0 28px' }}>Ukentlig oppsummering</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32 }}>
            {[
              { label:'Kontaktet denne uken', val:thisWeek.length, color:K.accent },
              { label:'Dager siden siste', val:daysSince, color:daysSince>2?K.red:K.green },
            ].map(s => (
              <div key={s.label} style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${K.border}` }}>
                <div style={{ fontSize:12, color:K.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:36, fontWeight:900, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background:K.card, borderRadius:16, padding:24, border:`1px solid ${K.border}`, marginBottom:28 }}>
            <h3 style={{ fontWeight:700, fontSize:17, margin:'0 0 18px' }}>Per person</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {['Elian','Ulrik'].map(person => {
                const pc = candidates.filter(c => c.owner===person && c.role!=='dropped');
                const pcc = pc.filter(c => c.status!=='ikke-kontaktet');
                const pw = thisWeek.filter(c => c.owner===person);
                return <div key={person} style={{ padding:20, background:K.surface, borderRadius:12, border:`1px solid ${K.border}` }}>
                  <div style={{ fontWeight:800, fontSize:17, marginBottom:12, color:person==='Elian'?K.accent:K.green }}>{person}</div>
                  <div style={{ fontSize:14, color:K.muted, lineHeight:2.2 }}>
                    Totalt: <span style={{ color:K.text, fontWeight:700 }}>{pc.length}</span><br/>
                    Kontaktet: <span style={{ color:K.text, fontWeight:700 }}>{pcc.length}</span><br/>
                    Denne uken: <span style={{ color:K.text, fontWeight:700 }}>{pw.length}</span>
                  </div>
                </div>;
              })}
            </div>
          </div>
          <div style={{ background:K.card, borderRadius:16, padding:24, border:`1px solid ${K.border}` }}>
            <h3 style={{ fontWeight:700, fontSize:17, margin:'0 0 18px' }}>Siste aktivitet</h3>
            {candidates.filter(c => c.history?.length>0)
              .flatMap(c => c.history.map(h => ({ ...h, candidate:c.name })))
              .sort((a,b) => b.date.localeCompare(a.date)).slice(0,10)
              .map((h,i) => (
                <div key={i} style={{ padding:'12px 0', borderBottom:i<9?`1px solid ${K.border}`:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div><span style={{ fontWeight:700 }}>{h.candidate}</span><span style={{ color:K.muted }}> — {h.action}</span></div>
                  <div style={{ fontSize:12, color:K.muted }}>{fmtDate(h.date)} · {h.by}</div>
                </div>
              ))}
            {!candidates.some(c => c.history?.length>0) && <p style={{ color:K.muted, textAlign:'center', padding:20 }}>Ingen aktivitet ennå</p>}
          </div>
        </div>
      )}

      {/* ── WEDGE FOOTER ── */}
      <div style={{ padding:'20px 28px', borderTop:`1px solid ${K.border}`, background:K.card, marginTop:20 }}>
        {editWedge ? (
          <div style={{ maxWidth:600, margin:'0 auto', display:'flex', gap:10 }}>
            <textarea value={wedge||''} onChange={e=>setWedge(e.target.value)} rows={2} style={{ ...inp, fontSize:14, textAlign:'center', fontStyle:'italic', resize:'none' }}/>
            <button onClick={()=>{saveWedge(wedge);setEditWedge(false);}} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:K.accent, color:'#fff', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}>Lagre</button>
          </div>
        ) : (
          <div style={{ textAlign:'center', position:'relative' }}>
            <p style={{ fontStyle:'italic', fontSize:14, color:K.muted, margin:0, opacity:0.8, whiteSpace:'pre-line' }}>«{wedge}»</p>
            <button onClick={()=>setEditWedge(true)} style={{ position:'absolute', right:0, top:0, background:'none', border:'none', cursor:'pointer', color:K.muted, opacity:0.5 }}><Edit3 size={14}/></button>
          </div>
        )}
      </div>

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }} onClick={()=>setShowAdd(false)}>
          <div style={{ background:K.card, borderRadius:18, padding:32, maxWidth:500, width:'100%', maxHeight:'90vh', overflow:'auto', boxShadow:'0 25px 80px rgba(0,0,0,0.5)', border:`1px solid ${K.border}` }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
              <h3 style={{ fontWeight:800, fontSize:22, margin:0 }}>Ny kandidat</h3>
              <button onClick={()=>setShowAdd(false)} style={{ background:'none', border:'none', cursor:'pointer', color:K.muted }}><X size={22}/></button>
            </div>
            <AddForm user={identity} onAdd={addCandidate} inp={inp} focusIn={focusIn} blurIn={blurIn}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Form ─────────────────────────────────────
function AddForm({ user, onAdd, inp, focusIn, blurIn }) {
  const [f, setF] = useState({ name:'', dl:'', phone:'', email:'', category:'Regnskap', channel:'telefon', address:'', owner:user, role:'pilot' });
  const valid = f.name.trim() && f.owner;
  const sel = { ...inp, padding:'8px 12px', fontSize:13, cursor:'pointer' };
  return <>
    {[['Firmanavn *','name','text'],['Besluttstaker','dl','text'],['Telefon','phone','tel'],['Epost','email','email'],['Adresse','address','text']].map(([label,key,type]) => (
      <div key={key} style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, color:K.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>
        <input type={type} value={f[key]} onChange={e=>setF({...f,[key]:e.target.value})} style={inp} onFocus={focusIn} onBlur={blurIn}/>
      </div>
    ))}
    <div style={{ display:'flex', gap:12, marginBottom:16 }}>
      <div style={{ flex:1 }}>
        <label style={{ fontSize:12, color:K.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Bransje</label>
        <select value={f.category} onChange={e=>setF({...f,category:e.target.value,role:autoRole({category:e.target.value})})} style={sel}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ flex:1 }}>
        <label style={{ fontSize:12, color:K.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Kanal</label>
        <select value={f.channel} onChange={e=>setF({...f,channel:e.target.value})} style={sel}>
          <option value="telefon">Telefon</option><option value="epost">Epost</option>
        </select>
      </div>
    </div>
    {/* Role */}
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:12, color:K.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Rolle</label>
      <div style={{ display:'flex', gap:6 }}>
        {['pilot','learn'].map(r => (
          <button key={r} onClick={()=>setF({...f,role:r})} style={{
            flex:1, padding:10, borderRadius:10, border:`1px solid ${f.role===r?ROLE_CFG[r].color+'55':K.border}`,
            background:f.role===r?ROLE_CFG[r].bg:'transparent', color:f.role===r?ROLE_CFG[r].color:K.muted,
            cursor:'pointer', fontSize:13, fontWeight:f.role===r?700:400, transition:'all .2s',
          }}>{ROLE_CFG[r].icon} {ROLE_CFG[r].label}</button>
        ))}
      </div>
    </div>
    <div style={{ marginBottom:28 }}>
      <label style={{ fontSize:12, color:K.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Eier *</label>
      <div style={{ display:'flex', gap:10 }}>
        {['Elian','Ulrik'].map(n => (
          <button key={n} onClick={()=>setF({...f,owner:n})} style={{
            flex:1, padding:12, borderRadius:10, border:`1px solid ${f.owner===n?K.accent:K.border}`,
            background:f.owner===n?'rgba(79,143,255,0.12)':'transparent', color:f.owner===n?K.accent:K.muted,
            cursor:'pointer', fontSize:14, fontWeight:f.owner===n?700:400,
          }}>{n}</button>
        ))}
      </div>
    </div>
    <button onClick={() => { if(valid) onAdd({...f, id:mkId(), status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, planned:''}); }}
      disabled={!valid} style={{
        width:'100%', padding:16, borderRadius:12, border:'none', cursor:valid?'pointer':'not-allowed',
        background:valid?'linear-gradient(135deg,#4f8fff,#3b6fd9)':'#1a1d30', color:valid?'#fff':K.muted,
        fontSize:16, fontWeight:700, boxShadow:valid?'0 4px 20px rgba(79,143,255,0.3)':'none',
      }}>Legg til kandidat</button>
  </>;
}
