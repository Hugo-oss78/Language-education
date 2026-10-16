// Mode Enfant · espagnol (variante d'Espagne : « coche », « plátano »).
// a / the : avec l'article indéfini / défini ; g : genre (pour « otro / otra ») ;
// obj : complément de « toca » avec le « a » personnel (personnes, animaux).

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default {
  code: 'es',
  words: {
    ball: { word: 'pelota', a: 'una pelota', the: 'la pelota', g: 'f' },
    dog: { word: 'perro', a: 'un perro', the: 'el perro', g: 'm', obj: 'al perro' },
    cat: { word: 'gato', a: 'un gato', the: 'el gato', g: 'm', obj: 'al gato' },
    car: { word: 'coche', a: 'un coche', the: 'el coche', g: 'm' },
    duck: { word: 'pato', a: 'un pato', the: 'el pato', g: 'm', obj: 'al pato' },
    teddy: { word: 'osito', a: 'un osito', the: 'el osito', g: 'm' },
    apple: { word: 'manzana', a: 'una manzana', the: 'la manzana', g: 'f' },
    banana: { word: 'plátano', a: 'un plátano', the: 'el plátano', g: 'm' },
    milk: { word: 'leche', a: 'leche', the: 'la leche', g: 'f', more: '¡Más leche!' },
    shoe: { word: 'zapato', a: 'un zapato', the: 'el zapato', g: 'm' },
    book: { word: 'libro', a: 'un libro', the: 'el libro', g: 'm' },
    fish: { word: 'pez', a: 'un pez', the: 'el pez', g: 'm', obj: 'al pez' },
    bird: { word: 'pájaro', a: 'un pájaro', the: 'el pájaro', g: 'm', obj: 'al pájaro' },
    baby: { word: 'bebé', a: 'un bebé', the: 'el bebé', g: 'm', obj: 'al bebé' },
    cup: { word: 'vaso', a: 'un vaso', the: 'el vaso', g: 'm' },
    water: { word: 'agua', a: 'agua', the: 'el agua', g: 'f', more: '¡Más agua!' },
    bed: { word: 'cama', a: 'una cama', the: 'la cama', g: 'f' },
    bath: { word: 'bañera', a: 'una bañera', the: 'la bañera', g: 'f' },
    daddy: { word: 'papá', a: 'papá', the: 'papá', g: 'm', obj: 'a papá' },
    mummy: { word: 'mamá', a: 'mamá', the: 'mamá', g: 'f', obj: 'a mamá' },
  },
  missions: {
    'find-ball': '¿Dónde está tu pelota?',
    'find-shoes': '¿Dónde están tus zapatos?',
    'where-daddy': '¿Dónde está papá?',
    'find-teddy': '¿Dónde está el osito?',
    'find-cup': '¿Dónde está tu vaso?',
  },
  phrases: {
    hello: (name) => `¡Hola, ${name}!`,
    look: (w) => `¡Mira! ¡${cap(w.a)}!`,
    name: (w) => `¡${cap(w.word)}!`,
    where: (w) => `¿Dónde está ${w.the}?`,
    yes: (w) => `¡Sí! ¡${cap(w.word)}!`,
    here: (w) => `¡Aquí está ${w.the}!`,
    thatIs: (w) => (w.person ? `Es ${w.a}.` : `Eso es ${w.a}.`),
    touch: (w) => `¡Toca ${w.obj || w.the}!`,
    whats: (w) => (w.person ? '¿Quién es?' : '¿Qué es esto?'),
    another: (w) => w.more || `¡Mira! ¡${w.g === 'f' ? 'Otra' : 'Otro'} ${w.word}!`,
    count: ['¡Uno!', '¡Dos!', '¡Tres!'],
    great: () => '¡Muy bien!',
    greatJob: () => '¡Sí! ¡Muy bien!',
    bye: (name) => `¡Muy bien! ¡Adiós, ${name}!`,
  },
};
