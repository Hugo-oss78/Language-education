// TOEIC blanc : écrans (accueil, test en conditions d'examen, entraînement par partie, résultats).
// Module isolé, chargé à la demande par app.js pour les routes #/toeic/…

import test1 from '../../data/toeic/test1.js';
import {
  PARTS, LETTERS, flatten, screens, scoreTest, weakestPart, scriptFor,
} from './engine.js';
import { icon, flag } from '../icons.js';

const KEY = 'lingua.toeic.v1';
const HUE = '#7fb6d9';
const TEST = test1;
const QUESTIONS = flatten(TEST);

let ctx = null; // { app, setActiveTab, setTheme, toast }

function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function render(html) {
  ctx.app.innerHTML = html;
  window.scrollTo(0, 0);
}

function go(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

// ---------- Sauvegarde des résultats (sur l'appareil) ----------

function loadData() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { attempts: [] }; } catch { return { attempts: [] }; }
}

function saveAttempt(attempt) {
  const d = loadData();
  d.attempts = [...d.attempts, attempt].slice(-20);
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* stockage indisponible */ }
  return d.attempts.length - 1;
}

// ---------- Voix : plusieurs accents anglais (le vrai test mélange américain, britannique, canadien, australien) ----------

function englishVoices() {
  let list = [];
  try { list = window.speechSynthesis?.getVoices() || []; } catch { list = []; }
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  const order = ['en-us', 'en-gb', 'en-au', 'en-ca', 'en-ie', 'en-nz'];
  return list.filter((v) => norm(v).startsWith('en'))
    .sort((a, b) => (order.indexOf(norm(a)) + 1 || 99) - (order.indexOf(norm(b)) + 1 || 99));
}

function voicesLoaded() {
  try { return (window.speechSynthesis?.getVoices() || []).length > 0; } catch { return false; }
}

function noVoiceHtml(q) {
  return `<p class="notice">${icon('speaker')}<span>Pas de voix anglaise sur cet appareil : voici le texte à la place.</span></p>${transcriptHtml(q).replace('<details', '<details open')}`;
}

export function hasEnglishVoice() {
  return englishVoices().length > 0;
}

// Choisit une voix par rôle ; « shift » fait varier les accents d'un document à l'autre.
function voiceFor(who, shift = 0) {
  const voices = englishVoices();
  if (!voices.length) return { voice: null, pitch: 1 };
  // Une voix par pays si possible, pour entendre plusieurs accents.
  const byLocale = [];
  for (const v of voices) if (!byLocale.some((x) => x.lang === v.lang)) byLocale.push(v);
  const pool = byLocale.length > 1 ? byLocale : voices;
  const base = { N: 0, W: 1, M: 2 }[who] ?? 0;
  const voice = pool[(base + shift) % pool.length];
  const other = pool[(({ N: 0, W: 1, M: 2 }[who === 'M' ? 'W' : 'M']) + shift) % pool.length];
  // Même voix pour l'homme et la femme : on les distingue par la hauteur.
  const pitch = voice === other ? (who === 'M' ? 0.85 : who === 'W' ? 1.15 : 1) : 1;
  return { voice, pitch };
}

// Lit des répliques à la suite. Renvoie une fonction d'arrêt.
//   onend : appelé à la fin ; onBlocked : appelé si la voix ne démarre pas (Safari iOS exige
//   qu'elle démarre juste après un appui : sinon elle reste muette, sans erreur).
// Le minuteur de secours ne court qu'une fois la voix lancée, pour ne jamais la couper.
function playScript(lines, shift, onLine, onend, onBlocked) {
  let i = 0;
  let stopped = false;
  let guard = null;
  let pause = null;
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  const next = () => {
    if (stopped) return;
    if (i >= lines.length) { onLine?.(-1); onend?.(); return; }
    const line = lines[i];
    onLine?.(i);
    let done = false;
    const finish = () => {
      if (done || stopped) return;
      done = true;
      clearTimeout(guard);
      i++;
      pause = setTimeout(next, 500);
    };
    // Sans synthèse vocale, on avance au rythme de la lecture (le texte est affiché).
    if (!synth) { guard = setTimeout(finish, 1500 + line.text.length * 60); return; }
    try {
      const u = new SpeechSynthesisUtterance(line.text);
      const { voice, pitch } = voiceFor(line.who, shift);
      u.lang = voice?.lang || 'en-US';
      if (voice) u.voice = voice;
      u.pitch = pitch;
      u.rate = 0.95;
      u.onstart = () => {
        clearTimeout(guard);
        guard = setTimeout(finish, 6000 + line.text.length * 130);
      };
      u.onend = finish;
      u.onerror = (e) => {
        // « not-allowed » : le navigateur a refusé de parler sans appui de l'utilisateur.
        if (e?.error === 'not-allowed' && i === 0) { clearTimeout(guard); onBlocked?.(); return; }
        finish();
      };
      // Annuler juste avant de parler fait parfois taire Safari : seulement si quelque chose est en cours.
      if (synth.speaking || synth.pending) synth.cancel();
      synth.speak(u);
      // Rien n'a démarré au bout de 3 s : sur la première réplique, c'est un blocage ; ensuite, on avance.
      guard = setTimeout(() => {
        if (i === 0) { stopped = true; try { synth.cancel(); } catch { /* rien */ } onBlocked?.(); } else finish();
      }, 3000);
    } catch {
      guard = setTimeout(finish, 1500 + line.text.length * 60);
    }
  };
  next();
  return () => {
    stopped = true;
    clearTimeout(guard);
    clearTimeout(pause);
    try { synth?.cancel(); } catch { /* rien */ }
  };
}

// ---------- Routes ----------

export async function routeToeic(sub, arg, helpers) {
  ctx = helpers;
  ctx.setActiveTab('home');
  ctx.setTheme(HUE);
  if (sub === 'exam') return viewRunner({ mode: 'exam' });
  if (sub === 'train') return viewRunner({ mode: 'train', part: Number(arg) });
  if (sub === 'result') return viewResult(Number(arg));
  return viewHome();
}

// ---------- Accueil ----------

function viewHome() {
  const { attempts } = loadData();
  const lCount = QUESTIONS.filter((q) => q.section === 'L').length;
  const rCount = QUESTIONS.length - lCount;
  render(`
    <header class="page-head">
      <a class="back" href="#/lang/en">${icon('back')} Anglais</a>
      <p class="eyebrow"><span class="ring">${flag('en')}</span> Anglais · préparation</p>
      <h1>TOEIC blanc</h1>
      <p class="lede">Entraîne-toi au format du TOEIC Listening &amp; Reading et obtiens une <b>estimation</b> de ton score.</p>
    </header>

    <a class="hero glass" href="#/toeic/exam" style="--rim:var(--gold)">
      <span class="orb big" style="--hue:var(--gold)">${icon('clock')}</span>
      <span class="hero-body">
        <span class="kicker">Conditions d’examen</span>
        <strong>${esc(TEST.title)}</strong>
        <span class="muted small">${lCount} questions d’écoute (audio joué une seule fois) + ${rCount} de lecture en ${TEST.readingMinutes} min · environ 35 min</span>
      </span>
      <span class="hero-go">${icon('arrow')}</span>
    </a>
    <p class="notice" id="voice-note" hidden>${icon('speaker')}<span>Aucune voix anglaise trouvée sur cet appareil : l’écoute ne pourra pas être lue à voix haute (le texte sera affiché à la place).</span></p>

    ${attempts.length ? `
      <h2 class="section-title">Tes résultats</h2>
      <ul class="toeic-history glass">
        ${attempts.map((a, i) => ({ a, i })).reverse().map(({ a, i }) => `
          <li><a href="#/toeic/result/${i}">
            <span>${new Date(a.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <strong>≈ ${a.result.total.score}</strong>
            <span class="muted small">écoute ${a.result.L.score} (${a.result.L.cefr}) · lecture ${a.result.R.score} (${a.result.R.cefr})</span>
          </a></li>`).join('')}
      </ul>` : ''}

    <h2 class="section-title">S’entraîner partie par partie</h2>
    <p class="muted small">Correction et explication en français après chaque question ; à l’écoute, tu peux réécouter et lire la transcription.</p>
    <section class="toeic-parts">
      ${Object.entries(PARTS).map(([n, p]) => {
        const count = QUESTIONS.filter((q) => q.part === Number(n)).length;
        return `<a class="glass toeic-part" href="#/toeic/train/${n}" style="--rim:${p.section === 'L' ? HUE : '#c79bf2'}">
          <span class="toeic-num">${n}</span>
          <span class="hero-body"><strong>${p.name}</strong><span class="muted small">${p.section === 'L' ? 'Écoute' : 'Lecture'} · ${count} questions · ${esc(p.desc)}</span></span>
          ${icon('arrow')}
        </a>`;
      }).join('')}
    </section>

    <section class="glass toeic-note">
      <p><strong>Est-ce le vrai TOEIC ?</strong> Non. Le TOEIC appartient à ETS et ses questions ne sont pas publiques.
        Ce test reprend fidèlement son <b>format</b> (7 parties, types de questions, pièges classiques), avec des questions écrites pour Lingua,
        en version réduite : ${QUESTIONS.length} questions au lieu de 200.</p>
      <p><strong>Le score est une estimation.</strong> ETS convertit les bonnes réponses en score avec une table propre à chaque version du test, qui n’est pas publiée.
        Lingua fait une conversion simple et affiche une <b>fourchette</b> : avec peu de questions, la marge d’erreur est grande.
        Les niveaux du CECRL (A1 à C1) suivent les seuils officiels publiés par ETS.</p>
      <p><strong>Pour aller plus loin :</strong> ETS propose gratuitement des tests d’exemple officiels sur sa page de préparation
        (ets.org → TOEIC → Test takers → Prepare). Seul le vrai examen, passé dans un centre agréé, donne un score officiel.</p>
    </section>
  `);
  // Les voix arrivent parfois après le premier affichage.
  setTimeout(() => {
    const note = ctx.app.querySelector('#voice-note');
    let list = [];
    try { list = speechSynthesis.getVoices(); } catch { /* rien */ }
    if (note && (!('speechSynthesis' in window) || (list.length && !hasEnglishVoice()))) note.hidden = false;
  }, 600);
  return null;
}

// ---------- Rendu d'une question ----------

function sceneHtml(item) {
  return `<figure class="toeic-photo" role="img" aria-label="${esc(item.sceneAlt)}">
    <span class="toeic-scene">${item.scene.join(' ')}</span>
    <figcaption>Image simplifiée : ${esc(item.sceneAlt)}</figcaption>
  </figure>`;
}

function graphicHtml(g) {
  return `<table class="toeic-graphic"><caption>${esc(g.title)}</caption>
    <thead><tr>${g.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${g.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

// Boutons de réponse. showText : afficher le texte des options (toujours sauf parties 1 et 2 en examen).
function optionsHtml(q, { showText, chosen, reveal }) {
  return `<div class="choices toeic-choices${showText ? '' : ' letters'}" data-q="${q.id}" style="--n:${q.options.length}">${q.options.map((o, i) => {
    let cls = '';
    if (reveal) cls = i === q.answer ? 'right' : i === chosen ? 'wrong' : '';
    else if (i === chosen) cls = 'picked';
    return `<button type="button" class="choice ${cls}" data-i="${i}" ${reveal ? 'disabled' : ''} aria-pressed="${i === chosen}">
      <b class="toeic-letter">${LETTERS[i]}</b>${showText ? `<span>${esc(o)}</span>` : ''}
    </button>`;
  }).join('')}</div>`;
}

function transcriptHtml(q) {
  const lines = scriptFor(q);
  if (!lines.length) return '';
  const label = { N: '', M: 'Homme', W: 'Femme' };
  return `<details class="toeic-transcript"><summary>Transcription</summary>
    ${lines.map((l) => `<p>${label[l.who] ? `<b>${label[l.who]} :</b> ` : ''}${esc(l.text)}</p>`).join('')}</details>`;
}

function explainHtml(q, chosen) {
  const ok = chosen === q.answer;
  return `<div class="toeic-explain ${ok ? 'ok' : 'ko'}">
    <p><b>${ok ? 'Bonne réponse' : chosen === undefined ? 'Pas de réponse' : 'Raté'}</b> · réponse ${LETTERS[q.answer]}${q.part <= 2 ? ` : « ${esc(q.options[q.answer])} »` : ''}</p>
    <p>${esc(q.explain)}</p>
  </div>`;
}

// Corps d'un écran (une question ou un ensemble). mode : 'exam' | 'train' | 'review'.
function screenBody(screen, { mode, answers, revealed }) {
  const first = screen.questions[0];
  const set = first.setRef;
  const listening = screen.section === 'L';
  const showText = (q) => !(listening && q.part <= 2) || mode !== 'exam' && revealed.has(q.id) || mode === 'review';
  let top = '';
  if (first.part === 1) top = sceneHtml(first.item);
  if (first.part === 2) top = '<p class="toeic-instruction">Écoute la question et les trois réponses.</p>';
  if (first.part === 3) top = set.graphic ? graphicHtml(set.graphic) : '';
  if (first.part === 4) top = `<p class="toeic-instruction">${esc(set.kind)}</p>`;
  if (first.part === 5) top = '';
  if (first.part === 6) {
    const body = esc(set.text).replace(/\{(\d)\}/g, (_, n) => `<b class="toeic-blank">(${n}) ------</b>`);
    top = `<article class="toeic-doc"><p class="kicker">${esc(set.title)}</p><div class="toeic-text">${body}</div></article>`;
  }
  if (first.part === 7) {
    top = set.passages.map((p) => `<article class="toeic-doc"><p class="kicker">${esc(p.kind)}</p><div class="toeic-text">${esc(p.body)}</div></article>`).join('');
  }
  const qs = screen.questions.map((q) => {
    const chosen = answers[q.id];
    const reveal = mode === 'review' || (mode === 'train' && revealed.has(q.id));
    let stem = '';
    if (q.part === 5) stem = `<p class="toeic-stem">${esc(q.item.sentence).replace('-------', '<b class="toeic-blank">-------</b>')}</p>`;
    else if (q.part === 6) stem = `<p class="toeic-stem small">Blanc (${q.index + 1})</p>`;
    else if (q.part >= 3) stem = `<p class="toeic-stem"><span class="muted">${q.number}.</span> ${esc(q.item.q)}</p>`;
    return `<div class="toeic-q" id="q-${q.id}">
      ${q.part <= 2 ? `<p class="toeic-stem"><span class="muted">${q.number}.</span> ${q.part === 1 ? 'Quelle phrase décrit le mieux l’image ?' : 'Quelle est la meilleure réponse ?'}</p>` : stem}
      ${optionsHtml(q, { showText: showText(q), chosen, reveal })}
      ${reveal ? explainHtml(q, chosen) : ''}
    </div>`;
  }).join('');
  const transcript = listening && (mode === 'review' || (mode === 'train' && screen.questions.every((q) => revealed.has(q.id)))) ? transcriptHtml(first) : '';
  return `${top}${qs}${transcript}`;
}

// ---------- Test (examen ou entraînement) ----------

function viewRunner({ mode, part }) {
  const pool = mode === 'train' ? QUESTIONS.filter((q) => q.part === part) : QUESTIONS;
  if (!pool.length) { go('#/toeic'); return null; }
  const list = screens(pool);
  const answers = {};
  const revealed = new Set();
  let index = 0;
  let phase = mode === 'exam' ? 'listening' : 'train';
  let stopAudio = null;
  let timer = null;
  let deadline = null;
  let audioDone = false;
  let noVoice = false;
  document.body.classList.add('in-session');

  const listeningCount = list.filter((s) => s.section === 'L').length;

  function cleanupAll() {
    stopAudio?.();
    clearInterval(timer);
    document.body.classList.remove('in-session');
  }

  // Numéros des questions de l'écran, comptés dans ce test (50 au total, ou les questions de la partie).
  function questionRange() {
    const before = list.slice(0, index).reduce((n, x) => n + x.questions.length, 0);
    const count = list[index].questions.length;
    return count > 1 ? `${before + 1}–${before + count}` : `${before + 1}`;
  }

  function header() {
    const done = list.slice(0, index).reduce((n, x) => n + x.questions.length, 0);
    const pct = Math.round((done / pool.length) * 100);
    const s = list[index];
    const p = PARTS[s.part];
    const label = mode === 'exam' ? (s.section === 'L' ? 'Écoute' : 'Lecture') : 'Entraînement';
    const range = questionRange();
    return `<div class="session-head toeic-head">
      <button class="icon-btn ghost" id="quit" aria-label="Quitter">${icon('x')}</button>
      <div class="progress wide" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progression"><span style="width:${pct}%"></span></div>
      ${phase === 'reading' ? '<span class="toeic-timer" id="timer"></span>' : `<span class="counter" aria-label="Question ${range} sur ${pool.length}">${range}/${pool.length}</span>`}
    </div>
    <p class="kind-chip"><span>Partie ${s.part} · ${p.name}</span><span class="sep">·</span><span class="muted">${label}${phase === 'reading' ? ` · question ${range}/${pool.length}` : ''}</span></p>`;
  }

  function show() {
    stopAudio?.();
    audioDone = false;
    const s = list[index];
    const listening = s.section === 'L';
    const isLastListening = mode === 'exam' && listening && index === listeningCount - 1;
    const isLast = index === list.length - 1;
    const canGoBack = mode === 'exam' ? phase === 'reading' && index > listeningCount : index > 0;
    render(`
      ${header()}
      <section class="toeic-screen glass">
        ${listening ? `<div class="toeic-audio">
          <span class="toeic-audio-state" id="audio-state">${icon('headphones')} Écoute…</span>
          ${mode === 'train' ? `<button class="btn" id="replay">${icon('speaker')} Réécouter</button>` : ''}
        </div>` : ''}
        <div id="screen-body">${screenBody(s, { mode, answers, revealed })}</div>
      </section>
      <div class="controls btn-row toeic-nav">
        ${canGoBack ? `<button class="btn" id="prev">${icon('back')} Précédent</button>` : ''}
        <button class="btn primary" id="next">${isLast ? (mode === 'exam' ? 'Terminer le test' : 'Terminer') : isLastListening ? 'Fin de l’écoute' : 'Suivant'} ${icon('arrow')}</button>
      </div>
    `);
    bind(s);
    if (listening) startAudio(s);
    if (phase === 'reading') tick();
  }

  function startAudio(s) {
    const state = ctx.app.querySelector('#audio-state');
    const first = s.questions[0];
    const lines = scriptFor(first);
    noVoice = !('speechSynthesis' in window) || (voicesLoaded() && !hasEnglishVoice());
    if (state) state.innerHTML = `${icon('headphones')} Écoute…`;
    ctx.app.querySelector('#start-audio')?.remove();
    stopAudio = playScript(lines, index, null, () => {
      audioDone = true;
      if (state) state.innerHTML = `${icon('check')} Fin de l’enregistrement${mode === 'exam' ? ' (une seule écoute, comme à l’examen)' : ''}`;
    }, () => {
      // La voix n'a pas démarré : un appui suffit (même en test blanc, rien n'a encore été entendu).
      if (state) state.innerHTML = `${icon('speaker')} Le son n’a pas démarré`;
      const box = ctx.app.querySelector('.toeic-audio');
      if (box && !box.querySelector('#start-audio')) {
        box.insertAdjacentHTML('beforeend', `<button class="btn primary" id="start-audio">${icon('speaker')} Lancer l’écoute</button>`);
        box.querySelector('#start-audio').addEventListener('click', () => startAudio(s));
      }
    });
    // Pas de voix anglaise : on affiche le texte, sinon l'exercice serait impossible.
    if (noVoice) ctx.app.querySelector('#screen-body').insertAdjacentHTML('beforeend', noVoiceHtml(first));
  }

  function bind(s) {
    const root = ctx.app;
    root.querySelector('#quit').addEventListener('click', () => {
      if (mode === 'exam' && !confirm('Quitter le test ? Tes réponses ne seront pas enregistrées.')) return;
      go('#/toeic');
    });
    root.querySelector('#replay')?.addEventListener('click', () => startAudio(s));
    root.querySelector('#prev')?.addEventListener('click', () => { index--; show(); });
    root.querySelector('#next').addEventListener('click', next);
    // Un seul écouteur sur le contenu : il survit quand on redessine les réponses (l'audio continue).
    const body = root.querySelector('#screen-body');
    body.addEventListener('click', (e) => {
      const b = e.target.closest('.choice');
      const group = b?.closest('.toeic-choices');
      if (!b || !group || b.disabled) return;
      const qid = group.dataset.q;
      answers[qid] = Number(b.dataset.i);
      if (mode === 'train') revealed.add(qid);
      const open = [...body.querySelectorAll('details[open]')].length > 0;
      body.innerHTML = screenBody(s, { mode, answers, revealed }) + (noVoice ? noVoiceHtml(s.questions[0]) : '');
      if (open) body.querySelector('details')?.setAttribute('open', '');
    });
  }

  function next() {
    stopAudio?.();
    if (mode === 'exam' && phase === 'listening' && index === listeningCount - 1) return showBreak();
    if (index === list.length - 1) return finish();
    index++;
    show();
  }

  function showBreak() {
    phase = 'break';
    render(`
      <section class="empty toeic-break">
        <span class="orb big" style="--hue:${HUE}">${icon('book')}</span>
        <h1>Fin de l’écoute</h1>
        <p class="lede">Place à la lecture : ${QUESTIONS.filter((q) => q.section === 'R').length} questions en <b>${TEST.readingMinutes} minutes</b>.
          Tu peux revenir en arrière dans cette partie. À la fin du temps, le test se termine tout seul.</p>
        <button class="btn primary full" id="start-reading">Commencer la lecture ${icon('arrow')}</button>
      </section>`);
    ctx.app.querySelector('#start-reading').addEventListener('click', () => {
      phase = 'reading';
      deadline = Date.now() + TEST.readingMinutes * 60 * 1000;
      timer = setInterval(tick, 1000);
      index = listeningCount;
      show();
    });
  }

  function tick() {
    if (!deadline) return;
    const left = Math.max(0, deadline - Date.now());
    const el = ctx.app.querySelector('#timer');
    if (el) {
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      el.textContent = `${m}:${String(s).padStart(2, '0')}`;
      el.classList.toggle('low', left < 3 * 60 * 1000);
    }
    if (left === 0) {
      clearInterval(timer);
      ctx.toast('Temps écoulé : le test est terminé.');
      finish();
    }
  }

  function finish() {
    clearInterval(timer);
    stopAudio?.();
    if (mode === 'train') {
      const ok = pool.filter((q) => answers[q.id] === q.answer).length;
      render(`
        <section class="empty">
          <span class="orb big" style="--hue:var(--gold)">${icon('trophy')}</span>
          <h1>${ok}/${pool.length}</h1>
          <p class="lede">Partie ${part} · ${PARTS[part].name}</p>
          <div class="btn-row center">
            <a class="btn primary" href="#/toeic/train/${part}?r=${Date.now()}">Recommencer</a>
            ${part < 7 ? `<a class="btn" href="#/toeic/train/${part + 1}">Partie ${part + 1} ${icon('arrow')}</a>` : ''}
            <a class="btn" href="#/toeic">Retour</a>
          </div>
        </section>`);
      document.body.classList.remove('in-session');
      return;
    }
    const result = scoreTest(QUESTIONS, answers);
    const i = saveAttempt({ at: Date.now(), testId: TEST.id, answers, result });
    document.body.classList.remove('in-session');
    go(`#/toeic/result/${i}`);
  }

  // Première écoute : on la lance depuis un appui (Safari iOS refuse de parler sans geste).
  if (list[0].section === 'L') {
    render(`
      <section class="empty toeic-break">
        <span class="orb big" style="--hue:${HUE}">${icon('headphones')}</span>
        <h1>${mode === 'exam' ? 'Prêt ?' : `Partie ${part}`}</h1>
        <p class="lede">${mode === 'exam'
          ? 'Monte le son. Chaque enregistrement n’est joué <b>qu’une seule fois</b>, comme à l’examen.'
          : 'Monte le son. Tu pourras réécouter et lire la transcription après avoir répondu.'}</p>
        <p class="muted small">Sur iPhone, vérifie aussi que le téléphone n’est pas en mode silencieux.</p>
        <button class="btn primary full" id="begin">${icon('headphones')} Commencer</button>
        <a class="btn full" href="#/toeic">Retour</a>
      </section>`);
    ctx.app.querySelector('#begin').addEventListener('click', show);
  } else {
    show();
  }
  return cleanupAll;
}

// ---------- Résultats ----------

function viewResult(i) {
  const a = loadData().attempts[i];
  if (!a) { go('#/toeic'); return null; }
  const { L, R, total, byPart } = a.result;
  const weak = weakestPart(byPart);
  const card = (label, s) => `<div class="glass toeic-score">
    <p class="kicker">${label}</p>
    <strong>${s.score}</strong><span class="muted small">/ 495</span>
    <p class="small muted">fourchette ${s.low}–${s.high} · ${s.correct}/${s.total} bonnes réponses</p>
    <p class="toeic-cefr">CECRL : <b>${s.cefr}</b></p>
  </div>`;
  render(`
    <header class="page-head">
      <a class="back" href="#/toeic">${icon('back')} TOEIC blanc</a>
      <p class="eyebrow">${new Date(a.at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1>≈ ${total.score} <span class="muted toeic-of">/ 990</span></h1>
      <p class="lede">Score <b>estimé</b>, probablement entre <b>${total.low}</b> et <b>${total.high}</b>.</p>
    </header>
    <section class="toeic-scores">${card('Écoute', L)}${card('Lecture', R)}</section>

    <h2 class="section-title">Par partie</h2>
    <ul class="toeic-byparts glass">
      ${Object.entries(byPart).map(([n, v]) => `<li>
        <span>${n}. ${PARTS[n].name}</span>
        <span class="kbar-wrap"><span class="toeic-bar"><span style="width:${Math.round((v.correct / v.total) * 100)}%"></span></span></span>
        <b>${v.correct}/${v.total}</b>
      </li>`).join('')}
    </ul>
    ${weak && weak.rate < 1 ? `<a class="hero glass" href="#/toeic/train/${weak.part}" style="--rim:var(--gold)">
      <span class="orb" style="--hue:var(--gold)">${icon('target')}</span>
      <span class="hero-body"><span class="kicker">À travailler</span><strong>Partie ${weak.part} · ${PARTS[weak.part].name}</strong>
        <span class="muted small">${esc(PARTS[weak.part].desc)}</span></span>
      <span class="hero-go">${icon('arrow')}</span></a>` : ''}

    <h2 class="section-title">Correction détaillée</h2>
    <div class="toeic-review">
      ${screens(QUESTIONS).map((s) => `<details class="glass toeic-review-item">
        <summary>Partie ${s.part} · ${s.questions.map((q) => `<span class="${a.answers[q.id] === q.answer ? 'gold' : 'bad'}">${q.number}${a.answers[q.id] === q.answer ? '✓' : '✗'}</span>`).join(' ')}</summary>
        ${screenBody(s, { mode: 'review', answers: a.answers, revealed: new Set() })}
      </details>`).join('')}
    </div>

    <section class="glass toeic-note">
      <p><strong>Comment lire ce score.</strong> C’est une estimation à partir de ${L.total + R.total} questions : la fourchette indique la marge d’erreur.
        Le vrai TOEIC (200 questions, table de conversion d’ETS) peut donner un résultat différent.
        Les niveaux CECRL viennent des seuils minimaux publiés par ETS : écoute B1 dès 275, B2 dès 400, C1 dès 490 ; lecture B1 dès 275, B2 dès 385, C1 dès 455.</p>
    </section>
    <div class="btn-row center"><a class="btn primary" href="#/toeic/exam">Repasser le test</a><a class="btn" href="#/toeic">Retour</a></div>
  `);
  return null;
}
