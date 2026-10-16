// Mode Enfant : assemble la base commune (images, missions) et les mots d'une langue.

import { BASE_WORDS, BASE_MISSIONS, CATEGORIES } from '../../data/kids/words.js';

// Langues proposées aux enfants (même ordre que l'application).
export const KIDS_LANGS = ['en', 'es', 'id', 'ne', 'ar'];

export { CATEGORIES };

// Fonction pure : lang = contenu de data/kids/<code>.js.
export function buildContent(lang) {
  const words = BASE_WORDS.map((base) => {
    const own = lang.words[base.id];
    return { ...base, ...own, a: own.a ?? own.word, the: own.the ?? own.word };
  });
  const byId = Object.fromEntries(words.map((w) => [w.id, w]));
  const P = lang.phrases;
  // Pour le parent : le mot, avec sa transcription s'il s'écrit dans un autre alphabet.
  // Isolé (U+2068…U+2069) pour que l'arabe ne mélange pas l'ordre de la phrase française autour.
  const iso = (text) => `\u2068${text}\u2069`;
  const shown = (w, text) => (w.translit ? `${iso(text)} (${w.translit})` : iso(text));
  const missions = BASE_MISSIONS.map((m) => {
    const say = lang.missions[m.id];
    const parent = m.parent({
      say: iso(say),
      word: (id) => shown(byId[id], byId[id].word),
      yes: (id) => shown(byId[id], P.yes(byId[id])),
    });
    return { id: m.id, words: m.words, emoji: m.emoji, title: m.title, say, parent };
  });
  const missionById = Object.fromEntries(missions.map((m) => [m.id, m]));
  return { code: lang.code, words, byId, missions, missionById, phrases: P, reviewNeeded: !!lang.reviewNeeded };
}

const cache = {};
export async function loadKidsContent(code) {
  const safe = KIDS_LANGS.includes(code) ? code : 'en';
  if (!cache[safe]) {
    const mod = await import(`../../data/kids/${safe}.js`);
    cache[safe] = buildContent(mod.default);
  }
  return cache[safe];
}
