// Recherche d'un mot dans la base de Lingua (paquets officiels + mots ajoutés),
// pour éviter les doublons et proposer une traduction déjà vérifiée.

import { alternatives, normalize, levenshtein } from './text.js';

// Toutes les formes sous lesquelles on peut chercher une carte, selon la langue de la saisie.
function formsOf(card, side) {
  const raw = side === 'fr' ? alternatives(card.fr) : [...alternatives(card.term), ...(card.translit ? alternatives(card.translit) : [])];
  return [...new Set(raw.map(normalize).filter(Boolean))];
}

// side : 'fr' (la saisie est en français) ou 'target' (dans la langue étudiée).
// Renvoie les correspondances exactes, puis les mots proches (fautes de frappe, mot contenu dans une expression).
export function findInBase(query, cards, side) {
  const q = normalize(query);
  if (!q) return { exact: [], close: [] };
  const exact = [];
  const close = [];
  for (const card of cards) {
    const forms = formsOf(card, side);
    if (forms.includes(q)) {
      exact.push(card);
      continue;
    }
    const tolerance = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
    const near = forms.some((f) => (tolerance && levenshtein(f, q) <= tolerance)
      || (q.length >= 3 && f.split(' ').includes(q)));
    if (near) close.push(card);
  }
  return { exact, close: close.slice(0, 5) };
}

// Traduction proposée à partir des cartes trouvées (sans doublon).
export function translationsFrom(cards, side) {
  const out = [];
  for (const c of cards) {
    const t = side === 'fr' ? c.term : c.fr;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

// Une écriture non latine (devanagari, arabe…) dans la saisie ?
export function hasNonLatin(text) {
  return /[֐-ࣿऀ-෿]/.test(text);
}
