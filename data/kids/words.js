// Mode Enfant : base commune à toutes les langues (images, catégories, sens en français, missions).
// Chaque langue (data/kids/<code>.js) donne ses mots, ses phrases modèles et la phrase de chaque mission.
// Les images sont des emoji du système : elles changent selon l'appareil (Apple, Google…).
// emoji : [image principale, variantes pour la généralisation]. Papa et maman n'ont pas de variante :
// ce sont des personnes précises, que l'enfant reconnaît dans la vraie vie (missions), pas sur une autre image.

export const CATEGORIES = {
  toys: { fr: 'Jouets', emoji: '🧸' },
  animals: { fr: 'Animaux', emoji: '🐶' },
  vehicles: { fr: 'Véhicules', emoji: '🚗' },
  food: { fr: 'Manger, boire', emoji: '🍎' },
  family: { fr: 'Famille', emoji: '👪' },
  home: { fr: 'Maison', emoji: '🏠' },
};

export const BASE_WORDS = [
  { id: 'ball', fr: 'la balle', category: 'toys', tier: 1, emoji: ['⚽', '🏀', '🏐'] },
  { id: 'dog', fr: 'le chien', category: 'animals', tier: 1, emoji: ['🐶', '🐕', '🐩'] },
  { id: 'cat', fr: 'le chat', category: 'animals', tier: 1, emoji: ['🐱', '🐈', '🐈‍⬛'] },
  { id: 'car', fr: 'la voiture', category: 'vehicles', tier: 1, emoji: ['🚗', '🚙', '🏎️'] },
  { id: 'duck', fr: 'le canard', category: 'animals', tier: 1, emoji: ['🦆', '🐤'] },
  { id: 'teddy', fr: 'le doudou (nounours)', category: 'toys', tier: 1, emoji: ['🧸'] },
  { id: 'apple', fr: 'la pomme', category: 'food', tier: 1, emoji: ['🍎', '🍏'] },
  { id: 'banana', fr: 'la banane', category: 'food', tier: 1, emoji: ['🍌'] },
  { id: 'milk', fr: 'le lait', category: 'food', tier: 1, emoji: ['🥛', '🍼'], mass: true },
  { id: 'shoe', fr: 'la chaussure', category: 'home', tier: 1, emoji: ['👟', '🥾', '👞'] },
  { id: 'book', fr: 'le livre', category: 'home', tier: 1, emoji: ['📖', '📕', '📚'] },
  { id: 'fish', fr: 'le poisson', category: 'animals', tier: 1, emoji: ['🐟', '🐠', '🐡'] },
  { id: 'bird', fr: 'l’oiseau', category: 'animals', tier: 1, emoji: ['🐦', '🐤', '🦜'] },
  { id: 'baby', fr: 'le bébé', category: 'family', tier: 1, emoji: ['👶', '👶🏽', '👶🏿'], person: true },
  { id: 'cup', fr: 'la tasse, le gobelet', category: 'home', tier: 1, emoji: ['🥤', '☕', '🍵'] },
  { id: 'water', fr: 'l’eau', category: 'food', tier: 1, emoji: ['💧', '🚰'], mass: true },
  { id: 'bed', fr: 'le lit', category: 'home', tier: 1, emoji: ['🛏️'] },
  { id: 'bath', fr: 'le bain', category: 'home', tier: 1, emoji: ['🛁', '🛀'] },
  { id: 'daddy', fr: 'papa', category: 'family', tier: 1, emoji: ['👨'], person: true },
  { id: 'mummy', fr: 'maman', category: 'family', tier: 1, emoji: ['👩'], person: true },
];

// Missions dans la vraie vie : l'enfant réutilise le mot avec le parent, hors de l'écran.
// parent(t) reçoit la phrase de la langue (t.say) et les mots (t.word('ball'), t.yes('ball')).
export const BASE_MISSIONS = [
  {
    id: 'find-ball', words: ['ball'], emoji: '⚽', title: 'Trouve la balle',
    parent: (t) => `Demandez « ${t.say} » et cherchez une vraie balle ensemble. Quand il la trouve : « ${t.yes('ball')} »`,
  },
  {
    id: 'find-shoes', words: ['shoe'], emoji: '👟', title: 'Trouve tes chaussures',
    parent: (t) => `Au moment de sortir, demandez « ${t.say} ». Montrez-les du doigt si besoin, puis : « ${t.yes('shoe')} »`,
  },
  {
    id: 'where-daddy', words: ['daddy', 'mummy'], emoji: '👨', title: 'Où est papa ?',
    parent: (t) => `Demandez « ${t.say} ». Quand il montre la bonne personne : « ${t.yes('daddy')} » (même jeu avec maman : « ${t.word('mummy')} »)`,
  },
  {
    id: 'find-teddy', words: ['teddy'], emoji: '🧸', title: 'Trouve le doudou',
    parent: (t) => `Cachez à moitié son doudou ou un nounours, puis demandez « ${t.say} ». À la découverte : « ${t.yes('teddy')} »`,
  },
  {
    id: 'find-cup', words: ['cup', 'milk', 'water'], emoji: '🥤', title: 'Trouve ton gobelet',
    parent: (t) => `Avant de boire, demandez « ${t.say} », puis nommez la boisson en la montrant : « ${t.word('milk')} » ou « ${t.word('water')} ».`,
  },
];
