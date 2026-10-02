process.env.NEXUS_TESTING = '1';

import { testCore } from './core.test.js';
import { testRouter } from './router.test.js';
import { testGit } from './git.test.js';

async function runAll() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           NEXUS AI LAB 2.0 — AUTOMATED TEST SUITE              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  let passed = 0;
  let failed = 0;

  try {
    await testCore();
    passed++;
  } catch (err) {
    console.error('✖ Core Tests Failed:', err);
    failed++;
  }

  try {
    await testRouter();
    passed++;
  } catch (err) {
    console.error('✖ Router Tests Failed:', err);
    failed++;
  }

  try {
    await testGit();
    passed++;
  } catch (err) {
    console.error('✖ Git Tests Failed:', err);
    failed++;
  }

  console.log('\n======================================================');
  if (failed === 0) {
    console.log(`\x1b[32m✔ ALL SUITES PASSED! (${passed}/3 test modules verified)\x1b[0m`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m✖ TEST FAILURES: ${failed} suite(s) failed.\x1b[0m`);
    process.exit(1);
  }
}

runAll();
