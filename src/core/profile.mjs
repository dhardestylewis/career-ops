import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export const DEFAULT_RESUME_PATH = path.resolve('data/assets/resume-dhl-20260630-causal-mle.pdf');

export function loadProfileConfig(profilePath = 'config/profile.yml') {
  try {
    const fileContents = fs.readFileSync(path.resolve(profilePath), 'utf8');
    return yaml.load(fileContents) || {};
  } catch {
    return {};
  }
}

export function getResumePath(profileConfig = {}) {
  const resumePath =
    profileConfig?.execution?.resume_path ||
    profileConfig?.execution?.resumePath ||
    profileConfig?.resume_path ||
    profileConfig?.resumePath ||
    DEFAULT_RESUME_PATH;

  if (path.isAbsolute(resumePath) || /^[A-Za-z]:[\\/]/.test(resumePath) || resumePath.startsWith('\\\\')) {
    return resumePath;
  }

  return path.resolve(resumePath);
}
