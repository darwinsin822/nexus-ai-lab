import { logger } from '../core/logger.js';

export class ParallelRunner {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 2;
  }

  /**
   * Validates if tasks have overlapping file conflicts before running in parallel
   */
  hasFileConflicts(tasks) {
    const fileSet = new Set();
    for (const t of tasks) {
      for (const f of t.files || []) {
        if (fileSet.has(f)) return true;
        fileSet.add(f);
      }
    }
    return false;
  }

  /**
   * Executes a batch of tasks respecting concurrency limits and safety isolation
   */
  async runBatch(tasks, executor) {
    if (this.hasFileConflicts(tasks)) {
      logger.warn('File overlap detected among parallel tasks. Enforcing sequential execution to prevent race conditions.');
      const results = [];
      for (const task of tasks) {
        results.push(await executor(task));
      }
      return results;
    }

    logger.info(`Running ${tasks.length} independent tasks with concurrency limit of ${this.maxConcurrency}...`);
    const results = [];
    const executing = [];

    for (const task of tasks) {
      const p = Promise.resolve().then(() => executor(task));
      results.push(p);

      if (this.maxConcurrency <= tasks.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= this.maxConcurrency) {
          await Promise.race(executing);
        }
      }
    }

    return Promise.all(results);
  }
}

export const parallelRunner = new ParallelRunner();
