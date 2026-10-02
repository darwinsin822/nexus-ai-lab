import fs from 'node:fs';
import path from 'node:path';
import { findNexusRoot } from '../core/config.js';
import { sanitize } from '../core/logger.js';

export class ResourceManager {
  constructor(options = {}) {
    this.root = options.root || findNexusRoot();
    this.telemetryFile = path.join(this.root, '.nexus', 'logs', 'telemetry.jsonl');
    this.statsFile = path.join(this.root, '.nexus', 'logs', 'stats.json');
    this.ensureDir();
  }

  ensureDir() {
    const dir = path.join(this.root, '.nexus', 'logs');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {}
    }
  }

  recordUsage(data) {
    this.ensureDir();
    const entry = {
      timestamp: new Date().toISOString(),
      taskId: data.taskId || 'unknown',
      engine: data.engine || 'opencode',
      agent: data.agent || 'unknown',
      model: data.model || 'unknown',
      durationMs: data.durationMs || 0,
      status: data.status || 'COMPLETED',
      exitCode: data.exitCode !== undefined ? data.exitCode : 0,
      filesChangedCount: (data.modifiedFiles || []).length,
      tokens: data.tokens || 'UNKNOWN',
      estimatedCost: data.estimatedCost || (data.engine === 'opencode' ? '0.00 (FREE)' : 'UNKNOWN')
    };

    const sanitizedLine = sanitize(JSON.stringify(entry)) + '\n';
    try {
      fs.appendFileSync(this.telemetryFile, sanitizedLine, 'utf8');
      this.updateAggregate(entry);
    } catch (e) {}
    return entry;
  }

  updateAggregate(entry) {
    let stats = {
      totalTasks: 0,
      byEngine: { opencode: 0, gemini: 0, local: 0 },
      byStatus: {},
      totalDurationMs: 0
    };

    if (fs.existsSync(this.statsFile)) {
      try {
        stats = JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
      } catch (e) {}
    }

    stats.totalTasks += 1;
    stats.byEngine[entry.engine] = (stats.byEngine[entry.engine] || 0) + 1;
    stats.byStatus[entry.status] = (stats.byStatus[entry.status] || 0) + 1;
    stats.totalDurationMs += (entry.durationMs || 0);

    try {
      fs.writeFileSync(this.statsFile, JSON.stringify(stats, null, 2), 'utf8');
    } catch (e) {}
  }

  getReport() {
    let stats = { totalTasks: 0, byEngine: { opencode: 0, gemini: 0, local: 0 }, totalDurationMs: 0 };
    if (fs.existsSync(this.statsFile)) {
      try {
        stats = JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
      } catch (e) {}
    }

    return `
========================================
       NEXUS RESOURCE REPORT
========================================

Total Tasks Executed: ${stats.totalTasks}

By Engine:
  - OpenCode: ${stats.byEngine.opencode || 0}
  - Gemini:   ${stats.byEngine.gemini || 0}
  - Local AI: ${stats.byEngine.local || 0}

Estimated Gemini Usage:
  ${stats.byEngine.gemini === 0 ? 'ZERO (Budget Guard 100% Preserved)' : `${stats.byEngine.gemini} critical tasks`}

Savings Strategy:
  ACTIVE (Prioritizing OpenCode and Free/Low-Cost OSS Models)

Total Compute Time:
  ${(stats.totalDurationMs / 1000).toFixed(1)}s
========================================
`.trim();
  }
}

export const resourceManager = new ResourceManager();
