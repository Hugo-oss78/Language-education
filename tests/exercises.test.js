import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KINDS, clozeOf, choicesFor, pickExercise, shuffle, bare } from '../js/exercises.js';
import { gradeTyped, normalize, levenshtein } from '../js/text.js';

const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };

test('phrase à trous : trouve le terme, même sans « to » ni article', () => {
  assert.deepEqual(clozeOf({ term: 'to give up', example: "Don't give up, you're almost there!" }),
    { before: "Don't ", answer: 'give up', after: ", you're almost there!" });
  assert.equal(clozeOf({ term: 'la carta', example: '¿Me trae la carta, por favor?' }).answer, 'la carta');
  assert.equal(clozeOf({ term: '¿qué?', example: '¿Qué quieres comer?' }).answer, 'Qué');
  assert.equal(clozeOf({ term: 'bisa', example: 'Saya bisa berenang.' }).answer, 'bisa');
  assert.equal(clozeOf({ term: 'पानी', example: 'यहाँ पानी छ?' }).answer, 'पानी');
  assert.equal(clozeOf({ term: 'art', example: 'This is a party.' }), null, 'pas de correspondance au milieu d’un mot');
  assert.equal(clozeOf({ term: 'x' }), null);
});

test('bare retire articles et ponctuation', () => {
  assert.equal(bare('to take a break'), 'take a break');
  assert.equal(bare('el pan'), 'pan');
  assert.equal(bare('¿cómo te llamas?'), 'cómo te llamas');
  assert.equal(bare('me llamo…'), 'me llamo');
});

test('QCM : 4 propositions distinctes dont la bonne, intrus du même paquet d’abord', () => {
  const pool = [
    ...['a', 'b', 'c', 'd', 'e'].map((x) => ({ id: `d1${x}`, deckId: 'd1', fr: `fr-${x}`, term: `t-${x}` })),
    ...['f', 'g'].map((x) => ({ id: `d2${x}`, deckId: 'd2', fr: `fr-${x}`, term: `t-${x}` })),
  ];
  const card = pool[0];
  const options = choicesFor(card, pool, 'fr');
  assert.equal(options.length, 4);
  assert.equal(new Set(options).size, 4);
  assert.ok(options.includes('fr-a'));
  assert.ok(options.every((o) => ['fr-a', 'fr-b', 'fr-c', 'fr-d', 'fr-e'].includes(o)), 'intrus du même paquet');
});

test('difficulté progressive selon le nombre de réussites', () => {
  const card = { term: 'to give up', example: "Don't give up!" };
  const first = new Set([0, 0.99].map((r) => pickExercise({ reps: 0 }, card, { rand: () => r })));
  assert.deepEqual([...first].sort(), [KINDS.MCQ_MEANING, KINDS.MCQ_TERM].sort(), 'reconnaissance au début');
  const later = new Set([0, 0.3, 0.6, 0.9].map((r) => pickExercise({ reps: 5 }, card, { rand: () => r, canListen: true })));
  assert.ok(later.has(KINDS.TYPE), 'production écrite ensuite');
  const noListen = [0, 0.3, 0.6, 0.9].map((r) => pickExercise({ reps: 5 }, card, { rand: () => r, canListen: false }));
  assert.ok(!noListen.includes(KINDS.LISTEN), 'pas d’écoute sans voix');
  assert.equal(pickExercise({ reps: 3 }, card, { mode: 'flash' }), KINDS.FLASH);
  const noCloze = [0, 0.4, 0.8].map((r) => pickExercise({ reps: 2 }, { term: 'hello' }, { rand: () => r }));
  assert.ok(noCloze.every((k) => k !== KINDS.CLOZE_TYPE && k !== KINDS.CLOZE_MCQ), 'pas de phrase à trous sans exemple');
});

test('mélange : même contenu, ordre déterministe avec un générateur fixé', () => {
  const out = shuffle([1, 2, 3, 4], seq(0.1, 0.9, 0.5));
  assert.deepEqual([...out].sort(), [1, 2, 3, 4]);
});

test('réponses écrites : exact, presque, faux', () => {
  assert.equal(gradeTyped('give up', 'to give up'), 'exact');
  assert.equal(gradeTyped('recieve', 'to receive'), 'close', 'inversion de lettres tolérée');
  assert.equal(gradeTyped('dhanyabad', 'धन्यवाद', 'dhanyabaad'), 'close', 'translittération approximative');
  assert.equal(gradeTyped('dhanyabaad', 'धन्यवाद', 'dhanyabaad'), 'exact');
  assert.equal(gradeTyped('धन्यवाद', 'धन्यवाद', 'dhanyabaad'), 'exact');
  assert.equal(gradeTyped('shukran', 'شكرا', 'shukran'), 'exact');
  assert.equal(gradeTyped('شُكْرًا', 'شكرا', 'shukran'), 'exact', 'voyelles arabes ignorées');
  assert.equal(gradeTyped('como estas', '¿cómo estás?'), 'exact');
  assert.equal(gradeTyped('cat', 'car'), 'wrong', 'mots courts : aucune tolérance');
  assert.equal(gradeTyped('', 'x'), 'wrong');
  assert.equal(normalize('as-salāmu ʿalaykum'), 'as salamu alaykum');
  assert.equal(levenshtein('kitten', 'sitting'), 3);
});
