// Langues proposées. Pour en ajouter une : créer data/<code>.js (même format que en.js),
// puis l'ajouter ici et dans la liste FILES de sw.js.
//   tts   : code de langue pour la synthèse vocale du navigateur
//   dir   : sens d'écriture ('rtl' pour l'arabe)
//   hue   : couleur d'ambiance de la langue
//   note  : précision affichée sur la page de la langue
export const LANGUAGES = [
  { code: 'en', name: 'Anglais', native: 'English', tts: 'en-GB', dir: 'ltr', hue: '#7fb6d9', available: true },
  { code: 'es', name: 'Espagnol', native: 'Español', tts: 'es-ES', dir: 'ltr', hue: '#f2c230', available: true },
  { code: 'id', name: 'Indonésien', native: 'Bahasa Indonesia', tts: 'id-ID', dir: 'ltr', hue: '#e8604c', available: true },
  {
    code: 'ne', name: 'Népalais', native: 'नेपाली', tts: 'ne-NP', dir: 'ltr', hue: '#e0708a', available: true,
    note: 'Contenu à faire relire par un locuteur natif. Tu peux répondre en devanagari ou en translittération.',
  },
  {
    code: 'ar', name: 'Arabe', native: 'العربية', tts: 'ar-SA', dir: 'rtl', hue: '#4fb07a', available: true,
    note: 'Arabe standard (fuṣḥā) : compris partout, mais chaque pays parle aussi son dialecte. Tu peux répondre en arabe ou en translittération. Contenu à faire relire.',
  },
];

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code);
}
