#!/usr/bin/env node

import { existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ONBOARDING_FILES = [
  'data/cv.md',
  'config/profile.yml',
  'modes/_profile.md',
  'portals.yml',
];

function fileMissing(path) {
  return !existsSync(join(ROOT, path));
}

function buildJsonReport() {
  const missing = ONBOARDING_FILES.filter(fileMissing);
  const warnings = [];

  if (!existsSync(join(ROOT, 'node_modules'))) {
    warnings.push('Dependencies not installed');
  }

  const fontsDir = join(ROOT, 'fonts');
  if (!existsSync(fontsDir)) {
    warnings.push('fonts/ directory not found');
  } else {
    try {
      if (readdirSync(fontsDir).length === 0) {
        warnings.push('fonts/ directory is empty');
      }
    } catch {
      warnings.push('fonts/ directory is not readable');
    }
  }

  return {
    onboardingNeeded: missing.length > 0,
    missing,
    warnings,
    autoCopied: [],
  };
}

async function main() {
  if (process.argv.includes('--json')) {
    const report = buildJsonReport();
    console.log(JSON.stringify(report));
    process.exit(report.onboardingNeeded ? 1 : 0);
  }

  await import('./src/core/doctor.mjs');
}

await main();
