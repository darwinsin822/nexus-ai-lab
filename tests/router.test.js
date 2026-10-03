import assert from 'node:assert';
import { aiRouter } from '../src/router/ai-router.js';
import { budgetGuard } from '../src/router/budget-guard.js';

export async function testRouter() {
  console.log('\n--- Running AI Router & Budget Guard Tests ---');

  // Test 1: Budget Guard blocks mechanical tasks from Gemini
  const eval1 = budgetGuard.evaluate({ title: 'formatear código y corregir indentación' }, 'CODE', 'LOW', 'ECONOMY');
  assert.strictEqual(eval1.allowed, false, 'Budget Guard must block code formatting on Gemini');
  console.log('✔ [PASS] Budget Guard blocks mechanical tasks');

  // Test 2: Budget Guard delegates Documentation to OpenCode
  const evalDocs = budgetGuard.evaluate({ title: 'crea la documentación técnica y el README' }, 'DOCUMENTATION', 'LOW', 'ECONOMY');
  assert.strictEqual(evalDocs.allowed, false, 'Documentation must be delegated to OpenCode');
  console.log('✔ [PASS] Budget Guard delegates documentation to OpenCode');

  // Test 3: Budget Guard delegates Planning to OpenCode in ECONOMY
  const evalPlan = budgetGuard.evaluate({ title: 'planifica el roadmap del proyecto y desglose de tareas' }, 'PLANNING', 'MEDIUM', 'ECONOMY');
  assert.strictEqual(evalPlan.allowed, false, 'Planning must be delegated to OpenCode plan agent in ECONOMY');
  console.log('✔ [PASS] Budget Guard delegates planning to OpenCode');

  // Test 4: Budget Guard allows architecture on Gemini in BALANCED/PREMIUM
  const evalArch = budgetGuard.evaluate({ title: 'diseña la arquitectura distribuida' }, 'ARCHITECTURE', 'HIGH', 'BALANCED');
  assert.strictEqual(evalArch.allowed, true, 'Budget Guard must allow architecture on Gemini in BALANCED');
  console.log('✔ [PASS] Budget Guard permits high-level architecture on Gemini');

  // Test 5: Router defaults to OpenCode for routine code tasks in ECONOMY
  const route1 = await aiRouter.route({ title: 'crea una función de validación de email' }, null, 'ECONOMY');
  assert.strictEqual(route1.engine, 'opencode', 'Routine task must route to OpenCode in ECONOMY');
  assert.strictEqual(route1.agent, 'build', 'Coder profile must map to OpenCode build agent');
  console.log('✔ [PASS] AI Router selects OpenCode for routine code in ECONOMY');

  // Test 6: Router selects Gemini in PREMIUM mode
  const route2 = await aiRouter.route({ title: 'crea una función de validación' }, null, 'PREMIUM');
  assert.strictEqual(route2.engine, 'gemini', 'PREMIUM mode routes to Gemini');
  console.log('✔ [PASS] AI Router honors PREMIUM mode for cognitive priority');

  // Test 7: Router rejects local engine due to hardware constraints (8 GB RAM / 4 cores)
  const routeLocal = await aiRouter.route({ title: 'tarea local' }, 'local', 'ECONOMY');
  assert.strictEqual(routeLocal.engine, 'opencode', 'Local engine request must be safely routed to OpenCode');
  assert.ok(routeLocal.reason.includes('deshabilitado'), 'Reason must explain hardware constraints');
  console.log('✔ [PASS] Local models policy safely routes to OpenCode');

  // Test 8: Dangerous command detection
  const route3 = await aiRouter.route({ title: 'delete database and rm -rf /var' }, null, 'ECONOMY');
  assert.strictEqual(route3.risk, 'DANGEROUS', 'Destructive task must be flagged DANGEROUS');
  assert.strictEqual(route3.permissions.requireConfirmation, true, 'DANGEROUS task requires confirmation');
  console.log('✔ [PASS] Risk router flags dangerous operations');

  return true;
}
