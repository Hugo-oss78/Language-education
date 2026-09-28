import { LANGUAGES, getLanguage } from '../data/languages.js';
import { GRADES, isNew, isDue, isMature, review, previewIntervals } from './srs.js';
import { gradeTyped, alternatives, parseCsv, rowsToCards } from './text.js';
import { KINDS, KIND_LABELS, clozeOf, choicesFor, pickExercise, pickQuizExercise, shuffle, bare } from './exercises.js';
import { icon, flag } from './icons.js';
import {
  store, save, logReview, newCardsToday, streak, today, accuracy,
  exportJson, importJson, resetAll,
} from './storage.js';

const app = document.getElementById('app');
const langCache = {};
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_NAMES = { A1: 'Découverte', A2: 'Survie', B1: 'Seuil', B2: 'Avancé', C1: 'Autonome' };
const DEFAULT_HUE = '#e3b35a';

// ---------- Données ----------

function slug(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function loadLanguage(code) {
  if (!langCache[code]) {
    const mod = await import(`../data/${code}.js`);
    langCache[code] = mod.default;
  }
  const lang = getLanguage(code);
  const { decks: base, reviewNeeded = false } = langCache[code];
  const custom = (store.customDecks[code] || []).map((d) => ({ icon: 'pen', level: 'B1', ...d, custom: true }));
  const decks = [...base, ...custom]
    .map((deck, order) => ({
      ...deck,
      order,
      hue: deck.hue || lang.hue,
      cards: deck.cards.map((c, i) => ({
        ...c,
        id: `${code}:${deck.id}:${slug(c.translit || c.term) || i}`,
        deckId: deck.id,
      })),
    }))
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.order - b.order);
  return { decks, reviewNeeded };
}

function stateOf(card) {
  return store.progress[card.id];
}

function counts(cards, now = Date.now()) {
  let due = 0, fresh = 0, mature = 0;
  for (const c of cards) {
    const s = stateOf(c);
    if (isNew(s)) fresh++;
    else if (isDue(s, now)) due++;
    if (isMature(s)) mature++;
  }
  return { due, fresh, mature, total: cards.length, seen: cards.length - fresh };
}

function newLeftToday(code) {
  return Math.max(0, store.settings.newPerDay - newCardsToday(code));
}

// ---------- Affichage ----------

function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Fonction de nettoyage de la page courante (écouteurs clavier…), appelée au changement de page.
let cleanup = null;
function render(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

function go(hash) {
  location.hash = hash;
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

function setActiveTab(name) {
  document.querySelectorAll('.tabbar a').forEach((a) => {
    const on = a.dataset.tab === name;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

// Couleur d'ambiance : le fond et les reflets suivent le thème de la leçon.
function setTheme(hue = DEFAULT_HUE) {
  document.documentElement.style.setProperty('--theme', hue);
}

function langAttrs(lang) {
  return `lang="${lang.code}" dir="${lang.dir}"`;
}

function pct(n, d) {
  return d ? Math.round((n / d) * 100) : 0;
}

function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n > 1 ? pluralWord : word}`;
}

// Bandeau : drapeaux et icônes du thème qui flottent au-dessus d'une vague.
// Disposition pseudo-aléatoire, mais stable pour une même page.
function banner(items, { compact = false } = {}) {
  const key = items.map((it) => it.flag || it.icon).join('|');
  let seed = [...key].reduce((h, ch) => (h * 31 + ch.codePointAt(0)) >>> 0, 7);
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const slots = compact ? 6 : 8;
  const floaties = Array.from({ length: slots }, (_, i) => {
    const it = items[i % items.length];
    const x = ((i + 0.5) / slots) * 100 + (rand() - 0.5) * 7;
    const y = (compact ? 6 : 12) + rand() * (compact ? 30 : 64);
    const r = Math.round((rand() - 0.5) * 22);
    const size = (compact ? 26 : 32) + rand() * (compact ? 8 : 14);
    const delay = (rand() * 6).toFixed(1);
    const inner = it.flag ? flag(it.flag) : `<span class="orb" style="--hue:${it.hue}">${icon(it.icon)}</span>`;
    return `<span class="floaty${it.flag ? ' is-flag' : ''}" style="left:calc(${x.toFixed(1)}% - ${size / 2}px);top:${y.toFixed(0)}px;width:${size.toFixed(0)}px;--r:${r}deg;animation-delay:-${delay}s">${inner}</span>`;
  }).join('');
  return `
    <div class="banner${compact ? ' compact' : ''}" aria-hidden="true">
      ${floaties}
      <svg class="wave" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M0 22C50 4 100 4 150 20s100 18 150 2 75-12 100-4"/></svg>
    </div>`;
}

function interleave(flags, icons) {
  if (!icons.length) return flags.map((f) => ({ flag: f }));
  return icons.flatMap((it, i) => [{ flag: flags[i % flags.length] }, it]);
}

function pageHead({ back, eyebrow, mark = icon('globe'), title, lede, saved }) {
  return `
    <header class="page-head">
      ${back ? `<a class="back" href="${back.href}">${icon('back')} ${esc(back.label)}</a>` : ''}
      ${eyebrow ? `<div class="eyebrow"><span class="ring">${mark}</span>${esc(eyebrow)}</div>` : ''}
      <h1>${title}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ''}
      ${saved ? `<p class="saved">${icon('check')} ${saved}</p>` : ''}
    </header>`;
}

function progressBar(value, label) {
  return `<span class="progress" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(label)}"><span style="width:${value}%"></span></span>`;
}

// ---------- Voix ----------

let voices = [];
function refreshVoices() {
  try { voices = window.speechSynthesis?.getVoices() || []; } catch { voices = []; }
}
if ('speechSynthesis' in window) {
  refreshVoices();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

function voiceFor(code) {
  const tts = getLanguage(code)?.tts || code;
  const base = tts.split('-')[0];
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  return voices.find((v) => norm(v) === tts.toLowerCase()) || voices.find((v) => norm(v).startsWith(base));
}

function canSpeak(code) {
  return !!voiceFor(code);
}

const warnedNoVoice = new Set();
function speak(text, code) {
  if (!('speechSynthesis' in window)) return toast('La synthèse vocale n’est pas disponible ici.');
  const voice = voiceFor(code);
  if (!voice && !warnedNoVoice.has(code)) {
    warnedNoVoice.add(code);
    toast(`Pas de voix ${getLanguage(code)?.name.toLowerCase()} sur cet appareil : la prononciation peut être fausse.`);
  }
  // Un souci audio ne doit jamais bloquer un exercice.
  try {
    const utter = new SpeechSynthesisUtterance(alternatives(text)[0].replace(/…/g, ''));
    utter.lang = getLanguage(code)?.tts || code;
    if (voice) utter.voice = voice;
    utter.rate = 0.92;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  } catch (err) {
    console.warn('Synthèse vocale indisponible', err);
  }
}

function speakBtn(text, cls = '') {
  return `<button type="button" class="icon-btn speak ${cls}" data-say="${esc(text)}" aria-label="Écouter">${icon('speaker')}</button>`;
}

function bindSpeak(root, code) {
  root.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    speak(b.dataset.say, code);
  }));
}

// ---------- Accueil ----------

async function viewHome() {
  setActiveTab('home');
  setTheme(DEFAULT_HUE);
  const rows = await Promise.all(LANGUAGES.map(async (l) => {
    const { decks } = await loadLanguage(l.code);
    return { l, c: counts(decks.flatMap((d) => d.cards)) };
  }));
  const s = streak();
  const last = rows.find((r) => r.l.code === store.settings.lastLang);

  render(`
    ${banner(interleave(LANGUAGES.map((l) => l.code), [
      { icon: 'chat', hue: '#f09a6a' }, { icon: 'book', hue: '#7fb6d9' }, { icon: 'plane', hue: '#82d0c0' }, { icon: 'star', hue: '#f4c76b' },
    ]))}
    ${pageHead({
      eyebrow: 'Carnet de langues',
      title: 'Lingua',
      lede: 'Un mot à la fois, un peu plus loin chaque jour.',
      saved: s ? `<b class="gold">${plural(s, 'jour')} d’affilée</b> · sauvegardé sur cet appareil` : 'Sauvegardé sur cet appareil',
    })}
    ${last ? `
      <a class="hero glass" href="#/session/${last.l.code}/all" style="--rim:var(--gold)">
        <span class="lang-flag">${flag(last.l.code)}</span>
        <span class="hero-body">
          <span class="kicker">Reprendre</span>
          <strong>${last.l.name}</strong>
          <span class="muted small">${last.c.due ? `<b class="gold">${last.c.due} à revoir</b> · ` : ''}${plural(Math.min(newLeftToday(last.l.code), last.c.fresh), 'nouveau mot', 'nouveaux mots')}</span>
        </span>
        <span class="hero-go">${icon('arrow')}</span>
      </a>` : ''}
    <h2 class="section-title">Quelle langue aujourd’hui ?</h2>
    <section class="lang-list">
      ${rows.map(({ l, c }) => `
        <a class="lang-card glass" href="#/lang/${l.code}" style="--rim:${l.hue}">
          <span class="lang-flag">${flag(l.code)}</span>
          <span class="lang-info">
            <strong>${l.name}</strong>
            <span class="muted" ${langAttrs(l)}>${l.native}</span>
            ${progressBar(pct(c.seen, c.total), `${l.name} : mots vus`)}
          </span>
          <span class="badges">
            ${c.due ? `<span class="badge due">${c.due} à revoir</span>` : ''}
            <span class="badge">${c.seen}/${c.total}</span>
          </span>
        </a>`).join('')}
    </section>
    <a class="method-link glass" href="#/method" style="--rim:#c79bf2">
      <span class="orb" style="--hue:#c79bf2">${icon('lightbulb')}</span>
      <span class="hero-body"><strong>La méthode</strong><span class="muted small">Pourquoi Lingua te fait travailler comme ça</span></span>
      ${icon('arrow')}
    </a>
  `);
}

// ---------- Page d'une langue ----------

async function viewLanguage(code) {
  setActiveTab('home');
  const lang = getLanguage(code);
  if (!lang) return go('#/');
  setTheme(lang.hue);
  const { decks } = await loadLanguage(code);
  const all = counts(decks.flatMap((d) => d.cards));
  const newToday = Math.min(newLeftToday(code), all.fresh);
  const byLevel = LEVELS.map((lv) => ({ lv, decks: decks.filter((d) => d.level === lv) })).filter((g) => g.decks.length);

  render(`
    ${banner(interleave([code], decks.slice(0, 6).map((d) => ({ icon: d.icon, hue: d.hue }))))}
    ${pageHead({
      back: { href: '#/', label: 'Langues' },
      eyebrow: lang.native,
      mark: flag(code),
      title: lang.name,
      lede: `<b class="glow">${all.seen}</b> mots vus sur ${all.total} · <b class="glow">${all.mature}</b> maîtrisés`,
    })}
    ${lang.note ? `<p class="notice">${icon('lightbulb')} <span>${esc(lang.note)}</span></p>` : ''}
    <a class="cta ${all.due + newToday ? '' : 'idle'}" href="#/session/${code}/all">
      <span>
        <strong>${all.due + newToday ? 'Séance du jour' : 'Réviser quand même'}</strong>
        <span>${all.due} à revoir · ${plural(newToday, 'nouveau mot', 'nouveaux mots')}</span>
      </span>
      ${icon('arrow')}
    </a>
    <div class="quick-row">
      <a class="chip-btn glass" href="#/quiz/${code}/all">${icon('target')} Quiz éclair</a>
      <a class="chip-btn glass" href="#/session/${code}/all?mode=flash">${icon('cards')} Cartes seules</a>
    </div>
    ${byLevel.map(({ lv, decks: list }) => `
      <h2 class="section-title level-title"><span class="level">${lv}</span> ${LEVEL_NAMES[lv] || ''}</h2>
      <section class="deck-grid">
        ${list.map((d) => {
          const c = counts(d.cards);
          return `
          <article class="deck glass" style="--rim:${d.hue};--hue:${d.hue}">
            <a class="deck-hit" href="#/session/${code}/${d.id}">
              <span class="orb big">${icon(d.icon)}</span>
              <strong>${esc(d.title)}</strong>
              <span class="desc">${esc(d.description || '')}</span>
            </a>
            ${progressBar(pct(c.seen, c.total), 'Mots vus')}
            <span class="meta">${c.seen}/${c.total}${c.due ? ` · <b class="due-text">${c.due} à revoir</b>` : ''}</span>
            <span class="deck-links">
              <a href="#/browse/${code}/${d.id}">${icon('eye')} Mots</a>
              <a href="#/quiz/${code}/${d.id}">${icon('target')} Quiz</a>
              ${d.custom ? `<button class="link" data-delete="${d.id}" aria-label="Supprimer ce paquet">${icon('x')}</button>` : ''}
            </span>
          </article>`;
        }).join('')}
      </section>`).join('')}
    <details class="import glass">
      <summary>${icon('plus')} Créer mon propre paquet (CSV)</summary>
      <p class="muted small">Une ligne par carte : <code>français ; ${lang.name.toLowerCase()} ; exemple ; note</code>.
      Les deux dernières colonnes sont facultatives. Sépare les réponses possibles par « / ».</p>
      <form id="import-form">
        <label>Nom du paquet <input name="title" required maxlength="60" placeholder="Ex. : Mon voyage"></label>
        <label>Cartes <textarea name="csv" rows="6" placeholder="la gare ; …"></textarea></label>
        <label>… ou un fichier <input type="file" name="file" accept=".csv,.tsv,.txt,text/csv"></label>
        <button class="btn primary" type="submit">Ajouter le paquet</button>
      </form>
    </details>
  `);

  app.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
    const deck = decks.find((d) => d.id === btn.dataset.delete);
    if (!confirm(`Supprimer le paquet « ${deck.title} » et sa progression ?`)) return;
    store.customDecks[code] = store.customDecks[code].filter((d) => d.id !== deck.id);
    deck.cards.forEach((c) => delete store.progress[c.id]);
    save();
    viewLanguage(code);
  }));

  app.querySelector('#import-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const file = form.file.files[0];
    const text = file ? await file.text() : form.csv.value;
    const cards = rowsToCards(parseCsv(text));
    if (!cards.length) return toast('Aucune carte trouvée : il faut au moins deux colonnes.');
    (store.customDecks[code] ||= []).push({
      id: `perso-${Date.now().toString(36)}`, title: form.title.value.trim(), icon: 'pen', level: 'B1',
      description: `${cards.length} cartes perso`, cards,
    });
    save();
    toast(`${cards.length} cartes ajoutées`);
    viewLanguage(code);
  });
}

// ---------- Liste des mots ----------

function exampleHtml(card, lang, { highlight = true } = {}) {
  if (!card.example) return '';
  const cz = highlight ? clozeOf(card) : null;
  const sentence = cz ? `${esc(cz.before)}<mark>${esc(cz.answer)}</mark>${esc(cz.after)}` : esc(card.example);
  return `
    <div class="example">
      <p ${langAttrs(lang)}>${sentence} ${speakBtn(card.example, 'small')}</p>
      ${card.exampleTr ? `<p class="translit">${esc(card.exampleTr)}</p>` : ''}
      ${card.exampleFr ? `<p class="example-fr">${esc(card.exampleFr)}</p>` : ''}
    </div>`;
}

async function viewBrowse(code, deckId) {
  setActiveTab('home');
  const lang = getLanguage(code);
  const { decks } = await loadLanguage(code);
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return go(`#/lang/${code}`);
  setTheme(deck.hue);
  render(`
    ${banner(interleave([code], [{ icon: deck.icon, hue: deck.hue }]), { compact: true })}
    ${pageHead({
      back: { href: `#/lang/${code}`, label: lang.name },
      eyebrow: `${deck.level} · ${plural(deck.cards.length, 'mot')}`,
      mark: icon(deck.icon),
      title: esc(deck.title),
      lede: esc(deck.description || ''),
    })}
    <ul class="word-list">
      ${deck.cards.map((c) => {
        const s = stateOf(c);
        const status = isNew(s) ? 'Nouveau' : isMature(s) ? 'Maîtrisé' : 'En cours';
        return `
        <li class="glass" style="--rim:${deck.hue}">
          <div class="word-top">
            <strong ${langAttrs(lang)}>${esc(c.term)}</strong>
            ${speakBtn(c.term, 'small')}
            <span class="chip ${slug(status)}">${status}</span>
          </div>
          ${c.translit ? `<span class="translit">${esc(c.translit)}</span>` : ''}
          <span class="word-fr">${esc(c.fr)}</span>
          ${exampleHtml(c, lang)}
          ${c.note ? `<span class="note">${icon('lightbulb')} ${esc(c.note)}</span>` : ''}
        </li>`;
      }).join('')}
    </ul>
  `);
  bindSpeak(app, code);
}

// ---------- Séance (révisions, nouveaux mots, quiz) ----------

function buildQueue(cards, code, deckOnly, opts) {
  const now = Date.now();
  // Révisions dues, mélangées : alterner les thèmes aide à mieux retenir.
  const due = shuffle(cards.filter((c) => isDue(stateOf(c), now)));
  const fresh = cards.filter((c) => isNew(stateOf(c))).slice(0, newLeftToday(code));
  let queue = due.map((card) => ({ card, kind: pickExercise(stateOf(card), card, opts) }));
  // Les nouveaux mots arrivent intercalés entre les révisions.
  fresh.forEach((card, i) => queue.splice(Math.min(queue.length, i * 2 + 1), 0, { card, kind: 'intro' }));
  if (!queue.length && deckOnly) {
    queue = cards.filter((c) => !isNew(stateOf(c)))
      .sort((a, b) => stateOf(a).due - stateOf(b).due).slice(0, 15)
      .map((card) => ({ card, kind: pickExercise(stateOf(card), card, opts) }));
  }
  return queue;
}

function buildQuiz(cards, opts) {
  const seen = cards.filter((c) => !isNew(stateOf(c)));
  const pool = seen.length >= 6 ? seen : cards;
  return shuffle(pool).slice(0, 10).map((card) => ({ card, kind: pickQuizExercise(card, opts) }));
}

async function viewSession(code, deckId = 'all', { quiz = false, mode } = {}) {
  setActiveTab('home');
  const lang = getLanguage(code);
  if (!lang) return go('#/');
  const { decks } = await loadLanguage(code);
  const scope = deckId === 'all' ? decks : decks.filter((d) => d.id === deckId);
  if (!scope.length) return go(`#/lang/${code}`);
  store.settings.lastLang = code;
  save();

  const deckOf = Object.fromEntries(decks.map((d) => [d.id, d]));
  const pool = decks.flatMap((d) => d.cards);
  const byTerm = new Map(pool.map((c) => [c.term, c]));
  const opts = { canListen: canSpeak(code), mode: mode || store.settings.mode };
  const cards = scope.flatMap((d) => d.cards);
  const queue = quiz ? buildQuiz(cards, opts) : buildQueue(cards, code, deckId !== 'all', opts);
  const back = `#/lang/${code}`;
  const title = quiz ? 'Quiz éclair' : deckId === 'all' ? 'Séance du jour' : scope[0].title;
  const total = new Set(queue.map((q) => q.card.id)).size;
  const tally = { right: 0, wrong: 0, fresh: 0 };
  const finished = new Set();
  let keys = {};

  if (!total) {
    setTheme(lang.hue);
    return render(`
      ${banner(interleave([code], [{ icon: 'trophy', hue: '#f4c76b' }, { icon: 'star', hue: '#f4c76b' }]))}
      <section class="empty">
        <h1>Tout est à jour !</h1>
        <p class="muted">Aucune carte à revoir et le quota de nouveaux mots du jour est atteint.
        Augmente-le dans les <a href="#/settings">réglages</a>, ou lance un quiz.</p>
        <div class="btn-row center">
          <a class="btn primary" href="#/quiz/${code}/${deckId}">${icon('target')} Quiz éclair</a>
          <a class="btn" href="${back}">Retour</a>
        </div>
      </section>`);
  }

  const onKey = (e) => {
    const typing = e.target.matches('input, textarea');
    if (e.key === 'Enter' && keys.enter && !(typing && !keys.enterInInput)) { e.preventDefault(); keys.enter(); return; }
    if (typing) return;
    if (e.key === ' ' && keys.space) { e.preventDefault(); keys.space(); return; }
    if (/^[1-4]$/.test(e.key) && keys.num) keys.num(Number(e.key) - 1);
  };
  document.addEventListener('keydown', onKey);
  // Mode concentration : pas de barre d'onglets, boutons d'action toujours visibles.
  document.body.classList.add('in-session');
  const stop = () => {
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('in-session');
  };
  cleanup = stop;

  const $ = (sel) => app.querySelector(sel);
  const controls = (html) => { $('#controls').innerHTML = html; bindSpeak($('#controls'), code); };

  function frame(card, label, kindIcon, body) {
    const d = deckOf[card.deckId];
    setTheme(d.hue);
    render(`
      <div class="session">
        <header class="session-head">
          <a class="icon-btn ghost" href="${back}" aria-label="Quitter la séance">${icon('x')}</a>
          <div class="progress wide" role="progressbar" aria-valuenow="${finished.size}" aria-valuemin="0" aria-valuemax="${total}" aria-label="Progression">
            <span style="width:${pct(finished.size, total)}%"></span>
          </div>
          <span class="counter">${finished.size}/${total}</span>
        </header>
        ${banner(interleave([code], [{ icon: d.icon, hue: d.hue }]), { compact: true })}
        <p class="kind-chip">${icon(kindIcon)} <span>${label}</span><span class="sep">·</span><span class="muted">${esc(quiz ? title : d.title)}</span></p>
        <article class="exercise glass" style="--rim:${d.hue}" aria-live="polite">${body}</article>
        <div id="controls" class="controls"></div>
      </div>`);
    bindSpeak(app, code);
    keys = {};
  }

  function termBlock(card, cls = '') {
    return `
      <div class="term ${cls}">
        <span class="term-text glow" ${langAttrs(lang)}>${esc(card.term)}</span>
        ${speakBtn(card.term)}
      </div>
      ${card.translit ? `<div class="translit">${esc(card.translit)}</div>` : ''}`;
  }

  function answerBlock(card) {
    return `
      <div class="answer-block">
        ${termBlock(card, 'small')}
        <div class="fr">${esc(card.fr)}</div>
        ${exampleHtml(card, lang)}
        ${card.note ? `<p class="note">${icon('lightbulb')} ${esc(card.note)}</p>` : ''}
      </div>`;
  }

  function next() {
    const item = queue.shift();
    if (!item) return finish();
    (RENDERERS[item.kind] || RENDERERS[KINDS.MCQ_MEANING])(item.card);
  }

  // Enregistre le résultat d'un exercice.
  function settle(card, grade) {
    const prev = stateOf(card);
    const ok = grade !== GRADES.AGAIN;
    if (ok) tally.right++; else tally.wrong++;
    if (quiz) {
      finished.add(card.id);
      logReview(false, ok, code);
    } else {
      store.progress[card.id] = review(prev, grade);
      logReview(isNew(prev), ok, code);
      if (ok) finished.add(card.id);
      else queue.splice(Math.min(queue.length, 3), 0, { card, kind: pickExercise(stateOf(card), card, opts) });
    }
    save();
  }

  // Correction immédiate, puis « Continuer ».
  function showResult(card, { ok, close = false, given }) {
    const verdict = ok
      ? `<p class="verdict ok">${icon('check')} ${close ? 'Presque ! Attention à l’orthographe' : 'Bonne réponse'}</p>`
      : `<p class="verdict ko">${icon('x')} ${given !== undefined ? `Ta réponse : « ${esc(given)} »` : 'Pas tout à fait'}</p>`;
    const zone = document.createElement('div');
    zone.className = 'result';
    zone.innerHTML = verdict + answerBlock(card);
    $('.exercise').append(zone);
    $('.exercise').classList.add(ok ? 'is-ok' : 'is-ko');
    bindSpeak(zone, code);
    if (store.settings.autoSpeak && canSpeak(code)) speak(card.term, code);
    let grade = ok ? (close ? GRADES.HARD : GRADES.GOOD) : GRADES.AGAIN;
    controls(`
      ${!ok && given ? '<button type="button" class="link small center-link" id="override">J’avais raison (synonyme)</button>' : ''}
      <button type="button" class="btn primary full" id="continue">Continuer <kbd>Entrée</kbd></button>`);
    $('#override')?.addEventListener('click', (e) => {
      grade = GRADES.GOOD;
      zone.querySelector('.verdict').outerHTML = `<p class="verdict ok">${icon('check')} Compté comme juste</p>`;
      e.currentTarget.remove();
    });
    const proceed = () => { keys = {}; settle(card, grade); next(); };
    $('#continue').addEventListener('click', proceed);
    $('#continue').focus({ preventScroll: true });
    keys = { enter: proceed, enterInInput: true };
  }

  function choiceButtons(options, inTarget) {
    return `<div class="choices">${options.map((o, i) => {
      const c = inTarget ? byTerm.get(o) : null;
      return `<button type="button" class="choice" data-i="${i}">
        <kbd>${i + 1}</kbd><span ${inTarget ? langAttrs(lang) : ''}>${esc(o)}</span>${c?.translit ? `<small class="translit">${esc(c.translit)}</small>` : ''}
      </button>`;
    }).join('')}</div>`;
  }

  function bindChoices(card, options, correct) {
    const pick = (i) => {
      if (options[i] === undefined || $('.choice[disabled]')) return;
      const ok = options[i] === correct;
      app.querySelectorAll('.choice').forEach((b, j) => {
        b.disabled = true;
        if (options[j] === correct) b.classList.add('right');
        else if (j === i) b.classList.add('wrong');
      });
      showResult(card, { ok });
    };
    app.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => pick(Number(b.dataset.i))));
    keys = { num: pick };
  }

  function typeForm(placeholder, attrs) {
    return `
      <form class="type-form" autocomplete="off">
        <input name="guess" ${attrs} placeholder="${esc(placeholder)}" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Ta réponse">
        <button class="btn primary" type="submit" aria-label="Vérifier">${icon('check')}</button>
      </form>
      <button type="button" class="link small" id="hint">${icon('lightbulb')} Un indice ?</button>`;
  }

  function bindType(card, answers, hintText) {
    const form = $('.type-form');
    let hinted = false;
    form.guess.focus();
    $('#hint').addEventListener('click', (e) => {
      hinted = true;
      e.currentTarget.outerHTML = `<p class="hint">${hintText}</p>`;
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const given = form.guess.value;
      if (!given.trim()) return form.guess.focus();
      const res = gradeTyped(given, ...answers);
      form.remove();
      $('#hint')?.remove();
      // Un indice utilisé plafonne la note à « Difficile ».
      showResult(card, { ok: res !== 'wrong', close: res === 'close' || (hinted && res === 'exact'), given });
    });
  }

  function hintFor(answer) {
    const b = bare(alternatives(answer)[0]);
    const letters = b.replace(/\s/g, '').length;
    return `Commence par « <b>${esc(b.slice(0, Math.max(1, Math.ceil(b.length / 4))))}</b>… » · ${plural(letters, 'lettre')}`;
  }

  const RENDERERS = {
    intro(card) {
      tally.fresh++;
      frame(card, 'Nouveau mot', 'sparkle', `
        <div class="intro">
          <span class="new-badge">${icon('star')} Nouveau</span>
          ${termBlock(card)}
          <div class="fr big-fr">${esc(card.fr)}</div>
          ${exampleHtml(card, lang)}
          ${card.note ? `<p class="note">${icon('lightbulb')} ${esc(card.note)}</p>` : ''}
        </div>`);
      if (store.settings.autoSpeak && canSpeak(code)) speak(card.term, code);
      controls(`<button type="button" class="btn primary full" id="got">Je le retiens <kbd>Entrée</kbd></button>`);
      const proceed = () => {
        keys = {};
        // Test juste après un ou deux autres exercices : rappel à court terme.
        queue.splice(Math.min(queue.length, 2), 0, { card, kind: pickExercise(stateOf(card), card, opts) });
        next();
      };
      $('#got').addEventListener('click', proceed);
      keys = { enter: proceed };
    },

    [KINDS.MCQ_MEANING](card) {
      const options = choicesFor(card, pool, 'fr');
      frame(card, KIND_LABELS[KINDS.MCQ_MEANING], 'target', `<div class="prompt">${termBlock(card)}</div>${choiceButtons(options, false)}`);
      bindChoices(card, options, card.fr);
    },

    [KINDS.MCQ_TERM](card) {
      const options = choicesFor(card, pool, 'term');
      frame(card, KIND_LABELS[KINDS.MCQ_TERM], 'target', `<div class="prompt"><span class="prompt-fr glow">${esc(card.fr)}</span></div>${choiceButtons(options, true)}`);
      bindChoices(card, options, card.term);
    },

    [KINDS.LISTEN](card) {
      const options = choicesFor(card, pool, 'fr');
      frame(card, KIND_LABELS[KINDS.LISTEN], 'headphones', `
        <div class="prompt listen">
          <button type="button" class="play" data-say="${esc(card.term)}" aria-label="Réécouter">${icon('speaker')}</button>
          <p class="muted small">Qu’as-tu entendu ? Touche le haut-parleur pour réécouter.</p>
        </div>${choiceButtons(options, false)}`);
      setTimeout(() => speak(card.term, code), 250);
      bindChoices(card, options, card.fr);
    },

    [KINDS.CLOZE_MCQ](card) {
      const cz = clozeOf(card);
      if (!cz) return RENDERERS[KINDS.MCQ_TERM](card);
      const options = choicesFor(card, pool, 'bare', Math.random, 4, cz.answer);
      frame(card, KIND_LABELS[KINDS.CLOZE_MCQ], 'quote', `
        <div class="prompt cloze">
          <p class="sentence" ${langAttrs(lang)}>${esc(cz.before)}<span class="blank">?</span>${esc(cz.after)}</p>
          <p class="example-fr">${esc(card.exampleFr || `(${card.fr})`)}</p>
        </div>${choiceButtons(options, true)}`);
      bindChoices(card, options, cz.answer);
    },

    [KINDS.CLOZE_TYPE](card) {
      const cz = clozeOf(card);
      if (!cz) return RENDERERS[KINDS.TYPE](card);
      frame(card, KIND_LABELS[KINDS.CLOZE_TYPE], 'pen', `
        <div class="prompt cloze">
          <p class="sentence" ${langAttrs(lang)}>${esc(cz.before)}<span class="blank">?</span>${esc(cz.after)}</p>
          <p class="example-fr">${esc(card.exampleFr || '')} <span class="muted">(${esc(card.fr)})</span></p>
          ${typeForm('Le mot manquant…', langAttrs(lang))}
        </div>`);
      bindType(card, [cz.answer, card.term, card.translit], hintFor(cz.answer));
    },

    [KINDS.TYPE](card) {
      frame(card, KIND_LABELS[KINDS.TYPE], 'pen', `
        <div class="prompt">
          <span class="prompt-fr glow">${esc(card.fr)}</span>
          ${typeForm(`En ${lang.name.toLowerCase()}…`, langAttrs(lang))}
          ${card.translit ? '<p class="muted small form-note">Écriture locale ou lettres latines : les deux sont acceptées.</p>' : ''}
        </div>`);
      bindType(card, [card.term, card.translit], hintFor(card.translit || card.term));
    },

    [KINDS.FLASH](card) {
      const showFr = Math.random() < 0.5;
      frame(card, KIND_LABELS[KINDS.FLASH], 'cards', `
        <div class="prompt">${showFr ? `<span class="prompt-fr glow">${esc(card.fr)}</span>` : termBlock(card)}</div>`);
      controls(`<button type="button" class="btn primary full" id="reveal">Voir la réponse <kbd>Espace</kbd></button>`);
      const reveal = () => {
        const zone = document.createElement('div');
        zone.className = 'result';
        zone.innerHTML = answerBlock(card);
        $('.exercise').append(zone);
        bindSpeak(zone, code);
        const labels = ['À revoir', 'Difficile', 'Bien', 'Facile'];
        const previews = previewIntervals(stateOf(card));
        controls(`<div class="grades" role="group" aria-label="Évalue ta réponse">${labels.map((l, g) => `
          <button type="button" class="grade g${g}" data-g="${g}"><span>${l}</span><small>${previews[g]}</small><kbd>${g + 1}</kbd></button>`).join('')}</div>`);
        const grade = (g) => { keys = {}; settle(card, g); next(); };
        app.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => grade(Number(b.dataset.g))));
        keys = { num: grade };
      };
      $('#reveal').addEventListener('click', reveal);
      keys = { space: reveal, enter: reveal };
    },
  };

  function finish() {
    stop();
    setTheme(lang.hue);
    const answered = tally.right + tally.wrong;
    const score = answered ? pct(tally.right, answered) : 100;
    render(`
      ${banner(interleave([code], [{ icon: 'trophy', hue: '#f4c76b' }, { icon: 'star', hue: '#f4c76b' }, { icon: 'flame', hue: '#f09a6a' }]))}
      <section class="empty">
        <p class="kicker">${quiz ? 'Quiz terminé' : 'Séance terminée'}</p>
        <p class="score glow-gold">${score}<small>%</small></p>
        <p class="muted">${plural(tally.right, 'bonne réponse', 'bonnes réponses')} sur ${answered}${tally.fresh ? ` · ${plural(tally.fresh, 'nouveau mot', 'nouveaux mots')}` : ''}</p>
        <p class="saved">${icon('flame')} ${plural(streak(), 'jour')} d’affilée</p>
        <div class="btn-row center">
          <a class="btn primary" href="${back}">Continuer</a>
          <a class="btn" href="#/quiz/${code}/${deckId}">${icon('target')} ${quiz ? 'Rejouer' : 'Quiz éclair'}</a>
        </div>
      </section>`);
  }

  next();
}

// ---------- Statistiques ----------

async function viewStats() {
  setActiveTab('stats');
  setTheme('#82b8db');
  const now = new Date();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ date: d, n: store.history[today(d)]?.reviews || 0 });
  }
  const totalReviews = Object.values(store.history).reduce((s, d) => s + d.reviews, 0);
  const acc = accuracy(30);

  const langs = await Promise.all(LANGUAGES.map(async (l) => {
    const { decks } = await loadLanguage(l.code);
    const cards = decks.flatMap((d) => d.cards);
    const stages = { neuf: 0, apprentissage: 0, jeune: 0, maitrise: 0 };
    for (const c of cards) {
      const s = stateOf(c);
      if (isNew(s)) stages.neuf++;
      else if (s.interval < 7) stages.apprentissage++;
      else if (s.interval < 21) stages.jeune++;
      else stages.maitrise++;
    }
    return { l, cards, stages };
  }));
  const seen = langs.reduce((s, x) => s + x.cards.length - x.stages.neuf, 0);
  const mature = langs.reduce((s, x) => s + x.stages.maitrise, 0);

  // Prévision : cartes à revoir sur les 7 prochains jours (le 1er jour inclut le retard).
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(23, 59, 59, 999);
    return { date: d, n: 0 };
  });
  for (const { cards } of langs) {
    for (const c of cards) {
      const s = stateOf(c);
      if (isNew(s)) continue;
      const slot = forecast.find((f) => s.due <= f.date.getTime());
      if (slot) slot.n++;
    }
  }

  const bars = (list, labelFn, tipFn) => {
    const max = Math.max(1, ...list.map((d) => d.n));
    return `<div class="bars">${list.map((d) => `
      <div class="bar-col" tabindex="0" data-tip="${esc(tipFn(d))}">
        <span class="bar-val">${d.n || ''}</span>
        <span class="bar" style="height:${(d.n / max) * 100}%"></span>
        <span class="bar-label">${labelFn(d)}</span>
      </div>`).join('')}</div>`;
  };
  const STAGES = [['maitrise', 'Maîtrisés'], ['jeune', 'Bien partis'], ['apprentissage', 'En apprentissage'], ['neuf', 'Pas encore vus']];
  const weekday = (d) => d.date.toLocaleDateString('fr-FR', { weekday: 'narrow' });

  render(`
    ${banner(interleave(LANGUAGES.map((l) => l.code), [{ icon: 'chart', hue: '#82b8db' }, { icon: 'flame', hue: '#f09a6a' }, { icon: 'target', hue: '#f4c76b' }]))}
    ${pageHead({ eyebrow: 'Carnet de bord', mark: icon('chart'), title: 'Statistiques', lede: 'Ce que tu as déjà parcouru.' })}
    <section class="tiles">
      <div class="tile glass" style="--rim:var(--gold)"><span class="tile-value glow-gold">${streak()}</span><span class="tile-label">jours d’affilée</span></div>
      <div class="tile glass"><span class="tile-value">${seen}</span><span class="tile-label">mots vus</span></div>
      <div class="tile glass"><span class="tile-value">${mature}</span><span class="tile-label">maîtrisés</span></div>
      <div class="tile glass"><span class="tile-value">${acc === null ? '—' : `${Math.round(acc * 100)}<small>%</small>`}</span><span class="tile-label">réussite (30 j)</span></div>
    </section>

    <h2 class="section-title">Activité · 14 derniers jours</h2>
    <figure class="chart glass" aria-label="Révisions par jour sur 14 jours">
      ${bars(days, weekday, (d) => `${d.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${plural(d.n, 'révision')}`)}
      <figcaption class="muted small">${plural(totalReviews, 'révision')} au total.</figcaption>
    </figure>

    <h2 class="section-title">À revoir · 7 prochains jours</h2>
    <figure class="chart glass forecast" aria-label="Cartes à revoir sur les 7 prochains jours">
      ${bars(forecast, weekday, (d) => `${d.date.toLocaleDateString('fr-FR', { weekday: 'long' })} : ${plural(d.n, 'carte')}`)}
      <figcaption class="muted small">Le premier jour inclut les cartes déjà en retard.</figcaption>
    </figure>

    <h2 class="section-title">Progression par langue</h2>
    <div class="legend">${STAGES.map(([k, l]) => `<span><i class="sw ${k}"></i>${l}</span>`).join('')}</div>
    <section class="stage-list">
      ${langs.map(({ l, cards, stages }) => `
        <div class="stage-row glass" style="--rim:${l.hue}">
          <div class="stage-head"><span class="lang-flag sm">${flag(l.code)}</span><strong>${l.name}</strong><span class="muted small">${cards.length - stages.neuf}/${cards.length} vus</span></div>
          <div class="stack" role="img" aria-label="${STAGES.map(([k, lab]) => `${lab} : ${stages[k]}`).join(', ')}">
            ${STAGES.map(([k, lab]) => (stages[k] ? `<span class="seg ${k}" style="flex:${stages[k]}" title="${lab} : ${stages[k]}"></span>` : '')).join('')}
          </div>
        </div>`).join('')}
    </section>
    <table class="stats-table glass">
      <thead><tr><th>Langue</th>${STAGES.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead>
      <tbody>${langs.map(({ l, stages }) => `<tr><td>${l.name}</td>${STAGES.map(([k]) => `<td>${stages[k]}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <p class="muted small">« Maîtrisé » : la carte ne revient plus qu’une fois toutes les 3 semaines, ou moins souvent.</p>
  `);
}

// ---------- Méthode ----------

function viewMethod() {
  setActiveTab('method');
  setTheme('#c79bf2');
  const P = (ic, title, text) => `
    <article class="principle glass">
      <span class="orb" style="--hue:var(--theme)">${icon(ic)}</span>
      <div><h3>${title}</h3><p>${text}</p></div>
    </article>`;
  render(`
    ${banner(interleave(LANGUAGES.map((l) => l.code), [{ icon: 'lightbulb', hue: '#c79bf2' }, { icon: 'target', hue: '#f4c76b' }, { icon: 'clock', hue: '#82d0c0' }]))}
    ${pageHead({ eyebrow: 'Comment ça marche', mark: icon('lightbulb'), title: 'La méthode', lede: 'Lingua s’appuie sur les techniques d’apprentissage les mieux étayées par la recherche.' })}
    <section class="principles">
      ${P('target', 'Se tester plutôt que relire', 'Aller chercher une réponse dans sa mémoire la renforce bien plus que relire une liste. Presque tout est donc un exercice, même les nouveaux mots, testés juste après leur découverte.')}
      ${P('clock', 'Espacer les révisions', 'Chaque mot revient juste avant que tu l’oublies : le lendemain, puis 3 jours, une semaine, un mois… Les mots faciles reviennent de moins en moins, les difficiles plus souvent.')}
      ${P('layers', 'Difficulté progressive', 'Reconnaître un mot (QCM), le retrouver dans une phrase, puis l’écrire ou le comprendre à l’oral. Plus l’effort de rappel est grand, plus le mot s’ancre, tant qu’il reste à ta portée.')}
      ${P('shuffle', 'Mélanger les thèmes', 'La séance du jour alterne les paquets au lieu de les enchaîner : il faut reconnaître le bon mot, pas réciter une liste dans l’ordre.')}
      ${P('quote', 'Toujours du contexte', 'Chaque mot vient avec une phrase d’exemple traduite, et l’audio quand ton appareil a la voix. On retient mieux ce qu’on comprend en situation.')}
      ${P('bolt', 'Correction immédiate', 'Tu vois tout de suite la bonne réponse, l’exemple et les pièges. Les petites fautes de frappe sont tolérées et tu peux faire accepter un synonyme.')}
    </section>
    <p class="notice">${icon('chat')} <span><b>Pour parler couramment</b>, une appli ne suffit pas : Lingua construit ton vocabulaire et tes automatismes. Combine-la avec de vraies conversations (tandem, cours, voyages), des séries et des podcasts. Une courte séance chaque jour vaut mieux qu’une longue par semaine.</span></p>
    <h2 class="section-title">Sources</h2>
    <ul class="sources glass">
      <li>Dunlosky et al. (2013), « Improving Students’ Learning With Effective Learning Techniques », <i>Psychological Science in the Public Interest</i>. Le test et l’espacement y sont jugés les techniques les plus utiles. <a href="https://journals.sagepub.com/doi/abs/10.1177/1529100612453266" rel="noopener" target="_blank">Lien</a></li>
      <li>Roediger & Karpicke (2006), « Test-Enhanced Learning », <i>Psychological Science</i>, 17, 249-255. <a href="https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x" rel="noopener" target="_blank">Lien</a></li>
      <li>Cepeda et al. (2006), « Distributed Practice in Verbal Recall Tasks », <i>Psychological Bulletin</i>, 132(3), 354-380. <a href="https://digitalcommons.usf.edu/psy_facpub/1771/" rel="noopener" target="_blank">Lien</a></li>
    </ul>
  `);
}

// ---------- Réglages ----------

function viewSettings() {
  setActiveTab('settings');
  setTheme('#82d0c0');
  const s = store.settings;
  render(`
    ${banner(interleave(LANGUAGES.map((l) => l.code), [{ icon: 'sliders', hue: '#82d0c0' }, { icon: 'headphones', hue: '#c79bf2' }]))}
    ${pageHead({ eyebrow: 'Carnet de langues', mark: icon('sliders'), title: 'Réglages', lede: 'Adapte les séances à ton rythme.' })}
    <form id="settings" class="settings glass">
      <fieldset>
        <legend>Type d’exercices</legend>
        <label><input type="radio" name="mode" value="auto" ${s.mode !== 'flash' ? 'checked' : ''}> Varié et progressif (recommandé)</label>
        <label><input type="radio" name="mode" value="flash" ${s.mode === 'flash' ? 'checked' : ''}> Cartes à retourner uniquement</label>
      </fieldset>
      <label class="row">Nouveaux mots par jour et par langue
        <input type="number" name="newPerDay" min="0" max="100" value="${s.newPerDay}">
      </label>
      <label class="row switch"><span>Prononcer automatiquement</span>
        <input type="checkbox" name="autoSpeak" ${s.autoSpeak ? 'checked' : ''}>
      </label>
    </form>

    <h2 class="section-title">Voix sur cet appareil</h2>
    <ul class="voices glass">
      ${LANGUAGES.map((l) => `<li><span class="lang-flag sm">${flag(l.code)}</span><span>${l.name}</span>
        ${canSpeak(l.code) ? `<span class="chip maitrise">${icon('check')} ${esc(voiceFor(l.code).name)}</span>` : '<span class="chip">Aucune : pas d’exercices d’écoute</span>'}</li>`).join('')}
    </ul>

    <h2 class="section-title">Sauvegarde</h2>
    <p class="muted small">Ta progression est enregistrée uniquement sur cet appareil. Exporte-la pour la garder ou la transférer.</p>
    <div class="btn-row">
      <button class="btn" id="export">Exporter</button>
      <label class="btn">Importer<input type="file" id="import" accept="application/json,.json" hidden></label>
      <button class="btn danger" id="reset">Tout effacer</button>
    </div>
    <p class="muted small about">Lingua · aucune donnée ne quitte ton appareil.</p>
  `);

  app.querySelector('#settings').addEventListener('change', (e) => {
    const f = e.currentTarget;
    s.mode = f.mode.value;
    s.newPerDay = Math.max(0, Math.min(100, parseInt(f.newPerDay.value, 10) || 0));
    s.autoSpeak = f.autoSpeak.checked;
    toast(save() ? 'Réglages enregistrés' : 'Impossible d’enregistrer sur cet appareil');
  });

  app.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lingua-sauvegarde-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  app.querySelector('#import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      importJson(await file.text());
      toast('Sauvegarde importée');
      viewSettings();
    } catch (err) {
      toast(`Import impossible : ${err.message}`);
    }
  });

  app.querySelector('#reset').addEventListener('click', () => {
    if (!confirm('Effacer toute la progression, les réglages et les paquets perso ?')) return;
    resetAll();
    toast('Tout a été effacé');
    viewSettings();
  });
}

// ---------- Routeur ----------

async function route() {
  cleanup?.();
  cleanup = null;
  const [path, query = ''] = (location.hash || '#/').split('?');
  const [, view, a, b] = path.split('/');
  const params = new URLSearchParams(query);
  try {
    if (view === 'lang') await viewLanguage(a);
    else if (view === 'session') await viewSession(a, b || 'all', { mode: params.get('mode') || undefined });
    else if (view === 'quiz') await viewSession(a, b || 'all', { quiz: true });
    else if (view === 'browse') await viewBrowse(a, b);
    else if (view === 'stats') await viewStats();
    else if (view === 'method') viewMethod();
    else if (view === 'settings') viewSettings();
    else await viewHome();
  } catch (err) {
    console.error(err);
    render(`<section class="empty"><h1>Oups…</h1><p class="muted">${esc(err.message)}</p><a class="btn" href="#/">Accueil</a></section>`);
  }
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
