// Choix et construction des exercices.
//
// Principe (difficulté progressive) : on commence par reconnaître un mot (QCM),
// puis on le retrouve en contexte (phrase à trous), puis on le produit soi-même
// (écrire la réponse, comprendre à l'oral). Produire est plus difficile que
// reconnaître, et c'est justement cet effort de rappel qui ancre le mot.

import { alternatives, normalize } from './text.js';

export const KINDS = Object.freeze({
  FLASH: 'flash', // carte à retourner, auto-évaluée
  MCQ_MEANING: 'mcq-meaning', // mot étranger → choisir le sens en français
  MCQ_TERM: 'mcq-term', // français → choisir le mot étranger
  CLOZE_MCQ: 'cloze-mcq', // phrase à trous, choix multiple
  CLOZE_TYPE: 'cloze-type', // phrase à trous, à écrire
  TYPE: 'type', // français → écrire le mot étranger
  LISTEN: 'listen', // écouter → choisir le sens
  ORDER: 'order', // remettre les mots d'une phrase dans l'ordre
  SPEAK: 'speak', // écouter puis répéter à voix haute
});

export const KIND_LABELS = {
  [KINDS.FLASH]: 'Carte',
  [KINDS.MCQ_MEANING]: 'Que veut dire… ?',
  [KINDS.MCQ_TERM]: 'Comment dit-on… ?',
  [KINDS.CLOZE_MCQ]: 'Complète la phrase',
  [KINDS.CLOZE_TYPE]: 'Complète la phrase',
  [KINDS.TYPE]: 'Écris la traduction',
  [KINDS.LISTEN]: 'Écoute',
  [KINDS.ORDER]: 'Remets dans l’ordre',
  [KINDS.SPEAK]: 'À toi de le dire',
};

export function shuffle(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Forme « nue » d'un terme pour le chercher dans une phrase : « to give up » → « give up ».
export function bare(term) {
  return term
    .replace(/[¿?¡!]/g, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/…/g, '')
    .trim()
    .replace(/^(to|a|an|the|el|la|los|las|un|una)\s+/i, '');
}

// Cherche le terme dans la phrase d'exemple et renvoie la phrase coupée en trois.
export function clozeOf(card) {
  if (!card.example) return null;
  const candidates = alternatives(card.term).flatMap((t) => [t, bare(t)]).filter((t) => t.length >= 2);
  candidates.sort((a, b) => b.length - a.length);
  for (const cand of candidates) {
    // Délimiteurs « mot » compatibles avec les écritures non latines.
    const re = new RegExp(`(^|[^\\p{L}\\p{M}])(${escapeRegExp(cand)})(?=$|[^\\p{L}\\p{M}])`, 'iu');
    const m = re.exec(card.example);
    if (m) {
      const start = m.index + m[1].length;
      const answer = m[2];
      return { before: card.example.slice(0, start), answer, after: card.example.slice(start + answer.length) };
    }
  }
  return null;
}

// Propositions de QCM : la bonne réponse + des intrus pris dans le même paquet
// (plus proches, donc plus instructifs), complétés par le reste de la langue.
export function choicesFor(card, pool, field, rand = Math.random, n = 4, correct = null) {
  const value = (c) => (field === 'bare' ? bare(alternatives(c.term)[0]) : c[field]);
  const right = correct ?? value(card);
  const seen = new Set([normalize(right)]);
  const same = shuffle(pool.filter((c) => c.deckId === card.deckId && c.id !== card.id), rand);
  const others = shuffle(pool.filter((c) => c.deckId !== card.deckId), rand);
  const picks = [];
  for (const c of [...same, ...others]) {
    const v = value(c);
    const key = normalize(v);
    if (!v || seen.has(key)) continue;
    seen.add(key);
    picks.push(v);
    if (picks.length === n - 1) break;
  }
  return shuffle([right, ...picks], rand);
}

// Découpe une phrase en mots (la ponctuation reste collée au mot).
export function tokens(sentence) {
  return String(sentence).trim().split(/\s+/).filter(Boolean);
}

// Étiquettes à remettre dans l'ordre : les mots de la phrase, mélangés,
// plus quelques intrus pris dans d'autres phrases quand la carte est déjà bien connue.
export function orderTiles(card, pool, rand = Math.random, extra = 0) {
  const answer = tokens(card.term);
  const words = new Set(answer.map(normalize));
  const intruders = shuffle(pool.filter((c) => c.id !== card.id && c.sentence).flatMap((c) => tokens(c.term)), rand)
    .filter((w) => !words.has(normalize(w)) && words.add(normalize(w)))
    .slice(0, extra);
  let tiles = shuffle([...answer, ...intruders], rand);
  // Évite de proposer la phrase déjà dans le bon ordre.
  if (tiles.length > 1 && tiles.join(' ') === answer.join(' ')) tiles = [...tiles.slice(1), tiles[0]];
  return { answer, tiles };
}

// Choisit l'exercice selon le type de carte et son niveau de maîtrise (réussites d'affilée).
export function pickExercise(state, card, { rand = Math.random, canListen = false, mode = 'auto' } = {}) {
  if (mode === 'flash') return KINDS.FLASH;
  const reps = state?.reps || 0;
  const pick = (pool) => pool[Math.floor(rand() * pool.length)];

  // Lettres d'un alphabet : reconnaître la lettre, puis la retrouver, puis écrire le son.
  if (card.script) {
    if (reps === 0) return KINDS.MCQ_MEANING;
    if (reps === 1) return pick([KINDS.MCQ_TERM, KINDS.MCQ_MEANING]);
    return pick([KINDS.TYPE, KINDS.MCQ_TERM, KINDS.MCQ_MEANING]);
  }

  // Phrases : comprendre, puis construire, puis produire (écrire ou dire).
  if (card.sentence) {
    const typable = card.term.length <= 40 && !card.translit;
    if (reps === 0) return pick([KINDS.MCQ_MEANING, KINDS.ORDER]);
    if (reps === 1) return pick([KINDS.ORDER, canListen ? KINDS.LISTEN : KINDS.ORDER]);
    return pick([KINDS.ORDER, typable ? KINDS.TYPE : KINDS.ORDER, canListen ? KINDS.SPEAK : KINDS.ORDER, canListen ? KINDS.LISTEN : KINDS.MCQ_TERM]);
  }
  const hasCloze = !!clozeOf(card);
  const long = card.term.length > 32; // longues phrases : l'écriture exacte devient frustrante

  let pool;
  if (reps === 0) pool = [KINDS.MCQ_MEANING, KINDS.MCQ_TERM];
  else if (reps === 1) pool = [KINDS.MCQ_TERM, hasCloze ? KINDS.CLOZE_MCQ : KINDS.MCQ_MEANING, canListen ? KINDS.LISTEN : KINDS.MCQ_MEANING];
  else if (reps === 2) pool = [hasCloze ? KINDS.CLOZE_TYPE : KINDS.TYPE, KINDS.TYPE, hasCloze ? KINDS.CLOZE_MCQ : KINDS.MCQ_TERM];
  else pool = [KINDS.TYPE, hasCloze ? KINDS.CLOZE_TYPE : KINDS.TYPE, canListen ? KINDS.LISTEN : KINDS.MCQ_TERM, canListen ? KINDS.SPEAK : KINDS.FLASH];

  if (long) pool = pool.map((k) => (k === KINDS.TYPE || k === KINDS.CLOZE_TYPE ? KINDS.CLOZE_MCQ : k));
  if (!hasCloze) pool = pool.map((k) => (k === KINDS.CLOZE_MCQ || k === KINDS.CLOZE_TYPE ? KINDS.MCQ_TERM : k));
  return pick(pool);
}

// Pour les quiz : un mélange de tous les formats, sans dépendre de la progression.
export function pickQuizExercise(card, { rand = Math.random, canListen = false } = {}) {
  if (card.script) return rand() < 0.5 ? KINDS.MCQ_MEANING : KINDS.MCQ_TERM;
  if (card.sentence) return rand() < 0.6 ? KINDS.ORDER : KINDS.MCQ_MEANING;
  const pool = [KINDS.MCQ_MEANING, KINDS.MCQ_TERM, KINDS.TYPE];
  if (clozeOf(card)) pool.push(KINDS.CLOZE_MCQ, KINDS.CLOZE_TYPE);
  if (canListen) pool.push(KINDS.LISTEN);
  return pool[Math.floor(rand() * pool.length)];
}
