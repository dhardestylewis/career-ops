import path from 'path';

function normalizeReportPath(reportPath, trackerDir, reportsRoot) {
  const clean = String(reportPath || '').trim();
  if (!clean) return clean;
  if (/^(https?:|mailto:|file:)/i.test(clean)) return clean;

  let rawPath = clean;
  rawPath = rawPath.replace(/^\[([^\]]+)\]\((.*)\)$/, '$2');
  rawPath = rawPath.replace(/^['"]|['"]$/g, '');

  const reportsPrefix = /^(\.\.\/)?reports\//i;
  if (reportsPrefix.test(rawPath)) {
    rawPath = rawPath.replace(reportsPrefix, '');
    const trackerNorm = trackerDir.replace(/\\/g, '/').toLowerCase();
    if (trackerNorm.endsWith('/data/tracker')) {
      return `reports/${path.basename(rawPath)}`;
    }
    const absPath = path.resolve(reportsRoot, rawPath);
    const relPath = path.relative(trackerDir, absPath).replace(/\\/g, '/');
    return relPath;
  }

  if (path.isAbsolute(rawPath)) {
    return path.relative(trackerDir, rawPath).replace(/\\/g, '/');
  }

  return rawPath.replace(/\\/g, '/');
}

export function normalizeReportLink(input, trackerDir, reportsRoot) {
  const text = String(input ?? '');

  if (text.includes('|')) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const normalized = normalizeReportPath(href, trackerDir, reportsRoot);
      return `[${label}](${normalized})`;
    });
  }

  if (/^\[([^\]]+)\]\(([^)]+)\)$/.test(text.trim())) {
    const match = text.trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    const normalized = normalizeReportPath(match[2], trackerDir, reportsRoot);
    return `[${match[1]}](${normalized})`;
  }

  return normalizeReportPath(text, trackerDir, reportsRoot);
}
