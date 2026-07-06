function normalizeRole(role) {
  return String(role || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(senior|staff|principal|lead|head|jr|junior|sr)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function roleFuzzyMatch(a, b) {
  const left = normalizeRole(a);
  const right = normalizeRole(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));
  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap++;
  }
  const minSize = Math.min(leftTokens.size, rightTokens.size);
  return minSize > 0 && overlap / minSize >= 0.6;
}
