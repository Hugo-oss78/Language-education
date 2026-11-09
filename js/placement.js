// Test de niveau : trouve le point de départ dans le parcours d'une langue. Fonctions pures, testées.
//
// Principe : un bloc de questions de vocabulaire par niveau (A1, puis A2, B1…), tirées des cartes
// de ce niveau. On passe au niveau suivant si le bloc est réussi (4 sur 5) ; sinon on s'arrête,
// et ce niveau devient le point de départ. Un bouton « Je ne sais pas » évite de répondre au hasard.
// C'est une estimation à partir du vocabulaire de Lingua, pas un test officiel du CECRL.

import { LEVELS } from './path.js';

export const PER_LEVEL = 5;
export const PASS = 4; // bonnes réponses sur 5 pour valider un niveau

function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Première réponse acceptée (« hello / hi » → « hello »), pour l'affichage.
const first = (text) => String(text).split(' / ')[0].trim();

// Mots significatifs d'une réponse (sans accents, articles ni petits mots) pour éviter les pièges ambigus :
// « bonjour » et « bonjour (le matin) », « la tête » et « le mal de tête » ne doivent pas être opposés.
const SMALL = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'the', 'to', 'an', 'is', 'it', 'and', 'et', 'ou', 'en', 'au', 'aux']);
function words(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !SMALL.has(w));
}
const overlap = (a, b) => { const wa = new Set(words(a)); return words(b).some((w) => wa.has(w)); };

// Niveaux couverts par le vocabulaire officiel de la langue (hors alphabet et paquets perso).
export function placementLevels(decks) {
  const vocab = decks.filter((d) => !d.type && !d.custom);
  return LEVELS.filter((lv) => vocab.filter((d) => d.level === lv).flatMap((d) => d.cards).length >= PER_LEVEL + 3);
}

// Questions d'un niveau : la moitié « Que veut dire… ? », l'autre « Comment dit-on… ? ».
export function levelQuestions(decks, level, rand = Math.random) {
  const pool = decks.filter((d) => !d.type && !d.custom && d.level === level).flatMap((d) => d.cards);
  const picked = shuffle(pool, rand).slice(0, PER_LEVEL);
  return picked.map((card, i) => {
    const toFr = i % 2 === 0; // on montre le mot étranger, on cherche le sens
    const shown = toFr ? first(card.term) : first(card.fr);
    const answer = toFr ? first(card.fr) : first(card.term);
    const others = shuffle(pool.filter((c) => c !== card), rand)
      // Pas de proposition qui ressemble trop à la bonne réponse (ni dans un sens, ni dans l'autre).
      .filter((c) => !overlap(c.fr, card.fr) && !overlap(c.term, card.term))
      .map((c) => (toFr ? first(c.fr) : first(c.term)))
      .filter((t, k, arr) => t !== answer && arr.indexOf(t) === k)
      .slice(0, 3);
    const options = shuffle([answer, ...others], rand);
    return {
      level,
      card,
      toFr,
      prompt: toFr ? 'Que veut dire…' : 'Comment dit-on…',
      shown,
      translit: toFr ? card.translit || null : null,
      options,
      answer: options.indexOf(answer),
      // Translittération des options en langue étrangère (népalais, arabe).
      optionTranslit: toFr ? null : options.map((o) => pool.find((c) => first(c.term) === o)?.translit || null),
    };
  });
}

// results : [{ level, correct, total }] dans l'ordre où les blocs ont été passés.
// Renvoie le niveau de départ et si l'on doit continuer le test.
export function nextAfter(levels, results) {
  const last = results[results.length - 1];
  if (!last) return { done: false, next: levels[0] };
  const passed = last.correct >= PASS;
  const i = levels.indexOf(last.level);
  if (!passed) return { done: true, start: last.level, passedAll: false };
  if (i === levels.length - 1) return { done: true, start: last.level, passedAll: true };
  return { done: false, next: levels[i + 1] };
}

// Les unités du parcours à partir du niveau de départ (l'alphabet reste toujours proposé).
export function unitsFrom(units, start) {
  if (!start) return units;
  const from = LEVELS.indexOf(start);
  return units.filter((u) => u.id === 'alphabet' || LEVELS.indexOf(u.level) >= from);
}

// Les nouvelles cartes : celles du niveau de départ et au-dessus d'abord, les plus faciles ensuite.
export function orderFresh(cards, start) {
  if (!start) return cards;
  const from = LEVELS.indexOf(start);
  const levelOf = (c) => LEVELS.indexOf(c.level);
  return [...cards.filter((c) => c.level === undefined || levelOf(c) >= from), ...cards.filter((c) => c.level !== undefined && levelOf(c) < from)];
}
