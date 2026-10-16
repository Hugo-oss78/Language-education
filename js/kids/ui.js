// Mode Enfant : écrans (espace parent, accueil enfant, séance, porte parentale).
// Module isolé : il ne lit ni n'écrit la progression adulte. app.js lui délègue les routes #/kids/…

import { CATEGORIES, KIDS_LANGS, loadKidsContent } from './content.js';
import { getLanguage } from '../../data/languages.js';
import {
  buildSession, applyOutcome, wordStatus, STATUS_LABELS, ageInMonths, tipOfTheDay, weeklySummary,
} from './engine.js';
import {
  kids, commit, activeProfile, setLocked, addProfile, updateProfile, removeProfile, recordSession,
  langProgress, langMissions, setLangData,
} from './store.js';
import { icon, flag } from '../icons.js';

const AVATARS = ['🦊', '🐻', '🐰', '🐼', '🦁', '🐸', '🐯', '🐨'];
const STICKERS = ['🌼', '🌻', '🌷', '🍄', '🐞', '🦋', '🐝', '🌈', '⭐', '🐌', '🌳', '🐿️', '🐢', '🌙', '🍓', '🐬'];
const KID_HUE = '#7fd1c7';

let ctx = null; // { app, setActiveTab, setTheme, toast }
let C = null; // contenu de la langue apprise (voir content.js)

const langName = (code) => getLanguage(code)?.name.toLowerCase() || code;
// Attributs pour afficher correctement le texte de la langue (népalais, arabe de droite à gauche).
const textAttrs = () => `lang="${C.code}" dir="${getLanguage(C.code)?.dir || 'ltr'}"`;

function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function render(html) {
  ctx.app.innerHTML = html;
  window.scrollTo(0, 0);
}

// Même adresse : on relance quand même le routeur (sinon la page ne se redessine pas).
function go(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

// ---------- Voix de la langue apprise, plus lente et un peu plus aiguë pour les petits ----------

function allVoices() {
  try { return window.speechSynthesis?.getVoices() || []; } catch { return []; }
}

function voiceFor(tts) {
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  const base = tts.split('-')[0];
  const list = allVoices();
  return list.find((v) => norm(v) === tts.toLowerCase()) || list.find((v) => norm(v).startsWith(base));
}

const ttsCode = () => getLanguage(C?.code || 'en')?.tts || 'en-GB';

// Lit une phrase ; onend est toujours appelé (même sans voix ou si le navigateur ne signale pas la fin).
function say(text, onend) {
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    onend?.();
  };
  const guard = setTimeout(done, 1600 + text.length * 110);
  try {
    if (!('speechSynthesis' in window)) throw new Error('pas de synthèse vocale');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = ttsCode();
    const v = voiceFor(u.lang);
    if (v) u.voice = v;
    u.rate = 0.8;
    u.pitch = 1.15;
    u.onend = u.onerror = done;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    // Sans voix, le texte reste affiché en grand : le parent peut le lire.
  }
  return () => { finished = true; clearTimeout(guard); try { speechSynthesis.cancel(); } catch { /* rien */ } };
}

// Plusieurs phrases à la suite, avec une petite pause entre elles.
function sayAll(texts, onend) {
  let i = 0;
  let stop = null;
  let stopped = false;
  let pause = null;
  const nextOne = () => {
    if (stopped) return;
    if (i >= texts.length) return onend?.();
    stop = say(texts[i++], () => { pause = setTimeout(nextOne, 450); });
  };
  nextOne();
  return () => { stopped = true; clearTimeout(pause); stop?.(); };
}

// Pour le parent : la transcription du mot quand la langue s'écrit avec un autre alphabet.
function translitLine(w) {
  return w.translit ? `<p class="kid-translit">${esc(w.word)} · ${esc(w.translit)}</p>` : '';
}

// ---------- Routes ----------

// Renvoie une fonction de nettoyage (appelée par app.js au changement de page).
export async function routeKids(sub, helpers) {
  ctx = helpers;
  const d = kids();
  const profile = activeProfile();
  const childScreens = ['play', 'session'];
  // Mode enfant verrouillé : seules les pages enfant sont accessibles.
  if (d.locked && profile && !childScreens.includes(sub)) {
    go('#/kids/play');
    return null;
  }
  C = await loadKidsContent(profile?.target || 'en');
  if (!profile && sub !== 'new') return viewSetup();
  if (sub === 'new') return viewSetup();
  if (sub === 'edit') return viewSetup(profile);
  if (sub === 'play') return viewPlay(profile);
  if (sub === 'session') return viewSession(profile);
  return viewParent(profile);
}

// ---------- Création / modification du profil (parent, moins de 2 minutes) ----------

function viewSetup(profile = null) {
  ctx.setActiveTab('home');
  ctx.setTheme(KID_HUE);
  const p = profile || { name: '', avatar: AVATARS[0], birth: '', interests: [], sessionMinutes: 3, target: 'en' };
  const hasProfiles = kids().profiles.length > 0;
  render(`
    <header class="page-head kids-head">
      <a class="back" href="${hasProfiles ? '#/kids' : '#/'}">${icon('back')} ${hasProfiles ? 'Espace parent' : 'Accueil'}</a>
      <p class="eyebrow">Mode Enfant</p>
      <h1>${profile ? 'Modifier le profil' : 'Créer le profil de l’enfant'}</h1>
      <p class="lede muted">Juste ce qu’il faut pour adapter les séances. Tout reste sur cet appareil.</p>
    </header>
    <form id="kid-form" class="settings glass kid-form">
      <label class="stack">Prénom ou surnom
        <input name="name" required maxlength="30" autocomplete="off" value="${esc(p.name)}" placeholder="Tim">
      </label>
      <fieldset>
        <legend>Son personnage</legend>
        <div class="avatar-pick">
          ${AVATARS.map((a) => `<label><input type="radio" name="avatar" value="${a}" ${a === p.avatar ? 'checked' : ''}><span>${a}</span></label>`).join('')}
        </div>
      </fieldset>
      <fieldset>
        <legend>Langue à découvrir</legend>
        <div class="lang-pick">
          ${KIDS_LANGS.map((code) => `<label><input type="radio" name="target" value="${code}" ${code === (p.target || 'en') ? 'checked' : ''}><span><span class="lang-flag sm">${flag(code)}</span>${getLanguage(code).name}${['ne', 'ar'].includes(code) ? ' <small class="muted">à faire relire</small>' : ''}</span></label>`).join('')}
        </div>
        ${profile ? '<small class="muted">Changer de langue garde la progression de chaque langue.</small>' : ''}
      </fieldset>
      <label class="stack">Mois de naissance <small class="muted">pour adapter la difficulté (facultatif)</small>
        <input type="month" name="birth" value="${esc(p.birth || '')}">
      </label>
      <fieldset>
        <legend>Ce qu’il aime <small class="muted">les premiers mots viendront de là</small></legend>
        <div class="interest-pick">
          ${Object.entries(CATEGORIES).map(([id, c]) => `<label><input type="checkbox" name="interests" value="${id}" ${p.interests.includes(id) ? 'checked' : ''}><span>${c.emoji} ${c.fr}</span></label>`).join('')}
        </div>
      </fieldset>
      <label class="stack">Durée d’une séance : <b id="minutes-out">${p.sessionMinutes} min</b>
        <input type="range" name="sessionMinutes" min="2" max="7" step="1" value="${p.sessionMinutes}">
      </label>
      <p class="muted small">Langue maternelle : français.
        Aucune photo, aucun enregistrement de la voix, aucun nom de famille.</p>
      <button class="btn primary full" type="submit">${profile ? 'Enregistrer' : 'Créer le profil'}</button>
    </form>
  `);
  const form = ctx.app.querySelector('#kid-form');
  form.sessionMinutes.addEventListener('input', () => {
    ctx.app.querySelector('#minutes-out').textContent = `${form.sessionMinutes.value} min`;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = {
      name: form.name.value,
      avatar: form.avatar.value || AVATARS[0],
      birth: form.birth.value || null,
      interests: [...form.querySelectorAll('[name="interests"]:checked')].map((i) => i.value),
      sessionMinutes: form.sessionMinutes.value,
      target: form.querySelector('[name="target"]:checked')?.value || 'en',
    };
    if (!fields.name.trim()) return ctx.toast('Indique un prénom ou un surnom');
    commit(profile ? updateProfile(kids(), profile.id, fields) : addProfile(kids(), fields));
    ctx.toast(profile ? 'Profil enregistré' : 'Profil créé');
    go('#/kids');
  });
  return null;
}

// ---------- Espace parent ----------

// « l’anglais », « le népalais »…
function withArticle(code) {
  const name = langName(code);
  return /^[aeiouyéèh]/i.test(name) ? `l’${name}` : `le ${name}`;
}

function ageText(months) {
  if (months === null || months < 0) return '';
  if (months < 24) return `${months} mois`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y} ans${m ? ` et ${m} mois` : ''}`;
}

function bar(value, cls) {
  return `<span class="kbar ${cls}" role="img" aria-label="${value} sur 100"><span style="width:${value}%"></span></span>`;
}

function viewParent(profile) {
  ctx.setActiveTab('home');
  ctx.setTheme(KID_HUE);
  const d = kids();
  const progress = langProgress(d, profile.id, C.code);
  const missionLog = langMissions(d, profile.id, C.code);
  const history = (d.history[profile.id] || []).filter((h) => (h.lang || 'en') === C.code);
  const week = weeklySummary(history, progress, C.words);
  const age = ageInMonths(profile.birth);
  const seen = C.words.filter((w) => progress[w.id]?.seen);
  const by = (st) => seen.filter((w) => wordStatus(progress[w.id]) === st).length;
  const stickers = d.stickers[profile.id] || [];

  render(`
    <header class="page-head kids-head">
      <a class="back" href="#/">${icon('back')} Accueil</a>
      <p class="eyebrow">Mode Enfant · espace parent</p>
      <h1><span class="kid-avatar sm">${profile.avatar}</span> ${esc(profile.name)}</h1>
      <p class="lede muted">${[ageText(age), `apprend ${withArticle(C.code)}`, `séances de ${profile.sessionMinutes} min`].filter(Boolean).join(' · ')}</p>
    </header>

    <div class="kid-langs" role="group" aria-label="Langue apprise">
      ${KIDS_LANGS.map((code) => `<button class="chip-btn glass" data-lang="${code}" aria-pressed="${code === C.code}"><span class="lang-flag sm">${flag(code)}</span>${getLanguage(code).name}</button>`).join('')}
    </div>
    ${C.reviewNeeded ? `<p class="notice">${icon('lightbulb')}<span>Les mots et phrases en ${langName(C.code)} pour les enfants sont <b>à faire relire</b> par un locuteur natif. N’hésitez pas à les dire à votre façon.</span></p>` : ''}
    ${allVoices().length && !voiceFor(ttsCode()) ? `<p class="notice">${icon('speaker')}<span>Pas de voix pour ${withArticle(C.code)} sur cet appareil : la prononciation sera fausse ou absente. Lisez les mots à voix haute à votre enfant (la transcription est affichée).</span></p>` : ''}

    <button class="btn primary full kid-start" id="start">${icon('star')} Lancer le mode enfant</button>
    <p class="muted small center">Pour en sortir : appui long sur le bouton « Parent » en haut de l’écran, puis un petit calcul.</p>

    <section class="glass kid-tip" style="--rim:var(--gold)">
      <span class="orb" style="--hue:#f4c76b">${icon('lightbulb')}</span>
      <div><p class="kicker">Conseil du jour</p><p>${esc(tipOfTheDay())}</p></div>
    </section>

    <h2 class="section-title">Cette semaine</h2>
    <section class="kid-stats">
      <div class="glass"><strong>${week.sessions}</strong><span class="muted small">${week.sessions > 1 ? 'séances' : 'séance'}</span></div>
      <div class="glass"><strong>${week.sessions && !week.minutes ? '&lt;1' : week.minutes}</strong><span class="muted small">minutes</span></div>
      <div class="glass"><strong>${week.newWords.length}</strong><span class="muted small">nouveaux mots</span></div>
      <div class="glass"><strong>${week.missions.length}</strong><span class="muted small">missions</span></div>
    </section>
    ${week.newWords.length ? `<p class="muted small">Mots découverts : ${week.newWords.map((id) => `${C.byId[id].emoji[0]} ${esc(C.byId[id].word)}`).join(', ')}.</p>` : ''}

    <h2 class="section-title">Ses mots <span class="muted small">${seen.length}/${C.words.length}</span></h2>
    ${seen.length ? `
      <p class="muted small">${by('discovering')} en découverte · ${by('understood')} compris · ${by('acquired')} acquis.
        « Comprend » et « Dit » sont suivis séparément : il est normal de comprendre bien avant de dire.</p>
      <ul class="kid-words glass">
        ${seen.map((w) => {
          const s = progress[w.id];
          const st = wordStatus(s);
          return `<li>
            <span class="kid-emoji">${w.emoji[0]}</span>
            <span class="kid-word">
              <span><strong ${textAttrs()}>${esc(w.word)}</strong>${w.translit ? ` <span class="small">${esc(w.translit)}</span>` : ''} <span class="muted small">${esc(w.fr)}</span></span>
              <span class="kid-bars"><span class="small muted">Comprend</span>${bar(s.comp, 'comp')}<span class="small muted">Dit</span>${bar(s.prod, 'prod')}</span>
            </span>
            <span class="kid-side">
              <span class="chip ${st === 'acquired' ? 'maitrise' : st === 'understood' ? 'en-cours' : ''}">${STATUS_LABELS[st]}</span>
              <button class="icon-btn" data-say="${esc(w.word)}" aria-label="Écouter ${esc(w.word)}">${icon('speaker')}</button>
              <button class="link-btn small" data-spont="${w.id}">L’a dit tout seul</button>
            </span>
          </li>`;
        }).join('')}
      </ul>` : '<p class="muted">Aucun mot pour l’instant : lancez une première séance de 2 ou 3 minutes, assis à côté de lui.</p>'}

    <h2 class="section-title">Missions dans la vraie vie</h2>
    <p class="muted small">À faire ensemble, hors de l’écran : c’est là que le mot devient vraiment le sien.</p>
    <ul class="kid-missions">
      ${C.missions.map((m) => {
        const log = missionLog[m.id];
        const ready = m.words.some((id) => progress[id]?.seen);
        return `<li class="glass ${ready ? '' : 'locked'}">
          <span class="kid-emoji">${m.emoji}</span>
          <div>
            <strong>${esc(m.title)}</strong> <span class="muted small" ${textAttrs()}>« ${esc(m.say)} »</span>
            <p class="small muted">${esc(m.parent)}</p>
            <p class="small">${log?.done ? `Faite ${log.done} fois` : ready ? 'Pas encore faite' : 'Après la découverte du mot en séance'}</p>
          </div>
          ${ready ? `<button class="btn small-btn" data-mission="${m.id}">${icon('check')} Faite</button>` : ''}
        </li>`;
      }).join('')}
    </ul>

    ${stickers.length ? `<h2 class="section-title">Son petit monde</h2><p class="kid-garden glass">${stickers.join(' ')}</p>` : ''}

    <h2 class="section-title">Réglages</h2>
    <div class="btn-row">
      <a class="btn" href="#/kids/edit">${icon('pen')} Modifier le profil</a>
      <a class="btn" href="#/kids/new">${icon('plus')} Autre enfant</a>
      ${d.profiles.length > 1 ? d.profiles.filter((p) => p.id !== profile.id).map((p) => `<button class="btn" data-switch="${p.id}">${p.avatar} ${esc(p.name)}</button>`).join('') : ''}
      <button class="btn danger" id="delete">Supprimer ce profil</button>
    </div>

    <section class="glass kid-note">
      <p><strong>Vie privée.</strong> Les données de l’enfant (prénom, mois de naissance, progression) restent sur cet appareil,
        séparées de votre progression. Pas de photo, pas d’enregistrement de la voix, pas de publicité ni d’achat.
        « Supprimer ce profil » efface tout ce qui le concerne.</p>
      <p><strong>Important.</strong> Lingua est un jeu d’éveil aux langues : il ne peut pas évaluer le développement du langage,
        l’audition ou les apprentissages. Pour toute question à ce sujet, parlez-en à un professionnel de santé
        (médecin, pédiatre, orthophoniste).</p>
    </section>
  `);

  const root = ctx.app;
  root.querySelector('#start').addEventListener('click', () => {
    setLocked(true);
    go('#/kids/play');
  });
  root.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === C.code) return;
    commit(updateProfile(kids(), profile.id, { target: b.dataset.lang }));
    go('#/kids');
  }));
  root.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => say(b.dataset.say)));
  root.querySelectorAll('[data-spont]').forEach((b) => b.addEventListener('click', () => {
    updateWord(profile.id, b.dataset.spont, 'spontaneous', 'said');
    ctx.toast('Bravo à lui ! C’est noté.');
    viewParent(profile);
  }));
  root.querySelectorAll('[data-mission]').forEach((b) => b.addEventListener('click', () => {
    markMission(profile.id, b.dataset.mission);
    ctx.toast('Mission notée');
    viewParent(profile);
  }));
  root.querySelectorAll('[data-switch]').forEach((b) => b.addEventListener('click', () => {
    commit({ ...kids(), activeId: b.dataset.switch });
    viewParent(activeProfile());
  }));
  root.querySelector('#delete').addEventListener('click', () => {
    if (!confirm(`Supprimer le profil de ${profile.name} et toute sa progression ? C’est définitif.`)) return;
    commit(removeProfile(kids(), profile.id));
    ctx.toast('Profil supprimé');
    go(kids().profiles.length ? '#/kids' : '#/');
  });
  return null;
}

function updateWord(profileId, wordId, activity, result) {
  const d = kids();
  const prog = { ...langProgress(d, profileId, C.code) };
  prog[wordId] = applyOutcome(prog[wordId], activity, result);
  commit(setLangData(d, 'progress', profileId, C.code, prog));
}

function markMission(profileId, missionId) {
  const d = kids();
  const log = { ...langMissions(d, profileId, C.code) };
  log[missionId] = { done: (log[missionId]?.done || 0) + 1, last: Date.now() };
  commit(setLangData(d, 'missions', profileId, C.code, log));
  const prog = langProgress(d, profileId, C.code);
  for (const id of C.missionById[missionId].words) if (prog[id]?.seen) updateWord(profileId, id, 'mission', 'done');
}

// ---------- Porte parentale : appui long puis petit calcul ----------

function parentButton() {
  return `<button class="kid-parent" id="parent-gate" aria-label="Espace parent : appui long">
    <span class="hold-ring"></span>${icon('users')}<span>Parent</span></button>`;
}

function bindParentGate(onOpen) {
  const btn = ctx.app.querySelector('#parent-gate');
  if (!btn) return () => {};
  let timer = null;
  const start = (e) => {
    e.preventDefault();
    btn.classList.add('holding');
    timer = setTimeout(() => { btn.classList.remove('holding'); onOpen?.(); showGateQuestion(); }, 2000);
  };
  const stop = () => { clearTimeout(timer); btn.classList.remove('holding'); };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => btn.addEventListener(t, stop));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  // Au clavier : Entrée maintenue n'existe pas, on ouvre directement la question (un enfant de 2–5 ans n'y arrive pas seul).
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onOpen?.(); showGateQuestion(); } });
  return stop;
}

export function gateQuestion(rand = Math.random) {
  const a = 4 + Math.floor(rand() * 6);
  const b = 3 + Math.floor(rand() * 6);
  const answer = a + b;
  const options = new Set([answer]);
  while (options.size < 4) options.add(answer + [-3, -2, -1, 1, 2, 3][Math.floor(rand() * 6)]);
  return { a, b, answer, options: [...options].sort((x, y) => x - y) };
}

function showGateQuestion() {
  document.querySelector('.gate')?.remove();
  const q = gateQuestion();
  const el = document.createElement('div');
  el.className = 'gate';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="gate-box glass">
      <p class="kicker">Espace parent</p>
      <p class="gate-q">Combien font ${q.a} + ${q.b} ?</p>
      <div class="gate-options">${q.options.map((o) => `<button class="btn" data-n="${o}">${o}</button>`).join('')}</div>
      <button class="link-btn" data-cancel>Revenir au jeu</button>
    </div>`;
  document.body.append(el);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-cancel')) return el.remove();
    if (Number(b.dataset.n) === q.answer) {
      el.remove();
      try { speechSynthesis.cancel(); } catch { /* rien */ }
      setLocked(false);
      go('#/kids');
    } else {
      el.remove();
      showGateQuestion();
    }
  });
}

// ---------- Accueil enfant ----------

function enterKidsMode() {
  document.body.classList.add('kids-mode');
  ctx.setTheme(KID_HUE);
  setLocked(true);
}

function leaveKidsMode() {
  document.body.classList.remove('kids-mode');
  document.querySelector('.gate')?.remove();
  try { speechSynthesis.cancel(); } catch { /* rien */ }
}

function viewPlay(profile) {
  enterKidsMode();
  const stickers = kids().stickers[profile.id] || [];
  render(`
    <section class="kids">
      <div class="kid-top">${parentButton()}</div>
      <button class="kid-hello" id="hello" aria-label="Dire bonjour">
        <span class="kid-avatar">${profile.avatar}</span>
        <span class="kid-big-text" ${textAttrs()}>${esc(C.phrases.hello(profile.name))}</span>
      </button>
      <button class="kid-play" id="play" aria-label="Jouer">▶</button>
      ${stickers.length ? `<p class="kid-garden" aria-label="Mon petit monde">${stickers.slice(-12).join(' ')}</p>` : ''}
    </section>
  `);
  let stopSpeech = null;
  const stopGate = bindParentGate(() => stopSpeech?.());
  ctx.app.querySelector('#hello').addEventListener('click', () => { stopSpeech?.(); stopSpeech = say(C.phrases.hello(profile.name)); });
  ctx.app.querySelector('#play').addEventListener('click', () => go('#/kids/session'));
  return () => { stopSpeech?.(); stopGate(); leaveKidsMode(); };
}

// ---------- Séance enfant ----------

function viewSession(profile) {
  enterKidsMode();
  const d = kids();
  const steps = buildSession({
    profile,
    words: C.words,
    progress: langProgress(d, profile.id, C.code),
    missions: C.missions,
    missionLog: langMissions(d, profile.id, C.code),
  });
  const started = Date.now();
  const practiced = new Set();
  const missionsDone = [];
  let index = 0;
  let timers = [];
  let stopSpeech = null;
  let prompt = []; // phrases rejouées par le bouton « haut-parleur »
  let alive = true;

  const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const speakNow = (texts, onend) => { stopSpeech?.(); stopSpeech = sayAll(texts, () => alive && onend?.()); };
  const record = (wordId, activity, result) => { updateWord(profile.id, wordId, activity, result); practiced.add(wordId); };

  function frame(inner, { replay = true } = {}) {
    const dots = steps.map((_, i) => `<span class="${i < index ? 'done' : i === index ? 'now' : ''}"></span>`).join('');
    render(`
      <section class="kids">
        <div class="kid-top">
          ${parentButton()}
          <div class="kid-dots" aria-hidden="true">${dots}</div>
          ${replay ? `<button class="kid-replay" id="replay" aria-label="Réécouter">${icon('speaker')}</button>` : '<span></span>'}
        </div>
        ${inner}
      </section>`);
    bindParentGate(() => { stopSpeech?.(); clearTimers(); });
    ctx.app.querySelector('#replay')?.addEventListener('click', () => speakNow(prompt));
  }

  function next() {
    clearTimers();
    stopSpeech?.();
    index++;
    show();
  }

  function nextButton() {
    return '<button class="kid-next" id="next" aria-label="Continuer">➜</button>';
  }

  function bindNext() {
    ctx.app.querySelector('#next')?.addEventListener('click', next);
  }

  function bounce(el) {
    el.classList.remove('pop');
    void el.offsetWidth; // relance l'animation
    el.classList.add('pop');
  }

  function cheer(el) {
    const burst = document.createElement('span');
    burst.className = 'kid-burst';
    burst.textContent = '✨';
    el.append(burst);
    later(() => burst.remove(), 900);
  }

  function show() {
    const step = steps[index];
    if (!step) return;
    const w = C.byId[step.word];
    if (step.type === 'hello') return showHello();
    if (step.type === 'discover') return showDiscover(w);
    if (step.type === 'find' || step.type === 'generalize') return showFind(step, w);
    if (step.type === 'touch') return showTouch(w);
    if (step.type === 'say') return showSay(w);
    if (step.type === 'mission') return showMission(C.missionById[step.mission]);
    if (step.type === 'bye') return showBye();
    return next();
  }

  function showHello() {
    prompt = [C.phrases.hello(profile.name)];
    frame(`
      <div class="kid-stage">
        <button class="kid-card" id="hi"><span class="kid-avatar">${profile.avatar}</span></button>
        <p class="kid-big-text" ${textAttrs()}>${esc(prompt[0])}</p>
      </div>
      ${nextButton()}`);
    bindNext();
    ctx.app.querySelector('#hi').addEventListener('click', (e) => { bounce(e.currentTarget); speakNow(prompt); });
    speakNow(prompt);
  }

  // Découverte : le contexte d'abord (« Look! A ball! »), puis le mot seul.
  function showDiscover(w) {
    prompt = [C.phrases.look(w), C.phrases.name(w)];
    record(w.id, 'discover', 'exposure');
    frame(`
      <div class="kid-stage">
        <button class="kid-card huge" id="pic" aria-label="${esc(w.word)}">${w.emoji[0]}</button>
        <p class="kid-big-text" ${textAttrs()}>${esc(C.phrases.name(w))}</p>
        ${translitLine(w)}
      </div>
      ${nextButton()}`);
    bindNext();
    const pic = ctx.app.querySelector('#pic');
    pic.addEventListener('click', () => { bounce(pic); speakNow([C.phrases.name(w)]); });
    speakNow(prompt, () => bounce(pic));
  }

  // « Where is the ball? » — une erreur ou un silence déclenchent un modèle, jamais un « non ».
  function showFind(step, w) {
    const general = step.type === 'generalize';
    const activity = general ? 'generalize' : 'find';
    const where = C.phrases.where(w);
    prompt = general ? [C.phrases.another(w), where] : [where];
    let helped = false;
    let silent = false;
    let finished = false;
    const picture = (id) => (id === w.id && general ? w.emoji[step.variant] || w.emoji[0] : C.byId[id].emoji[0]);
    frame(`
      <div class="kid-stage">
        <p class="kid-big-text" ${textAttrs()}>${esc(where)}</p>
        ${translitLine(w)}
        <div class="kid-choices n${step.choices.length}">
          ${step.choices.map((id) => `<button class="kid-card" data-id="${id}" aria-label="${esc(C.byId[id].word)}">${picture(id)}</button>`).join('')}
        </div>
      </div>`);
    const target = ctx.app.querySelector(`[data-id="${w.id}"]`);
    const model = () => {
      target.classList.add('hint');
      speakNow([C.phrases.here(w)]);
    };
    const waitForAnswer = () => {
      // Pas de compte à rebours visible : on redit la question, puis on montre la réponse.
      later(() => {
        speakNow([where]);
        later(() => {
          silent = true;
          model();
          // Toujours rien : on enregistre « pas de réponse » et on passe, sans rien montrer d'autre.
          later(() => { finished = true; record(w.id, activity, 'no_response'); next(); }, 12000);
        }, 7000);
      }, 8000);
    };
    ctx.app.querySelectorAll('.kid-choices .kid-card').forEach((b) => b.addEventListener('click', () => {
      if (finished) return;
      clearTimers();
      if (b.dataset.id === w.id) {
        finished = true;
        b.classList.remove('hint');
        b.classList.add('yes');
        bounce(b);
        cheer(b);
        record(w.id, activity, helped ? 'helped' : silent ? 'no_response' : 'success');
        speakNow([C.phrases.yes(w)], () => later(next, 500));
      } else {
        helped = true;
        bounce(b);
        stopSpeech?.();
        stopSpeech = sayAll([C.phrases.thatIs(C.byId[b.dataset.id]), C.phrases.here(w)]);
        target.classList.add('hint');
      }
    }));
    speakNow(prompt, waitForAnswer);
  }

  // Action : toucher l'image trois fois en comptant.
  function showTouch(w) {
    prompt = [C.phrases.touch(w)];
    let taps = 0;
    frame(`
      <div class="kid-stage">
        <p class="kid-big-text" ${textAttrs()}>${esc(prompt[0])}</p>
        ${translitLine(w)}
        <button class="kid-card huge" id="pic" aria-label="${esc(w.word)}">${w.emoji[0]}</button>
        <p class="kid-count" aria-live="polite"></p>
      </div>`);
    const pic = ctx.app.querySelector('#pic');
    const count = ctx.app.querySelector('.kid-count');
    const words = C.phrases.count;
    pic.addEventListener('click', () => {
      if (taps >= 3) return;
      bounce(pic);
      count.textContent = words[taps];
      speakNow([words[taps]]);
      taps++;
      if (taps === 3) {
        cheer(pic);
        record(w.id, 'touch', 'success');
        later(() => speakNow([C.phrases.great(), C.phrases.name(w)], () => later(next, 400)), 700);
      }
    });
    speakNow(prompt);
    // Si l'enfant ne touche pas, on avance quand même après un modèle (sans rien enregistrer).
    later(() => { if (!taps) speakNow([C.phrases.name(w)], () => later(next, 1500)); }, 15000);
  }

  // Production facultative : c'est le parent qui indique ce que l'enfant a dit. L'appli redonne toujours le modèle.
  function showSay(w) {
    prompt = [C.phrases.whats(w)];
    frame(`
      <div class="kid-stage">
        <button class="kid-card huge" id="pic" aria-label="?">${w.emoji[0]}</button>
        <p class="kid-big-text" ${textAttrs()}>${esc(prompt[0])}</p>
      </div>
      <div class="kid-parent-strip" hidden>
        <p class="small">Parent : qu’a-t-il dit ?</p>
        <div class="btn-row">
          <button class="btn" data-said="exact_match">Le mot</button>
          <button class="btn" data-said="approximate_match">Presque</button>
          <button class="btn" data-said="child_attempt">Il a essayé</button>
          <button class="btn" data-said="no_response">Rien, pas grave</button>
        </div>
      </div>`);
    const strip = ctx.app.querySelector('.kid-parent-strip');
    const pic = ctx.app.querySelector('#pic');
    pic.addEventListener('click', () => bounce(pic));
    speakNow(prompt, () => later(() => { strip.hidden = false; }, 1500));
    strip.addEventListener('click', (e) => {
      const b = e.target.closest('[data-said]');
      if (!b) return;
      strip.hidden = true;
      record(w.id, 'say', b.dataset.said);
      bounce(pic);
      cheer(pic);
      const reply = b.dataset.said === 'exact_match' ? [C.phrases.yes(w)] : [C.phrases.name(w), C.phrases.look(w)];
      speakNow(reply, () => later(next, 500));
    });
  }

  function showMission(m) {
    prompt = [m.say];
    frame(`
      <div class="kid-stage">
        <span class="kid-card huge static">${m.emoji}</span>
        <p class="kid-big-text" ${textAttrs()}>${esc(m.say)}</p>
      </div>
      <div class="kid-parent-strip">
        <p class="small"><strong>Mission avec vous :</strong> ${esc(m.parent)}</p>
        <div class="btn-row">
          <button class="btn primary" data-done>${icon('check')} Mission faite</button>
          <button class="btn" data-later>Plus tard</button>
        </div>
      </div>`);
    ctx.app.querySelector('[data-done]').addEventListener('click', () => {
      markMission(profile.id, m.id);
      missionsDone.push(m.id);
      speakNow([C.phrases.greatJob()], () => later(next, 300));
    });
    ctx.app.querySelector('[data-later]').addEventListener('click', next);
    speakNow(prompt);
  }

  function showBye() {
    const sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
    let d2 = kids();
    d2 = recordSession(d2, profile.id, { at: started, duration: Date.now() - started, lang: C.code, words: [...practiced], missionsDone });
    d2 = { ...d2, stickers: { ...d2.stickers, [profile.id]: [...(d2.stickers[profile.id] || []), sticker].slice(-60) } };
    commit(d2);
    prompt = [C.phrases.bye(profile.name)];
    frame(`
      <div class="kid-stage">
        <span class="kid-card huge static pop">${sticker}</span>
        <p class="kid-big-text" ${textAttrs()}>${esc(prompt[0])}</p>
      </div>
      <button class="kid-next" id="home" aria-label="Fin">🏠</button>`);
    ctx.app.querySelector('#home').addEventListener('click', () => go('#/kids/play'));
    speakNow(prompt);
  }

  show();
  return () => {
    alive = false;
    clearTimers();
    stopSpeech?.();
    leaveKidsMode();
  };
}

