// Mode Enfant : sauvegarde locale, séparée de celle des adultes (clé différente).
// Données minimales : prénom ou surnom, mois de naissance, centres d'intérêt, durée de séance.
// Ni photo, ni voix, ni nom de famille. Rien n'est envoyé sur Internet.

const KEY = 'lingua.kids.v1';

export function emptyData() {
  return {
    profiles: [], // [{ id, name, avatar, birth: 'AAAA-MM', native, target, interests, sessionMinutes, createdAt }]
    activeId: null,
    locked: false, // true pendant le mode enfant : on n'en sort que par l'action parentale
    progress: {}, // id profil -> id mot -> état (voir engine.js)
    missions: {}, // id profil -> id mission -> { done, last }
    history: {}, // id profil -> [{ at, duration, words, missionsDone }]
    stickers: {}, // id profil -> [emoji] : le petit monde qui se remplit
  };
}

const HISTORY_MAX = 300;

let data = load();

function load() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY);
    if (raw) return { ...emptyData(), ...JSON.parse(raw) };
  } catch {
    // stockage indisponible : on garde des valeurs vides
  }
  return emptyData();
}

export function kids() {
  return data;
}

export function saveKids() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // stockage plein ou indisponible
  }
}

export function activeProfile(d = data) {
  return d.profiles.find((p) => p.id === d.activeId) || d.profiles[0] || null;
}

export function isLocked() {
  return !!data.locked && data.profiles.length > 0;
}

export function setLocked(on) {
  data.locked = !!on;
  saveKids();
}

// ---------- Fonctions pures (testées) ----------

export function addProfile(d, fields, now = Date.now()) {
  const id = `p${now.toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  const profile = {
    id,
    name: String(fields.name || '').trim().slice(0, 30),
    avatar: fields.avatar || '🦊',
    birth: fields.birth || null,
    native: 'fr',
    target: 'en',
    interests: fields.interests || [],
    sessionMinutes: clampMinutes(fields.sessionMinutes),
    createdAt: now,
  };
  return { ...d, profiles: [...d.profiles, profile], activeId: id };
}

export function updateProfile(d, id, fields) {
  return {
    ...d,
    profiles: d.profiles.map((p) => (p.id === id ? {
      ...p,
      ...fields,
      name: fields.name !== undefined ? String(fields.name).trim().slice(0, 30) : p.name,
      sessionMinutes: fields.sessionMinutes !== undefined ? clampMinutes(fields.sessionMinutes) : p.sessionMinutes,
    } : p)),
  };
}

// Suppression complète : profil, progression, missions, historique et autocollants.
export function removeProfile(d, id) {
  const drop = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => k !== id));
  const profiles = d.profiles.filter((p) => p.id !== id);
  return {
    ...d,
    profiles,
    activeId: d.activeId === id ? profiles[0]?.id || null : d.activeId,
    locked: profiles.length ? d.locked : false,
    progress: drop(d.progress),
    missions: drop(d.missions),
    history: drop(d.history),
    stickers: drop(d.stickers),
  };
}

export function recordSession(d, id, entry) {
  const list = [...(d.history[id] || []), entry].slice(-HISTORY_MAX);
  return { ...d, history: { ...d.history, [id]: list } };
}

function clampMinutes(n) {
  const v = Math.round(Number(n) || 3);
  return Math.max(2, Math.min(7, v));
}

// ---------- Mutations de l'état courant ----------

export function commit(next) {
  data = next;
  saveKids();
  return data;
}
