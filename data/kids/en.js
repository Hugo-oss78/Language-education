// Mode Enfant : premiers mots d'anglais pour les 2–5 ans (langue maternelle : français).
// Chaque mot : id, word (affiché et prononcé), fr (pour le parent), category, tier (1 = tout premiers mots),
// emoji : [image principale, variantes pour la généralisation], a / the : le mot avec son article
// (« a ball », « the ball »), person : pour « Who's this? », more : phrase de réutilisation si « Another … » sonne faux.
// Les images sont des emoji du système : elles changent selon l'appareil (Apple, Google…).

export const CATEGORIES = {
  toys: { fr: 'Jouets', emoji: '🧸' },
  animals: { fr: 'Animaux', emoji: '🐶' },
  vehicles: { fr: 'Véhicules', emoji: '🚗' },
  food: { fr: 'Manger, boire', emoji: '🍎' },
  family: { fr: 'Famille', emoji: '👪' },
  home: { fr: 'Maison', emoji: '🏠' },
};

export const WORDS = [
  { id: 'ball', word: 'ball', fr: 'la balle', category: 'toys', tier: 1, emoji: ['⚽', '🏀', '🏐'], a: 'a ball', the: 'the ball' },
  { id: 'dog', word: 'dog', fr: 'le chien', category: 'animals', tier: 1, emoji: ['🐶', '🐕', '🐩'], a: 'a dog', the: 'the dog' },
  { id: 'cat', word: 'cat', fr: 'le chat', category: 'animals', tier: 1, emoji: ['🐱', '🐈', '🐈‍⬛'], a: 'a cat', the: 'the cat' },
  { id: 'car', word: 'car', fr: 'la voiture', category: 'vehicles', tier: 1, emoji: ['🚗', '🚙', '🏎️'], a: 'a car', the: 'the car' },
  { id: 'duck', word: 'duck', fr: 'le canard', category: 'animals', tier: 1, emoji: ['🦆', '🐤'], a: 'a duck', the: 'the duck' },
  { id: 'teddy', word: 'teddy', fr: 'le doudou (nounours)', category: 'toys', tier: 1, emoji: ['🧸'], a: 'a teddy', the: 'Teddy' },
  { id: 'apple', word: 'apple', fr: 'la pomme', category: 'food', tier: 1, emoji: ['🍎', '🍏'], a: 'an apple', the: 'the apple' },
  { id: 'banana', word: 'banana', fr: 'la banane', category: 'food', tier: 1, emoji: ['🍌'], a: 'a banana', the: 'the banana' },
  { id: 'milk', word: 'milk', fr: 'le lait', category: 'food', tier: 1, emoji: ['🥛', '🍼'], a: 'milk', the: 'the milk', more: 'More milk!' },
  { id: 'shoe', word: 'shoe', fr: 'la chaussure', category: 'home', tier: 1, emoji: ['👟', '🥾', '👞'], a: 'a shoe', the: 'the shoe' },
  { id: 'book', word: 'book', fr: 'le livre', category: 'home', tier: 1, emoji: ['📖', '📕', '📚'], a: 'a book', the: 'the book' },
  { id: 'fish', word: 'fish', fr: 'le poisson', category: 'animals', tier: 1, emoji: ['🐟', '🐠', '🐡'], a: 'a fish', the: 'the fish' },
  { id: 'bird', word: 'bird', fr: 'l’oiseau', category: 'animals', tier: 1, emoji: ['🐦', '🐤', '🦜'], a: 'a bird', the: 'the bird' },
  { id: 'baby', word: 'baby', fr: 'le bébé', category: 'family', tier: 1, emoji: ['👶', '👶🏽', '👶🏿'], a: 'a baby', the: 'the baby', person: true },
  { id: 'cup', word: 'cup', fr: 'la tasse, le gobelet', category: 'home', tier: 1, emoji: ['🥤', '☕', '🍵'], a: 'a cup', the: 'the cup' },
  { id: 'water', word: 'water', fr: 'l’eau', category: 'food', tier: 1, emoji: ['💧', '🚰'], a: 'water', the: 'the water', more: 'More water!' },
  { id: 'bed', word: 'bed', fr: 'le lit', category: 'home', tier: 1, emoji: ['🛏️'], a: 'a bed', the: 'the bed' },
  { id: 'bath', word: 'bath', fr: 'le bain', category: 'home', tier: 1, emoji: ['🛁', '🛀'], a: 'a bath', the: 'the bath' },
  { id: 'daddy', word: 'Daddy', fr: 'papa', category: 'family', tier: 1, emoji: ['👨', '🧔', '👨🏽'], a: 'Daddy', the: 'Daddy', person: true },
  { id: 'mummy', word: 'Mummy', fr: 'maman', category: 'family', tier: 1, emoji: ['👩', '👱‍♀️', '👩🏽'], a: 'Mummy', the: 'Mummy', person: true },
];

// Missions dans la vraie vie : l'enfant réutilise le mot avec le parent, hors de l'écran.
export const MISSIONS = [
  {
    id: 'find-ball', words: ['ball'], emoji: '⚽',
    en: 'Can you find your ball?', title: 'Trouve la balle',
    parent: 'Demandez « Can you find your ball? » et cherchez une vraie balle ensemble. Quand il la trouve : « Yes! Ball! »',
  },
  {
    id: 'find-shoes', words: ['shoe'], emoji: '👟',
    en: 'Can you find your shoes?', title: 'Trouve tes chaussures',
    parent: 'Au moment de sortir : « Where are your shoes? » Montrez-les du doigt si besoin, puis « Shoes on! »',
  },
  {
    id: 'where-daddy', words: ['daddy', 'mummy'], emoji: '👨',
    en: 'Where is Daddy?', title: 'Où est papa ?',
    parent: 'Demandez « Where is Daddy? » (ou « Where is Mummy? »). Quand il montre la bonne personne : « Yes! Daddy! »',
  },
  {
    id: 'find-teddy', words: ['teddy'], emoji: '🧸',
    en: 'Can you find Teddy?', title: 'Trouve le doudou',
    parent: 'Cachez à moitié son doudou ou un nounours, puis « Where is Teddy? ». À la découverte : « Here is Teddy! Hug Teddy! »',
  },
  {
    id: 'find-cup', words: ['cup', 'milk', 'water'], emoji: '🥤',
    en: 'Can you find your cup?', title: 'Trouve ton gobelet',
    parent: 'Avant de boire : « Where is your cup? » puis « Milk or water? » en montrant chaque boisson.',
  },
];

// Phrases modèles utilisées par les séances (5 structures du MVP ; la cible V1 en compte 20).
export const PHRASES = {
  hello: (name) => `Hello ${name}!`,
  look: (w) => `Look! ${cap(w.a)}!`,
  name: (w) => `${cap(w.word)}!`,
  where: (w) => `Where is ${w.the}?`,
  yes: (w) => `Yes! ${cap(w.word)}!`,
  here: (w) => `Here's ${w.the}!`,
  thatIs: (w) => `That's ${w.the}.`,
  touch: (w) => `Touch ${w.the}!`,
  whats: (w) => (w.person ? 'Who’s this?' : 'What’s this?'),
  another: (w) => w.more || `Look! Another ${w.word}!`,
  great: () => 'Great!',
  bye: (name) => `Great! Bye bye, ${name}!`,
};

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default { CATEGORIES, WORDS, MISSIONS, PHRASES };
