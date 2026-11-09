import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES } from '../data/languages.js';
import en from '../data/en.js';
import { buildPath } from '../js/path.js';
import {
  placementLevels, levelQuestions, nextAfter, unitsFrom, orderFresh, PER_LEVEL, PASS,
} from '../js/placement.js';

function seeded(seed = 7) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

test('anglais : niveaux débutants A1 et A2 présents, avec exemples traduits', () => {
  const levels = new Set(en.decks.map((d) => d.level));
  assert.ok(levels.has('A1') && levels.has('A2'), [...levels].join(','));
  const beginner = en.decks.filter((d) => ['A1', 'A2'].includes(d.level));
  assert.ok(beginner.flatMap((d) => d.cards).length >= 150);
  for (const d of beginner.filter((x) => !x.type)) {
    for (const c of d.cards) assert.ok(c.example && c.exampleFr, `${d.id} « ${c.term} » : exemple traduit attendu pour les débutants`);
  }
  assert.ok(en.dialogues.some((x) => x.level === 'A1'));
  const units = buildPath(en.decks, en.dialogues);
  assert.equal(units[0].level, 'A1', 'le parcours anglais commence au niveau A1');
});

test('test de niveau : chaque langue couvre au moins deux niveaux', async () => {
  for (const l of LANGUAGES) {
    const { decks } = (await import(`../data/${l.code}.js`)).default;
    const levels = placementLevels(decks);
    assert.ok(levels.length >= 2, `${l.code} : ${levels}`);
    assert.equal(levels[0], 'A1', `${l.code} commence à A1`);
    for (const lv of levels) {
      const qs = levelQuestions(decks, lv, seeded(lv.charCodeAt(1)));
      assert.equal(qs.length, PER_LEVEL);
      for (const q of qs) {
        assert.equal(q.level, lv);
        assert.equal(q.options.length, 4, `${l.code} ${lv} « ${q.shown} » : 4 propositions`);
        assert.equal(new Set(q.options).size, 4, `${l.code} ${lv} « ${q.shown} » : propositions en double`);
        assert.ok(q.answer >= 0, 'la bonne réponse est proposée');
        assert.ok(!q.options.includes(q.shown), `${l.code} : la question ne doit pas contenir sa réponse`);
      }
      // Les deux sens : comprendre et retrouver le mot.
      assert.ok(qs.some((q) => q.toFr) && qs.some((q) => !q.toFr));
    }
  }
});

test('test de niveau : on monte tant que le niveau est réussi, on s’arrête au premier échec', () => {
  const levels = ['A1', 'A2', 'B1', 'B2'];
  assert.deepEqual(nextAfter(levels, []), { done: false, next: 'A1' });
  assert.deepEqual(nextAfter(levels, [{ level: 'A1', correct: PASS, total: 5 }]), { done: false, next: 'A2' });
  assert.deepEqual(nextAfter(levels, [{ level: 'A1', correct: 2, total: 5 }]), { done: true, start: 'A1', passedAll: false });
  const r = nextAfter(levels, [{ level: 'A1', correct: 5, total: 5 }, { level: 'A2', correct: 5, total: 5 }, { level: 'B1', correct: 3, total: 5 }]);
  assert.deepEqual(r, { done: true, start: 'B1', passedAll: false });
  const all = levels.map((level) => ({ level, correct: 5, total: 5 }));
  assert.deepEqual(nextAfter(levels, all), { done: true, start: 'B2', passedAll: true });
});

test('point de départ : le parcours et les nouveaux mots commencent au bon niveau', () => {
  const units = buildPath(en.decks, en.dialogues);
  const fromB1 = unitsFrom(units, 'B1');
  assert.ok(fromB1.length < units.length);
  assert.ok(fromB1.every((u) => ['B1', 'B2', 'C1'].includes(u.level)));
  assert.deepEqual(unitsFrom(units, null), units);
  const cards = [{ id: 'a', level: 'A1' }, { id: 'b', level: 'A2' }, { id: 'c', level: 'B1' }, { id: 'd', level: 'B2' }];
  assert.deepEqual(orderFresh(cards, 'B1').map((c) => c.id), ['c', 'd', 'a', 'b']);
  assert.deepEqual(orderFresh(cards, null).map((c) => c.id), ['a', 'b', 'c', 'd']);
});

test('test de niveau : pas de fausse réponse trop proche de la bonne', () => {
  for (let seed = 1; seed < 40; seed++) {
    for (const lv of ['A1', 'A2']) {
      for (const q of levelQuestions(en.decks, lv, seeded(seed))) {
        const good = q.options[q.answer].toLowerCase();
        for (const o of q.options) {
          if (o === q.options[q.answer]) continue;
          assert.ok(!(good.includes('bonjour') && o.toLowerCase().includes('bonjour')), `« ${good} » / « ${o} »`);
          assert.ok(!(good.includes('tête') && o.toLowerCase().includes('tête')), `« ${good} » / « ${o} »`);
        }
      }
    }
  }
});
