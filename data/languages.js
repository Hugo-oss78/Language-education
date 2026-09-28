// Langues proposées. Pour en ajouter une : créer data/<code>.js (même format que en.js)
// puis passer `available` à true.
//   tts  : code de langue pour la synthèse vocale du navigateur
//   dir  : sens d'écriture ('rtl' pour l'arabe)
export const LANGUAGES = [
  { code: 'en', name: 'Anglais', native: 'English', flag: '🇬🇧', tts: 'en-GB', dir: 'ltr', available: true },
  { code: 'es', name: 'Espagnol', native: 'Español', flag: '🇪🇸', tts: 'es-ES', dir: 'ltr', available: false },
  { code: 'id', name: 'Indonésien', native: 'Bahasa Indonesia', flag: '🇮🇩', tts: 'id-ID', dir: 'ltr', available: false },
  { code: 'ne', name: 'Népalais', native: 'नेपाली', flag: '🇳🇵', tts: 'ne-NP', dir: 'ltr', available: false },
  { code: 'ar', name: 'Arabe', native: 'العربية', flag: 'ع', tts: 'ar', dir: 'rtl', available: false },
];

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code);
}
