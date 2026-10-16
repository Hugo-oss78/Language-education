// Mode Enfant · arabe standard simplifié.
// ⚠️ À faire relire par un locuteur natif. À la maison, beaucoup de familles parlent un dialecte
// (égyptien, levantin, maghrébin…) : le parent peut adapter les mots à l'oral.
// Les impératifs sont au masculin, la forme neutre d'usage (le profil ne demande pas le sexe de l'enfant).
// g : genre du mot (هذا / هذه) ; the : forme avec l'article « ال » ; translit : transcription pour le parent.

const dem = (w) => (w.g === 'f' ? 'هذه' : 'هذا');

export default {
  code: 'ar',
  reviewNeeded: true,
  words: {
    ball: { word: 'كرة', the: 'الكرة', g: 'f', translit: 'kura' },
    dog: { word: 'كلب', the: 'الكلب', g: 'm', translit: 'kalb' },
    cat: { word: 'قطة', the: 'القطة', g: 'f', translit: 'qitta' },
    car: { word: 'سيارة', the: 'السيارة', g: 'f', translit: 'sayyaara' },
    duck: { word: 'بطة', the: 'البطة', g: 'f', translit: 'batta' },
    teddy: { word: 'دبدوب', the: 'الدبدوب', g: 'm', translit: 'dabdoub' },
    apple: { word: 'تفاحة', the: 'التفاحة', g: 'f', translit: 'tuffaaha' },
    banana: { word: 'موزة', the: 'الموزة', g: 'f', translit: 'mawza' },
    milk: { word: 'حليب', the: 'الحليب', g: 'm', translit: 'haliib' },
    shoe: { word: 'حذاء', the: 'الحذاء', g: 'm', translit: 'hidhaa’' },
    book: { word: 'كتاب', the: 'الكتاب', g: 'm', translit: 'kitaab' },
    fish: { word: 'سمكة', the: 'السمكة', g: 'f', translit: 'samaka' },
    bird: { word: 'عصفور', the: 'العصفور', g: 'm', translit: '‘usfour' },
    baby: { word: 'طفل', the: 'الطفل', g: 'm', translit: 'tifl' },
    cup: { word: 'كوب', the: 'الكوب', g: 'm', translit: 'kuub' },
    water: { word: 'ماء', the: 'الماء', g: 'm', translit: 'maa’' },
    bed: { word: 'سرير', the: 'السرير', g: 'm', translit: 'sariir' },
    bath: { word: 'حمّام', the: 'الحمّام', g: 'm', translit: 'hammaam' },
    daddy: { word: 'بابا', the: 'بابا', g: 'm', translit: 'baabaa' },
    mummy: { word: 'ماما', the: 'ماما', g: 'f', translit: 'maamaa' },
  },
  missions: {
    'find-ball': 'أين الكرة؟',
    'find-shoes': 'أين الحذاء؟',
    'where-daddy': 'أين بابا؟',
    'find-teddy': 'أين الدبدوب؟',
    'find-cup': 'أين الكوب؟',
  },
  phrases: {
    hello: (name) => `مرحبًا يا ${name}!`,
    look: (w) => `${dem(w)} ${w.word}!`,
    name: (w) => `${w.word}!`,
    where: (w) => `أين ${w.the}؟`,
    yes: (w) => `نعم! ${w.word}!`,
    here: (w) => `ها ${w.g === 'f' ? 'هي' : 'هو'} ${w.the}!`,
    thatIs: (w) => `${dem(w)} ${w.word}.`,
    touch: (w) => `المس ${w.the}!`,
    whats: (w) => (w.person ? 'من هذا؟' : 'ما هذا؟'),
    another: (w) => `و${dem(w)} ${w.word} أيضًا!`,
    count: ['واحد!', 'اثنان!', 'ثلاثة!'],
    great: () => 'رائع!',
    greatJob: () => 'نعم! رائع!',
    bye: (name) => `رائع! مع السلامة يا ${name}!`,
  },
};
