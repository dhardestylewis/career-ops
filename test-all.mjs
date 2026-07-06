#!/usr/bin/env node

// Backward-compatible shim for callers that invoke the test suite from the repo root.
await import('./src/core/test-all.mjs');
