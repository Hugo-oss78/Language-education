// TOEIC blanc : fonctions pures (questions à plat, score estimé, niveau CECRL). Testées.
//
// Faits officiels utilisés (vérifiés) :
//   - 7 parties ; écoute (parties 1 à 4) puis lecture (parties 5 à 7) ;
//   - chaque section est notée de 5 à 495 par paliers de 5, total de 10 à 990 ;
//   - seuils minimaux ETS par niveau du CECRL (document « Mapping the TOEIC tests on the CEFR ») :
//       écoute : A1 60, A2 110, B1 275, B2 400, C1 490 ; lecture : A1 60, A2 115, B1 275, B2 385, C1 455.
//
// Ce qui est une estimation de Lingua (pas une règle ETS) : le passage du nombre de bonnes réponses
// au score. ETS utilise pour chaque version du test une table de conversion non publique ;
// ici on fait une conversion linéaire, avec une fourchette qui tient compte du petit nombre de questions.

export const PARTS = {
  1: { section: 'L', name: 'Photographies', en: 'Photographs', desc: 'Quatre phrases entendues sur une image : choisis celle qui la décrit.' },
  2: { section: 'L', name: 'Questions-réponses', en: 'Question-Response', desc: 'Une question ou une phrase, puis trois réponses : choisis la plus logique.' },
  3: { section: 'L', name: 'Conversations', en: 'Conversations', desc: 'Une conversation entre deux personnes, puis trois questions écrites.' },
  4: { section: 'L', name: 'Exposés', en: 'Talks', desc: 'Une annonce ou un message, puis trois questions écrites.' },
  5: { section: 'R', name: 'Phrases à compléter', en: 'Incomplete Sentences', desc: 'Grammaire et vocabulaire : le mot qui manque.' },
  6: { section: 'R', name: 'Textes à compléter', en: 'Text Completion', desc: 'Un texte à trous, dont une phrase entière à insérer.' },
  7: { section: 'R', name: 'Compréhension écrite', en: 'Reading Comprehension', desc: 'Un ou plusieurs documents (e-mail, annonce, messagerie…), puis des questions.' },
};

export const CEFR_MIN = {
  L: [['C1', 490], ['B2', 400], ['B1', 275], ['A2', 110], ['A1', 60]],
  R: [['C1', 455], ['B2', 385], ['B1', 275], ['A2', 115], ['A1', 60]],
};

export const LETTERS = ['A', 'B', 'C', 'D'];

// Toutes les questions du test, dans l'ordre, avec leur partie et leur ensemble (conversation, texte…).
export function flatten(test) {
  const out = [];
  for (const p of test.parts) {
    const section = PARTS[p.part].section;
    if (p.items) {
      for (const it of p.items) {
        const options = it.statements || it.responses || it.options;
        out.push({ id: it.id, part: p.part, section, set: it.id, item: it, options, answer: it.answer, explain: it.explain });
      }
    } else {
      for (const s of p.sets) {
        s.questions.forEach((q, i) => out.push({
          id: `${s.id}-${i + 1}`, part: p.part, section, set: s.id, setRef: s, index: i, item: q, options: q.options, answer: q.answer, explain: q.explain,
        }));
      }
    }
  }
  out.forEach((q, i) => { q.number = i + 1; });
  return out;
}

// Les « écrans » du test : une question seule (parties 1, 2, 5) ou un ensemble de questions (3, 4, 6, 7).
export function screens(questions) {
  const list = [];
  for (const q of questions) {
    const last = list[list.length - 1];
    if (last && last.set === q.set) last.questions.push(q);
    else list.push({ set: q.set, part: q.part, section: q.section, questions: [q] });
  }
  return list;
}

const round5 = (n) => Math.round(n / 5) * 5;
const clamp = (n) => Math.max(5, Math.min(495, n));

// Score estimé d'une section : conversion linéaire de 5 à 495, avec une fourchette d'environ ±1 écart type
// (l'incertitude d'un pourcentage mesuré sur peu de questions).
export function sectionScore(correct, total) {
  if (!total) return null;
  const p = correct / total;
  const score = clamp(round5(5 + p * 490));
  // Avec 25 questions, la marge est large ; on garde au moins ±25 points même à 0 % ou 100 %.
  const se = Math.max(Math.sqrt((p * (1 - p)) / total), 0.05);
  const low = clamp(round5(5 + (p - se) * 490));
  const high = clamp(round5(5 + (p + se) * 490));
  return { correct, total, score, low, high };
}

export function cefr(section, score) {
  for (const [level, min] of CEFR_MIN[section]) if (score >= min) return level;
  return 'A1 non atteint';
}

// Résultat complet. answers : { idQuestion: index choisi }.
export function scoreTest(questions, answers) {
  const tally = { L: [0, 0], R: [0, 0] };
  const byPart = {};
  for (const q of questions) {
    const ok = answers[q.id] === q.answer;
    tally[q.section][1]++;
    if (ok) tally[q.section][0]++;
    byPart[q.part] ||= { correct: 0, total: 0 };
    byPart[q.part].total++;
    if (ok) byPart[q.part].correct++;
  }
  const L = tally.L[1] ? { ...sectionScore(...tally.L) } : null;
  const R = tally.R[1] ? { ...sectionScore(...tally.R) } : null;
  if (L) L.cefr = cefr('L', L.score);
  if (R) R.cefr = cefr('R', R.score);
  const total = L && R ? { score: L.score + R.score, low: L.low + R.low, high: L.high + R.high } : null;
  return { L, R, total, byPart };
}

// La partie la plus faible (pour savoir quoi travailler).
export function weakestPart(byPart) {
  let worst = null;
  for (const [part, v] of Object.entries(byPart)) {
    const rate = v.correct / v.total;
    if (!worst || rate < worst.rate) worst = { part: Number(part), rate };
  }
  return worst;
}

// Ce qui est lu à voix haute pour une question d'écoute.
export function scriptFor(q) {
  const it = q.item;
  if (q.part === 1) return it.statements.map((s, i) => ({ who: 'N', text: `${LETTERS[i]}. ${s}` }));
  if (q.part === 2) return [{ who: 'W', text: it.prompt }, ...it.responses.map((r, i) => ({ who: 'M', text: `${LETTERS[i]}. ${r}` }))];
  const s = q.setRef;
  if (q.part === 3) return s.lines.map((l) => ({ who: l.who, text: l.text }));
  if (q.part === 4) return [{ who: s.who, text: s.text }];
  return [];
}
