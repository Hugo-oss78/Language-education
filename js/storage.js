// Sauvegarde locale (sur l'appareil) de la progression, des réglages et des paquets perso.

const KEY = 'lingua.v1';

const DEFAULTS = {
  progress: {}, // id de carte -> état SRS
  settings: { direction: 'mixed', newPerDay: 10, typing: false, autoSpeak: false },
  customDecks: {}, // code langue -> [paquets]
  history: {}, // 'AAAA-MM-JJ' -> { reviews, newCards }
};

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return merge(JSON.parse(raw));
  } catch {
    // stockage indisponible (navigation privée…) : on garde les valeurs par défaut
  }
  return structuredClone(DEFAULTS);
}

function merge(saved) {
  const d = structuredClone(DEFAULTS);
  return {
    progress: saved.progress || d.progress,
    settings: { ...d.settings, ...saved.settings },
    customDecks: saved.customDecks || d.customDecks,
    history: saved.history || d.history,
  };
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export const store = {
  get progress() { return data.progress; },
  get settings() { return data.settings; },
  get customDecks() { return data.customDecks; },
  get history() { return data.history; },
};

export function today(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function logReview(wasNew) {
  const day = (data.history[today()] ||= { reviews: 0, newCards: 0 });
  day.reviews += 1;
  if (wasNew) day.newCards += 1;
}

export function newCardsToday() {
  return data.history[today()]?.newCards || 0;
}

// Nombre de jours consécutifs avec au moins une révision (aujourd'hui ou hier inclus).
export function streak(date = new Date()) {
  const d = new Date(date);
  if (!data.history[today(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (data.history[today(d)]?.reviews) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function exportJson() {
  return JSON.stringify({ app: 'lingua', version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (parsed.app !== 'lingua') throw new Error('Ce fichier ne vient pas de Lingua.');
  data = merge(parsed);
  save();
}

export function resetAll() {
  data = structuredClone(DEFAULTS);
  save();
}
