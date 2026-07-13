#!/usr/bin/env node
import { resolveAttachRuntime, checkDebugger, readMetadata } from './browser_attach_common.mjs';

const runtime = resolveAttachRuntime();
const status = await checkDebugger(runtime.url);
const metadata = readMetadata(runtime.metadataPath);

if (!status.ok) {
  console.log(JSON.stringify({
    status: 'stopped',
    url: runtime.url,
    metadata,
    error: status.error,
  }));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'running',
  url: runtime.url,
  metadata,
  browser: status.json.Browser,
  webSocketDebuggerUrl: status.json.webSocketDebuggerUrl,
}));
