import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BASE_WORDS, BASE_MISSIONS, CATEGORIES } from '../data/kids/words.js';
import en from '../data/kids/en.js';
import es from '../data/kids/es.js';
import id from '../data/kids/id.js';
import ne from '../data/kids/ne.js';
import ar from '../data/kids/ar.js';
import { buildContent, KIDS_LANGS } from '../js/kids/content.js';
import {
  applyOutcome, buildSession, choiceCount, pickChoices, wordStatus, newWordBudget, nextNewWords,
  dueWords, ageInMonths, weeklySummary, STEPS, DAY, MIN,
} from '../js/kids/engine.js';
import {
  emptyData, addProfile, removeProfile, recordSession, updateProfile, migrate, langProgress, setLangData,
} from '../js/kids/store.js';

const ALL = { en, es, id, ne, ar };
const { words: WORDS, missions: MISSIONS, phrases: PHRASES } = buildContent(en);

const NOW = Date.UTC(2026, 9, 5, 9);
const tim = { name: 'Tim', birth: '2024-09', interests: ['animals'], sessionMinutes: 3 };

// Générateur pseudo-aléatoire déterministe.
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

test('données enfant : 20 mots uniques, images, catégories et missions valides', () => {
  assert.equal(WORDS.length, 20);
  assert.equal(new Set(WORDS.map((w) => w.id)).size, 20);
  for (const w of WORDS) {
    assert.ok(w.word && w.fr && w.a && w.the, w.id);
    assert.ok(CATEGORIES[w.category], `${w.id} : catégorie ${w.category}`);
    assert.ok(Array.isArray(w.emoji) && w.emoji.length >= 1, w.id);
    assert.equal(new Set(w.emoji).size, w.emoji.length, `${w.id} : variantes en double`);
  }
  // Deux mots ne partagent jamais la même image principale (sinon « Where is… ? » serait ambigu).
  assert.equal(new Set(WORDS.map((w) => w.emoji[0])).size, 20);
  assert.equal(MISSIONS.length, 5);
  for (const m of MISSIONS) {
    assert.ok(m.say && m.parent && m.title && m.emoji, m.id);
    for (const id of m.words) assert.ok(WORDS.some((w) => w.id === id), `${m.id} : mot inconnu ${id}`);
  }
  assert.equal(PHRASES.look(WORDS.find((w) => w.id === 'apple')), 'Look! An apple!');
  assert.equal(PHRASES.where(WORDS.find((w) => w.id === 'daddy')), 'Where is Daddy?');
});

test('première séance de Tim : rituel, découverte, compréhension, action, mission, au revoir', () => {
  const steps = buildSession({ profile: { ...tim, interests: ['toys'] }, words: WORDS, progress: {}, missions: MISSIONS, now: NOW, rand: seeded() });
  const types = steps.map((s) => s.type);
  assert.equal(types[0], 'hello');
  assert.equal(types.at(-1), 'bye');
  // 3 minutes : un seul nouveau mot, pris dans ses centres d'intérêt (jouets : la balle).
  const discover = steps.filter((s) => s.type === 'discover');
  assert.equal(discover.length, 1);
  assert.equal(discover[0].word, 'ball');
  // Compréhension après la découverte, avec 2 images seulement pour un mot tout neuf.
  const find = steps.find((s) => s.type === 'find');
  assert.ok(types.indexOf('find') > types.indexOf('discover'));
  assert.equal(find.choices.length, 2);
  assert.ok(find.choices.includes(find.word));
  // Pas de production exigée sur un mot qu'il vient de découvrir.
  assert.ok(!types.includes('say'));
  assert.ok(types.includes('touch'));
  // Mission dans la vraie vie liée au mot du jour : « Can you find your ball? ».
  assert.equal(steps.find((s) => s.type === 'mission').mission, 'find-ball');
});

test('pas de mission sans rapport avec ce que l’enfant connaît', () => {
  const steps = buildSession({ profile: tim, words: WORDS, progress: {}, missions: MISSIONS, now: NOW, rand: seeded() });
  assert.equal(steps.find((s) => s.type === 'discover').word, 'dog');
  assert.ok(!steps.some((s) => s.type === 'mission'));
});

test('jamais plus de 3 nouveaux mots, et moins si des mots récents sont fragiles', () => {
  assert.equal(newWordBudget({ sessionMinutes: 2 }, WORDS, {}), 1);
  assert.equal(newWordBudget({ sessionMinutes: 5 }, WORDS, {}), 2);
  assert.equal(newWordBudget({ sessionMinutes: 7 }, WORDS, {}), 3);
  const fragile = {};
  for (const w of WORDS.slice(0, 4)) fragile[w.id] = applyOutcome(undefined, 'discover', 'exposure', NOW);
  assert.equal(newWordBudget({ sessionMinutes: 7 }, WORDS, fragile), 0);
  const steps = buildSession({ profile: { ...tim, sessionMinutes: 7 }, words: WORDS, progress: {}, missions: MISSIONS, now: NOW, rand: seeded(3) });
  assert.ok(steps.filter((s) => s.type === 'discover').length <= 3);
});

test('une erreur ne fait pas baisser la compréhension : le mot revient simplement plus tôt', () => {
  let s = applyOutcome(undefined, 'discover', 'exposure', NOW);
  s = applyOutcome(s, 'find', 'success', NOW);
  const comp = s.comp;
  const helped = applyOutcome(s, 'find', 'helped', NOW + DAY);
  assert.ok(helped.comp >= comp);
  assert.equal(helped.step, 0);
  assert.equal(helped.nextReview, NOW + DAY + STEPS[0]);
});

test('la stabilité demande des réussites sur plusieurs jours, pas une seule séance', () => {
  let s = applyOutcome(undefined, 'discover', 'exposure', NOW);
  for (let i = 0; i < 5; i++) s = applyOutcome(s, 'find', 'success', NOW + i * MIN);
  assert.equal(s.step, 0, 'cinq réussites le même jour ne suffisent pas');
  assert.equal(s.stab, 0);
  assert.notEqual(wordStatus(s), 'acquired');
  s = applyOutcome(s, 'find', 'success', NOW + DAY);
  s = applyOutcome(s, 'find', 'success', NOW + 3 * DAY);
  s = applyOutcome(s, 'generalize', 'success', NOW + 3 * DAY + MIN);
  assert.ok(s.stab >= 40);
  assert.equal(wordStatus(s), 'acquired');
  assert.ok(s.nextReview > NOW + 4 * DAY);
});

test('production : les catégories de réponse orale ne retirent jamais de points', () => {
  const base = applyOutcome(undefined, 'discover', 'exposure', NOW);
  const exact = applyOutcome(base, 'say', 'exact_match', NOW);
  const approx = applyOutcome(base, 'say', 'approximate_match', NOW);
  const attempt = applyOutcome(base, 'say', 'child_attempt', NOW);
  const none = applyOutcome(base, 'say', 'no_response', NOW);
  assert.ok(exact.prod > approx.prod && approx.prod > attempt.prod && attempt.prod > none.prod);
  assert.equal(none.prod, base.prod);
  assert.equal(none.comp, base.comp);
});

test('le nombre d’images grandit avec la stabilité (3 au plus avant 3 ans)', () => {
  assert.equal(choiceCount(undefined, 25), 2);
  assert.equal(choiceCount({ stab: 20, comp: 40 }, 25), 3);
  assert.equal(choiceCount({ stab: 80, comp: 90 }, 25), 3);
  assert.equal(choiceCount({ stab: 80, comp: 90 }, 48), 4);
  const target = WORDS.find((w) => w.id === 'daddy');
  for (let i = 1; i < 20; i++) {
    const c = pickChoices(target, WORDS, {}, 3, seeded(i));
    assert.equal(c.length, 3);
    assert.equal(new Set(c.map((w) => w.id)).size, 3);
    assert.equal(c.filter((w) => w.person).length, 1, 'jamais deux personnes à confondre');
  }
});

test('révisions : les mots en retard reviennent en premier, avec une image différente pour généraliser', () => {
  let progress = {};
  for (const id of ['dog', 'cat', 'ball']) {
    let s = applyOutcome(undefined, 'discover', 'exposure', NOW - 3 * DAY);
    s = applyOutcome(s, 'find', 'success', NOW - 3 * DAY);
    progress[id] = s;
  }
  progress = { ...progress, ball: { ...progress.ball, nextReview: NOW - 5 * DAY } };
  const due = dueWords(WORDS, progress, NOW);
  assert.equal(due[0].id, 'ball');
  const steps = buildSession({ profile: tim, words: WORDS, progress, missions: MISSIONS, now: NOW, rand: seeded(5) });
  const review = steps.filter((s) => s.review);
  assert.ok(review.length >= 1 && review.length <= 2);
  const gen = steps.find((s) => s.type === 'generalize');
  assert.ok(gen && gen.variant >= 1);
  assert.ok(steps.some((s) => s.type === 'say'), 'production proposée sur un mot déjà compris');
});

test('nouveaux mots : palier puis centres d’intérêt', () => {
  const first = nextNewWords({ interests: ['food'] }, WORDS, {}, 2);
  assert.deepEqual(first.map((w) => w.category), ['food', 'food']);
  const none = nextNewWords({ interests: [] }, WORDS, {}, 1);
  assert.equal(none[0].id, 'ball');
});

test('âge et résumé de la semaine', () => {
  assert.equal(ageInMonths('2024-09', NOW), 25);
  assert.equal(ageInMonths(null, NOW), null);
  const history = [{ at: NOW - DAY, duration: 3 * MIN, missionsDone: ['find-ball'] }, { at: NOW - 10 * DAY, duration: 5 * MIN }];
  const progress = { ball: { ...applyOutcome(undefined, 'discover', 'exposure', NOW - DAY) } };
  const week = weeklySummary(history, progress, WORDS, NOW);
  assert.equal(week.sessions, 1);
  assert.equal(week.minutes, 3);
  assert.deepEqual(week.newWords, ['ball']);
  assert.deepEqual(week.missions, ['find-ball']);
});

test('profil enfant : données minimales et suppression complète', () => {
  let d = addProfile(emptyData(), { name: '  Tim  ', birth: '2024-09', sessionMinutes: 12 }, NOW);
  const p = d.profiles[0];
  assert.equal(p.name, 'Tim');
  assert.equal(p.sessionMinutes, 7, 'durée bornée entre 2 et 7 minutes');
  assert.deepEqual(Object.keys(p).sort(), ['avatar', 'birth', 'createdAt', 'id', 'interests', 'name', 'native', 'sessionMinutes', 'target']);
  d = updateProfile(d, p.id, { sessionMinutes: 1 });
  assert.equal(d.profiles[0].sessionMinutes, 2);
  d = { ...d, locked: true, progress: { [p.id]: { ball: {} } }, missions: { [p.id]: {} }, stickers: { [p.id]: ['🌼'] } };
  d = recordSession(d, p.id, { at: NOW });
  d = removeProfile(d, p.id);
  assert.equal(d.profiles.length, 0);
  assert.equal(d.activeId, null);
  assert.equal(d.locked, false, 'plus de profil : le mode enfant ne peut pas rester verrouillé');
  for (const k of ['progress', 'missions', 'history', 'stickers']) assert.deepEqual(d[k], {}, k);
});

test('le mode enfant est hors ligne : ses fichiers sont dans le service worker', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const files = ['css/kids.css', 'js/kids/engine.js', 'js/kids/store.js', 'js/kids/ui.js', 'js/kids/content.js', 'data/kids/words.js',
    ...KIDS_LANGS.map((c) => `data/kids/${c}.js`)];
  for (const f of files) {
    assert.ok(sw.includes(`'${f}'`), f);
  }
});

test('Mode Enfant : les 5 langues ont tous les mots, missions et phrases', () => {
  assert.deepEqual(Object.keys(ALL).sort(), [...KIDS_LANGS].sort());
  for (const [code, lang] of Object.entries(ALL)) {
    assert.equal(lang.code, code);
    for (const b of BASE_WORDS) {
      const w = lang.words[b.id];
      assert.ok(w && w.word, `${code} : mot manquant ${b.id}`);
      if (code === 'ne' || code === 'ar') assert.ok(w.translit, `${code} : transcription manquante pour ${b.id}`);
    }
    assert.equal(Object.keys(lang.words).length, BASE_WORDS.length, `${code} : mots en trop`);
    for (const m of BASE_MISSIONS) assert.ok(lang.missions[m.id], `${code} : mission ${m.id}`);
    const c = buildContent(lang);
    assert.equal(c.phrases.count.length, 3);
    const texts = [c.phrases.hello('Tim'), c.phrases.bye('Tim'), c.phrases.great(), c.phrases.greatJob(), ...c.missions.flatMap((m) => [m.say, m.parent])];
    for (const w of c.words) {
      for (const k of ['look', 'name', 'where', 'yes', 'here', 'thatIs', 'touch', 'whats', 'another']) texts.push(c.phrases[k](w));
    }
    for (const t of texts) {
      assert.equal(typeof t, 'string', code);
      assert.ok(t.trim() && !/undefined|null/.test(t), `${code} : « ${t} »`);
    }
    // Deux mots d'une même langue ne s'écrivent jamais pareil (sinon « Where is… ? » serait ambigu à l'oral).
    assert.equal(new Set(c.words.map((w) => w.word.toLowerCase())).size, c.words.length, `${code} : mots en double`);
  }
  assert.ok(ne.reviewNeeded && ar.reviewNeeded);
  assert.equal(buildContent(es).phrases.another(buildContent(es).byId.ball), '¡Mira! ¡Otra pelota!');
  assert.equal(buildContent(ne).phrases.where(buildContent(ne).byId.daddy), 'बुबा कहाँ हुनुहुन्छ?');
});

test('progression rangée par langue, et migration des données anglaises existantes', () => {
  const old = {
    profiles: [{ id: 'p1', name: 'Tim', target: 'en' }], activeId: 'p1', locked: false,
    progress: { p1: { ball: { comp: 20, seen: 1 } } }, missions: { p1: { 'find-ball': { done: 1 } } },
    history: { p1: [{ at: 1 }] }, stickers: { p1: ['🌼'] },
  };
  const d = migrate(old);
  assert.equal(d.v, 2);
  assert.equal(langProgress(d, 'p1', 'en').ball.comp, 20);
  assert.deepEqual(langProgress(d, 'p1', 'es'), {});
  assert.equal(d.missions.p1.en['find-ball'].done, 1);
  assert.equal(d.history.p1[0].lang, 'en');
  assert.deepEqual(migrate(d), d, 'migration idempotente');
  const d2 = setLangData(d, 'progress', 'p1', 'es', { ball: { comp: 5 } });
  assert.equal(langProgress(d2, 'p1', 'en').ball.comp, 20, 'l’anglais est conservé');
  assert.equal(langProgress(d2, 'p1', 'es').ball.comp, 5);
  assert.equal(updateProfile(d2, 'p1', { target: 'xx' }).profiles[0].target, 'en', 'langue inconnue refusée');
  assert.equal(updateProfile(d2, 'p1', { target: 'ne' }).profiles[0].target, 'ne');
  assert.equal(addProfile(emptyData(), { name: 'Léa', target: 'ar' }).profiles[0].target, 'ar');
});
