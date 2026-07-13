#!/usr/bin/env node
import { resolveAttachRuntime, startAttachableBrowser } from './browser_attach_common.mjs';

try {
  const result = await startAttachableBrowser(resolveAttachRuntime());
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(JSON.stringify({
    status: 'launch-failed',
    error: String(error?.message || error),
  }));
  process.exit(1);
}
