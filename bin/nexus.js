#!/usr/bin/env node

import { cli } from '../src/cli/index.js';

cli().catch((err) => {
  console.error('\x1b[31m[NEXUS FATAL ERROR]\x1b[0m', err.message || err);
  process.exit(1);
});
