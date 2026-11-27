// Choix de la voix de synthèse : la meilleure voix disponible sur l'appareil, ou celle choisie dans les réglages.
// Partagé par le mode adulte, le Mode Enfant et le TOEIC.
//
// Sur iPhone et Mac, la liste des voix contient aussi des voix « gadget » très robotiques (Eddy, Flo, Fred,
// Albert, Bubbles…) et des voix « compactes » de qualité basse : prendre la première voix venue donne souvent
// un résultat robotique, surtout sur des phrases. On classe donc les voix (qualité, langue exacte) et on écarte
// les voix gadget. Les repères (« premium », « enhanced », « eloquence »…) viennent des identifiants de voix
// des navigateurs ; ils peuvent varier selon l'appareil et la version du système.

const KEY = 'lingua.voices'; // code langue -> identifiant de voix (voiceURI) choisi par l'utilisateur

// Voix de fantaisie ou de l'ancien moteur « Eloquence » (Apple) : à éviter pour apprendre une langue.
const NOVELTY = new Set([
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'good news', 'hysterical',
  'jester', 'organ', 'pipe organ', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'fred', 'junior',
  'kathy', 'ralph', 'princess', 'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
]);

const norm = (lang) => String(lang || '').replace('_', '-').toLowerCase();
const baseName = (v) => String(v.name || '').toLowerCase().replace(/\s*\(.*\)\s*$/, '').trim();

export function isNovelty(v) {
  const uri = String(v.voiceURI || '').toLowerCase();
  return uri.includes('eloquence') || NOVELTY.has(baseName(v));
}

// Note de qualité d'une voix (plus c'est haut, mieux c'est).
export function voiceScore(v, tts) {
  const name = String(v.name || '').toLowerCase();
  const uri = String(v.voiceURI || '').toLowerCase();
  let s = 0;
  // Bon pays (en-GB pour en-GB) : un plus, mais la qualité compte davantage qu'un accent exact.
  if (norm(v.lang) === norm(tts)) s += 40;
  if (/premium/.test(name + uri)) s += 60;
  if (/enhanced|améliorée|amelioree|natural|neural|wavenet/.test(name + uri)) s += 45;
  if (/google/.test(name)) s += 30; // voix réseau de Chrome, en général plus naturelles
  if (/compact/.test(uri)) s -= 15;
  if (v.default) s += 5;
  if (isNovelty(v)) s -= 300;
  return s;
}

// Voix d'une langue, de la meilleure à la moins bonne (même langue, autres pays compris).
export function rankVoices(list, tts) {
  const base = norm(tts).split('-')[0];
  return (list || [])
    .filter((v) => norm(v.lang).split('-')[0] === base)
    .map((v, i) => ({ v, i, s: voiceScore(v, tts) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.v);
}

export function voiceLabel(v) {
  const uri = String(v.voiceURI || '').toLowerCase();
  const name = String(v.name || '');
  const tag = /premium/i.test(name + uri) ? 'premium'
    : /enhanced|améliorée|natural|neural/i.test(name + uri) ? 'améliorée'
      : isNovelty(v) ? 'robotique' : /compact/.test(uri) ? 'compacte' : '';
  return `${name.replace(/\s*\(.*\)\s*$/, '')} · ${v.lang}${tag ? ` · ${tag}` : ''}`;
}

function readSaved() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export function savedVoiceId(code) {
  return readSaved()[code] || null;
}

export function saveVoiceId(code, id) {
  const d = readSaved();
  if (id) d[code] = id; else delete d[code];
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* stockage indisponible */ }
}

// La voix à utiliser : celle choisie dans les réglages si elle existe encore, sinon la mieux classée.
export function pickVoice(list, tts, code) {
  const ranked = rankVoices(list, tts);
  const id = code ? savedVoiceId(code) : null;
  return (id && ranked.find((v) => v.voiceURI === id || v.name === id)) || ranked[0] || null;
}
