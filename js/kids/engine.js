// Mode Enfant : moteur de séance, scores par mot et répétition espacée.
// Fonctions pures (sans DOM ni stockage) pour pouvoir les tester.
//
// Principes du cahier des charges :
//   compréhension → interaction → répétition → production → réutilisation ;
//   jamais de correction négative : une erreur déclenche un modèle (« Here! Ball! »), pas un « non » ;
//   un mot n'est acquis qu'avec de la stabilité (réussites sur plusieurs jours) et de la généralisation.

export const MIN = 60 * 1000;
export const DAY = 24 * 60 * MIN;

// Paliers de révision : quelques minutes, puis 1, 3, 7, 14 et 30 jours.
export const STEPS = [10 * MIN, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];

export const SCORE_KEYS = ['comp', 'recog', 'prod', 'pron', 'stab', 'gen', 'spont'];
export const SCORE_LABELS = {
  comp: 'Compréhension', recog: 'Reconnaissance', prod: 'Production', pron: 'Prononciation',
  stab: 'Stabilité', gen: 'Généralisation', spont: 'Utilisation spontanée',
};

// Catégories de réponse orale (mêmes noms que la future reconnaissance vocale).
// MVP : c'est le parent qui choisit ; « probable_match » sera réservé à la reconnaissance automatique.
export const SPEECH = ['exact_match', 'probable_match', 'approximate_match', 'child_attempt', 'no_response'];

export function newWordState() {
  return {
    comp: 0, recog: 0, prod: 0, pron: 0, stab: 0, gen: 0, spont: 0,
    step: 0, seen: 0, successes: 0, lastSeen: 0, lastSuccessDay: null, nextReview: 0, introduced: 0,
  };
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

// Points gagnés selon le type d'activité et le résultat. Une aide (modèle) ne retire rien.
const GAINS = {
  discover: { exposure: { comp: 5 } },
  find: { success: { comp: 15, recog: 12 }, helped: { comp: 3 }, no_response: { comp: 2 } },
  touch: { success: { comp: 6 } },
  say: {
    exact_match: { prod: 25, pron: 18 },
    probable_match: { prod: 20, pron: 12 },
    approximate_match: { prod: 15, pron: 6 },
    child_attempt: { prod: 8 },
    no_response: {},
  },
  generalize: { success: { gen: 25, comp: 5 }, helped: { gen: 3 }, no_response: {} },
  mission: { done: { gen: 12, spont: 8 } },
  spontaneous: { said: { spont: 30, prod: 10 } },
};

// Met à jour l'état d'un mot après une activité. Renvoie un nouvel objet.
export function applyOutcome(prev, activity, result, now = Date.now()) {
  const s = { ...newWordState(), ...prev };
  const gain = GAINS[activity]?.[result] || {};
  for (const [k, v] of Object.entries(gain)) s[k] = clamp(s[k] + v);
  s.seen += 1;
  s.lastSeen = now;
  if (activity === 'discover' && !s.introduced) s.introduced = now;

  // Seules les questions de compréhension (trouver, généraliser) font avancer la répétition espacée.
  if (activity === 'find' || activity === 'generalize') {
    if (result === 'success') {
      s.successes += 1;
      const today = dayKey(now);
      // La stabilité demande des réussites sur des jours différents : une seule séance ne suffit pas.
      if (s.lastSuccessDay !== today) {
        s.step = Math.min(STEPS.length - 1, s.step + (s.lastSuccessDay === null ? 0 : 1));
        s.lastSuccessDay = today;
      }
    } else {
      // Pas de punition visible : on revoit simplement le mot plus tôt.
      s.step = Math.max(0, s.step - 1);
    }
    s.stab = clamp((s.step / (STEPS.length - 1)) * 100);
  }
  s.nextReview = now + STEPS[s.step];
  return s;
}

// Où en est l'enfant avec ce mot (pour le parent).
export function wordStatus(s) {
  if (!s || !s.seen) return 'new';
  if (s.comp >= 60 && s.stab >= 40 && s.gen >= 20) return 'acquired';
  if (s.comp >= 30) return 'understood';
  return 'discovering';
}

export const STATUS_LABELS = {
  new: 'Pas encore vu', discovering: 'Découverte', understood: 'Comprend', acquired: 'Acquis',
};

export function ageInMonths(birth, now = Date.now()) {
  if (!birth) return null;
  const [y, m] = String(birth).split('-').map(Number);
  if (!y || !m) return null;
  const d = new Date(now);
  return (d.getUTCFullYear() - y) * 12 + (d.getUTCMonth() + 1 - m);
}

// Nombre d'images proposées : 2 au début, jusqu'à 4 quand le mot est stable (3 au plus avant 3 ans).
export function choiceCount(state, ageMonths) {
  const max = ageMonths !== null && ageMonths !== undefined && ageMonths < 36 ? 3 : 4;
  const stab = state?.stab || 0;
  const n = stab >= 60 ? 4 : stab >= 20 || (state?.comp || 0) >= 45 ? 3 : 2;
  return Math.min(n, max);
}

// Mélange déterministe si on fournit rand (tests), aléatoire sinon.
export function shuffle(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Images proposées pour « Where is the X? » : la cible + des mots différents (déjà vus de préférence).
export function pickChoices(target, words, progress, n, rand = Math.random) {
  const others = words.filter((w) => w.id !== target.id && w.emoji[0] !== target.emoji[0]);
  const seen = shuffle(others.filter((w) => progress[w.id]?.seen), rand);
  const rest = shuffle(others.filter((w) => !progress[w.id]?.seen), rand);
  // Éviter deux personnes ensemble (papa / maman / bébé se ressemblent trop en emoji).
  const picked = [];
  for (const w of [...seen, ...rest]) {
    if (picked.length >= n - 1) break;
    if (target.person && w.person) continue;
    if (w.person && picked.some((p) => p.person)) continue;
    picked.push(w);
  }
  return shuffle([target, ...picked], rand);
}

// Combien de nouveaux mots aujourd'hui : 1 à 3 selon la durée, moins si des mots récents sont encore fragiles.
export function newWordBudget(profile, words, progress) {
  const minutes = profile.sessionMinutes || 3;
  let budget = minutes <= 3 ? 1 : minutes <= 5 ? 2 : 3;
  const fragile = words.filter((w) => {
    const s = progress[w.id];
    return s?.seen && wordStatus(s) === 'discovering';
  }).length;
  if (fragile >= 4) budget = 0;
  else if (fragile >= 2) budget = Math.min(budget, 1);
  return budget;
}

// Ordre d'introduction : palier, puis centres d'intérêt de l'enfant, puis ordre de la liste.
export function nextNewWords(profile, words, progress, count) {
  const interests = new Set(profile.interests || []);
  return words
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => !progress[w.id]?.seen)
    .sort((a, b) => a.w.tier - b.w.tier || (interests.has(b.w.category) - interests.has(a.w.category)) || a.i - b.i)
    .slice(0, count)
    .map(({ w }) => w);
}

// Mots à revoir : ceux dont la date est passée, les plus en retard d'abord.
export function dueWords(words, progress, now = Date.now(), max = 3) {
  return words
    .filter((w) => progress[w.id]?.seen && progress[w.id].nextReview <= now)
    .sort((a, b) => progress[a.id].nextReview - progress[b.id].nextReview)
    .slice(0, max);
}

export function pickMission(missions, words, progress, missionLog = {}, rand = Math.random) {
  // Une mission n'est proposée que si l'enfant a déjà rencontré au moins un de ses mots.
  const ready = missions.filter((m) => m.words.some((id) => progress[id]?.seen));
  if (!ready.length) return null;
  const sorted = shuffle(ready, rand).sort((a, b) => (missionLog[a.id]?.done || 0) - (missionLog[b.id]?.done || 0));
  return sorted[0];
}

// Construit la liste des étapes d'une séance (2 à 7 minutes).
//   rituel → réactivation → nouveaux mots → compréhension → action → production (facultative)
//   → réutilisation / généralisation → mission → conclusion.
export function buildSession({ profile, words, progress = {}, missions = [], missionLog = {}, now = Date.now(), rand = Math.random }) {
  const age = ageInMonths(profile.birth, now);
  const steps = [{ type: 'hello' }];
  const minutes = profile.sessionMinutes || 3;

  const review = dueWords(words, progress, now, minutes <= 3 ? 2 : 3);
  for (const w of review) {
    steps.push({ type: 'find', word: w.id, choices: pickChoices(w, words, progress, choiceCount(progress[w.id], age), rand).map((c) => c.id), review: true });
  }

  const fresh = nextNewWords(profile, words, progress, newWordBudget(profile, words, progress));
  // Si rien n'est à revoir ni à découvrir, on consolide les mots les moins stables.
  const consolidate = !review.length && !fresh.length
    ? words.filter((w) => progress[w.id]?.seen).sort((a, b) => progress[a.id].stab - progress[b.id].stab).slice(0, 2)
    : [];

  for (const w of fresh) steps.push({ type: 'discover', word: w.id });
  for (const w of [...fresh, ...consolidate]) {
    // Un mot tout neuf : 2 images seulement, pour réussir sans deviner au hasard.
    const n = fresh.includes(w) ? 2 : choiceCount(progress[w.id], age);
    steps.push({ type: 'find', word: w.id, choices: pickChoices(w, words, progress, n, rand).map((c) => c.id) });
  }

  const focus = [...fresh, ...consolidate, ...review];
  if (focus.length) steps.push({ type: 'touch', word: focus[0].id });

  // Production seulement pour un mot déjà un peu compris (à partir de 2 ans), jamais exigée.
  const sayable = focus.find((w) => (progress[w.id]?.comp || 0) >= 20 || review.includes(w));
  if (sayable && (age === null || age >= 24) && minutes >= 3) steps.push({ type: 'say', word: sayable.id });

  // Généralisation : le même mot sous une autre image (si le mot a des variantes).
  const gen = [...review, ...consolidate, ...fresh].find((w) => w.emoji.length > 1);
  if (gen) {
    const variant = 1 + Math.floor(rand() * (gen.emoji.length - 1));
    const n = Math.max(2, Math.min(3, choiceCount(progress[gen.id], age)));
    steps.push({ type: 'generalize', word: gen.id, variant, choices: pickChoices(gen, words, progress, n, rand).map((c) => c.id) });
  }

  // Mission : seulement si l'enfant connaît déjà un mot de la mission (ou vient de le découvrir).
  const known = { ...progress };
  for (const w of fresh) known[w.id] = { ...newWordState(), seen: 1 };
  const mission = minutes >= 3 || review.length ? pickMission(missions, words, known, missionLog, rand) : null;
  if (mission) steps.push({ type: 'mission', mission: mission.id });

  steps.push({ type: 'bye' });
  return steps;
}

// Conseils du jour pour le parent (un par jour, en boucle).
export const PARENT_TIPS = [
  'Dites le mot anglais dans la vraie situation : au bain, montrez le canard et dites « Duck! ».',
  'Pas besoin de corriger : s’il dit « baba » pour « banana », répondez simplement « Yes, banana! ».',
  'Courtes et régulières : deux ou trois minutes par jour valent mieux qu’une longue séance.',
  'Laissez-lui le temps de répondre : comptez lentement jusqu’à cinq avant d’aider.',
  'Montrez du doigt en disant le mot : le geste aide à comprendre avant de savoir dire.',
  'Répétez le même mot dans plusieurs situations : la balle au parc, la balle dans le bain, la balle en image.',
  'Arrêtez dès qu’il se lasse : une séance doit finir sur un bon moment.',
  'Chantez : une comptine simple en anglais réutilise les mots sans effort.',
  'Il comprend souvent bien avant de parler : c’est normal que la production arrive plus tard.',
  'Félicitez l’effort (« Good try! ») autant que la réussite.',
];

export function tipOfTheDay(now = Date.now()) {
  return PARENT_TIPS[Math.floor(now / DAY) % PARENT_TIPS.length];
}

// Résumé de la semaine pour le tableau de bord parent.
export function weeklySummary(history = [], progress = {}, words = [], now = Date.now()) {
  const since = now - 7 * DAY;
  const week = history.filter((h) => h.at >= since);
  const newWords = words.filter((w) => (progress[w.id]?.introduced || 0) >= since).map((w) => w.id);
  const missions = week.flatMap((h) => h.missionsDone || []);
  return {
    sessions: week.length,
    minutes: Math.round(week.reduce((t, h) => t + (h.duration || 0), 0) / MIN),
    newWords,
    missions,
  };
}
