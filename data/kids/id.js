// Mode Enfant · indonésien (langue parlée de tous les jours, pas d'article).
// the : forme avec « -nya » (« bolanya » = la balle dont on parle), très utilisée avec les enfants.

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default {
  code: 'id',
  words: {
    ball: { word: 'bola', the: 'bolanya' },
    dog: { word: 'anjing', the: 'anjingnya' },
    cat: { word: 'kucing', the: 'kucingnya' },
    car: { word: 'mobil', the: 'mobilnya' },
    duck: { word: 'bebek', the: 'bebeknya' },
    teddy: { word: 'boneka', the: 'bonekanya' },
    apple: { word: 'apel', the: 'apelnya' },
    banana: { word: 'pisang', the: 'pisangnya' },
    milk: { word: 'susu', the: 'susunya' },
    shoe: { word: 'sepatu', the: 'sepatunya' },
    book: { word: 'buku', the: 'bukunya' },
    fish: { word: 'ikan', the: 'ikannya' },
    bird: { word: 'burung', the: 'burungnya' },
    baby: { word: 'bayi', the: 'adik bayi' },
    cup: { word: 'gelas', the: 'gelasnya' },
    water: { word: 'air', the: 'airnya' },
    bed: { word: 'kasur', the: 'kasurnya' },
    bath: { word: 'bak mandi', the: 'bak mandinya' },
    daddy: { word: 'Ayah', the: 'Ayah' },
    mummy: { word: 'Ibu', the: 'Ibu' },
  },
  missions: {
    'find-ball': 'Mana bolanya?',
    'find-shoes': 'Mana sepatunya?',
    'where-daddy': 'Mana Ayah?',
    'find-teddy': 'Mana bonekanya?',
    'find-cup': 'Mana gelasnya?',
  },
  phrases: {
    hello: (name) => `Halo, ${name}!`,
    look: (w) => `Lihat! ${cap(w.word)}!`,
    name: (w) => `${cap(w.word)}!`,
    where: (w) => `Mana ${w.the}?`,
    yes: (w) => `Iya! ${cap(w.word)}!`,
    here: (w) => `Ini ${w.the}!`,
    thatIs: (w) => `Itu ${w.word}.`,
    touch: (w) => `Pegang ${w.the}!`,
    whats: (w) => (w.person ? 'Siapa ini?' : 'Apa ini?'),
    another: (w) => `Lihat! ${cap(w.word)} lagi!`,
    count: ['Satu!', 'Dua!', 'Tiga!'],
    great: () => 'Pintar!',
    greatJob: () => 'Iya! Pintar!',
    bye: (name) => `Pintar! Dadah, ${name}!`,
  },
};
