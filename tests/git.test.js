import assert from 'node:assert';
import { gitSafety } from '../src/git/git-safety.js';
import { qualityGate } from '../src/quality/quality-gate.js';

export async function testGit() {
  console.log('\n--- Running Git Safety & Quality Gate Tests ---');

  // Test 1: Destructive command rejection
  const chk1 = gitSafety.validateCommandSafety('git reset --hard HEAD~1');
  assert.strictEqual(chk1.safe, false, 'Must reject git reset --hard');

  const chk2 = gitSafety.validateCommandSafety('git clean -fd');
  assert.strictEqual(chk2.safe, false, 'Must reject git clean -fd');

  const chk3 = gitSafety.validateCommandSafety('git status');
  assert.strictEqual(chk3.safe, true, 'Must allow safe git status');
  console.log('✔ [PASS] Destructive command validation enforces zero-loss policy');

  // Test 2: Quality Gate evaluation on failed execution
  const qgFail = await qualityGate.evaluate({ id: 'task-test' }, { exitCode: 1, modifiedFiles: [] });
  assert.strictEqual(qgFail.verdict, 'FAIL', 'Non-zero exit code must trigger FAIL');
  console.log('✔ [PASS] Quality Gate rejects crashed executions');

  // Test 3: Quality Gate evaluation on clean execution
  const qgPass = await qualityGate.evaluate({ id: 'task-test' }, { exitCode: 0, modifiedFiles: ['src/core/config.js'] });
  assert.strictEqual(qgPass.verdict, 'PASS', 'Clean exit with modified files must PASS');
  console.log('✔ [PASS] Quality Gate approves valid executions');

  return true;
}
