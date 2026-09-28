import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPath, stepStatus, nextStep, pathProgress, stepAfter, DIALOGUE_PASS } from '../js/path.js';
import { LANGUAGES } from '../data/languages.js';

const deck = (id, level, type) => ({ id, level, ...(type ? { type } : {}) });

test('unités : alphabet d’abord, puis par niveau, 3 thèmes max + un dialogue', () => {
  const decks = [
    deck('a1', 'A1'), deck('a2', 'A1'), deck('a3', 'A1'), deck('a4', 'A1'),
    deck('abc', 'A1', 'script'), deck('s1', 'A1', 'sentences'), deck('b1', 'B1'),
    { ...deck('perso', 'B1'), custom: true },
  ];
  const dialogues = [{ id: 'd1', level: 'A1' }, { id: 'd2', level: 'A1' }, { id: 'd3', level: 'B1' }];
  const units = buildPath(decks, dialogues);
  assert.equal(units[0].id, 'alphabet');
  assert.deepEqual(units[0].steps, [{ type: 'deck', id: 'abc' }]);
  const a1 = units.filter((u) => u.level === 'A1' && u.id !== 'alphabet');
  assert.equal(a1.length, 2);
  assert.deepEqual(a1[0].steps.map((s) => s.id), ['a1', 'a2', 'a3', 'd1']);
  assert.deepEqual(a1[1].steps.map((s) => s.id), ['a4', 's1', 'd2'], 'les phrases après le vocabulaire');
  const all = units.flatMap((u) => u.steps.map((s) => s.id));
  assert.ok(!all.includes('perso'), 'les paquets perso restent hors parcours');
  assert.ok(all.includes('d3'));
  assert.deepEqual(units.map((u) => u.number), units.map((_, i) => i + 1));
});

test('état des étapes et étape suivante', () => {
  assert.equal(stepStatus({ type: 'deck' }, { deckCounts: { learned: 3, total: 3, mature: 0 } }).done, true);
  assert.equal(stepStatus({ type: 'deck' }, { deckCounts: { learned: 2, total: 3 } }).done, false);
  assert.equal(stepStatus({ type: 'deck' }, { deckCounts: { learned: 5, total: 5, mature: 4 } }).mastered, true);
  assert.equal(stepStatus({ type: 'deck' }, { deckCounts: { seen: 3, learned: 1, total: 3 } }).done, false, 'vues mais ratées : pas validée');
  assert.equal(stepStatus({ type: 'dialogue' }, { dialogueBest: DIALOGUE_PASS }).done, true);
  assert.equal(stepStatus({ type: 'dialogue' }, { dialogueBest: 33 }).done, false);
  assert.equal(stepStatus({ type: 'dialogue' }, {}).done, false);

  const units = buildPath([deck('x', 'A1'), deck('y', 'A1')], [{ id: 'd', level: 'A1' }]);
  const doneIds = new Set(['x']);
  const statusOf = (s) => ({ done: doneIds.has(s.id) });
  assert.equal(nextStep(units, statusOf).step.id, 'y');
  assert.deepEqual(pathProgress(units, statusOf), { done: 1, total: 3 });
  assert.equal(stepAfter(units, { type: 'deck', id: 'y' }).step.id, 'd');
  doneIds.add('y'); doneIds.add('d');
  assert.equal(nextStep(units, statusOf), null);
});

test('chaque langue a un parcours complet qui couvre tout le contenu officiel', async () => {
  for (const lang of LANGUAGES) {
    const { default: data } = await import(`../data/${lang.code}.js`);
    const units = buildPath(data.decks, data.dialogues);
    const ids = units.flatMap((u) => u.steps.map((s) => `${s.type}:${s.id}`));
    assert.equal(new Set(ids).size, ids.length, `${lang.name} : étape en double`);
    assert.equal(ids.filter((i) => i.startsWith('deck:')).length, data.decks.length, `${lang.name} : paquet oublié`);
    assert.equal(ids.filter((i) => i.startsWith('dialogue:')).length, data.dialogues.length, `${lang.name} : dialogue oublié`);
    units.forEach((u) => assert.ok(u.steps.length <= 4 || u.id === 'alphabet', `${lang.name} : unité ${u.id} trop longue`));
  }
});
