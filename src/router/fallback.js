import { logger } from '../core/logger.js';
import { opencodeAdapter } from '../engines/opencode/adapter.js';
import { geminiAdapter } from '../engines/gemini/adapter.js';
import { claudeAdapter } from '../engines/claude/adapter.js';
import { handoffManager } from '../handoff/handoff-manager.js';
import { gitSafety } from '../git/git-safety.js';

export class FallbackEngine {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Detects if an error is caused by Claude 5-hour window or quota limits
   */
  isClaudeRateLimited(errorText) {
    if (!errorText) return false;
    const str = String(errorText).toLowerCase();
    return (
      str.includes('rate limit') ||
      str.includes('rate_limit') ||
      str.includes('429') ||
      str.includes('usage limit') ||
      str.includes('5 hours') ||
      str.includes('5-hour') ||
      str.includes('5 horas') ||
      str.includes('resets in') ||
      str.includes('try again in') ||
      str.includes('limit reached until') ||
      str.includes('quota exceeded') ||
      str.includes('overloaded') ||
      str.includes('credit balance') ||
      str.includes('capacity') ||
      str.includes('claude is exhausted')
    );
  }

  /**
   * Executes task with automatic fallback, failover, and escalation
   */
  async executeWithFallback(task, routingDecision, options = {}) {
    let attempt = 0;
    let currentEngine = routingDecision.engine;
    let currentAgent = routingDecision.agent;
    let currentModel = routingDecision.model;
    let lastError = null;
    let failoverOccurred = false;

    while (attempt <= this.maxRetries) {
      attempt++;
      logger.info(`Execution attempt ${attempt}/${this.maxRetries + 1} for ${task.id} on ${currentEngine} [Model: ${currentModel || 'default'}]...`);

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
        } else if (currentEngine === 'claude') {
          result = await claudeAdapter.execute(task, {
            agent: currentAgent,
            model: currentModel,
            cwd: options.cwd,
            simulate5HourLimit: options.simulate5HourLimit
          });
        } else {
          throw new Error(`Unsupported execution engine: ${currentEngine}`);
        }

        if (result && result.success) {
          return {
            ...result,
            attempts: attempt,
            escalated: currentEngine !== routingDecision.engine,
            failover: failoverOccurred ? {
              from: 'claude',
              to: 'deepseek/deepseek-flash',
              reason: 'Claude 5-hour limit exhausted: Resumed seamlessly by DeepSeek'
            } : null
          };
        }

        lastError = result?.error || 'Execution failed without explicit error';
        logger.warn(`Attempt ${attempt} failed: ${lastError}`);
      } catch (err) {
        lastError = err.message;
        logger.warn(`Attempt ${attempt} threw exception: ${lastError}`);
      }

      // 🚨 AUTOMATIC CLAUDE 5-HOUR LIMIT FAILOVER TO DEEPSEEK
      if (currentEngine === 'claude' || this.isClaudeRateLimited(lastError)) {
        logger.warn(`[NEXUS AUTO-FAILOVER] ⏳ Límite de 5 horas de Claude detectado. Activando relevo automático a DeepSeek...`);
        failoverOccurred = true;

        // 1. Snapshot de emergencia del estado actual de Git y modificaciones
        const cwd = options.cwd || process.cwd();
        const diff = gitSafety.getDiff(cwd);
        const status = gitSafety.getStatus(cwd);
        handoffManager.createHandoff(
          { engine: 'claude', agent: currentAgent || 'claude-code' },
          { engine: 'opencode', agent: 'build' },
          {
            stage: 'CLAUDE_5H_FAILOVER_TO_DEEPSEEK',
            objective: `Continuar y finalizar la tarea asignada tras agotamiento de límite de 5 horas de Claude: ${task.title || task.description}`,
            decisions: `Claude alcanzó el límite de 5 horas. Nexus congela el estado, preserva diffs y delega a DeepSeek para completar el 100% de los requerimientos.`,
            filesModified: status.modifiedFiles || [],
            testResults: 'Pendiente de finalización por DeepSeek',
            nextSteps: 'Retomar la tarea desde el último checkpoint, resolver archivos pendientes y finalizar la implementación sin interrupción.'
          }
        );

        // 2. Conmutar a DeepSeek vía OpenCode
        currentEngine = 'opencode';
        currentAgent = 'build';
        currentModel = 'deepseek/deepseek-flash';
        task.failover = {
          triggered: true,
          from: 'claude',
          to: 'deepseek/deepseek-flash',
          reason: 'Límite de 5 horas de Claude alcanzado',
          timestamp: new Date().toISOString()
        };

        logger.info(`[NEXUS FAILOVER] DeepSeek (${currentModel}) asume la tarea para completar el 100% de los requerimientos.`);
        // Reintentar inmediatamente con DeepSeek
        continue;
      }

      // If attempts exhausted, don't fallback further
      if (attempt > this.maxRetries) break;

      // Strategy for next attempt (standard OpenCode -> Gemini escalation)
      if (attempt === 1) {
        logger.info(`Fallback step 1: Trying alternative OpenCode agent 'general'...`);
        currentAgent = 'general';
        currentModel = 'opencode/nemotron-3.5-lightning-free';
      } else if (attempt === 2) {
        logger.info(`Fallback step 2: Escalating task to Gemini (Gemini Escalation Rule)...`);
        currentEngine = 'gemini';
        currentAgent = 'self';
        currentModel = 'gemini/gemini-3.8-flash';
        task.escalated = true;
      }
    }

    logger.error(`Task ${task.id} failed after ${attempt} attempts. Last error: ${lastError}`);
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
