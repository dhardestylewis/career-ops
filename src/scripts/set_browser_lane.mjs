#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const cwd = process.cwd();
const args = process.argv.slice(2);
const lane = args[0];
const profilePath = path.resolve(cwd, 'config/profile.yml');
const mcpPath = path.resolve(cwd, '.mcp.json');

function usage() {
  console.log(`Usage:
  node src/scripts/set_browser_lane.mjs <lane> [options]

Lanes:
  local-headless
  local-headed
  remote-cdp
  extension-attach
  mcp-headless
  mcp-extension
  mcp-remote-http

Options:
  --cdp-url <url>      Set execution.browser_remote_cdp_url or attach URL
  --http-url <url>     Set MCP HTTP endpoint for mcp-remote-http
  --write-profile      Update config/profile.yml execution settings
  --write-mcp          Update .mcp.json
`);
}

function readYaml(file) {
  try {
    return yaml.load(fs.readFileSync(file, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeYaml(file, data) {
  fs.writeFileSync(file, yaml.dump(data, { lineWidth: 120, noRefs: true }));
}

function writeMcp(config) {
  fs.writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`);
}

function flagValue(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : undefined;
}

if (!lane || ['-h', '--help', 'help'].includes(lane)) {
  usage();
  process.exit(lane ? 0 : 1);
}

const cdpUrl = flagValue('--cdp-url');
const httpUrl = flagValue('--http-url');
const writeProfile = args.includes('--write-profile');
const writeMcpFlag = args.includes('--write-mcp');
const normalized = lane.toLowerCase();

if (!writeProfile && !writeMcpFlag) {
  console.error('Choose at least one target: --write-profile and/or --write-mcp');
  process.exit(1);
}

if (writeProfile) {
  const profile = readYaml(profilePath);
  profile.execution = profile.execution || {};
  if (normalized === 'local-headless') {
    profile.execution.browser_lane = 'local_headless';
  } else if (normalized === 'local-headed') {
    profile.execution.browser_lane = 'local_headed';
    profile.execution.browser_headed_offscreen = true;
  } else if (normalized === 'remote-cdp') {
    profile.execution.browser_lane = 'remote_cdp';
    if (cdpUrl) profile.execution.browser_remote_cdp_url = cdpUrl;
  } else if (normalized === 'extension-attach') {
    profile.execution.browser_lane = 'extension_attach';
    if (cdpUrl) profile.execution.browser_attach_cdp_url = cdpUrl;
  } else {
    console.error(`Lane ${lane} does not map to config/profile.yml execution settings.`);
    process.exit(1);
  }
  writeYaml(profilePath, profile);
  console.log(`Updated ${profilePath}`);
}

if (writeMcpFlag) {
  if (normalized === 'mcp-headless') {
    writeMcp({
      mcpServers: {
        playwright: {
          command: 'npx',
          args: ['@playwright/mcp@latest', '--headless'],
        },
      },
    });
  } else if (normalized === 'mcp-extension') {
    writeMcp({
      mcpServers: {
        playwright: {
          command: 'npx',
          args: ['@playwright/mcp@latest', '--extension'],
        },
      },
    });
  } else if (normalized === 'mcp-remote-http') {
    if (!httpUrl) {
      console.error('--http-url is required for mcp-remote-http');
      process.exit(1);
    }
    writeMcp({
      mcpServers: {
        playwright: {
          url: httpUrl,
        },
      },
    });
  } else {
    console.error(`Lane ${lane} does not map to .mcp.json MCP settings.`);
    process.exit(1);
  }
  console.log(`Updated ${mcpPath}`);
}
