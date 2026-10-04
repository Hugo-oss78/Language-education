// Suggestion de traduction en ligne (facultative) via le service gratuit MyMemory.
// Le mot saisi est envoyé à ce service : on ne l'appelle que sur demande explicite.
// Limites publiées : environ 5 000 caractères par jour en usage anonyme, 500 octets par requête.

const ENDPOINT = 'https://api.mymemory.translated.net/get';

export async function translateOnline(text, from, to, { timeout = 8000 } = {}) {
  const q = String(text).trim().slice(0, 200);
  if (!q) return [];
  const url = `${ENDPOINT}?${new URLSearchParams({ q, langpair: `${from}|${to}` })}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`service indisponible (${res.status})`);
    return parseResponse(await res.json(), q);
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('le service ne répond pas');
    throw new Error(navigator.onLine === false ? 'pas de connexion internet' : err.message || 'erreur réseau');
  } finally {
    clearTimeout(timer);
  }
}

// Garde la traduction principale puis les variantes de la mémoire de traduction, sans doublon.
export function parseResponse(data, query = '') {
  if (!data || (data.responseStatus && Number(data.responseStatus) !== 200)) {
    throw new Error(data?.responseDetails || 'réponse invalide');
  }
  const seen = new Set();
  const out = [];
  const add = (t) => {
    const clean = String(t || '').replace(/\s+/g, ' ').trim();
    const key = clean.toLowerCase();
    if (!clean || key === query.toLowerCase() || seen.has(key) || /MYMEMORY WARNING/i.test(clean)) return;
    seen.add(key);
    out.push(clean);
  };
  add(data.responseData?.translatedText);
  for (const m of data.matches || []) add(m.translation);
  return out.slice(0, 4);
}
