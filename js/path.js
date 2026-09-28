// Parcours : le contenu d'une langue découpé en unités courtes et ordonnées.
// Une unité = 2 à 3 thèmes (vocabulaire ou phrases) + un dialogue qui sert d'étape de validation.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const LEVEL_NAMES = { A1: 'Découverte', A2: 'Survie', B1: 'Seuil', B2: 'Avancé', C1: 'Autonome' };

const PER_UNIT = 3; // thèmes par unité (hors dialogue)
export const DIALOGUE_PASS = 67; // score minimal (%) pour valider un dialogue

export function buildPath(decks, dialogues = []) {
  const units = [];
  const deckStep = (d) => ({ type: 'deck', id: d.id });

  const script = decks.filter((d) => d.type === 'script');
  if (script.length) {
    units.push({ id: 'alphabet', title: 'Lire l’alphabet', level: 'A1', steps: script.map(deckStep) });
  }

  for (const level of LEVELS) {
    // Vocabulaire d'abord, puis les phrases qui le réutilisent (les paquets perso restent hors parcours).
    const themes = [
      ...decks.filter((d) => d.level === level && !d.type && !d.custom),
      ...decks.filter((d) => d.level === level && d.type === 'sentences'),
    ];
    const talks = dialogues.filter((x) => x.level === level);
    const chunks = Math.max(Math.ceil(themes.length / PER_UNIT), talks.length ? 1 : 0);
    // Répartition équilibrée (7 thèmes → 3 + 2 + 2) ; les dialogues ferment les dernières unités du niveau.
    const base = Math.floor(themes.length / chunks);
    const extra = themes.length % chunks;
    let start = 0;
    for (let i = 0; i < chunks; i++) {
      const size = base + (i < extra ? 1 : 0);
      const steps = themes.slice(start, start + size).map(deckStep);
      start += size;
      const firstTalk = Math.max(0, chunks - talks.length);
      const mine = i < firstTalk ? [] : i === chunks - 1 ? talks.slice(i - firstTalk) : [talks[i - firstTalk]];
      steps.push(...mine.map((x) => ({ type: 'dialogue', id: x.id })));
      if (!steps.length) continue;
      units.push({
        id: `${level}-${i + 1}`,
        title: chunks > 1 ? `${LEVEL_NAMES[level]} · partie ${i + 1}` : LEVEL_NAMES[level],
        level,
        steps,
      });
    }
  }
  return units.map((u, i) => ({ ...u, number: i + 1 }));
}

// État d'une étape à partir des compteurs de cartes ou du score au dialogue.
//   deckCounts : { learned, total, mature } ; dialogueBest : meilleur score en %.
export function stepStatus(step, { deckCounts, dialogueBest } = {}) {
  if (step.type === 'dialogue') {
    const best = dialogueBest ?? null;
    return { done: best !== null && best >= DIALOGUE_PASS, progress: best === null ? 0 : Math.min(1, best / DIALOGUE_PASS), mastered: best === 100 };
  }
  // Une étape est validée quand chaque carte a été réussie au moins une fois.
  const { learned = 0, total = 0, mature = 0 } = deckCounts || {};
  return {
    done: total > 0 && learned >= total,
    progress: total ? learned / total : 0,
    mastered: total > 0 && mature / total >= 0.8,
  };
}

// Aplatit le parcours et renvoie la première étape non terminée (null si tout est fini).
export function nextStep(units, statusOf) {
  for (const unit of units) {
    for (const step of unit.steps) {
      if (!statusOf(step).done) return { unit, step };
    }
  }
  return null;
}

export function pathProgress(units, statusOf) {
  const steps = units.flatMap((u) => u.steps);
  const done = steps.filter((s) => statusOf(s).done).length;
  return { done, total: steps.length };
}

// L'étape qui suit une étape donnée (pour enchaîner après une validation).
export function stepAfter(units, step) {
  const flat = units.flatMap((u) => u.steps.map((s) => ({ unit: u, step: s })));
  const i = flat.findIndex((x) => x.step.type === step.type && x.step.id === step.id);
  return i >= 0 ? flat[i + 1] || null : null;
}
