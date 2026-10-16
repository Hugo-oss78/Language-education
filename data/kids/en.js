// Mode Enfant · anglais (britannique : « Mummy », voix en-GB).
// word : le mot affiché et prononcé ; a / the : avec l'article (« a ball », « the ball ») ;
// more : phrase de réutilisation quand « Another … » sonne faux.

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default {
  code: 'en',
  words: {
    ball: { word: 'ball', a: 'a ball', the: 'the ball' },
    dog: { word: 'dog', a: 'a dog', the: 'the dog' },
    cat: { word: 'cat', a: 'a cat', the: 'the cat' },
    car: { word: 'car', a: 'a car', the: 'the car' },
    duck: { word: 'duck', a: 'a duck', the: 'the duck' },
    teddy: { word: 'teddy', a: 'a teddy', the: 'Teddy' },
    apple: { word: 'apple', a: 'an apple', the: 'the apple' },
    banana: { word: 'banana', a: 'a banana', the: 'the banana' },
    milk: { word: 'milk', a: 'milk', the: 'the milk', more: 'More milk!' },
    shoe: { word: 'shoe', a: 'a shoe', the: 'the shoe' },
    book: { word: 'book', a: 'a book', the: 'the book' },
    fish: { word: 'fish', a: 'a fish', the: 'the fish' },
    bird: { word: 'bird', a: 'a bird', the: 'the bird' },
    baby: { word: 'baby', a: 'a baby', the: 'the baby' },
    cup: { word: 'cup', a: 'a cup', the: 'the cup' },
    water: { word: 'water', a: 'water', the: 'the water', more: 'More water!' },
    bed: { word: 'bed', a: 'a bed', the: 'the bed' },
    bath: { word: 'bath', a: 'a bath', the: 'the bath' },
    daddy: { word: 'Daddy', a: 'Daddy', the: 'Daddy' },
    mummy: { word: 'Mummy', a: 'Mummy', the: 'Mummy' },
  },
  missions: {
    'find-ball': 'Can you find your ball?',
    'find-shoes': 'Where are your shoes?',
    'where-daddy': 'Where is Daddy?',
    'find-teddy': 'Where is Teddy?',
    'find-cup': 'Where is your cup?',
  },
  phrases: {
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
    count: ['One!', 'Two!', 'Three!'],
    great: () => 'Great!',
    greatJob: () => 'Yes! Great job!',
    bye: (name) => `Great! Bye bye, ${name}!`,
  },
};
