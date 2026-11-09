import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test1 from '../data/toeic/test1.js';
import {
  PARTS, flatten, screens, sectionScore, scoreTest, cefr, weakestPart, scriptFor,
} from '../js/toeic/engine.js';

const QS = flatten(test1);

test('TOEIC blanc : format réduit au quart, 7 parties dans l’ordre officiel', () => {
  const count = (part) => QS.filter((q) => q.part === part).length;
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(count), [3, 7, 9, 6, 8, 4, 13]);
  assert.equal(QS.filter((q) => q.section === 'L').length, 25);
  assert.equal(QS.filter((q) => q.section === 'R').length, 25);
  // L'écoute vient avant la lecture, comme à l'examen.
  const firstR = QS.findIndex((q) => q.section === 'R');
  assert.ok(QS.slice(firstR).every((q) => q.section === 'R'));
  assert.equal(screens(QS).length, 3 + 7 + 3 + 2 + 8 + 1 + 4);
  assert.equal(new Set(QS.map((q) => q.id)).size, QS.length);
});

test('TOEIC blanc : chaque question est complète et cohérente', () => {
  for (const q of QS) {
    const n = q.part === 2 ? 3 : 4;
    assert.equal(q.options.length, n, `${q.id} : ${n} réponses attendues`);
    assert.equal(new Set(q.options).size, n, `${q.id} : réponses en double`);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < n, `${q.id} : bonne réponse`);
    assert.ok(q.explain && q.explain.length > 20, `${q.id} : explication`);
    if (q.part === 5) assert.ok(q.item.sentence.includes('-------'), q.id);
    if ([3, 4, 7].includes(q.part)) assert.ok(q.item.q, `${q.id} : énoncé`);
  }
  for (const s of test1.parts.find((p) => p.part === 6).sets) {
    s.questions.forEach((_, i) => assert.ok(s.text.includes(`{${i + 1}}`), `${s.id} : blanc ${i + 1}`));
  }
  for (const q of QS.filter((x) => x.part === 1)) assert.ok(q.item.scene.length && q.item.sceneAlt, q.id);
});

test('TOEIC blanc : les bonnes réponses sont bien réparties entre A, B, C et D', () => {
  const four = QS.filter((q) => q.options.length === 4);
  const counts = [0, 1, 2, 3].map((i) => four.filter((q) => q.answer === i).length);
  for (const c of counts) {
    assert.ok(c >= four.length * 0.15, `répartition déséquilibrée : ${counts}`);
    assert.ok(c <= four.length * 0.4, `répartition déséquilibrée : ${counts}`);
  }
  const three = QS.filter((q) => q.options.length === 3);
  assert.ok([0, 1, 2].every((i) => three.some((q) => q.answer === i)));
});

test('score estimé : de 5 à 495 par section, par paliers de 5, avec une fourchette', () => {
  assert.deepEqual(
    [sectionScore(25, 25).score, sectionScore(0, 25).score, sectionScore(13, 25).score],
    [495, 5, 260],
  );
  for (let c = 0; c <= 25; c++) {
    const s = sectionScore(c, 25);
    assert.equal(s.score % 5, 0);
    assert.ok(s.low <= s.score && s.score <= s.high, `${c} : ${s.low} ≤ ${s.score} ≤ ${s.high}`);
    assert.ok(s.low >= 5 && s.high <= 495);
    // Avec 25 questions, la marge n'est jamais minuscule (plus étroite seulement contre les bornes 5 et 495).
    assert.ok(s.high - s.low >= (c === 0 || c === 25 ? 25 : 40), `${c} : marge ${s.low}–${s.high}`);
  }
});

test('niveaux CECRL : seuils minimaux officiels d’ETS', () => {
  assert.equal(cefr('L', 490), 'C1');
  assert.equal(cefr('L', 485), 'B2');
  assert.equal(cefr('L', 400), 'B2');
  assert.equal(cefr('L', 275), 'B1');
  assert.equal(cefr('L', 110), 'A2');
  assert.equal(cefr('R', 455), 'C1');
  assert.equal(cefr('R', 385), 'B2');
  assert.equal(cefr('R', 380), 'B1');
  assert.equal(cefr('R', 115), 'A2');
  assert.equal(cefr('R', 110), 'A1');
  assert.equal(cefr('L', 55), 'A1 non atteint');
});

test('résultat complet : total, détail par partie, partie la plus faible', () => {
  const all = Object.fromEntries(QS.map((q) => [q.id, q.answer]));
  const perfect = scoreTest(QS, all);
  assert.equal(perfect.total.score, 990);
  assert.equal(perfect.L.cefr, 'C1');
  // On rate toute la partie 5 : elle devient la partie à travailler.
  const answers = { ...all };
  for (const q of QS.filter((x) => x.part === 5)) answers[q.id] = (q.answer + 1) % 4;
  const r = scoreTest(QS, answers);
  assert.equal(r.byPart[5].correct, 0);
  assert.equal(weakestPart(r.byPart).part, 5);
  assert.equal(r.L.score, 495);
  assert.ok(r.R.score < 495);
  const empty = scoreTest(QS, {});
  assert.equal(empty.total.score, 10);
});

test('écoute : ce qui est lu à voix haute', () => {
  const p1 = QS.find((q) => q.part === 1);
  assert.deepEqual(scriptFor(p1).map((l) => l.text.slice(0, 3)), ['A. ', 'B. ', 'C. ', 'D. ']);
  const p2 = QS.find((q) => q.part === 2);
  assert.equal(scriptFor(p2).length, 4);
  const p3 = QS.find((q) => q.part === 3);
  assert.ok(scriptFor(p3).every((l) => ['M', 'W'].includes(l.who)));
  assert.equal(scriptFor(QS.find((q) => q.part === 5)).length, 0);
  assert.ok(Object.values(PARTS).every((p) => p.name && p.desc));
});

test('TOEIC hors ligne : fichiers dans le service worker', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const f of ['css/toeic.css', 'js/toeic/engine.js', 'js/toeic/ui.js', 'data/toeic/test1.js']) assert.ok(sw.includes(`'${f}'`), f);
});
