// Répétition espacée : variante simplifiée de l'algorithme SM-2 (celui d'Anki),
// avec quatre boutons de réponse.

export const GRADES = Object.freeze({ AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 });

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const MIN_EASE = 1.3;
const START_EASE = 2.5;
const MAX_INTERVAL = 365; // jours

export function newCardState() {
  return { ease: START_EASE, interval: 0, reps: 0, lapses: 0, due: 0, seen: false };
}

export function isNew(state) {
  return !state || !state.seen;
}

export function isDue(state, now = Date.now()) {
  return !isNew(state) && state.due <= now;
}

// Retourne un nouvel état (l'état d'origine n'est jamais modifié).
export function review(state, grade, now = Date.now()) {
  const s = { ...newCardState(), ...state, seen: true };

  if (grade === GRADES.AGAIN) {
    s.lapses += s.reps > 0 ? 1 : 0;
    s.reps = 0;
    s.interval = 0;
    s.ease = Math.max(MIN_EASE, s.ease - 0.2);
    s.due = now + MINUTE; // on la revoit dans la même séance
    return s;
  }

  let interval;
  if (grade === GRADES.HARD) {
    interval = s.reps === 0 ? 1 : s.interval * 1.2;
    s.ease = Math.max(MIN_EASE, s.ease - 0.15);
  } else if (grade === GRADES.GOOD) {
    if (s.reps === 0) interval = 1;
    else if (s.reps === 1) interval = 3;
    else interval = s.interval * s.ease;
  } else if (grade === GRADES.EASY) {
    interval = s.reps === 0 ? 4 : s.interval * s.ease * 1.3;
    s.ease += 0.15;
  } else {
    throw new RangeError(`Note inconnue : ${grade}`);
  }

  // Un intervalle ne recule jamais sur une bonne réponse.
  interval = Math.max(interval, s.interval + (grade === GRADES.HARD ? 0 : 1));
  s.interval = Math.min(MAX_INTERVAL, Math.max(1, Math.round(interval)));
  s.reps += 1;
  s.due = now + s.interval * DAY;
  return s;
}

// Aperçu lisible de l'intervalle obtenu pour chaque bouton.
export function previewIntervals(state, now = Date.now()) {
  return Object.values(GRADES).map((g) => formatDelay(review(state, g, now).due - now));
}

export function formatDelay(ms) {
  if (ms < DAY) return `${Math.max(1, Math.round(ms / MINUTE))} min`;
  const days = Math.round(ms / DAY);
  if (days < 31) return `${days} j`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  return `${(days / 365).toFixed(1).replace('.0', '')} an`;
}

// Une carte est « maîtrisée » quand son intervalle atteint 3 semaines.
export function isMature(state) {
  return !isNew(state) && state.interval >= 21;
}
