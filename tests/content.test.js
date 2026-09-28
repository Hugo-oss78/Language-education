import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES } from '../data/languages.js';
import { ICON_NAMES } from '../js/icons.js';
import { clozeOf } from '../js/exercises.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const slug = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

for (const lang of LANGUAGES) {
  test(`${lang.name} : paquets bien formés`, async () => {
    const { default: data } = await import(`../data/${lang.code}.js`);
    assert.ok(data.decks.length >= 5, 'au moins 5 paquets');
    const ids = new Set();
    let total = 0;
    for (const deck of data.decks) {
      assert.ok(deck.id && deck.title && deck.description, `${deck.id} : champs manquants`);
      assert.ok(ICON_NAMES.includes(deck.icon), `${deck.id} : icône inconnue « ${deck.icon} »`);
      assert.match(deck.hue, /^#[0-9a-f]{6}$/i, `${deck.id} : couleur invalide`);
      assert.ok(LEVELS.includes(deck.level), `${deck.id} : niveau invalide`);
      assert.ok(deck.cards.length >= 10, `${deck.id} : trop peu de cartes`);
      deck.cards.forEach((c, i) => {
        assert.ok(c.fr && c.term, `${deck.id} #${i} : carte incomplète`);
        if (['ne', 'ar'].includes(lang.code)) assert.ok(c.translit, `${deck.id} « ${c.fr} » : translittération manquante`);
        if (c.example && lang.code !== 'en') assert.ok(c.exampleFr, `${deck.id} « ${c.fr} » : traduction de l’exemple manquante`);
        const id = `${deck.id}:${c.key || slug(c.translit || c.term) || i}`;
        assert.ok(!ids.has(id), `identifiant en double : ${id}`);
        ids.add(id);
      });
      total += deck.cards.length;
    }
    assert.ok(total >= 100, `${lang.name} : ${total} cartes, il en faut au moins 100`);

    const sentences = data.decks.filter((d) => d.type === 'sentences');
    assert.ok(sentences.length >= 1, 'au moins un paquet de phrases');
    for (const d of sentences) {
      assert.ok(d.tips?.length >= 2, `${d.id} : fiche de grammaire manquante`);
      d.cards.forEach((c) => assert.ok(c.term.trim().split(/\s+/).length >= 2, `${d.id} « ${c.fr} » : phrase trop courte à remettre dans l’ordre`));
    }
    if (['ne', 'ar'].includes(lang.code)) {
      const letters = data.decks.filter((d) => d.type === 'script').flatMap((d) => d.cards);
      assert.ok(letters.length >= 25, 'alphabet complet');
      assert.equal(new Set(letters.map((c) => c.term)).size, letters.length, 'lettre en double');
      letters.forEach((c) => assert.ok(c.key && c.translit, `lettre ${c.term} : clé ou son manquant`));
    }
  });

  test(`${lang.name} : dialogues bien formés`, async () => {
    const { default: data } = await import(`../data/${lang.code}.js`);
    assert.ok(data.dialogues?.length >= 3, 'au moins 3 dialogues');
    const ids = new Set();
    for (const d of data.dialogues) {
      assert.ok(!ids.has(d.id), `dialogue en double : ${d.id}`);
      ids.add(d.id);
      assert.ok(d.title && d.context && LEVELS.includes(d.level) && ICON_NAMES.includes(d.icon), `${d.id} : champs manquants`);
      assert.ok(d.lines.length >= 4, `${d.id} : trop court`);
      d.lines.forEach((l) => assert.ok(l.who && l.text && l.fr, `${d.id} : réplique incomplète`));
      if (['ne', 'ar'].includes(lang.code)) d.lines.forEach((l) => assert.ok(l.tr, `${d.id} : translittération manquante`));
      d.questions.forEach((q) => {
        assert.ok(q.options.length >= 3 && Number.isInteger(q.answer) && q.options[q.answer], `${d.id} : question invalide`);
        assert.equal(new Set(q.options).size, q.options.length, `${d.id} : options en double`);
      });
    }
  });
}

test('les phrases à trous couvrent une bonne partie des cartes à exemple', async () => {
  for (const code of ['en', 'es', 'id']) {
    const { default: data } = await import(`../data/${code}.js`);
    const withEx = data.decks.flatMap((d) => d.cards).filter((c) => c.example);
    const cloze = withEx.filter((c) => clozeOf(c));
    assert.ok(cloze.length / withEx.length > 0.6, `${code} : ${cloze.length}/${withEx.length} phrases à trous`);
  }
});
