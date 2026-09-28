// Outils de texte : comparaison tolérante des réponses et lecture de CSV.

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // voyelles brèves et tatweel arabes
    .replace(/[ʿʾ]/g, '') // signes de translittération de l'arabe
    .replace(/[’‘`]/g, "'")
    .replace(/\([^)]*\)/g, ' ') // précisions entre parenthèses
    .replace(/[.,!?;:"«»¿¡؟،।…-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:(?:to|the|a|an|le|la|les|un|une|se)\s+|l'|s')/, '');
}

// Les réponses alternatives sont séparées par « / ».
export function alternatives(answer) {
  return String(answer).split('/').map((a) => a.trim()).filter(Boolean);
}

export function checkAnswer(input, answer) {
  const given = normalize(input);
  if (!given) return false;
  return alternatives(answer).some((alt) => normalize(alt) === given);
}

// Distance d'édition (Damerau, variante OSA) : une inversion de deux lettres compte pour 1.
export function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Évalue une réponse écrite : 'exact', 'close' (petite faute de frappe) ou 'wrong'.
// Plusieurs réponses de référence possibles (ex. le mot et sa translittération).
export function gradeTyped(input, ...answers) {
  const given = normalize(input);
  if (!given) return 'wrong';
  const refs = answers.filter(Boolean).flatMap(alternatives).map(normalize).filter(Boolean);
  if (refs.includes(given)) return 'exact';
  const tolerance = (len) => (len >= 8 ? 2 : len >= 4 ? 1 : 0);
  const compact = (t) => t.replace(/[\s']/g, '');
  if (refs.some((r) => compact(r) === compact(given))) return 'close';
  return refs.some((r) => levenshtein(r, given) <= tolerance(r.length)) ? 'close' : 'wrong';
}

// Lecture CSV minimale : gère les guillemets et détecte le séparateur (; , ou tabulation).
export function parseCsv(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const sep = ['\t', ';', ','].find((c) => firstLine.includes(c)) || ';';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && !field.trim()) {
      quoted = true;
      field = '';
    } else if (c === sep) {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows.map((r) => r.map((f) => f.trim()));
}

// Transforme des lignes CSV en cartes. Colonnes : français, langue cible, exemple, note.
export function rowsToCards(rows) {
  const header = rows[0] ? rows[0].map((h) => normalize(h)) : [];
  const hasHeader = header[0]?.startsWith('fr') || header[1]?.startsWith('trad') || header[1] === 'mot';
  return rows
    .slice(hasHeader ? 1 : 0)
    .filter((r) => r[0] && r[1])
    .map(([fr, term, example = '', note = '']) => ({ fr, term, example, note }));
}
