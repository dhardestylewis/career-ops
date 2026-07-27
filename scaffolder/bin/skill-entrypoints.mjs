import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_ROOT = dirname(fileURLToPath(import.meta.url));
const SKILL_SOURCE_CANDIDATES = [
  '.agents/skills/career-ops/SKILL.md',
  '.claude/skills/career-ops/SKILL.md',
];
const SKILL_TARGETS = [
  '.claude/skills/career-ops/SKILL.md',
  '.opencode/skills/career-ops/SKILL.md',
  '.qwen/skills/career-ops/SKILL.md',
  '.antigravitycli/skills/career-ops/SKILL.md',
  '.grok/skills/career-ops/SKILL.md',
  '.kimi/skills/career-ops/SKILL.md',
];

function repoPath(root, relPath) {
  return join(root, ...relPath.split('/'));
}

function ensureParentDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function readFirstExisting(root, candidates) {
  for (const candidate of candidates) {
    const abs = repoPath(root, candidate);
    if (existsSync(abs)) {
      return readFileSync(abs, 'utf8');
    }
  }
  return null;
}

function isPointerFile(absPath) {
  if (!existsSync(absPath)) return false;
  try {
    const text = readFileSync(absPath, 'utf8').trim();
    return text.length > 0 && !text.includes('\n') && text.includes('skills/');
  } catch {
    return false;
  }
}

export function materializeSkillEntrypoints(root = DEFAULT_ROOT) {
  const source = readFirstExisting(root, SKILL_SOURCE_CANDIDATES);
  if (!source) return [];

  const materialized = [];
  for (const relTarget of SKILL_TARGETS) {
    const absTarget = repoPath(root, relTarget);
    const targetExists = existsSync(absTarget);
    const shouldReplace = targetExists && isPointerFile(absTarget);

    if (targetExists && !shouldReplace) {
      continue;
    }

    if (targetExists) {
      rmSync(absTarget, { force: true, recursive: true });
    }
    ensureParentDir(absTarget);
    writeFileSync(absTarget, source, 'utf8');
    materialized.push(relTarget);
  }

  return materialized;
}

export function ensureSkillEntrypoints(root = DEFAULT_ROOT) {
  return materializeSkillEntrypoints(root);
}
