import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRADES, newCardState, review, isDue, isNew, isMature, formatDelay } from '../js/srs.js';
import { normalize, checkAnswer, parseCsv, rowsToCards } from '../js/text.js';
import en from '../data/en.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

test('une nouvelle carte notée « Bien » revient le lendemain, puis dans 3 jours', () => {
  let s = review(undefined, GRADES.GOOD, NOW);
  assert.equal(s.interval, 1);
  assert.equal(s.due, NOW + DAY);
  s = review(s, GRADES.GOOD, s.due);
  assert.equal(s.interval, 3);
});

test('les intervalles grandissent avec les bonnes réponses', () => {
  let s = newCardState();
  const intervals = [];
  for (let i = 0; i < 6; i++) {
    s = review(s, GRADES.GOOD, NOW);
    intervals.push(s.interval);
  }
  intervals.reduce((a, b) => (assert.ok(b > a, `${b} > ${a}`), b));
  assert.ok(isMature(s));
});

test('« À revoir » remet la carte dans la séance et baisse la facilité', () => {
  let s = review(undefined, GRADES.GOOD, NOW);
  s = review(s, GRADES.GOOD, NOW);
  const failed = review(s, GRADES.AGAIN, NOW);
  assert.equal(failed.reps, 0);
  assert.equal(failed.lapses, 1);
  assert.ok(failed.ease < s.ease);
  assert.ok(failed.due - NOW < DAY);
  assert.ok(isDue(failed, NOW + 2 * 60 * 1000));
});

test('« Facile » donne un intervalle plus long que « Bien », « Difficile » plus court', () => {
  const base = review(review(undefined, GRADES.GOOD, NOW), GRADES.GOOD, NOW);
  const hard = review(base, GRADES.HARD, NOW).interval;
  const good = review(base, GRADES.GOOD, NOW).interval;
  const easy = review(base, GRADES.EASY, NOW).interval;
  assert.ok(hard < good && good < easy, `${hard} < ${good} < ${easy}`);
});

test('la facilité ne descend jamais sous 1,3 et l’état d’origine est intact', () => {
  let s = newCardState();
  const original = { ...s };
  for (let i = 0; i < 20; i++) s = review(s, GRADES.AGAIN, NOW);
  assert.equal(s.ease, 1.3);
  assert.deepEqual(newCardState(), original);
});

test('isNew / formatDelay', () => {
  assert.ok(isNew(undefined));
  assert.ok(!isNew(review(undefined, GRADES.GOOD, NOW)));
  assert.equal(formatDelay(60 * 1000), '1 min');
  assert.equal(formatDelay(3 * DAY), '3 j');
  assert.equal(formatDelay(90 * DAY), '3 mois');
});

test('comparaison tolérante des réponses', () => {
  assert.ok(checkAnswer('Give up', 'to give up'));
  assert.ok(checkAnswer('realize', 'to realise / to realize'));
  assert.ok(checkAnswer('se reposer', 'se reposer'));
  assert.ok(checkAnswer('bibliotheque', 'une bibliothèque'));
  assert.ok(checkAnswer("it’s a piece of cake", "it's a piece of cake"));
  assert.ok(!checkAnswer('', 'to give up'));
  assert.ok(!checkAnswer('other', 'another'), 'le « an » de another ne doit pas être retiré');
  assert.equal(normalize('Une conférence (magistrale)'), 'conference');
});

test('lecture CSV : séparateurs, guillemets, en-tête', () => {
  const rows = parseCsv('français;anglais;exemple\nla gare;the station;"Where is it; please?"\r\n\nun "chat";a cat;\n');
  assert.deepEqual(rows[1], ['la gare', 'the station', 'Where is it; please?']);
  const cards = rowsToCards(rows);
  assert.equal(cards.length, 2);
  assert.equal(cards[1].fr, 'un "chat"');
  assert.deepEqual(rowsToCards(parseCsv('chien,dog\nchat,cat')).map((c) => c.term), ['dog', 'cat']);
});

test('les paquets d’anglais sont bien formés', () => {
  const ids = new Set();
  for (const deck of en.decks) {
    assert.ok(deck.id && deck.title && deck.cards.length >= 10, deck.id);
    for (const c of deck.cards) {
      assert.ok(c.fr && c.term, `${deck.id}: carte incomplète`);
      const id = `${deck.id}:${c.term}`;
      assert.ok(!ids.has(id), `doublon ${id}`);
      ids.add(id);
    }
  }
});
