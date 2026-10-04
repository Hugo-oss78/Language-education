import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findInBase, translationsFrom, hasNonLatin } from '../js/lookup.js';
import { parseResponse } from '../js/translate.js';

const cards = [
  { id: '1', term: 'to give up', fr: 'abandonner / renoncer' },
  { id: '2', term: 'a library', fr: 'une bibliothèque' },
  { id: '3', term: 'धन्यवाद', translit: 'dhanyabaad', fr: 'merci' },
  { id: '4', term: 'to look forward to', fr: 'avoir hâte de' },
];

test('mot déjà présent : trouvé dans les deux sens, sans tenir compte des articles ni des accents', () => {
  assert.deepEqual(findInBase('Give up', cards, 'target').exact.map((c) => c.id), ['1']);
  assert.deepEqual(findInBase('library', cards, 'target').exact.map((c) => c.id), ['2']);
  assert.deepEqual(findInBase('bibliotheque', cards, 'fr').exact.map((c) => c.id), ['2']);
  assert.deepEqual(findInBase('renoncer', cards, 'fr').exact.map((c) => c.id), ['1']);
  assert.deepEqual(findInBase('dhanyabaad', cards, 'target').exact.map((c) => c.id), ['3'], 'par la translittération');
  assert.deepEqual(findInBase('धन्यवाद', cards, 'target').exact.map((c) => c.id), ['3']);
});

test('mots proches : faute de frappe ou mot contenu dans une expression', () => {
  assert.deepEqual(findInBase('libary', cards, 'target').close.map((c) => c.id), ['2']);
  assert.deepEqual(findInBase('forward', cards, 'target').close.map((c) => c.id), ['4']);
  assert.equal(findInBase('maison', cards, 'fr').exact.length, 0);
  assert.deepEqual(findInBase('', cards, 'fr'), { exact: [], close: [] });
});

test('traductions proposées et détection d’écriture', () => {
  assert.deepEqual(translationsFrom([cards[0], cards[0]], 'fr'), ['to give up']);
  assert.deepEqual(translationsFrom([cards[2]], 'target'), ['merci']);
  assert.ok(hasNonLatin('مرحبا') && hasNonLatin('नमस्ते') && !hasNonLatin('hola'));
});

test('réponse du service de traduction : principale + variantes, sans doublon ni avertissement', () => {
  const out = parseResponse({
    responseStatus: 200,
    responseData: { translatedText: 'butterfly' },
    matches: [{ translation: 'Butterfly' }, { translation: 'moth' }, { translation: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS' }, { translation: 'papillon' }],
  }, 'papillon');
  assert.deepEqual(out, ['butterfly', 'moth']);
  assert.throws(() => parseResponse({ responseStatus: 403, responseDetails: 'quota dépassé' }), /quota/);
});
