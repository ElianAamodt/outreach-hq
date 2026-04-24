import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Phone, Mail, Search, Plus, ChevronRight, Copy, Check,
  Download, Upload, Users, TrendingUp, Calendar, Clock,
  MapPin, Building2, User, MessageSquare, Star, X,
  ArrowRight, BarChart3, RefreshCw, AlertCircle, FileText,
  ChevronDown, ExternalLink, Hash, Target, Coffee, Zap
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

// Write to Firestore (debounced per key)
const writeTimers = {};
const saveToFirestore = (key, data) => {
  if (writeTimers[key]) clearTimeout(writeTimers[key]);
  writeTimers[key] = setTimeout(() => {
    setDoc(doc(db, "outreach", key), { data }, { merge: true }).catch(console.error);
  }, 500);
};

// ─── Colors & Config ───────────────────────────────
const K = {
  bg:'#0b0d1a',
  card:'#111428',
  cardHover:'#161a35',
  text:'#e2e4f0',
  muted:'#6b7094',
  accent:'#4f8fff',
  accentGlow:'rgba(79,143,255,0.15)',
  border:'#1e2245',
  green:'#34d399',
  yellow:'#fbbf24',
  red:'#f87171',
  surface:'#0e1025',
};

const STATUS_CFG = {
  'ikke-kontaktet':   { label:'Ikke kontaktet',    color:K.muted,  bg:'#1a1d35',  icon:'○' },
  'sendt-epost':      { label:'Sendt epost',        color:K.yellow, bg:'#2a2518',  icon:'✉' },
  'interessert':      { label:'Interessert',         color:K.green,  bg:'#0f2a22',  icon:'✓' },
  'møte-booket':      { label:'Møte booket',         color:K.green,  bg:'#0f2a22',  icon:'★' },
  'gatekeeper':       { label:'Gatekeeper',          color:K.yellow, bg:'#2a2518',  icon:'⚑' },
  'takket-nei':       { label:'Takket nei',          color:K.red,    bg:'#2a1518',  icon:'✕' },
  'mobilsvar':        { label:'Mobilsvar',           color:K.yellow, bg:'#2a2518',  icon:'☎' },
  'ingen-svar-epost': { label:'Ingen svar (epost)',  color:K.yellow, bg:'#2a2518',  icon:'…' },
  'oppfølging':       { label:'Oppfølging',          color:K.accent, bg:'#0f1a2a',  icon:'↻' },
};

const CATEGORIES = ['Regnskap','Jus','Psykologi','Tannlege','Fysio','Frisør','Annet'];

const DISCOVERY_QS = [
  'Hvordan ser en vanlig mandag ut hos dere?',
  'Når tok noe admin lengre tid enn det burde?',
  'Hvor mange timer i uka går til det?',
  'Har dere prøvd å løse det? Hva skjedde?',
  'Hvem internt ville måttet være med?',
];

// ─── Default Candidates ───────────────────────────
const mkId = () => Math.random().toString(36).slice(2,10);

const DEFAULT_CANDIDATES = [
  { id:mkId(), name:'Aketo Regnskap', dl:'Marius Fjellheim Nyman', phone:'92 35 51 36', email:'', category:'Regnskap', channel:'telefon', planned:'Man 09:30', address:'Inkognitogata 33A', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Unikum Regnskap', dl:'Truls Uppheim', phone:'', email:'post@unikumregnskap.no', category:'Regnskap', channel:'epost', planned:'Man 10:30', address:'Munkedamsveien 45', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Suleiman & Co', dl:'Verifiser på proff.no', phone:'21 39 04 54', email:'', category:'Jus', channel:'telefon', planned:'Tirs 09:30', address:'C.J. Hambros plass 2d', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Kognito psykisk helse', dl:'Sten-Rune Roland', phone:'23 90 50 70', email:'post@kognito.no', category:'Psykologi', channel:'epost', planned:'Man 10:30', address:'Tullins gate 2', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Lian & Fjell', dl:'Erlend / Sofie', phone:'21 45 60 30', email:'post@lianogfjell.no', category:'Psykologi', channel:'epost', planned:'Tirs 10:30', address:'Keysers gate 5', owner:'Elian', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Sanner Tannklinikk', dl:'Sjekk proff.no', phone:'22 37 41 74', email:'', category:'Tannlege', channel:'telefon', planned:'Man 09:30', address:'Sannergata 38', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Grünerløkkas Hus Tannlegesenter', dl:'Alexander Salvador', phone:'22 38 20 18', email:'post@grunerlokkashus.no', category:'Tannlege', channel:'epost', planned:'Man 10:45', address:'Schleppegrells gt. 32', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Løkkaklinikken', dl:'Karianne', phone:'41 84 79 29', email:'', category:'Fysio', channel:'telefon', planned:'Tirs 09:30', address:'Thorvald Meyers gt. 18', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Saxofón Frisør', dl:'Simon / Adam', phone:'45 55 58 98', email:'', category:'Frisør', channel:'epost', planned:'Man 10:45', address:'Fredensborgveien 22A', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Behandlerverket', dl:'Sigbjørn / Bent Roar', phone:'53 75 55 55', email:'post@behandlerverket.no', category:'Fysio', channel:'epost', planned:'Tirs 11:00', address:'Calmeyers gate 8B', owner:'Ulrik', status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, wantToWork:false },
  { id:mkId(), name:'Oslo Sentrum Tannklinikk', dl:'Zlatko Petrovic', phone:'21 38 60 65', email:'post@oslosentrumtannklinikk.no', category:'Tannlege', channel:'epost', planned:'', address:'', owner:'Ulrik', status:'sendt-epost', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[{action:'Sendt epost',date:'2026-04-22',by:'Ulrik'}], lastContacted:'2026-04-22', lastUpdatedBy:'Ulrik', lastUpdatedAt:'2026-04-22', wantToWork:false },
  { id:mkId(), name:'Ecora Regnskap', dl:'Nam Vo', phone:'90 09 74 10', email:'post@ecora.no', category:'Regnskap', channel:'epost', planned:'', address:'', owner:'Elian', status:'sendt-epost', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[{action:'Sendt epost',date:'2026-04-22',by:'Elian'}], lastContacted:'2026-04-22', lastUpdatedBy:'Elian', lastUpdatedAt:'2026-04-22', wantToWork:false },
  { id:mkId(), name:'Sentralstasjonen Fysio', dl:'Lene Bjoland Harstad', phone:'22 40 35 70', email:'', category:'Fysio', channel:'telefon', planned:'', address:'', owner:'Elian', status:'takket-nei', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[{action:'Takket nei',date:'2026-04-22',by:'Elian'}], lastContacted:'2026-04-22', lastUpdatedBy:'Elian', lastUpdatedAt:'2026-04-22', wantToWork:false },
];

// ─── Helpers ───────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = d => { if(!d) return '—'; const p=d.split('-'); return `${p[2]}/${p[1]}`; };
const firstName = name => (name||'').split(/[\s\/]/)[0];

// ─── Badge Component ──────────────────────────────
function Badge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['ikke-kontaktet'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 10px', borderRadius:12, fontSize:11,
      fontFamily:'"Inter", -apple-system, sans-serif',
      color:cfg.color, background:cfg.bg, fontWeight:600,
      whiteSpace:'nowrap', letterSpacing:0.3,
    }}>
      <span style={{fontSize:10}}>{cfg.icon}</span> {cfg.label}
    </span>
  );
}

// ─── Copy Button ──────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handle} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'8px 16px', borderRadius:8, border:`1px solid ${copied ? K.green : K.border}`,
      background:copied ? 'rgba(52,211,153,0.15)' : K.card, color:copied ? K.green : K.text,
      cursor:'pointer', fontSize:12, fontFamily:'"Inter", -apple-system, sans-serif',
      transition:'all 0.2s', fontWeight:500,
    }}>
      {copied ? <><Check size={13}/> Kopiert!</> : <><Copy size={13}/> Kopier</>}
    </button>
  );
}

// ─── Email Generator ──────────────────────────────
function genEmail(candidate, user, type) {
  const fn = firstName(candidate.dl);
  const u = user || 'Elian';

  if (type === 'interessert') {
    return `Hei ${fn},\n\nBare en rask bekreftelse på at vi snakkes [DAG] kl [TID]. Jeg tar med kaffe og spørsmål — ingenting annet.\n\nSes da!\n\n${u}`;
  }
  if (type === 'møte-booket') {
    return `Hei ${fn},\n\nTakk for praten. Det du sa om [KONKRET DETALJ] satte fingeren på noe vi skal grave i.\n\nIngen pitch, ingen vedlegg — bare en takk.\n\n${u}`;
  }
  if (type === 'takket-nei') {
    return `Hei ${fn},\n\nTakk for at du var rett frem. Kort spørsmål: da du sa dere ikke trenger det — var det fordi dere har løst det annerledes, eller fordi det rett og slett ikke er et problem hos dere? Spør bare fordi jeg lærer av hvert svar.\n\n${u}`;
  }
  // Default cold email
  const bransje = candidate.category?.toLowerCase() || 'bedrift';
  return `Hei ${fn},\n\nJeg heter ${u}, er 20 år, og prøver å forstå hvordan hverdagen faktisk ser ut i en ${bransje}${bransje==='bedrift'?'':'praksis'}. Vi selger ingenting. Vi har ingenting å selge enda. Vi bare lurer.\n\nKonkret: vi snakker med folk som driver småbedrifter i Oslo for å finne ut hvilke admin-oppgaver som spiser mest tid — og om AI kan gjøre noe med det.\n\nHar du 15 minutter en dag denne uka? Gjerne over en kaffe i nærheten av ${candidate.address || 'sentrum'}.\n\n${u}`;
}

// ─── Call Script ──────────────────────────────────
function CallScript({ candidate, user }) {
  const fn = firstName(candidate.dl);
  return (
    <div style={{ fontFamily:'"Inter", -apple-system, sans-serif', fontSize:13, lineHeight:1.7, color:K.text }}>
      <div style={{ marginBottom:16, padding:14, background:'rgba(79,143,255,0.08)', borderRadius:10, borderLeft:`3px solid ${K.accent}` }}>
        <div style={{ fontWeight:600, marginBottom:6, color:K.accent, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>Åpning</div>
        «Hei, er det {fn}? Dette er {user}. Beklager at jeg ringer sånn uten videre. Har du 20 sekunder, eller fanget jeg deg på dårlig tidspunkt?»
      </div>
      <div style={{ marginBottom:16, padding:14, background:'rgba(52,211,153,0.08)', borderRadius:10, borderLeft:`3px solid ${K.green}` }}>
        <div style={{ fontWeight:600, marginBottom:6, color:K.green, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>Hvis ja</div>
        «Kult. Kort forklart: jeg er 20 år, bor i Oslo, og prøver å forstå hvordan hverdagen ser ut i en {candidate.category?.toLowerCase() || 'liten bedrift'}. Vi selger ingenting — vi prøver bare å finne ut om det finnes admin-oppgaver som tar unødvendig lang tid, og om AI kan hjelpe. Kan vi ta en kaffe i nærheten av dere en dag?»
      </div>
      <div style={{ marginBottom:16, padding:14, background:'rgba(251,191,36,0.08)', borderRadius:10, borderLeft:`3px solid ${K.yellow}` }}>
        <div style={{ fontWeight:600, marginBottom:6, color:K.yellow, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>Hvis nei</div>
        «Helt forståelig. Når passer det bedre?»
      </div>
      <div style={{ marginBottom:16, padding:14, background:'rgba(107,112,148,0.08)', borderRadius:10, borderLeft:`3px solid ${K.muted}` }}>
        <div style={{ fontWeight:600, marginBottom:6, color:K.muted, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>Hvis stresset</div>
        «Skal jeg ringe i morgen?»
      </div>
      <div style={{ padding:14, background:'rgba(52,211,153,0.06)', borderRadius:10, border:`1px solid rgba(52,211,153,0.15)` }}>
        <div style={{ fontWeight:600, marginBottom:10, color:K.green, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>Discovery-spørsmål</div>
        {DISCOVERY_QS.map((q,i) => (
          <div key={i} style={{ marginBottom:6, paddingLeft:4, color:K.text, opacity:0.9 }}>{i+1}. {q}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Next Steps per Status ────────────────────────
function NextSteps({ status, candidate, user, onUpdate }) {
  if (status === 'interessert') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <StepItem text="Book konkret tidspunkt — «Fungerer torsdag 10:15?»" icon="📅" />
      <StepItem text="Send kort bekreftelse på epost innen 1 time" icon="✉️" />
      <StepItem text="Forbered de 5 discovery-spørsmålene" icon="📋" />
      <StepItem text="Ikke send demo eller materiell" icon="🚫" warn />
      <div style={{ marginTop:10, padding:14, background:'rgba(52,211,153,0.06)', borderRadius:10, border:`1px solid rgba(52,211,153,0.12)` }}>
        <div style={{ fontWeight:600, marginBottom:8, fontSize:12, color:K.green, textTransform:'uppercase', letterSpacing:0.5 }}>Bekreftelse-epost</div>
        <pre style={{ whiteSpace:'pre-wrap', fontSize:12, lineHeight:1.6, margin:0, fontFamily:'"SF Mono", "Fira Code", monospace', color:K.text, opacity:0.9 }}>
          {genEmail(candidate, user, 'interessert')}
        </pre>
        <div style={{ marginTop:10 }}><CopyBtn text={genEmail(candidate, user, 'interessert')} /></div>
      </div>
    </div>
  );

  if (status === 'møte-booket') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <StepItem text="Les Google-reviewene deres på nytt" icon="⭐" />
      <StepItem text="Sjekk nettsiden for systemer de bruker" icon="🌐" />
      <StepItem text="Skriv ut discovery-cheatsheet" icon="🖨️" />
      <StepItem text="Ta med notatblokk — aldri laptop" icon="📓" />
      <StepItem text="Still de 5 spørsmålene i rekkefølge" icon="📋" />
      <StepItem text="Skriv 3 ordrett-sitater innen 1 time etter møtet" icon="✍️" />
      <div style={{ marginTop:10, padding:14, background:'rgba(52,211,153,0.06)', borderRadius:10, border:`1px solid rgba(52,211,153,0.12)` }}>
        <div style={{ fontWeight:600, marginBottom:10, fontSize:12, color:K.green, textTransform:'uppercase', letterSpacing:0.5 }}>Discovery-spørsmål</div>
        {DISCOVERY_QS.map((q,i) => (
          <div key={i} style={{ marginBottom:5, fontSize:12, fontFamily:'"SF Mono", "Fira Code", monospace', color:K.text, opacity:0.9 }}>{i+1}. {q}</div>
        ))}
      </div>
      <div style={{ marginTop:10, padding:14, background:'rgba(79,143,255,0.06)', borderRadius:10, border:`1px solid rgba(79,143,255,0.12)` }}>
        <div style={{ fontWeight:600, marginBottom:10, fontSize:12, color:K.accent, textTransform:'uppercase', letterSpacing:0.5 }}>Takk-epost (send etter møtet)</div>
        <pre style={{ whiteSpace:'pre-wrap', fontSize:12, lineHeight:1.6, margin:0, fontFamily:'"SF Mono", "Fira Code", monospace', color:K.text, opacity:0.9 }}>
          {genEmail(candidate, user, 'møte-booket')}
        </pre>
        <div style={{ marginTop:10 }}><CopyBtn text={genEmail(candidate, user, 'møte-booket')} /></div>
      </div>
    </div>
  );

  if (status === 'gatekeeper') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <StepItem text="Skriv ned resepsjonistens navn" icon="📝" />
      <StepItem text={`Spør: «Når pleier ${firstName(candidate.dl)} å være inne?»`} icon="🕐" />
      <StepItem text="Ring tilbake på det tidspunktet" icon="📞" />
      <StepItem text={`Åpning: «Hei [resepsjonist]! Det er ${user} igjen.»`} icon="👋" />
      <div style={{ marginTop:10 }}>
        <label style={{ fontSize:11, color:K.muted, fontFamily:'"Inter", -apple-system, sans-serif', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Resepsjonistens navn</label>
        <input value={candidate.gatekeeper||''} onChange={e => onUpdate({gatekeeper:e.target.value})}
          style={{ width:'100%', padding:10, borderRadius:8, border:`1px solid ${K.border}`, background:K.surface, fontSize:13, fontFamily:'"Inter", -apple-system, sans-serif', color:K.text, boxSizing:'border-box', outline:'none', transition:'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = K.accent}
          onBlur={e => e.target.style.borderColor = K.border}
          placeholder="Skriv inn navn..." />
      </div>
    </div>
  );

  if (status === 'takket-nei') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <StepItem text="Respekter svaret" icon="🤝" />
      <StepItem text="Still oppfølgingsspørsmålet" icon="💬" />
      <StepItem text="Logg svaret som markedsdata" icon="📊" />
      <StepItem text="Gå videre" icon="➡️" />
      <div style={{ marginTop:10, padding:14, background:'rgba(248,113,113,0.06)', borderRadius:10, border:`1px solid rgba(248,113,113,0.12)` }}>
        <div style={{ fontWeight:600, marginBottom:10, fontSize:12, color:K.red, textTransform:'uppercase', letterSpacing:0.5 }}>Oppfølgingsspørsmål</div>
        <pre style={{ whiteSpace:'pre-wrap', fontSize:12, lineHeight:1.6, margin:0, fontFamily:'"SF Mono", "Fira Code", monospace', color:K.text, opacity:0.9 }}>
          {genEmail(candidate, user, 'takket-nei')}
        </pre>
        <div style={{ marginTop:10 }}><CopyBtn text={genEmail(candidate, user, 'takket-nei')} /></div>
      </div>
    </div>
  );

  if (status === 'mobilsvar') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <StepItem text="Ikke legg igjen beskjed" icon="🚫" warn />
      <StepItem text="Prøv igjen om 3–4 timer" icon="⏰" />
      <StepItem text="Beste tider: 09:30–11 eller 13:30–15" icon="🕐" />
      <StepItem text="Etter 3 forsøk → send backup-epost" icon="✉️" />
      <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:13, fontFamily:'"Inter", -apple-system, sans-serif', color:K.muted }}>
          Forsøk: {candidate.callAttempts || 0}/3
        </span>
        <button onClick={() => onUpdate({callAttempts: Math.min((candidate.callAttempts||0)+1, 3)})}
          style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${K.border}`, background:K.card, cursor:'pointer', fontSize:12, fontFamily:'"Inter", -apple-system, sans-serif', color:K.text, transition:'all 0.2s' }}>
          + Forsøk
        </button>
        {(candidate.callAttempts||0) >= 3 && (
          <span style={{ fontSize:12, color:K.accent, fontWeight:600 }}>→ Send backup-epost</span>
        )}
      </div>
    </div>
  );

  if (status === 'ingen-svar-epost') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <StepItem text="Vent 5 virkedager" icon="📅" />
      <StepItem text="Ring dem i stedet" icon="📞" />
      <StepItem text="Ikke send oppfølgings-epost" icon="🚫" warn />
      <StepItem text="Etter telefon + epost uten svar → gå videre" icon="➡️" />
    </div>
  );

  return null;
}

function StepItem({ text, icon, warn }) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10, padding:'8px 12px', borderRadius:8,
      background: warn ? 'rgba(248,113,113,0.08)' : 'rgba(79,143,255,0.05)', fontSize:13,
      fontFamily:'"Inter", -apple-system, sans-serif', color:K.text, lineHeight:1.5,
      border: warn ? '1px solid rgba(248,113,113,0.12)' : '1px solid transparent',
    }}>
      <span style={{ flexShrink:0, fontSize:14 }}>{icon}</span>
      <span style={{ opacity:0.9 }}>{text}</span>
    </div>
  );
}

// ─── Fit Score Visual ─────────────────────────────
function FitScoreBar({ score, onChange }) {
  const color = score >= 7 ? K.green : score >= 4 ? K.yellow : score > 0 ? K.red : K.muted;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ display:'flex', gap:3 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            width:24, height:24, borderRadius:6, border:'none', cursor:'pointer',
            background: n <= score ? color : K.border, transition:'all 0.15s',
            fontSize:10, fontFamily:'"Inter", -apple-system, sans-serif',
            color: n <= score ? '#fff' : K.muted, fontWeight:700,
          }}>{n}</button>
        ))}
      </div>
      <span style={{ fontSize:13, fontFamily:'"Inter", -apple-system, sans-serif', color, fontWeight:700 }}>
        {score > 0 ? score + '/10' : '—'}
      </span>
    </div>
  );
}

// ─── Add Candidate Modal ──────────────────────────
function AddModal({ user, onAdd, onClose }) {
  const [f, setF] = useState({ name:'', dl:'', phone:'', email:'', category:'Regnskap', channel:'telefon', address:'', owner:user });
  const valid = f.name.trim() && f.owner;

  const modalInput = {
    width:'100%', padding:10, borderRadius:8, border:`1px solid ${K.border}`,
    background:K.surface, fontSize:13, fontFamily:'"Inter", -apple-system, sans-serif',
    color:K.text, boxSizing:'border-box', outline:'none', transition:'border-color 0.2s',
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
      onClick={onClose}>
      <div style={{ background:K.card, borderRadius:16, padding:28, maxWidth:480, width:'100%', maxHeight:'90vh', overflow:'auto', boxShadow:'0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(79,143,255,0.1)', border:`1px solid ${K.border}` }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 style={{ fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:700, fontSize:20, color:K.text, margin:0 }}>Ny kandidat</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:K.muted, padding:4 }}><X size={20}/></button>
        </div>
        {[
          ['Firmanavn *','name','text'],['Besluttstaker','dl','text'],['Telefon','phone','tel'],
          ['Epost','email','email'],['Adresse','address','text'],
        ].map(([label,key,type]) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:K.muted, fontFamily:'"Inter", -apple-system, sans-serif', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>{label}</label>
            <input type={type} value={f[key]} onChange={e=>setF({...f,[key]:e.target.value})}
              style={modalInput}
              onFocus={e => e.target.style.borderColor = K.accent}
              onBlur={e => e.target.style.borderColor = K.border} />
          </div>
        ))}
        <div style={{ display:'flex', gap:12, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:K.muted, fontFamily:'"Inter", -apple-system, sans-serif', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Bransje</label>
            <select value={f.category} onChange={e=>setF({...f,category:e.target.value})}
              style={{ ...modalInput, cursor:'pointer' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:K.muted, fontFamily:'"Inter", -apple-system, sans-serif', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Kanal</label>
            <select value={f.channel} onChange={e=>setF({...f,channel:e.target.value})}
              style={{ ...modalInput, cursor:'pointer' }}>
              <option value="telefon">Telefon</option>
              <option value="epost">Epost</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ fontSize:11, color:K.muted, fontFamily:'"Inter", -apple-system, sans-serif', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Eier *</label>
          <div style={{ display:'flex', gap:8 }}>
            {['Elian','Ulrik'].map(n => (
              <button key={n} onClick={() => setF({...f,owner:n})} style={{
                flex:1, padding:10, borderRadius:8, border:`1px solid ${f.owner===n?K.accent:K.border}`,
                background:f.owner===n?'rgba(79,143,255,0.15)':'transparent', color:f.owner===n?K.accent:K.muted,
                cursor:'pointer', fontSize:13, fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:f.owner===n?700:400,
                transition:'all 0.2s',
              }}>{n}</button>
            ))}
          </div>
        </div>
        <button onClick={() => { if(valid) onAdd({...f, id:mkId(), status:'ikke-kontaktet', fitScore:0, painPoints:['','',''], nextStep:'', notes:'', gatekeeper:'', callAttempts:0, history:[], lastContacted:null, lastUpdatedBy:null, lastUpdatedAt:null, planned:'', wantToWork:false}); }}
          disabled={!valid}
          style={{
            width:'100%', padding:14, borderRadius:10, border:'none', cursor:valid?'pointer':'not-allowed',
            background:valid ? `linear-gradient(135deg, ${K.accent}, #3b6fd9)` : '#2a2d45',
            color:valid ? '#fff' : K.muted, fontSize:14,
            fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:700,
            transition:'all 0.3s',
            boxShadow: valid ? '0 4px 20px rgba(79,143,255,0.3)' : 'none',
          }}>
          Legg til kandidat
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────
export default function OutreachHQ() {
  const [identity, setIdentity] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('alle');
  const [filterStatus, setFilterStatus] = useState('alle');
  const [filterCat, setFilterCat] = useState('alle');
  const [showAdd, setShowAdd] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [wantToWork, setWantToWork] = useState({});
  const [synced, setSynced] = useState(false);
  const skipNextSync = useRef(false);

  // Load identity from localStorage (per device, not shared)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('outreach:identity');
      if (saved) setIdentity(saved);
    } catch(e) {}
  }, []);

  // Real-time Firestore listener for candidates
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "outreach", "candidates"), (snap) => {
      if (skipNextSync.current) { skipNextSync.current = false; return; }
      const d = snap.data();
      if (d?.data && Array.isArray(d.data) && d.data.length > 0) {
        setCandidates(d.data);
      } else if (!snap.exists()) {
        // First time: seed the database with defaults
        setCandidates(DEFAULT_CANDIDATES);
        saveToFirestore('candidates', DEFAULT_CANDIDATES);
      }
      setLoading(false);
      setSynced(true);
    }, (err) => {
      console.error('Firestore error:', err);
      setCandidates(DEFAULT_CANDIDATES);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore listener for wantToWork
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "outreach", "wanttowork"), (snap) => {
      const d = snap.data();
      if (d?.data) setWantToWork(d.data);
    });
    return () => unsub();
  }, []);

  // Save candidates to Firestore (debounced)
  const saveCandidates = useCallback((data) => {
    setCandidates(data);
    skipNextSync.current = true;
    saveToFirestore('candidates', data);
  }, []);

  const saveIdentity = (name) => {
    setIdentity(name);
    try { localStorage.setItem('outreach:identity', name); } catch(e) {}
  };

  const updateCandidate = useCallback((id, updates) => {
    setCandidates(prev => {
      const next = prev.map(c => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates, lastUpdatedBy: identity, lastUpdatedAt: today() };
        if (updates.status && updates.status !== c.status) {
          updated.history = [...(c.history||[]), { action: STATUS_CFG[updates.status]?.label || updates.status, date: today(), by: identity }];
          updated.lastContacted = today();
        }
        return updated;
      });
      skipNextSync.current = true;
      saveToFirestore('candidates', next);
      return next;
    });
  }, [identity]);

  const addCandidate = (c) => {
    const next = [...candidates, c];
    saveCandidates(next);
    setShowAdd(false);
  };

  // ─── Identity Picker ───────────────────────────
  if (!identity) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:`radial-gradient(ellipse at 50% 30%, #111840, ${K.bg})`,
        fontFamily:'"Inter", -apple-system, sans-serif',
      }}>
        <div style={{ textAlign:'center', maxWidth:360, padding:32 }}>
          <h1 style={{ fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:800, fontSize:32, color:K.text, marginBottom:6, letterSpacing:-0.5 }}>
            Outreach HQ
          </h1>
          <p style={{ color:K.muted, fontSize:14, marginBottom:40 }}>Hvem er du?</p>
          <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
            {['Elian','Ulrik'].map(n => (
              <button key={n} onClick={() => saveIdentity(n)} style={{
                padding:'18px 48px', borderRadius:12, border:`1px solid ${K.accent}`,
                background:'transparent', color:K.accent, fontSize:18, cursor:'pointer',
                fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:700,
                transition:'all 0.3s', letterSpacing:0.3,
              }}
              onMouseEnter={e => { e.target.style.background='rgba(79,143,255,0.15)'; e.target.style.boxShadow='0 0 30px rgba(79,143,255,0.2)'; }}
              onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.boxShadow='none'; }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading || !candidates) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:K.bg }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:32, height:32, border:`3px solid ${K.border}`, borderTopColor:K.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <p style={{ fontFamily:'"Inter", -apple-system, sans-serif', color:K.muted, fontSize:14 }}>Laster...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  // ─── Computed Data ─────────────────────────────
  const active = candidates.find(c => c.id === activeId);
  const contacted = candidates.filter(c => c.status !== 'ikke-kontaktet');
  const interested = candidates.filter(c => c.status === 'interessert' || c.status === 'møte-booket');
  const meetings = candidates.filter(c => c.status === 'møte-booket');
  const declined = candidates.filter(c => c.status === 'takket-nei');
  const hitRate = contacted.length > 0 ? Math.round((interested.length / contacted.length) * 100) : 0;

  // Next action
  const nextUp = candidates.find(c => c.status === 'ikke-kontaktet' && c.owner === identity);

  // Filtered list
  const filtered = candidates.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.dl.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterOwner !== 'alle' && c.owner !== filterOwner) return false;
    if (filterStatus !== 'alle' && c.status !== filterStatus) return false;
    if (filterCat !== 'alle' && c.category !== filterCat) return false;
    return true;
  });

  // Industry stats
  const industryStats = CATEGORIES.filter(c => c !== 'Annet').map(cat => {
    const inCat = candidates.filter(c => c.category === cat);
    const catContacted = inCat.filter(c => c.status !== 'ikke-kontaktet');
    const catInterested = inCat.filter(c => c.status === 'interessert' || c.status === 'møte-booket');
    const avgFit = inCat.filter(c => c.fitScore > 0).reduce((s,c) => s + c.fitScore, 0) / (inCat.filter(c=>c.fitScore>0).length || 1);
    const painFilled = inCat.filter(c => c.painPoints?.some(p => p.trim())).length;
    return { cat, total: inCat.length, contacted: catContacted.length, interested: catInterested.length, avgFit: Math.round(avgFit*10)/10, painFilled, want: wantToWork[cat] || false };
  }).filter(s => s.total > 0);

  // Week activity
  const thisWeek = candidates.filter(c => {
    if (!c.lastContacted) return false;
    const d = new Date(c.lastContacted);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
    return d >= weekAgo;
  });

  const daysSinceActivity = (() => {
    const dates = candidates.filter(c=>c.lastContacted).map(c=>new Date(c.lastContacted));
    if (!dates.length) return 99;
    const latest = Math.max(...dates);
    return Math.floor((Date.now() - latest) / (24*60*60*1000));
  })();

  // ─── Export / Import ───────────────────────────
  const exportData = () => {
    const data = JSON.stringify({ candidates, wantToWork, exportDate: today() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `outreach-backup-${today()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.candidates) { saveCandidates(data.candidates); }
        if (data.wantToWork) { setWantToWork(data.wantToWork); saveToFirestore('wanttowork', data.wantToWork); }
      } catch(err) { console.error('Import error:', err); }
    };
    input.click();
  };

  // ─── Styles ────────────────────────────────────
  const tabStyle = (t) => ({
    padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
    background: tab===t ? 'rgba(79,143,255,0.15)' : 'transparent',
    color: tab===t ? K.accent : K.muted,
    fontSize:13, fontFamily:'"Inter", -apple-system, sans-serif', fontWeight: tab===t ? 600 : 400,
    transition:'all 0.2s', whiteSpace:'nowrap',
    borderBottom: tab===t ? `2px solid ${K.accent}` : '2px solid transparent',
  });

  const inputStyle = {
    width:'100%', padding:10, borderRadius:8, border:`1px solid ${K.border}`,
    background:K.surface, fontSize:13, fontFamily:'"Inter", -apple-system, sans-serif',
    color:K.text, boxSizing:'border-box', outline:'none', transition:'border-color 0.2s',
  };

  const selectStyle = {
    padding:'6px 10px', borderRadius:8, border:`1px solid ${K.border}`, background:K.surface,
    fontSize:12, fontFamily:'"Inter", -apple-system, sans-serif', color:K.text, cursor:'pointer',
    outline:'none',
  };

  // ─── RENDER ────────────────────────────────────
  return (
    <div style={{
      minHeight:'100vh', background:K.bg, color:K.text,
      fontFamily:'"Inter", -apple-system, sans-serif', fontSize:13,
      position:'relative',
    }}>
      {/* Header */}
      <div style={{
        padding:'14px 24px', borderBottom:`1px solid ${K.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:K.card, position:'sticky', top:0, zIndex:100,
        backdropFilter:'blur(12px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <h1 style={{ fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:800, fontSize:20, margin:0, color:K.text, letterSpacing:-0.3 }}>
            Outreach HQ
          </h1>
          <span style={{
            padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:600,
            background:`linear-gradient(135deg, ${K.accent}, #3b6fd9)`, color:'#fff',
          }}>{identity}</span>
          <span style={{
            padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:500,
            background: synced ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
            color: synced ? K.green : K.yellow,
          }}>{synced ? '● synkronisert' : '○ kobler til...'}</span>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={exportData} style={{ background:'none', border:'none', cursor:'pointer', color:K.muted, padding:8, borderRadius:8, transition:'color 0.2s' }}
            onMouseEnter={e => e.target.style.color=K.accent} onMouseLeave={e => e.target.style.color=K.muted} title="Eksporter">
            <Download size={16}/>
          </button>
          <button onClick={importData} style={{ background:'none', border:'none', cursor:'pointer', color:K.muted, padding:8, borderRadius:8, transition:'color 0.2s' }}
            onMouseEnter={e => e.target.style.color=K.accent} onMouseLeave={e => e.target.style.color=K.muted} title="Importer">
            <Upload size={16}/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        padding:'6px 24px', borderBottom:`1px solid ${K.border}`,
        display:'flex', gap:4, overflowX:'auto', background:K.card,
      }}>
        <button style={tabStyle('dashboard')} onClick={()=>setTab('dashboard')}>Dashboard</button>
        <button style={tabStyle('kandidater')} onClick={()=>setTab('kandidater')}>Kandidater</button>
        <button style={tabStyle('bransje')} onClick={()=>setTab('bransje')}>Bransjer</button>
        <button style={tabStyle('uke')} onClick={()=>setTab('uke')}>Uke</button>
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {tab === 'dashboard' && (
        <div style={{ padding:24, maxWidth:920, margin:'0 auto' }}>
          {/* Stats cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14, marginBottom:28 }}>
            {[
              { label:'Kontaktet', val:contacted.length, total:candidates.length, color:K.text },
              { label:'Interessert', val:interested.length, color:K.green },
              { label:'Møter', val:meetings.length, color:K.green },
              { label:'Nei', val:declined.length, color:K.red },
              { label:'Treffrate', val:hitRate+'%', color:hitRate>20?K.green:K.yellow },
            ].map(s => (
              <div key={s.label} style={{
                background:K.card, borderRadius:12, padding:18, border:`1px solid ${K.border}`,
                transition:'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,143,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = K.border}>
                <div style={{ fontSize:11, color:K.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>{s.label}</div>
                <div style={{ fontSize:30, fontWeight:800, color:s.color, letterSpacing:-1 }}>
                  {s.val}{s.total ? <span style={{ fontSize:14, color:K.muted, fontWeight:400 }}>/{s.total}</span> : null}
                </div>
              </div>
            ))}
          </div>

          {/* Next action */}
          {nextUp && (
            <div style={{
              background:K.card, borderRadius:14, padding:22, border:`1px solid rgba(79,143,255,0.3)`,
              marginBottom:28, cursor:'pointer', transition:'all 0.3s',
              boxShadow:'0 0 30px rgba(79,143,255,0.08)',
            }}
            onClick={() => { setActiveId(nextUp.id); setTab('kandidater'); setMobileDetail(true); }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 40px rgba(79,143,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 30px rgba(79,143,255,0.08)'}>
              <div style={{ fontSize:11, color:K.accent, fontWeight:700, marginBottom:10, textTransform:'uppercase', letterSpacing:1.5 }}>
                Hva gjør du nå?
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontSize:19, fontWeight:700, letterSpacing:-0.3 }}>{nextUp.name}</div>
                  <div style={{ color:K.muted, marginTop:6, fontSize:13 }}>
                    {nextUp.dl} · {nextUp.channel === 'telefon' ? '📞 ' + nextUp.phone : '✉️ ' + nextUp.email} · {nextUp.planned}
                  </div>
                </div>
                <ArrowRight size={22} color={K.accent} />
              </div>
            </div>
          )}

          {/* Industry breakdown mini */}
          <div style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${K.border}`, marginBottom:28 }}>
            <h3 style={{ fontWeight:700, fontSize:16, margin:'0 0 18px 0', letterSpacing:-0.2 }}>Fordeling per bransje</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:10 }}>
              {industryStats.map(s => (
                <div key={s.cat} style={{ padding:12, background:K.surface, borderRadius:10, textAlign:'center', border:`1px solid ${K.border}`, transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,143,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = K.border}>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:6, color:K.text }}>{s.cat}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:K.accent }}>{s.total}</div>
                  <div style={{ fontSize:10, color:K.muted, marginTop:4 }}>{s.contacted} kontaktet · {s.interested} int.</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity warning */}
          {daysSinceActivity > 2 && (
            <div style={{
              background:'rgba(248,113,113,0.08)', borderRadius:12, padding:18, border:`1px solid rgba(248,113,113,0.2)`,
              display:'flex', alignItems:'center', gap:14,
            }}>
              <AlertCircle size={20} color={K.red} />
              <span style={{ color:K.red, fontSize:13 }}>
                {daysSinceActivity} dager siden siste outreach. Tid for å ringe noen?
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══ KANDIDATER ═══ */}
      {tab === 'kandidater' && (
        <div style={{ display:'flex', height:'calc(100vh - 105px)', overflow:'hidden' }}>
          {/* List panel */}
          <div style={{
            width: mobileDetail && active ? '0' : '100%',
            maxWidth: active && !mobileDetail ? 400 : '100%',
            minWidth: mobileDetail && active ? 0 : undefined,
            borderRight: active ? `1px solid ${K.border}` : 'none',
            display:'flex', flexDirection:'column',
            overflow:'hidden',
            transition:'all 0.2s',
          }}>
            {/* Search + filters */}
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${K.border}`, background:K.card }}>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <div style={{ flex:1, position:'relative' }}>
                  <Search size={14} style={{ position:'absolute', left:10, top:11, color:K.muted }} />
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Søk..."
                    style={{ ...inputStyle, paddingLeft:30 }}
                    onFocus={e => e.target.style.borderColor = K.accent}
                    onBlur={e => e.target.style.borderColor = K.border} />
                </div>
                <button onClick={()=>setShowAdd(true)} style={{
                  padding:'10px 16px', borderRadius:8, border:'none',
                  background:`linear-gradient(135deg, ${K.accent}, #3b6fd9)`, color:'#fff',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12,
                  fontFamily:'"Inter", -apple-system, sans-serif', whiteSpace:'nowrap', fontWeight:600,
                  boxShadow:'0 2px 12px rgba(79,143,255,0.25)', transition:'all 0.2s',
                }}>
                  <Plus size={14}/> Ny
                </button>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <select value={filterOwner} onChange={e=>setFilterOwner(e.target.value)} style={selectStyle}>
                  <option value="alle">Alle eiere</option>
                  <option value="Elian">Elian</option>
                  <option value="Ulrik">Ulrik</option>
                </select>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={selectStyle}>
                  <option value="alle">Alle statuser</option>
                  {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={selectStyle}>
                  <option value="alle">Alle bransjer</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Candidate rows */}
            <div style={{ flex:1, overflow:'auto' }}>
              {filtered.map(c => (
                <div key={c.id}
                  onClick={() => { setActiveId(c.id); setMobileDetail(true); setShowScript(false); setShowEmail(false); }}
                  style={{
                    padding:'14px 18px', borderBottom:`1px solid ${K.border}`,
                    cursor:'pointer', transition:'background 0.15s',
                    background: c.id === activeId ? 'rgba(79,143,255,0.08)' : 'transparent',
                    borderLeft: c.id === activeId ? `2px solid ${K.accent}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if(c.id!==activeId) e.currentTarget.style.background=K.cardHover; }}
                  onMouseLeave={e => { if(c.id!==activeId) e.currentTarget.style.background='transparent'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:K.text }}>{c.name}</div>
                    <Badge status={c.status} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', color:K.muted, fontSize:11 }}>
                    <span>{c.dl} · {c.category}</span>
                    <span>{c.owner}</span>
                  </div>
                  {c.lastContacted && (
                    <div style={{ fontSize:10, color:K.muted, marginTop:3, opacity:0.7 }}>Sist: {fmtDate(c.lastContacted)}</div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding:40, textAlign:'center', color:K.muted }}>Ingen kandidater funnet</div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {active && (
            <div style={{
              flex:1, overflow:'auto', background:K.card,
              display: mobileDetail || window.innerWidth > 768 ? 'block' : 'none',
              position: window.innerWidth <= 768 ? 'fixed' : 'static',
              inset: window.innerWidth <= 768 ? '105px 0 0 0' : undefined,
              zIndex: window.innerWidth <= 768 ? 50 : undefined,
            }}>
              <div style={{ padding:24 }}>
                {/* Back button mobile */}
                <button onClick={() => setMobileDetail(false)}
                  style={{
                    display:'flex', alignItems:'center', gap:4, background:'none', border:'none',
                    cursor:'pointer', color:K.accent, fontSize:12, marginBottom:14, padding:0,
                    fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:500,
                  }}>
                  ← Tilbake
                </button>

                {/* Name + status */}
                <h2 style={{ fontWeight:700, fontSize:22, margin:'0 0 4px 0', letterSpacing:-0.3 }}>
                  {active.name}
                </h2>
                <div style={{ color:K.muted, marginBottom:18, fontSize:12 }}>
                  {active.category} · {active.owner}
                  {active.lastUpdatedBy && (
                    <span> · Oppdatert av {active.lastUpdatedBy} {fmtDate(active.lastUpdatedAt)}</span>
                  )}
                </div>

                {/* Contact info */}
                <div style={{
                  display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10,
                  marginBottom:22, padding:18, background:K.surface, borderRadius:12, border:`1px solid ${K.border}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <User size={14} color={K.muted}/> <span style={{ fontSize:13 }}>{active.dl}</span>
                  </div>
                  {active.phone && (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Phone size={14} color={K.muted}/> <a href={`tel:${active.phone.replace(/\s/g,'')}`} style={{ color:K.accent, textDecoration:'none', fontSize:13 }}>{active.phone}</a>
                    </div>
                  )}
                  {active.email && (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Mail size={14} color={K.muted}/> <a href={`mailto:${active.email}`} style={{ color:K.accent, textDecoration:'none', fontSize:12 }}>{active.email}</a>
                    </div>
                  )}
                  {active.address && (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <MapPin size={14} color={K.muted}/> <span style={{ fontSize:12 }}>{active.address}</span>
                    </div>
                  )}
                  {active.planned && (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Calendar size={14} color={K.muted}/> <span style={{ fontSize:13 }}>{active.planned}</span>
                    </div>
                  )}
                </div>

                {/* Status selector */}
                <div style={{ marginBottom:22 }}>
                  <label style={{ fontSize:11, color:K.muted, display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Status</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                      <button key={key}
                        onClick={() => updateCandidate(active.id, { status: key })}
                        style={{
                          padding:'7px 14px', borderRadius:8, cursor:'pointer',
                          border: active.status === key ? `1px solid ${cfg.color}` : `1px solid ${K.border}`,
                          background: active.status === key ? cfg.bg : 'transparent',
                          color: active.status === key ? cfg.color : K.muted,
                          fontSize:11, fontWeight: active.status === key ? 600 : 400,
                          fontFamily:'"Inter", -apple-system, sans-serif',
                          transition:'all 0.15s',
                        }}>
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
                  {active.channel === 'telefon' && (
                    <button onClick={() => { setShowScript(!showScript); setShowEmail(false); }} style={{
                      padding:'10px 18px', borderRadius:10, border:`1px solid ${showScript ? K.accent : K.border}`,
                      background: showScript ? 'rgba(79,143,255,0.12)' : K.surface, color: showScript ? K.accent : K.text,
                      cursor:'pointer', fontSize:12, fontFamily:'"Inter", -apple-system, sans-serif',
                      display:'flex', alignItems:'center', gap:7, fontWeight:500, transition:'all 0.2s',
                    }}>
                      <Phone size={14}/> Ring-manus
                    </button>
                  )}
                  <button onClick={() => { setShowEmail(!showEmail); setShowScript(false); }} style={{
                    padding:'10px 18px', borderRadius:10, border:`1px solid ${showEmail ? K.accent : K.border}`,
                    background: showEmail ? 'rgba(79,143,255,0.12)' : K.surface, color: showEmail ? K.accent : K.text,
                    cursor:'pointer', fontSize:12, fontFamily:'"Inter", -apple-system, sans-serif',
                    display:'flex', alignItems:'center', gap:7, fontWeight:500, transition:'all 0.2s',
                  }}>
                    <Mail size={14}/> Generer epost
                  </button>
                </div>

                {/* Call script */}
                {showScript && (
                  <div style={{ marginBottom:22, padding:18, background:K.surface, borderRadius:12, border:`1px solid ${K.border}` }}>
                    <h4 style={{ fontWeight:700, margin:'0 0 14px 0', fontSize:15, color:K.text }}>Ring-manus</h4>
                    <CallScript candidate={active} user={identity} />
                  </div>
                )}

                {/* Email generator */}
                {showEmail && (
                  <div style={{ marginBottom:22, padding:18, background:K.surface, borderRadius:12, border:`1px solid ${K.border}` }}>
                    <h4 style={{ fontWeight:700, margin:'0 0 14px 0', fontSize:15, color:K.text }}>Epost-utkast</h4>
                    <pre style={{
                      whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.7, margin:'0 0 14px 0',
                      fontFamily:'"SF Mono", "Fira Code", monospace', color:K.text, opacity:0.9,
                    }}>
                      {genEmail(active, identity)}
                    </pre>
                    <CopyBtn text={genEmail(active, identity)} />
                  </div>
                )}

                {/* Next steps (status-based) */}
                {active.status !== 'ikke-kontaktet' && (
                  <div style={{ marginBottom:22, padding:18, background:K.surface, borderRadius:12, border:`1px solid ${K.border}` }}>
                    <h4 style={{ fontWeight:700, margin:'0 0 14px 0', fontSize:15, color:K.text }}>Neste steg</h4>
                    <NextSteps
                      status={active.status}
                      candidate={active}
                      user={identity}
                      onUpdate={(updates) => updateCandidate(active.id, updates)}
                    />
                  </div>
                )}

                {/* Editable fields */}
                <div style={{ display:'flex', flexDirection:'column', gap:18, marginBottom:22 }}>
                  {/* Fit score */}
                  <div>
                    <label style={{ fontSize:11, color:K.muted, display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Fit-score</label>
                    <FitScoreBar score={active.fitScore} onChange={v => updateCandidate(active.id, { fitScore: v })} />
                  </div>

                  {/* Pain points */}
                  <div>
                    <label style={{ fontSize:11, color:K.muted, display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Smerte-stikkord (ordrett fra samtalen)</label>
                    {[0,1,2].map(i => (
                      <input key={i}
                        value={active.painPoints?.[i] || ''}
                        onChange={e => {
                          const pp = [...(active.painPoints || ['','',''])];
                          pp[i] = e.target.value;
                          updateCandidate(active.id, { painPoints: pp });
                        }}
                        placeholder={`Stikkord ${i+1}...`}
                        style={{ ...inputStyle, marginBottom:6 }}
                        onFocus={e => e.target.style.borderColor = K.accent}
                        onBlur={e => e.target.style.borderColor = K.border}
                      />
                    ))}
                  </div>

                  {/* Next step */}
                  <div>
                    <label style={{ fontSize:11, color:K.muted, display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Neste konkret steg</label>
                    <input value={active.nextStep || ''} onChange={e => updateCandidate(active.id, { nextStep: e.target.value })}
                      placeholder="F.eks. ring tilbake onsdag 10:00" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = K.accent}
                      onBlur={e => e.target.style.borderColor = K.border} />
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize:11, color:K.muted, display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Notater</label>
                    <textarea value={active.notes || ''} onChange={e => updateCandidate(active.id, { notes: e.target.value })}
                      placeholder="Frie notater..."
                      rows={4}
                      style={{ ...inputStyle, resize:'vertical' }}
                      onFocus={e => e.target.style.borderColor = K.accent}
                      onBlur={e => e.target.style.borderColor = K.border}
                    />
                  </div>
                </div>

                {/* History timeline */}
                {active.history && active.history.length > 0 && (
                  <div style={{ marginBottom:22 }}>
                    <label style={{ fontSize:11, color:K.muted, display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Historikk</label>
                    <div style={{ borderLeft:`2px solid ${K.border}`, paddingLeft:18 }}>
                      {[...active.history].reverse().map((h, i) => (
                        <div key={i} style={{ marginBottom:14, position:'relative' }}>
                          <div style={{
                            position:'absolute', left:-23, top:4, width:10, height:10,
                            borderRadius:'50%', background:K.accent, border:`2px solid ${K.card}`,
                            boxShadow:'0 0 8px rgba(79,143,255,0.3)',
                          }} />
                          <div style={{ fontSize:13, fontWeight:600, color:K.text }}>{h.action}</div>
                          <div style={{ fontSize:11, color:K.muted, marginTop:2 }}>{fmtDate(h.date)} · {h.by}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!active && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:K.muted }}>
              <div style={{ textAlign:'center' }}>
                <Users size={44} strokeWidth={1} style={{ marginBottom:14, opacity:0.5 }} />
                <p style={{ fontSize:14 }}>Velg en kandidat fra listen</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BRANSJE-ANALYSE ═══ */}
      {tab === 'bransje' && (
        <div style={{ padding:24, maxWidth:920, margin:'0 auto' }}>
          <h2 style={{ fontWeight:700, fontSize:22, margin:'0 0 24px 0', letterSpacing:-0.3 }}>Bransje-analyse</h2>

          {/* Chart */}
          <div style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${K.border}`, marginBottom:28 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={industryStats}>
                <XAxis dataKey="cat" tick={{ fontSize:11, fontFamily:'"Inter", -apple-system, sans-serif', fill:K.muted }} axisLine={{stroke:K.border}} tickLine={false} />
                <YAxis tick={{ fontSize:11, fontFamily:'"Inter", -apple-system, sans-serif', fill:K.muted }} axisLine={{stroke:K.border}} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:K.card, border:`1px solid ${K.border}`, borderRadius:10, fontFamily:'"Inter", -apple-system, sans-serif', fontSize:12, color:K.text }}
                  cursor={{ fill:'rgba(79,143,255,0.05)' }}
                />
                <Bar dataKey="total" name="Totalt" radius={[6,6,0,0]}>
                  {industryStats.map((s,i) => (
                    <Cell key={i} fill={s.interested > 0 ? K.green : K.muted} />
                  ))}
                </Bar>
                <Bar dataKey="interested" name="Interessert" fill={K.accent} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail cards per industry */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {industryStats.map(s => {
              const score = (
                (s.contacted > 0 ? (s.contacted / s.total) * 25 : 0) +
                (s.interested > 0 ? (s.interested / s.contacted) * 30 : 0) +
                (s.avgFit > 0 ? (s.avgFit / 10) * 25 : 0) +
                (s.want ? 20 : 0)
              );
              return (
                <div key={s.cat} style={{
                  background:K.card, borderRadius:12, padding:18, border:`1px solid ${K.border}`,
                  transition:'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,143,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = K.border}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <h3 style={{ fontWeight:700, fontSize:16, margin:0 }}>{s.cat}</h3>
                    <span style={{
                      padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                      background: score > 50 ? 'rgba(52,211,153,0.12)' : score > 25 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)',
                      color: score > 50 ? K.green : score > 25 ? K.yellow : K.red,
                    }}>
                      Score: {Math.round(score)}
                    </span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:14, marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:10, color:K.muted, textTransform:'uppercase', letterSpacing:0.5 }}>Totalt</div>
                      <div style={{ fontSize:20, fontWeight:800, marginTop:2 }}>{s.total}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:K.muted, textTransform:'uppercase', letterSpacing:0.5 }}>Kontaktet</div>
                      <div style={{ fontSize:20, fontWeight:800, marginTop:2 }}>{s.contacted}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:K.muted, textTransform:'uppercase', letterSpacing:0.5 }}>Interessert</div>
                      <div style={{ fontSize:20, fontWeight:800, color:K.green, marginTop:2 }}>{s.interested}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:K.muted, textTransform:'uppercase', letterSpacing:0.5 }}>Snitt fit</div>
                      <div style={{ fontSize:20, fontWeight:800, color:s.avgFit>=7?K.green:s.avgFit>=4?K.yellow:K.muted, marginTop:2 }}>{s.avgFit||'—'}</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:6, background:K.border, borderRadius:3, overflow:'hidden', marginBottom:14 }}>
                    <div style={{
                      height:'100%', borderRadius:3, transition:'width 0.4s',
                      width:`${Math.min(score, 100)}%`,
                      background: score > 50 ? K.green : score > 25 ? K.yellow : K.red,
                      boxShadow: score > 50 ? `0 0 10px rgba(52,211,153,0.3)` : 'none',
                    }} />
                  </div>
                  {/* Want to work toggle */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={() => {
                      const next = { ...wantToWork, [s.cat]: !wantToWork[s.cat] };
                      setWantToWork(next);
                      saveToFirestore('wanttowork', next);
                    }} style={{
                      padding:'6px 14px', borderRadius:8, border:`1px solid ${wantToWork[s.cat] ? K.green : K.border}`, cursor:'pointer',
                      background: wantToWork[s.cat] ? 'rgba(52,211,153,0.12)' : 'transparent',
                      color: wantToWork[s.cat] ? K.green : K.muted,
                      fontSize:12, fontFamily:'"Inter", -apple-system, sans-serif', fontWeight:500,
                      transition:'all 0.2s',
                    }}>
                      {wantToWork[s.cat] ? '♥ Ja, vil jobbe med denne' : '○ Lyst til å jobbe med denne?'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendation (if 30+ contacted) */}
          {contacted.length >= 30 && (
            <div style={{
              marginTop:28, padding:22, background:`linear-gradient(135deg, ${K.accent}, #3b6fd9)`, borderRadius:14, color:'#fff',
              boxShadow:'0 8px 30px rgba(79,143,255,0.3)',
            }}>
              <h3 style={{ fontWeight:700, fontSize:18, margin:'0 0 12px 0' }}>
                Bransjevalg-anbefaling
              </h3>
              <p style={{ fontSize:13, lineHeight:1.6, opacity:0.95 }}>
                Basert på {contacted.length} kontaktede bedrifter, bør dere vurdere{' '}
                <strong>{industryStats.sort((a,b) => {
                  const scoreA = (a.contacted/a.total)*25 + (a.interested/Math.max(a.contacted,1))*30 + (a.avgFit/10)*25 + (a.want?20:0);
                  const scoreB = (b.contacted/b.total)*25 + (b.interested/Math.max(b.contacted,1))*30 + (b.avgFit/10)*25 + (b.want?20:0);
                  return scoreB - scoreA;
                })[0]?.cat}</strong> som pilotbransje.
              </p>
            </div>
          )}

          {contacted.length < 30 && (
            <div style={{
              marginTop:28, padding:18, background:K.surface, borderRadius:12, border:`1px dashed ${K.border}`,
              textAlign:'center', color:K.muted, fontSize:13,
            }}>
              Bransjevalg-anbefaling låses opp etter 30 kontaktede ({contacted.length}/30)
            </div>
          )}
        </div>
      )}

      {/* ═══ UKE ═══ */}
      {tab === 'uke' && (
        <div style={{ padding:24, maxWidth:920, margin:'0 auto' }}>
          <h2 style={{ fontWeight:700, fontSize:22, margin:'0 0 24px 0', letterSpacing:-0.3 }}>Ukentlig oppsummering</h2>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
            <div style={{ background:K.card, borderRadius:12, padding:18, border:`1px solid ${K.border}` }}>
              <div style={{ fontSize:11, color:K.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Kontaktet denne uken</div>
              <div style={{ fontSize:34, fontWeight:800, color:K.accent }}>{thisWeek.length}</div>
            </div>
            <div style={{ background:K.card, borderRadius:12, padding:18, border:`1px solid ${K.border}` }}>
              <div style={{ fontSize:11, color:K.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Dager siden siste aktivitet</div>
              <div style={{ fontSize:34, fontWeight:800, color: daysSinceActivity > 2 ? K.red : K.green }}>
                {daysSinceActivity}
              </div>
            </div>
            <div style={{ background:K.card, borderRadius:12, padding:18, border:`1px solid ${K.border}` }}>
              <div style={{ fontSize:11, color:K.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>Momentum</div>
              <div style={{ fontSize:20, fontWeight:700, display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                {thisWeek.length >= 5 ? (
                  <><TrendingUp size={22} color={K.green}/> <span style={{color:K.green}}>Bra driv!</span></>
                ) : thisWeek.length >= 2 ? (
                  <><ArrowRight size={22} color={K.yellow}/> <span style={{color:K.yellow}}>Steady</span></>
                ) : (
                  <><AlertCircle size={22} color={K.red}/> <span style={{color:K.red}}>Trenger fart</span></>
                )}
              </div>
            </div>
          </div>

          {/* Activity by person */}
          <div style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${K.border}`, marginBottom:28 }}>
            <h3 style={{ fontWeight:700, fontSize:16, margin:'0 0 18px 0' }}>Per person</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {['Elian','Ulrik'].map(person => {
                const personCandidates = candidates.filter(c => c.owner === person);
                const personContacted = personCandidates.filter(c => c.status !== 'ikke-kontaktet');
                const personThisWeek = thisWeek.filter(c => c.owner === person);
                return (
                  <div key={person} style={{ padding:18, background:K.surface, borderRadius:10, border:`1px solid ${K.border}` }}>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:10, color:K.accent }}>{person}</div>
                    <div style={{ fontSize:13, color:K.muted, lineHeight:2 }}>
                      Totalt: <span style={{color:K.text, fontWeight:600}}>{personCandidates.length}</span><br/>
                      Kontaktet: <span style={{color:K.text, fontWeight:600}}>{personContacted.length}</span><br/>
                      Denne uken: <span style={{color:K.text, fontWeight:600}}>{personThisWeek.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div style={{ background:K.card, borderRadius:14, padding:22, border:`1px solid ${K.border}` }}>
            <h3 style={{ fontWeight:700, fontSize:16, margin:'0 0 18px 0' }}>Siste aktivitet</h3>
            {candidates.filter(c => c.history?.length > 0)
              .flatMap(c => c.history.map(h => ({ ...h, candidate: c.name })))
              .sort((a,b) => b.date.localeCompare(a.date))
              .slice(0, 10)
              .map((h, i) => (
                <div key={i} style={{
                  padding:'10px 0', borderBottom: i < 9 ? `1px solid ${K.border}` : 'none',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <div>
                    <span style={{ fontWeight:600, color:K.text }}>{h.candidate}</span>
                    <span style={{ color:K.muted }}> — {h.action}</span>
                  </div>
                  <div style={{ fontSize:11, color:K.muted }}>{fmtDate(h.date)} · {h.by}</div>
                </div>
              ))}
            {candidates.filter(c => c.history?.length > 0).length === 0 && (
              <p style={{ color:K.muted, textAlign:'center', fontSize:14, padding:20 }}>Ingen aktivitet registrert ennå</p>
            )}
          </div>

          {/* Reminder */}
          {daysSinceActivity > 2 && (
            <div style={{
              marginTop:28, padding:18, background:'rgba(248,113,113,0.08)', borderRadius:12, border:`1px solid rgba(248,113,113,0.2)`,
              textAlign:'center', fontSize:14, color:K.red,
            }}>
              Det har gått {daysSinceActivity} dager. Ring én person i dag — det tar 2 minutter.
            </div>
          )}
        </div>
      )}

      {/* Mantra */}
      <div style={{
        padding:'18px 24px', borderTop:`1px solid ${K.border}`,
        textAlign:'center', background:K.card,
        position: tab === 'kandidater' ? 'fixed' : 'relative',
        bottom:0, left:0, right:0,
      }}>
        <p style={{
          fontFamily:'"Inter", -apple-system, sans-serif', fontStyle:'italic', fontSize:13,
          color:K.muted, margin:0, lineHeight:1.5, fontWeight:400, opacity:0.8,
        }}>
          «Hvor lite kan jeg si, og likevel få denne personen til å fortelle meg sannheten om hverdagen sin?»
        </p>
      </div>

      {/* Add Modal */}
      {showAdd && <AddModal user={identity} onAdd={addCandidate} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
