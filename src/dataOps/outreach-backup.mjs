#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname, relative, resolve, sep, isAbsolute } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_BACKUP_PARENT = join(homedir(), '.codex', 'backups');
const SNAPSHOT_PREFIX = 'career-ops-outreach';

function normalizeText(value) {
  return String(value || '').trim();
}

function parseArgs(argv) {
  const args = {
    dest: DEFAULT_BACKUP_PARENT,
    includeAuth: false,
    dryRun: false,
    allowInRepo: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dest') args.dest = argv[++i];
    else if (arg === '--include-auth') args.includeAuth = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--allow-in-repo') args.allowInRepo = true;
  }

  return args;
}

function timestampUtc(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function toPosix(relPath) {
  return normalizeText(relPath).split(sep).join('/');
}

function isWithin(child, parent) {
  const childPath = resolve(child);
  const parentPath = resolve(parent);
  const rel = relative(parentPath, childPath);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function walkFiles(rootDir, filterFn = () => true) {
  const found = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absPath);
        continue;
      }
      const relPath = toPosix(relative(ROOT, absPath));
      if (filterFn(relPath, entry.name)) {
        found.push(relPath);
      }
    }
  }

  return found.sort();
}

function collectFiles(includeAuth) {
  const files = new Set();
  const outreachRoot = join(ROOT, 'data/outreach');
  const trackerRoot = join(ROOT, 'data/tracker');
  const archiveRoot = join(ROOT, 'data/archive');

  if (existsSync(outreachRoot)) {
    for (const relPath of walkFiles(outreachRoot)) {
      files.add(relPath);
    }
  }

  if (existsSync(trackerRoot)) {
    for (const relPath of walkFiles(trackerRoot, (relPath) => /\/(?:applications\.md(?:\.bak)?|pipeline\.md)$/i.test(relPath))) {
      files.add(relPath);
    }
  }

  if (existsSync(archiveRoot)) {
    for (const relPath of walkFiles(archiveRoot, (relPath) => /\/(newlab-application-|submission_).+\.(json|png)$/i.test(relPath))) {
      files.add(relPath);
    }
  }

  if (includeAuth) {
    for (const relPath of ['credentials.json', 'token.json']) {
      if (existsSync(join(ROOT, relPath))) {
        files.add(relPath);
      }
    }
  }

  return [...files].sort();
}

function gitInfo() {
  const read = (command) => {
    try {
      return execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return '';
    }
  };

  return {
    branch: read('git branch --show-current') || 'unknown',
    commit: read('git rev-parse --short HEAD') || 'unknown',
  };
}

function writeSnapshotReadme(snapshotDir, meta, files, includeAuth) {
  const readme = [
    '# career-ops outreach snapshot',
    '',
    `Created: ${meta.createdAt}`,
    `Git branch: ${meta.branch}`,
    `Git commit: ${meta.commit}`,
    `Included auth files: ${includeAuth ? 'yes' : 'no'}`,
    '',
    'This snapshot is off-GitHub local recovery state.',
    'Do not push it to a public repository.',
    '',
    'Copied files:',
    ...files.map(file => `- ${file}`),
    '',
  ].join('\n');

  writeFileSync(join(snapshotDir, 'README.md'), readme, 'utf8');
}

function writeManifest(snapshotDir, meta, files, includeAuth) {
  const manifest = {
    createdAt: meta.createdAt,
    branch: meta.branch,
    commit: meta.commit,
    root: ROOT,
    includeAuth,
    copiedFiles: files,
    excludedFiles: includeAuth ? [] : ['credentials.json', 'token.json'],
  };

  writeFileSync(join(snapshotDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const backupParent = resolve(args.dest);

  if (isWithin(backupParent, ROOT) && !args.allowInRepo) {
    console.error(`Backup destination must be outside the repo: ${backupParent}`);
    console.error('Pass --allow-in-repo only if you intentionally want a local mirror inside the worktree.');
    process.exit(1);
  }

  const createdAt = new Date().toISOString();
  const snapshotName = `${SNAPSHOT_PREFIX}-${timestampUtc()}`;
  const snapshotDir = join(backupParent, snapshotName);
  const files = collectFiles(args.includeAuth);

  if (args.dryRun) {
    console.log(`Dry run: would create ${snapshotDir}`);
    console.log(`Files: ${files.length}`);
    for (const file of files) {
      console.log(`  ${file}`);
    }
    return;
  }

  mkdirSync(snapshotDir, { recursive: true });

  for (const relPath of files) {
    const src = join(ROOT, relPath);
    const dst = join(snapshotDir, relPath);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
  }

  const meta = { createdAt, ...gitInfo() };
  writeSnapshotReadme(snapshotDir, meta, files, args.includeAuth);
  writeManifest(snapshotDir, meta, files, args.includeAuth);

  console.log(`Backed up ${files.length} files to ${snapshotDir}`);
  if (!args.includeAuth) {
    console.log('Auth files excluded by default: credentials.json, token.json');
  }
}

main();
