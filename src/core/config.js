import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_CONFIG = {
  version: '2.0.0',
  default_engine: 'opencode',
  default_mode: 'ECONOMY',      // ECONOMY, BALANCED, PREMIUM
  budget_mode: 'GUARD',         // Strict protection against unnecessary Gemini consumption
  autonomy_mode: 'SAFE',        // SAFE, AUTO, FULL
  preferred_agents: {
    ARCHITECT: 'plan',
    PLANNER: 'plan',
    CODER: 'build',
    DEBUGGER: 'build',
    TESTER: 'build',
    REVIEWER: 'general',
    RESEARCHER: 'explore',
    DOCUMENTATION: 'general',
    SECURITY: 'general',
    DEVOPS: 'general'
  },
  preferred_models: {
    PLANNER: 'opencode/big-pickle',
    DOCUMENTATION: 'opencode/muse-spark-1.3-contributor-free',
    CODER: 'opencode/nemotron-3.5-lightning-free',
    DEBUGGER: 'opencode/nemotron-3.5-lightning-free',
    TESTER: 'opencode/ling-3.0-flash-free',
    RESEARCHER: 'opencode/hy3-free',
    opencode: 'opencode/big-pickle',
    gemini: 'Gemini 3.8 Flash'
  },
  max_retries: 2,
  git_strategy: 'branch',       // 'branch', 'worktree', 'checkpoint'
  parallel_tasks: 2,            // Max concurrent tasks for RAM safety
  logging: {
    level: 'INFO',
    directory: '.nexus/logs'
  },
  telemetry: true,
  permissions: {
    destructive_commands_block: true,
    require_confirmation_for_large_diff: true,
    max_auto_files_changed: 10
  }
};

/**
 * Searches for .nexus/config.json in cwd or parent directories
 */
export function findNexusRoot(startDir = process.cwd()) {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, '.nexus'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return startDir;
}

/**
 * Loads project configuration, falling back to default configuration
 */
export function loadConfig(targetDir = process.cwd()) {
  const root = findNexusRoot(targetDir);
  const configPath = path.join(root, '.nexus', 'config.json');

  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...DEFAULT_CONFIG, ...data };
    } catch (err) {
      console.warn(`[Config] Error reading config at ${configPath}, using defaults: ${err.message}`);
    }
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Saves configuration to .nexus/config.json
 */
export function saveConfig(config, targetDir = process.cwd()) {
  const root = path.resolve(targetDir);
  const nexusDir = path.join(root, '.nexus');
  if (!fs.existsSync(nexusDir)) {
    fs.mkdirSync(nexusDir, { recursive: true });
  }

  // Ensure sensitive data is NEVER stored
  const sanitized = { ...config };
  delete sanitized.apiKey;
  delete sanitized.api_key;
  delete sanitized.token;
  delete sanitized.password;
  delete sanitized.secret;

  const configPath = path.join(nexusDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(sanitized, null, 2), 'utf8');
  return configPath;
}

export function initProjectStructure(targetDir = process.cwd()) {
  const root = path.resolve(targetDir);
  const dirs = [
    '.nexus',
    '.nexus/memory',
    '.nexus/logs',
    '.nexus/tasks',
    '.nexus/context',
    '.nexus/changes'
  ];

  for (const dir of dirs) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
    }
  }

  // Write default config if not exists
  const configPath = path.join(root, '.nexus', 'config.json');
  if (!fs.existsSync(configPath)) {
    saveConfig(DEFAULT_CONFIG, root);
  }

  // Write .nexus/.gitignore
  const gitignorePath = path.join(root, '.nexus', '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'logs/\n*.log\ncache/\ntmp/\n*.key\n*.token\nauth.json\ncredentials.json\n', 'utf8');
  }

  return root;
}
