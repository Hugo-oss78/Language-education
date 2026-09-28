import { LANGUAGES, getLanguage } from '../data/languages.js';
import { GRADES, isNew, isDue, isMature, review, previewIntervals } from './srs.js';
import { checkAnswer, alternatives, parseCsv, rowsToCards } from './text.js';
import {
  store, save, logReview, newCardsToday, streak, today,
  exportJson, importJson, resetAll,
} from './storage.js';

const app = document.getElementById('app');
const deckCache = {};

// ---------- Données ----------

function slug(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function loadDecks(lang) {
  if (!deckCache[lang]) {
    const mod = await import(`../data/${lang}.js`);
    deckCache[lang] = mod.default.decks;
  }
  const custom = store.customDecks[lang] || [];
  return [...deckCache[lang], ...custom.map((d) => ({ ...d, custom: true }))].map((deck) => ({
    ...deck,
    cards: deck.cards.map((c) => ({ ...c, id: `${lang}:${deck.id}:${slug(c.term)}`, deckId: deck.id })),
  }));
}

function deckCounts(cards, now = Date.now()) {
  let due = 0, fresh = 0, mature = 0;
  for (const c of cards) {
    const s = store.progress[c.id];
    if (isNew(s)) fresh++;
    else if (isDue(s, now)) due++;
    if (isMature(s)) mature++;
  }
  return { due, fresh, mature, total: cards.length, seen: cards.length - fresh };
}

function newLeftToday() {
  return Math.max(0, store.settings.newPerDay - newCardsToday());
}

// ---------- Outils d'affichage ----------

function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function render(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
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
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
}

// ---------- Synthèse vocale ----------

function speak(text, langCode) {
  if (!('speechSynthesis' in window)) return toast('La synthèse vocale n’est pas disponible ici.');
  const lang = getLanguage(langCode)?.tts || langCode;
  const utter = new SpeechSynthesisUtterance(alternatives(text)[0]);
  utter.lang = lang;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(lang));
  if (voice) utter.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// ---------- Vue : accueil ----------

async function viewHome() {
  setActiveTab('home');
  const rows = await Promise.all(LANGUAGES.map(async (l) => {
    if (!l.available) return { l };
    const cards = (await loadDecks(l.code)).flatMap((d) => d.cards);
    return { l, counts: deckCounts(cards) };
  }));
  const s = streak();

  render(`
    <header class="page-head">
      <h1>Bonjour 👋</h1>
      <p class="muted">${s ? `🔥 ${s} jour${s > 1 ? 's' : ''} d’affilée — continue !` : 'Une petite séance aujourd’hui ?'}</p>
    </header>
    <section class="lang-list">
      ${rows.map(({ l, counts }) => l.available ? `
        <a class="lang-card" href="#/lang/${l.code}">
          <span class="flag" aria-hidden="true">${l.flag}</span>
          <span class="lang-info">
            <strong>${l.name}</strong>
            <span class="muted" lang="${l.code}" dir="${l.dir}">${l.native}</span>
          </span>
          <span class="badges">
            ${counts.due ? `<span class="badge due">${counts.due} à revoir</span>` : ''}
            <span class="badge">${counts.seen}/${counts.total} vus</span>
          </span>
        </a>` : `
        <div class="lang-card disabled" aria-disabled="true">
          <span class="flag" aria-hidden="true">${l.flag}</span>
          <span class="lang-info">
            <strong>${l.name}</strong>
            <span class="muted" lang="${l.code}" dir="${l.dir}">${l.native}</span>
          </span>
          <span class="badges"><span class="badge soon">Bientôt</span></span>
        </div>`).join('')}
    </section>
  `);
}

// ---------- Vue : paquets d'une langue ----------

async function viewLanguage(code) {
  setActiveTab('home');
  const lang = getLanguage(code);
  if (!lang?.available) return (location.hash = '#/');
  const decks = await loadDecks(code);
  const all = deckCounts(decks.flatMap((d) => d.cards));
  const newToday = Math.min(newLeftToday(), all.fresh);

  render(`
    <header class="page-head">
      <a class="back" href="#/">← Langues</a>
      <h1><span aria-hidden="true">${lang.flag}</span> ${lang.name}</h1>
    </header>
    <a class="cta ${all.due + newToday ? '' : 'idle'}" href="#/review/${code}/all">
      <strong>${all.due + newToday ? 'Commencer la séance' : 'Réviser quand même'}</strong>
      <span>${all.due} à revoir · ${newToday} nouvelle${newToday > 1 ? 's' : ''}</span>
    </a>
    <h2 class="section-title">Paquets</h2>
    <section class="deck-list">
      ${decks.map((d) => {
        const c = deckCounts(d.cards);
        const pct = Math.round((c.seen / c.total) * 100);
        return `
        <article class="deck">
          <a class="deck-main" href="#/review/${code}/${d.id}">
            <span class="deck-icon" aria-hidden="true">${esc(d.icon || '📝')}</span>
            <span class="deck-body">
              <strong>${esc(d.title)}</strong>
              <span class="muted small">${esc(d.description || '')}</span>
              <span class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Cartes vues">
                <span style="width:${pct}%"></span>
              </span>
              <span class="muted small">${c.seen}/${c.total} vues · ${c.mature} maîtrisées${c.due ? ` · <b class="due-text">${c.due} à revoir</b>` : ''}</span>
            </span>
          </a>
          <div class="deck-actions">
            <a href="#/browse/${code}/${d.id}">Voir la liste</a>
            ${d.custom ? `<button class="link danger" data-delete="${d.id}">Supprimer</button>` : ''}
          </div>
        </article>`;
      }).join('')}
    </section>
    <details class="import">
      <summary>➕ Créer mon propre paquet (CSV)</summary>
      <p class="muted small">Une ligne par carte : <code>français ; ${lang.name.toLowerCase()} ; exemple ; note</code>.
      Les deux dernières colonnes sont facultatives. Sépare les réponses possibles par « / ».</p>
      <form id="import-form">
        <label>Nom du paquet <input name="title" required maxlength="60" placeholder="Ex. : Voyage à Londres"></label>
        <label>Cartes <textarea name="csv" rows="6" placeholder="la gare ; the station ; Where is the station?"></textarea></label>
        <label class="file">… ou un fichier <input type="file" name="file" accept=".csv,.tsv,.txt,text/csv"></label>
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
    const list = (store.customDecks[code] ||= []);
    list.push({ id: `perso-${Date.now().toString(36)}`, title: form.title.value.trim(), icon: '📝', description: `${cards.length} cartes perso`, cards });
    save();
    toast(`${cards.length} cartes ajoutées ✔`);
    viewLanguage(code);
  });
}

// ---------- Vue : liste des cartes ----------

async function viewBrowse(code, deckId) {
  setActiveTab('home');
  const lang = getLanguage(code);
  const deck = (await loadDecks(code)).find((d) => d.id === deckId);
  if (!deck) return (location.hash = `#/lang/${code}`);
  render(`
    <header class="page-head">
      <a class="back" href="#/lang/${code}">← ${lang.name}</a>
      <h1>${esc(deck.icon || '')} ${esc(deck.title)}</h1>
    </header>
    <ul class="word-list">
      ${deck.cards.map((c) => {
        const s = store.progress[c.id];
        const status = isNew(s) ? 'Nouvelle' : isMature(s) ? 'Maîtrisée' : 'En cours';
        return `
        <li>
          <div>
            <strong lang="${code}" dir="${lang.dir}">${esc(c.term)}</strong>
            ${c.translit ? `<span class="translit">${esc(c.translit)}</span>` : ''}
            <span class="muted">${esc(c.fr)}</span>
            ${c.note ? `<span class="note small">${esc(c.note)}</span>` : ''}
          </div>
          <div class="word-side">
            <button class="icon-btn" data-say="${esc(c.term)}" aria-label="Écouter ${esc(c.term)}">🔊</button>
            <span class="chip ${slug(status)}">${status}</span>
          </div>
        </li>`;
      }).join('')}
    </ul>
  `);
  app.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => speak(b.dataset.say, code)));
}

// ---------- Vue : séance de révision ----------

function buildQueue(cards, deckId) {
  const now = Date.now();
  const due = cards.filter((c) => isDue(store.progress[c.id], now))
    .sort((a, b) => store.progress[a.id].due - store.progress[b.id].due);
  const fresh = cards.filter((c) => isNew(store.progress[c.id])).slice(0, newLeftToday());
  let queue = [...due, ...fresh];
  // Rien à faire ? Révision libre des cartes déjà vues, les plus proches de l'échéance d'abord.
  if (!queue.length && deckId) {
    queue = cards.filter((c) => !isNew(store.progress[c.id]))
      .sort((a, b) => store.progress[a.id].due - store.progress[b.id].due).slice(0, 20);
  }
  return queue;
}

async function viewReview(code, deckId) {
  setActiveTab('home');
  const lang = getLanguage(code);
  const decks = await loadDecks(code);
  const scope = deckId === 'all' ? decks : decks.filter((d) => d.id === deckId);
  if (!lang?.available || !scope.length) return (location.hash = `#/lang/${code}`);

  const queue = buildQueue(scope.flatMap((d) => d.cards), deckId !== 'all');
  const total = queue.length;
  const tally = { right: 0, again: 0 };
  let done = 0;
  let current = null;

  const back = `#/lang/${code}`;
  const title = deckId === 'all' ? 'Séance du jour' : scope[0].title;

  if (!total) {
    return render(`
      <header class="page-head"><a class="back" href="${back}">← ${lang.name}</a></header>
      <section class="empty">
        <p class="big">🎉</p>
        <h1>Tout est à jour !</h1>
        <p class="muted">Aucune carte à revoir pour l’instant et le quota de nouvelles cartes du jour est atteint.
        Tu peux l’augmenter dans les <a href="#/settings">réglages</a>.</p>
      </section>`);
  }

  function next() {
    current = queue.shift();
    if (!current) return finish();
    const { direction } = store.settings;
    current.showFr = direction === 'fr' || (direction === 'mixed' && Math.random() < 0.5);
    drawCard();
  }

  function drawCard() {
    const c = current;
    const typing = store.settings.typing;
    const prompt = c.showFr ? c.fr : c.term;
    const promptAttrs = c.showFr ? 'lang="fr"' : `lang="${code}" dir="${lang.dir}"`;
    render(`
      <header class="review-head">
        <a class="back" href="${back}" aria-label="Quitter la séance">✕</a>
        <div class="progress wide" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}" aria-label="Progression de la séance">
          <span style="width:${(done / total) * 100}%"></span>
        </div>
        <span class="muted small">${done}/${total}</span>
      </header>
      <p class="muted small center">${esc(title)} · ${c.showFr ? `Français → ${lang.name}` : `${lang.name} → Français`}</p>
      <article class="flashcard" aria-live="polite">
        <div class="prompt" ${promptAttrs}>${esc(prompt)}</div>
        ${!c.showFr ? `<button class="icon-btn speak" data-say aria-label="Écouter">🔊</button>` : ''}
        <div id="answer" hidden></div>
      </article>
      <div id="controls">
        ${typing ? `
          <form id="type-form" class="type-form" autocomplete="off">
            <input name="guess" ${c.showFr ? `lang="${code}" dir="${lang.dir}"` : 'lang="fr"'} placeholder="Ta réponse…" autocapitalize="off" spellcheck="false" aria-label="Ta réponse">
            <button class="btn primary" type="submit">Vérifier</button>
          </form>` : `
          <button class="btn primary full" id="reveal">Afficher la réponse <kbd>Espace</kbd></button>`}
      </div>
    `);
    if (!c.showFr && store.settings.autoSpeak) speak(c.term, code);
    app.querySelector('[data-say]')?.addEventListener('click', () => speak(c.term, code));
    if (typing) {
      const form = app.querySelector('#type-form');
      form.guess.focus();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const guess = form.guess.value;
        reveal({ guess, ok: checkAnswer(guess, c.showFr ? c.term : c.fr) });
      });
    } else {
      app.querySelector('#reveal').addEventListener('click', () => reveal());
    }
  }

  function reveal(typed) {
    const c = current;
    const answer = c.showFr ? c.term : c.fr;
    const answerAttrs = c.showFr ? `lang="${code}" dir="${lang.dir}"` : 'lang="fr"';
    const box = app.querySelector('#answer');
    box.hidden = false;
    box.innerHTML = `
      <hr>
      ${typed ? `<p class="verdict ${typed.ok ? 'ok' : 'ko'}">${typed.ok ? '✔ Bonne réponse' : `✘ Ta réponse : « ${esc(typed.guess || '—')} »`}</p>` : ''}
      <div class="answer" ${answerAttrs}>${esc(answer)}</div>
      ${c.translit ? `<div class="translit">${esc(c.translit)}</div>` : ''}
      ${c.example ? `<p class="example" lang="${code}" dir="${lang.dir}">
        <button class="icon-btn small" data-say-example aria-label="Écouter l’exemple">🔊</button> ${esc(c.example)}</p>` : ''}
      ${c.note ? `<p class="note">💡 ${esc(c.note)}</p>` : ''}
    `;
    if (c.showFr) {
      box.querySelector('.answer').insertAdjacentHTML('beforeend', ' <button class="icon-btn small" data-say-term aria-label="Écouter">🔊</button>');
      box.querySelector('[data-say-term]').addEventListener('click', () => speak(c.term, code));
      if (store.settings.autoSpeak) speak(c.term, code);
    }
    box.querySelector('[data-say-example]')?.addEventListener('click', () => speak(c.example, code));

    const labels = ['À revoir', 'Difficile', 'Bien', 'Facile'];
    const previews = previewIntervals(store.progress[c.id]);
    const suggested = typed ? (typed.ok ? GRADES.GOOD : GRADES.AGAIN) : null;
    app.querySelector('#controls').innerHTML = `
      <div class="grades" role="group" aria-label="Évalue ta réponse">
        ${labels.map((label, g) => `
          <button class="grade g${g} ${g === suggested ? 'suggested' : ''}" data-grade="${g}">
            <span>${label}</span><small>${previews[g]}</small><kbd>${g + 1}</kbd>
          </button>`).join('')}
      </div>`;
    app.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => grade(Number(b.dataset.grade))));
    (app.querySelector('.grade.suggested') || app.querySelector('.grade.g2')).focus({ preventScroll: true });
  }

  function grade(g) {
    const c = current;
    const prev = store.progress[c.id];
    store.progress[c.id] = review(prev, g);
    logReview(isNew(prev));
    save();
    if (g === GRADES.AGAIN) {
      tally.again++;
      queue.splice(Math.min(queue.length, 3), 0, c); // elle revient un peu plus tard
    } else {
      tally.right++;
      done++;
    }
    next();
  }

  function finish() {
    document.removeEventListener('keydown', onKey);
    render(`
      <section class="empty">
        <p class="big">🎉</p>
        <h1>Séance terminée !</h1>
        <p class="muted">${done} carte${done > 1 ? 's' : ''} révisée${done > 1 ? 's' : ''}${tally.again ? `, ${tally.again} erreur${tally.again > 1 ? 's' : ''} rattrapée${tally.again > 1 ? 's' : ''}` : ' sans erreur'}.</p>
        <p class="muted">🔥 Série : ${streak()} jour${streak() > 1 ? 's' : ''}</p>
        <a class="btn primary" href="${back}">Retour aux paquets</a>
      </section>`);
  }

  function onKey(e) {
    if (!location.hash.startsWith('#/review/')) return document.removeEventListener('keydown', onKey);
    if (e.target.matches('input, textarea')) return;
    const revealBtn = app.querySelector('#reveal');
    if ((e.key === ' ' || e.key === 'Enter') && revealBtn) { e.preventDefault(); revealBtn.click(); }
    else if (['1', '2', '3', '4'].includes(e.key) && app.querySelector('[data-grade]')) grade(Number(e.key) - 1);
  }
  document.addEventListener('keydown', onKey);
  next();
}

// ---------- Vue : statistiques ----------

async function viewStats() {
  setActiveTab('stats');
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = today(d);
    days.push({ key, date: d, label: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }), n: store.history[key]?.reviews || 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.n));
  const totalReviews = Object.values(store.history).reduce((s, d) => s + d.reviews, 0);
  const states = Object.values(store.progress);
  const seen = states.filter((s) => !isNew(s)).length;
  const mature = states.filter(isMature).length;

  const perLang = await Promise.all(LANGUAGES.filter((l) => l.available).map(async (l) => {
    const decks = await loadDecks(l.code);
    return { l, decks: decks.map((d) => ({ d, c: deckCounts(d.cards) })) };
  }));

  render(`
    <header class="page-head"><h1>Statistiques</h1></header>
    <section class="tiles">
      <div class="tile"><span class="tile-value">${streak()}</span><span class="tile-label">jours d’affilée</span></div>
      <div class="tile"><span class="tile-value">${seen}</span><span class="tile-label">cartes vues</span></div>
      <div class="tile"><span class="tile-value">${mature}</span><span class="tile-label">maîtrisées</span></div>
      <div class="tile"><span class="tile-value">${totalReviews}</span><span class="tile-label">révisions</span></div>
    </section>
    <h2 class="section-title">Révisions sur 14 jours</h2>
    <figure class="chart" aria-label="Nombre de révisions par jour sur les 14 derniers jours">
      <div class="bars">
        ${days.map((d) => `
          <div class="bar-col" tabindex="0" data-tip="${d.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${d.n} révision${d.n > 1 ? 's' : ''}">
            <span class="bar" style="height:${(d.n / max) * 100}%"></span>
            <span class="bar-label">${d.label}</span>
          </div>`).join('')}
      </div>
      <figcaption class="muted small">Maximum : ${max} révisions/jour. Survole ou touche une barre pour le détail.</figcaption>
    </figure>
    ${perLang.map(({ l, decks }) => `
      <h2 class="section-title">${l.flag} ${l.name}</h2>
      <table class="stats-table">
        <thead><tr><th>Paquet</th><th>Vues</th><th>Maîtrisées</th><th>À revoir</th></tr></thead>
        <tbody>
          ${decks.map(({ d, c }) => `<tr><td>${esc(d.title)}</td><td>${c.seen}/${c.total}</td><td>${c.mature}</td><td>${c.due}</td></tr>`).join('')}
        </tbody>
      </table>`).join('')}
    <p class="muted small">Une carte est « maîtrisée » quand elle n’est plus demandée qu’une fois toutes les 3 semaines ou moins souvent.</p>
  `);
}

// ---------- Vue : réglages ----------

function viewSettings() {
  setActiveTab('settings');
  const s = store.settings;
  render(`
    <header class="page-head"><h1>Réglages</h1></header>
    <form id="settings" class="settings">
      <fieldset>
        <legend>Sens des cartes</legend>
        <label><input type="radio" name="direction" value="mixed" ${s.direction === 'mixed' ? 'checked' : ''}> Mélangé (recommandé)</label>
        <label><input type="radio" name="direction" value="fr" ${s.direction === 'fr' ? 'checked' : ''}> Français → langue étudiée</label>
        <label><input type="radio" name="direction" value="target" ${s.direction === 'target' ? 'checked' : ''}> Langue étudiée → français</label>
      </fieldset>
      <label class="row">Nouvelles cartes par jour
        <input type="number" name="newPerDay" min="0" max="100" value="${s.newPerDay}">
      </label>
      <label class="row switch"><span>Écrire ma réponse avant de la voir</span>
        <input type="checkbox" name="typing" ${s.typing ? 'checked' : ''}>
      </label>
      <label class="row switch"><span>Prononcer automatiquement</span>
        <input type="checkbox" name="autoSpeak" ${s.autoSpeak ? 'checked' : ''}>
      </label>
    </form>

    <h2 class="section-title">Sauvegarde</h2>
    <p class="muted small">Ta progression est enregistrée uniquement sur cet appareil. Exporte-la pour la garder ou la transférer.</p>
    <div class="btn-row">
      <button class="btn" id="export">Exporter</button>
      <label class="btn">Importer<input type="file" id="import" accept="application/json,.json" hidden></label>
      <button class="btn danger" id="reset">Tout effacer</button>
    </div>
    <p class="muted small about">Lingua · les données restent sur ton appareil, aucun compte nécessaire.</p>
  `);

  app.querySelector('#settings').addEventListener('change', (e) => {
    const f = e.currentTarget;
    s.direction = f.direction.value;
    s.newPerDay = Math.max(0, Math.min(100, parseInt(f.newPerDay.value, 10) || 0));
    s.typing = f.typing.checked;
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
      toast('Sauvegarde importée ✔');
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
  const [, view, a, b] = (location.hash || '#/').split('/');
  try {
    if (view === 'lang') await viewLanguage(a);
    else if (view === 'review') await viewReview(a, b || 'all');
    else if (view === 'browse') await viewBrowse(a, b);
    else if (view === 'stats') await viewStats();
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
