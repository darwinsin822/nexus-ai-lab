import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { BaseEngine } from '../base.js';
import { logger } from '../../core/logger.js';

export class OpenCodeAdapter extends BaseEngine {
  constructor(options = {}) {
    super('opencode');
    this.cliPath = options.cliPath || this.resolveBinary();
    this.runningProcesses = new Map();
  }

  resolveBinary() {
    try {
      const which = execSync('which opencode', { encoding: 'utf8' }).trim();
      if (which && fs.existsSync(which)) return which;
    } catch (e) {
      // Fallback
    }
    return 'opencode';
  }

  async detect() {
    try {
      const output = execSync(`${this.cliPath} --version`, {
        encoding: 'utf8',
        timeout: 30000
      }).trim();
      const version = output.split('\n')[0].trim();
      return {
        available: true,
        version: version || '1.18.34',
        binary: this.cliPath,
        type: 'official-cli'
      };
    } catch (err) {
      // Check if npx is available
      try {
        const npxVer = execSync('npx --yes --prefer-offline opencode-ai --version', {
          encoding: 'utf8',
          timeout: 30000
        }).trim().split('\n')[0].trim();
        return {
          available: true,
          version: npxVer,
          binary: 'npx --yes --prefer-offline opencode-ai',
          type: 'npx-cli'
        };
      } catch (npxErr) {
        return {
          available: false,
          error: err.message
        };
      }
    }
  }

  async health() {
    const detected = await this.detect();
    if (!detected.available) {
      return { status: 'ERROR', message: 'OpenCode CLI not reachable' };
    }
    return {
      status: 'OK',
      version: detected.version,
      binary: detected.binary
    };
  }

  async listAgents() {
    try {
      const output = execSync(`${this.cliPath} agent list`, {
        encoding: 'utf8',
        timeout: 30000
      });
      const lines = output.split('\n');
      const agents = [];

      for (const line of lines) {
        const match = line.match(/^([a-zA-Z0-9_-]+)\s+\((primary|subagent)\)/);
        if (match) {
          agents.push({
            name: match[1],
            type: match[2],
            provider: 'opencode'
          });
        }
      }

      if (agents.length === 0) {
        // Fallback default verified agents from audit
        return [
          { name: 'build', type: 'primary', provider: 'opencode' },
          { name: 'general', type: 'subagent', provider: 'opencode' },
          { name: 'plan', type: 'primary', provider: 'opencode' },
          { name: 'explore', type: 'subagent', provider: 'opencode' },
          { name: 'summary', type: 'primary', provider: 'opencode' },
          { name: 'title', type: 'primary', provider: 'opencode' },
          { name: 'compaction', type: 'primary', provider: 'opencode' }
        ];
      }
      return agents;
    } catch (err) {
      logger.warn(`Failed to dynamically list OpenCode agents: ${err.message}`);
      return [
        { name: 'build', type: 'primary', provider: 'opencode' },
        { name: 'general', type: 'subagent', provider: 'opencode' },
        { name: 'plan', type: 'primary', provider: 'opencode' },
        { name: 'explore', type: 'subagent', provider: 'opencode' }
      ];
    }
  }

  async listModels(provider = null) {
    // 1. Try reading from fast local cache first
    const cachePath = path.join(process.env.HOME || '/home/darwinsin', '.cache', 'opencode', 'models.json');
    if (fs.existsSync(cachePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        const models = [];
        for (const [providerId, providerData] of Object.entries(data)) {
          if (provider && providerId !== provider) continue;
          if (providerData && providerData.models) {
            for (const [mId, mInfo] of Object.entries(providerData.models)) {
              models.push({
                id: `${providerId}/${mId}`,
                modelId: mId,
                provider: providerId,
                name: mInfo.name || mId,
                description: mInfo.description || '',
                cost: mInfo.cost || null,
                context: mInfo.limit?.context || null,
                tool_call: mInfo.tool_call || false,
                reasoning: mInfo.reasoning || false
              });
            }
          }
        }
        if (models.length > 0) return models;
      } catch (err) {
        // Fallback to CLI
      }
    }

    // 2. Fallback to CLI
    try {
      const cmd = provider ? `${this.cliPath} models ${provider}` : `${this.cliPath} models`;
      const output = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
      const lines = output.trim().split('\n').filter(Boolean);
      return lines.map(line => ({
        id: line.trim(),
        provider: line.includes('/') ? line.split('/')[0] : 'opencode',
        name: line.trim()
      }));
    } catch (err) {
      logger.warn(`Failed to fetch models via CLI: ${err.message}`);
      return [
        { id: 'opencode/big-pickle', provider: 'opencode', name: 'Big Pickle (Free)' },
        { id: 'opencode/fledge-alpha-free', provider: 'opencode', name: 'Fledge Alpha (Free)' },
        { id: 'opencode/ling-3.0-flash-fin-free', provider: 'opencode', name: 'Ling 3.0 Flash (Free)' },
        { id: 'opencode/nemotron-3.5-lightning-free', provider: 'opencode', name: 'Nemotron 3.5 Lightning (Free)' },
        { id: 'opencode/space-bunny-free', provider: 'opencode', name: 'Space Bunny (Free)' }
      ];
    }
  }

  async execute(task, options = {}) {
    const startTime = Date.now();
    const agent = options.agent || 'build';
    const model = options.model || 'opencode/big-pickle';
    const cwd = options.cwd || process.cwd();
    const auto = options.auto !== false; // Default auto permissions

    if (process.env.NEXUS_TESTING === '1' && (task.id?.includes('test') || options.mock)) {
      return {
        success: true,
        exitCode: 0,
        durationMs: 50,
        stdout: `Task ${task.id} completed successfully via OpenCode (${model}) [MOCK_TEST_RUN].`,
        stderr: '',
        agent,
        model,
        modifiedFiles: ['src/example.js']
      };
    }

    const args = ['run', task.description || task.title];
    if (agent) args.push('--agent', agent);
    if (model) args.push('-m', model);
    if (auto) args.push('--auto');

    // Pre-flight check: record initial git state to track modified files
    let initialFiles = [];
    try {
      const gitOut = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
      initialFiles = gitOut.split('\n').filter(Boolean).map(l => l.substring(3).trim());
    } catch (e) {
      // not a git repo or git error
    }

    logger.info(`Spawning OpenCode [Agent: ${agent}, Model: ${model}]...`, {
      taskId: task.id,
      engine: 'opencode'
    });

    return new Promise((resolve, reject) => {
      const proc = spawn(this.cliPath, args, {
        cwd,
        env: { ...process.env, CI: '1', NONINTERACTIVE: '1' }
      });

      let stdout = '';
      let stderr = '';

      if (task.id) {
        this.runningProcesses.set(task.id, proc);
      }

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (options.onProgress) options.onProgress(text);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (options.onLog) options.onLog(text);
      });

      proc.on('error', (err) => {
        if (task.id) this.runningProcesses.delete(task.id);
        const durationMs = Date.now() - startTime;
        resolve({
          success: false,
          exitCode: -1,
          durationMs,
          stdout,
          stderr: stderr + '\n' + err.message,
          error: err.message,
          agent,
          model,
          modifiedFiles: []
        });
      });

      proc.on('close', (code) => {
        if (task.id) this.runningProcesses.delete(task.id);
        const durationMs = Date.now() - startTime;

        // Post-execution: determine modified files
        let finalFiles = [];
        try {
          const gitOut = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
          const currentModified = gitOut.split('\n').filter(Boolean).map(l => l.substring(3).trim());
          finalFiles = currentModified.filter(f => !initialFiles.includes(f));
        } catch (e) {
          // Fallback parsing from stdout if git not present
          const matches = stdout.match(/(?:write|create|modify|edit)\s+([a-zA-Z0-9_\-\.\/]+)/gi) || [];
          finalFiles = matches.map(m => m.split(/\s+/)[1]);
        }

        const success = code === 0;
        resolve({
          success,
          exitCode: code,
          durationMs,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          agent,
          model,
          modifiedFiles: Array.from(new Set(finalFiles)),
          error: success ? null : `Process exited with code ${code}`
        });
      });
    });
  }

  async cancel(taskId) {
    if (this.runningProcesses.has(taskId)) {
      const proc = this.runningProcesses.get(taskId);
      try {
        proc.kill('SIGTERM');
        this.runningProcesses.delete(taskId);
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  capabilities() {
    return {
      name: 'opencode',
      supportsToolCalls: true,
      supportsStreaming: true,
      supportsSubagents: true,
      supportsLocal: false
    };
  }
}

export const opencodeAdapter = new OpenCodeAdapter();
