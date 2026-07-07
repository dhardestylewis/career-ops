#!/usr/bin/env node
import fs from 'fs';
import { resolveAttachRuntime, readMetadata, stopAttachableBrowserByPid, checkDebugger } from './browser_attach_common.mjs';

const runtime = resolveAttachRuntime();
const metadata = readMetadata(runtime.metadataPath);
const alreadyDown = !(await checkDebugger(runtime.url)).ok;

if (!metadata?.pid) {
  console.error(JSON.stringify({ status: 'no-metadata', metadataPath: runtime.metadataPath }));
  process.exit(1);
}

try {
  stopAttachableBrowserByPid(metadata.pid);
} catch (error) {
  if (alreadyDown) {
    try {
      fs.unlinkSync(runtime.metadataPath);
    } catch {}
    console.log(JSON.stringify({ status: 'stopped-stale-pid', pid: metadata.pid }));
    process.exit(0);
  }
  console.error(JSON.stringify({
    status: 'stop-failed',
    pid: metadata.pid,
    error: String(error?.message || error),
  }));
  process.exit(1);
}

try {
  fs.unlinkSync(runtime.metadataPath);
} catch {}

console.log(JSON.stringify({ status: 'stopped', pid: metadata.pid }));
