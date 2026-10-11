import { BaseEngine } from '../base.js';
import { logger } from '../../core/logger.js';
import { execSync } from 'node:child_process';

export class ClaudeAdapter extends BaseEngine {
  constructor() {
    super('claude');
  }

  async detect() {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    return {
      available: true,
      bridge: 'claude-bridge',
      hasApiKey,
      model: 'Claude Sonnet 4.6'
    };
  }

  async health() {
    return {
      status: 'OK',
      engine: 'claude',
      connected: true
    };
  }

  async listModels() {
    return [
      { id: 'claude/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', tier: 'flagship' },
      { id: 'claude/claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic', tier: 'flagship' }
    ];
  }

  async listAgents() {
    return [
      { name: 'claude-code', type: 'primary', provider: 'claude' }
    ];
  }

  async execute(task, options = {}) {
    const startTime = Date.now();
    logger.info(`Executing with Claude Engine...`, { taskId: task.id });

    // Check if simulate or explicitly rate limited
    if (task.mockRateLimit || options.simulate5HourLimit) {
      return {
        success: false,
        exitCode: 429,
        error: 'Usage limit reached: Your Claude 5-hour window limit has been exhausted. Resets in 4 hours 45 minutes.',
        rateLimited: true,
        durationMs: Date.now() - startTime
      };
    }

    try {
      // If claude binary is installed, call it
      const output = execSync(`claude -p "${task.title || task.description}"`, {
        encoding: 'utf8',
        timeout: 60000,
        cwd: options.cwd || process.cwd()
      });
      return {
        success: true,
        stdout: output,
        exitCode: 0,
        durationMs: Date.now() - startTime
      };
    } catch (err) {
      const errStr = (err.stderr || err.message || '').toString();
      const is5h = errStr.includes('5 hours') || errStr.includes('limit') || errStr.includes('429');
      return {
        success: false,
        exitCode: is5h ? 429 : 1,
        error: errStr || err.message,
        rateLimited: is5h,
        durationMs: Date.now() - startTime
      };
    }
  }
}

export const claudeAdapter = new ClaudeAdapter();
