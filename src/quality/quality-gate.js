import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { gitSafety } from '../git/git-safety.js';
import { logger } from '../core/logger.js';

export class QualityGate {
  /**
   * Evaluates task completion
   */
  async evaluate(task, executionResult, options = {}) {
    const cwd = options.cwd || process.cwd();
    const checks = [];

    // 1. Check if execution succeeded without process crash
    if (executionResult.exitCode !== 0) {
      checks.push({
        name: 'Process Exit Code',
        status: 'FAIL',
        details: `Process terminated with error code ${executionResult.exitCode}: ${executionResult.stderr || executionResult.error}`
      });
    } else {
      checks.push({
        name: 'Process Exit Code',
        status: 'PASS',
        details: 'Process completed cleanly with code 0'
      });
    }

    // 2. Check files modified
    const modified = executionResult.modifiedFiles || [];
    if (modified.length > 0) {
      checks.push({
        name: 'File Modifications',
        status: 'PASS',
        details: `${modified.length} files modified: ${modified.slice(0, 5).join(', ')}`
      });
    } else {
      checks.push({
        name: 'File Modifications',
        status: 'WARN',
        details: 'No file modifications recorded for this task'
      });
    }

    // 3. Automated Test Execution (if package.json test script exists and not in recursive test run)
    const pkgPath = path.join(cwd, 'package.json');
    if (!process.env.NEXUS_TESTING && fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts && pkg.scripts.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
          try {
            execSync('npm test', { cwd, encoding: 'utf8', timeout: 30000 });
            checks.push({
              name: 'Automated Test Suite',
              status: 'PASS',
              details: 'All automated tests passed successfully'
            });
          } catch (testErr) {
            checks.push({
              name: 'Automated Test Suite',
              status: 'FAIL',
              details: `Tests failed: ${testErr.message}`
            });
          }
        }
      } catch (e) {}
    }

    // 4. Git Diff Inspection
    const diff = gitSafety.getDiff(cwd);
    if (diff) {
      checks.push({
        name: 'Git Diff Validation',
        status: 'PASS',
        details: `Diff contains ${diff.split('\n').length} lines of changes`
      });
    }

    // Overall verdict
    const hasFail = checks.some(c => c.status === 'FAIL');
    const hasWarn = checks.some(c => c.status === 'WARN');
    const verdict = hasFail ? 'FAIL' : (hasWarn ? 'WARN' : 'PASS');

    logger.info(`Quality Gate Verdict for task ${task.id}: [${verdict}]`);

    return {
      verdict,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

export const qualityGate = new QualityGate();
