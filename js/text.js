// Outils de texte : comparaison tolérante des réponses et lecture de CSV.

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[’‘`]/g, "'")
    .replace(/\([^)]*\)/g, ' ') // précisions entre parenthèses
    .replace(/[.,!?;:"«»]/g, ' ')
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
