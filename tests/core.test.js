import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '../src/core/config.js';
import { taskClassifier } from '../src/tasks/classifier.js';
import { taskManager } from '../src/tasks/task-manager.js';
import { sanitize } from '../src/core/logger.js';

export async function testCore() {
  console.log('\n--- Running Core Tests ---');

  // Test 1: Config loading
  const config = loadConfig();
  assert.strictEqual(config.default_mode, 'ECONOMY', 'Default mode must be ECONOMY');
  assert.strictEqual(config.default_engine, 'opencode', 'Default engine must be opencode');
  console.log('✔ [PASS] Config loading and default modes');

  // Test 2: Sanitizer protects secrets
  const secretString = 'My key is sk-123456789012345678901234 and AIzaSyDfakefakefakefakefakefakefake';
  const clean = sanitize(secretString);
  assert.ok(!clean.includes('sk-1234567890'), 'Secret key must be redacted');
  assert.ok(!clean.includes('AIzaSyD'), 'Google key must be redacted');
  console.log('✔ [PASS] Secret sanitizer sanitizes sensitive tokens');

  // Test 3: Task Classifier
  const c1 = taskClassifier.classify('diseña la arquitectura de base de datos');
  assert.strictEqual(c1.category, 'ARCHITECTURE', 'Should classify as ARCHITECTURE');
  assert.strictEqual(c1.profile, 'ARCHITECT', 'Should assign ARCHITECT profile');

  const c2 = taskClassifier.classify('corrige este error de typescript');
  assert.strictEqual(c2.category, 'DEBUG', 'Should classify as DEBUG');
  assert.strictEqual(c2.profile, 'DEBUGGER', 'Should assign DEBUGGER profile');

  const c3 = taskClassifier.classify('crea pruebas unitarias con jest');
  assert.strictEqual(c3.category, 'TEST', 'Should classify as TEST');
  console.log('✔ [PASS] Semantic Task Classifier precision');

  // Test 4: Task Manager persistence
  const t = taskManager.createTask('Test task execution', 'Desc', { engine: 'opencode' });
  assert.ok(t.id.startsWith('task-'), 'Task ID must be formatted task-XXXX');
  const retrieved = taskManager.getTask(t.id);
  assert.strictEqual(retrieved.id, t.id, 'Task must be retrievable from disk');
  console.log('✔ [PASS] Task Manager lifecycle and persistence');

  return true;
}
