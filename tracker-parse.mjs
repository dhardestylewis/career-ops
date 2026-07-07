export const LEGACY_COLMAP = {
  num: 0,
  date: 1,
  company: 2,
  role: 3,
  score: 4,
  status: 5,
  pdf: 6,
  report: 7,
  notes: 8,
  location: null,
};

const HEADER_ALIASES = {
  '#': 'num',
  'num': 'num',
  'number': 'num',
  'date': 'date',
  'company': 'company',
  'role': 'role',
  'title': 'role',
  'score': 'score',
  'status': 'status',
  'pdf': 'pdf',
  'report': 'report',
  'notes': 'notes',
  'note': 'notes',
  'location': 'location',
};

function normalizeCell(cell) {
  return String(cell || '').trim().toLowerCase();
}

export function detectColumns(lines) {
  const headerLine = Array.isArray(lines)
    ? lines.find((line) => line.startsWith('|') && line.toLowerCase().includes('company') && line.toLowerCase().includes('role'))
    : null;
  if (!headerLine) return null;

  const cells = headerLine.split('|').map((s) => s.trim()).filter(Boolean);
  const colmap = { location: null };
  for (let i = 0; i < cells.length; i++) {
    const key = HEADER_ALIASES[normalizeCell(cells[i])];
    if (!key) continue;
    colmap[key] = i;
  }

  const hasRequired =
    typeof colmap.num === 'number' &&
    typeof colmap.date === 'number' &&
    typeof colmap.company === 'number' &&
    typeof colmap.role === 'number' &&
    typeof colmap.score === 'number' &&
    typeof colmap.status === 'number' &&
    typeof colmap.pdf === 'number' &&
    typeof colmap.report === 'number';

  return hasRequired ? colmap : null;
}

function looksLikeScore(value) {
  return /^\**\s*\d+(?:\.\d+)?\s*\/\s*5\s*\**$/.test(String(value || '').trim());
}

function looksLikeStatus(value) {
  return /^(evaluated|applied|responded|interview|offer|rejected|discarded|skip)$/i.test(String(value || '').trim());
}

export function resolveScoreStatus(a, b) {
  const leftScore = looksLikeScore(a);
  const rightScore = looksLikeScore(b);
  const leftStatus = looksLikeStatus(a);
  const rightStatus = looksLikeStatus(b);

  if (leftScore && rightStatus) return { score: String(a).trim(), status: String(b).trim() };
  if (rightScore && leftStatus) return { score: String(b).trim(), status: String(a).trim() };
  if (leftScore) return { score: String(a).trim(), status: String(b).trim() };
  if (rightScore) return { score: String(b).trim(), status: String(a).trim() };
  return null;
}
