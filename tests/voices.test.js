import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankVoices, pickVoice, isNovelty, voiceLabel } from '../js/voices.js';

// Liste proche de celle d'un iPhone : voix compactes, améliorées, premium et voix « gadget ».
const IOS = [
  { name: 'Eddy (anglais (R.-U.))', lang: 'en-GB', voiceURI: 'com.apple.eloquence.en-GB.Eddy' },
  { name: 'Albert', lang: 'en-US', voiceURI: 'com.apple.speech.synthesis.voice.Albert' },
  { name: 'Bubbles', lang: 'en-US', voiceURI: 'com.apple.speech.synthesis.voice.Bubbles' },
  { name: 'Daniel', lang: 'en-GB', voiceURI: 'com.apple.voice.compact.en-GB.Daniel' },
  { name: 'Serena (Premium)', lang: 'en-GB', voiceURI: 'com.apple.voice.premium.en-GB.Serena' },
  { name: 'Samantha (Enhanced)', lang: 'en-US', voiceURI: 'com.apple.voice.enhanced.en-US.Samantha' },
  { name: 'Mónica', lang: 'es-ES', voiceURI: 'com.apple.voice.compact.es-ES.Monica' },
];

test('voix : la meilleure voix passe en premier, les voix gadget en dernier', () => {
  const ranked = rankVoices(IOS, 'en-GB');
  assert.equal(ranked[0].name, 'Serena (Premium)');
  assert.ok(ranked.indexOf(ranked.find((v) => v.name === 'Daniel')) < ranked.indexOf(ranked.find((v) => v.name.startsWith('Eddy'))));
  assert.ok(['Albert', 'Bubbles'].every((n) => ranked.slice(-3).some((v) => v.name === n)));
  assert.ok(isNovelty(IOS[0]) && isNovelty(IOS[1]) && !isNovelty(IOS[3]));
  assert.ok(!ranked.some((v) => v.lang === 'es-ES'), 'seulement la langue demandée');
  // Pour l'anglais américain, une voix améliorée en-US passe devant une premium en-GB.
  assert.equal(rankVoices(IOS, 'en-US')[0].name, 'Samantha (Enhanced)');
  assert.match(voiceLabel(IOS[4]), /premium/);
  assert.match(voiceLabel(IOS[0]), /robotique/);
});

test('voix : sans voix gadget seulement, on prend quand même une voix', () => {
  assert.equal(pickVoice([IOS[0]], 'en-GB').name, IOS[0].name);
  assert.equal(pickVoice([], 'en-GB'), null);
  assert.equal(pickVoice(IOS, 'es-ES').name, 'Mónica');
});

test('voix : une voix améliorée d’un autre pays passe devant une voix compacte du bon pays', () => {
  const ranked = rankVoices(IOS.filter((v) => !v.name.startsWith('Serena')), 'en-GB');
  assert.equal(ranked[0].name, 'Samantha (Enhanced)');
});
