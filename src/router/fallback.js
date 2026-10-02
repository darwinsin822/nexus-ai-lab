import { logger } from '../core/logger.js';
import { opencodeAdapter } from '../engines/opencode/adapter.js';
import { geminiAdapter } from '../engines/gemini/adapter.js';

export class FallbackEngine {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 2;
  }

  /**
   * Executes task with automatic fallback and escalation
   */
  async executeWithFallback(task, routingDecision, options = {}) {
    let attempt = 0;
    let currentEngine = routingDecision.engine;
    let currentAgent = routingDecision.agent;
    let currentModel = routingDecision.model;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      logger.info(`Execution attempt ${attempt}/${this.maxRetries + 1} for ${task.id} on ${currentEngine} [Agent: ${currentAgent}]...`);

      try {
        let result = null;
        if (currentEngine === 'opencode') {
          result = await opencodeAdapter.execute(task, {
            agent: currentAgent,
            model: currentModel,
            cwd: options.cwd
          });
        } else if (currentEngine === 'gemini') {
          result = await geminiAdapter.execute(task, {
            agent: currentAgent,
            model: currentModel
          });
        } else {
          throw new Error(`Unsupported execution engine: ${currentEngine}`);
        }

        if (result && result.success) {
          return {
            ...result,
            attempts: attempt,
            escalated: currentEngine !== routingDecision.engine
          };
        }

        lastError = result?.error || 'Execution failed without explicit error';
        logger.warn(`Attempt ${attempt} failed: ${lastError}`);
      } catch (err) {
        lastError = err.message;
        logger.warn(`Attempt ${attempt} threw exception: ${lastError}`);
      }

      // If attempts exhausted, don't fallback further
      if (attempt > this.maxRetries) break;

      // Strategy for next attempt
      if (attempt === 1) {
        // Attempt 2: Try alternative agent or model within OpenCode
        logger.info(`Fallback step 1: Trying alternative OpenCode agent 'general'...`);
        currentAgent = 'general';
        currentModel = 'opencode/nemotron-3.5-lightning-free';
      } else if (attempt === 2) {
        // Attempt 3: Escalate to Gemini
        logger.info(`Fallback step 2: Escalating task to Gemini (Gemini Escalation Rule)...`);
        currentEngine = 'gemini';
        currentAgent = 'self';
        currentModel = 'gemini/gemini-3.8-flash';
        task.escalated = true;
      }
    }

    logger.error(`Task ${task.id} failed after ${this.maxRetries + 1} attempts. Last error: ${lastError}`);
    return {
      success: false,
      attempts: attempt,
      error: lastError,
      durationMs: 0,
      modifiedFiles: []
    };
  }
}

export const fallbackEngine = new FallbackEngine();
