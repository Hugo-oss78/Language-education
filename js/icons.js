// Jeu d'icônes maison (trait 24×24) et drapeaux en SVG : rendu identique partout,
// contrairement aux emojis (les drapeaux emoji ne s'affichent pas sous Windows).

const PATHS = {
  // Interface
  globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  speaker: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  flame: '<path d="M12 22c4.4 0 7-3 7-7 0-4.5-3.5-6.5-4.5-11-2 2-3 4-3 6.5-1.2-.8-2-2.2-2-4C7 8.5 5 11.5 5 15c0 4 2.6 7 7 7z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-2 1.5-3 3-5 1.5 2 3 3 3 5 0 1.7-1.3 3-3 3z"/>',
  book: '<path d="M2 4.5h6a4 4 0 0 1 4 4V21a3 3 0 0 0-3-3H2z"/><path d="M22 4.5h-6a4 4 0 0 0-4 4V21a3 3 0 0 1 3-3h7z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 16v-4M13 16V8M18 16V5"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  target: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
  pen: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="M14 6l3 3"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
  cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  lightbulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  // Thèmes de leçon
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L6 14"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
  quote: '<path d="M4 21c3 0 6-2 6-7V5H3v7h4M14 21c3 0 6-2 6-7V5h-7v7h4"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 6v6l4 2"/>',
  question: '<circle cx="12" cy="12" r="9.5"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
  masks: '<path d="M2 4h9v6a4.5 4.5 0 0 1-9 0z"/><path d="M13 9h9v6a4.5 4.5 0 0 1-9 0z"/><path d="M4.5 7.5h1M8 7.5h1M4.5 11.5c.8.8 2.6.8 3.5 0M15.5 12.5h1M19 12.5h1M15.5 17c.9-.8 2.7-.8 3.5 0"/>',
  puzzle: '<path d="M19.4 11H18V7a1 1 0 0 0-1-1h-4V4.6a2.1 2.1 0 1 0-4 0V6H5a1 1 0 0 0-1 1v3.6h1.4a2.1 2.1 0 1 1 0 4H4V19a1 1 0 0 0 1 1h4.4v-1.4a2.1 2.1 0 1 1 4 0V20H17a1 1 0 0 0 1-1v-4h1.4a2 2 0 1 0 0-4z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  scale: '<path d="M12 3v18M7 21h10M3 7h18M6 7l-3 7a3.5 3.5 0 0 0 6 0zM18 7l-3 7a3.5 3.5 0 0 0 6 0z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  mountain: '<path d="m8 3 13 18H3z"/><path d="m5.5 13.5 3.5-2 2 1.5 2.5-2.5 3 1.5"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>',
  compass: '<circle cx="12" cy="12" r="9.5"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5z"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1z"/>',
  wave: '<path d="M2 7c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5-1"/><path d="M2 12.5c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5-1"/><path d="M2 18c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5-1"/>',
  fish: '<path d="M6.5 12c3-5 9-6 13-2.5L22 12l-2.5 2.5c-4 3.5-10 2.5-13-2.5z"/><path d="M6.5 12 2 8v8z"/><path d="M16.5 11h.01"/>',
};

export function icon(name, cls = '') {
  const body = PATHS[name] || PATHS.sparkle;
  return `<svg class="ico${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

export const ICON_NAMES = Object.keys(PATHS);

// Drapeaux simplifiés (ratio 3:2), coins arrondis.
const FLAGS = {
  fr: '<rect width="10" height="20" fill="#2b4fa8"/><rect x="10" width="10" height="20" fill="#f4f1ea"/><rect x="20" width="10" height="20" fill="#d8413a"/>',
  en: '<rect width="30" height="20" fill="#243f8f"/><path d="M0 0l30 20M30 0L0 20" stroke="#f4f1ea" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#d8413a" stroke-width="1.4"/><path d="M15 0v20M0 10h30" stroke="#f4f1ea" stroke-width="6.5"/><path d="M15 0v20M0 10h30" stroke="#d8413a" stroke-width="3.6"/>',
  es: '<rect width="30" height="20" fill="#c8362e"/><rect y="5" width="30" height="10" fill="#f2c230"/>',
  id: '<rect width="30" height="10" fill="#d8413a"/><rect y="10" width="30" height="10" fill="#f4f1ea"/>',
  ne: '<rect width="30" height="20" fill="#16303a"/><path d="M8 1l14 8.6h-9.5L23 19H8z" fill="#c8362e" stroke="#243f8f" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="7" r="1.4" fill="#f4f1ea"/><circle cx="12.5" cy="14.8" r="1.8" fill="#f4f1ea"/>',
  ar: '<rect width="30" height="20" fill="#2e7d4f"/><text x="15" y="14.6" text-anchor="middle" font-family="Georgia, \'Noto Naskh Arabic\', serif" font-size="13" font-weight="700" fill="#f4f1ea">ع</text>',
};

export function flag(code, cls = '') {
  const body = FLAGS[code] || FLAGS.fr;
  return `<svg class="flag-svg${cls ? ` ${cls}` : ''}" viewBox="0 0 30 20" aria-hidden="true"><clipPath id="fc-${code}"><rect width="30" height="20" rx="3.5"/></clipPath><g clip-path="url(#fc-${code})">${body}</g><rect width="30" height="20" rx="3.5" fill="none" stroke="rgb(255 255 255 / 25%)" stroke-width=".8"/></svg>`;
}
