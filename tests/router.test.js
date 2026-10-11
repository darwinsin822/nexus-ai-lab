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

  // Test 5: Router defaults to OpenCode for routine code tasks in ECONOMY with specialized model
  const route1 = await aiRouter.route({ title: 'crea una función de validación de email' }, null, 'ECONOMY');
  assert.strictEqual(route1.engine, 'opencode', 'Routine task must route to OpenCode in ECONOMY');
  assert.strictEqual(route1.agent, 'build', 'Coder profile must map to OpenCode build agent');
  assert.strictEqual(route1.model, 'opencode/nemotron-3.5-lightning-free', 'Coder profile maps to fast coding open-source model');
  console.log('✔ [PASS] AI Router selects OpenCode with Nemotron 3.5 for routine code in ECONOMY');

  // Test 5.1: Router assigns Big Pickle to Planning and Muse Spark to Documentation
  const routePlan = await aiRouter.route({ title: 'planifica el roadmap del proyecto' }, null, 'ECONOMY');
  assert.strictEqual(routePlan.model, 'opencode/big-pickle', 'Planning routes to Big Pickle');
  const routeDoc = await aiRouter.route({ title: 'crea la documentación técnica y el README' }, null, 'ECONOMY');
  assert.strictEqual(routeDoc.model, 'opencode/muse-spark-1.3-contributor-free', 'Documentation routes to Muse Spark');
  console.log('✔ [PASS] Specialized OpenCode models correctly assigned (Big Pickle -> Plan, Muse -> Docs)');

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

  // Test 9: Claude 5-hour rate limit detector
  const { fallbackEngine } = await import('../src/router/fallback.js');
  assert.strictEqual(fallbackEngine.isClaudeRateLimited('Claude 5-hour limit exceeded. Resets in 3 hours.'), true);
  assert.strictEqual(fallbackEngine.isClaudeRateLimited('HTTP 429: Usage limit reached'), true);
  assert.strictEqual(fallbackEngine.isClaudeRateLimited('Generic syntax error'), false);
  console.log('✔ [PASS] Claude 5-hour limit detector triggers accurately');

  // Test 10: Failover execution simulates Claude limit and continues on DeepSeek
  const failoverTask = { id: 'task-claude-test', title: 'tarea interrumpida en Claude' };
  const failoverRes = await fallbackEngine.executeWithFallback(failoverTask, {
    engine: 'claude',
    agent: 'claude-code',
    model: 'claude/claude-sonnet-4-6'
  }, { simulate5HourLimit: true });
  assert.strictEqual(failoverRes.success, true, 'Task must succeed after failover');
  assert.strictEqual(failoverRes.failover?.from, 'claude', 'Failover origin must be claude');
  assert.strictEqual(failoverRes.failover?.to, 'deepseek/deepseek-flash', 'Failover target must be DeepSeek');
  console.log('✔ [PASS] Automatic Claude -> DeepSeek failover completes task successfully');

  // Test 11: Gemini 5-hour / quota limit detector
  assert.strictEqual(fallbackEngine.isGeminiRateLimited('RESOURCE_EXHAUSTED: Gemini 5-hour usage limit reached'), true);
  assert.strictEqual(fallbackEngine.isGeminiRateLimited('Quota exceeded for quota metric Queries and limit Queries per day'), true);
  assert.strictEqual(fallbackEngine.isGeminiRateLimited('Compilation error at line 42'), false);
  console.log('✔ [PASS] Gemini 5-hour / quota limit detector triggers accurately');

  // Test 12: Failover execution simulates Gemini 5-hour limit and continues on DeepSeek
  const failoverGeminiTask = { id: 'task-gemini-test', title: 'tarea interrumpida en Gemini' };
  const failoverGeminiRes = await fallbackEngine.executeWithFallback(failoverGeminiTask, {
    engine: 'gemini',
    agent: 'self',
    model: 'gemini/gemini-3.8-flash'
  }, { simulateGemini5HourLimit: true });
  assert.strictEqual(failoverGeminiRes.success, true, 'Task must succeed after Gemini failover');
  assert.strictEqual(failoverGeminiRes.failover?.from, 'gemini', 'Failover origin must be gemini');
  assert.strictEqual(failoverGeminiRes.failover?.to, 'deepseek/deepseek-flash', 'Failover target must be DeepSeek');
  console.log('✔ [PASS] Automatic Gemini -> DeepSeek failover completes task successfully');

  return true;
}
