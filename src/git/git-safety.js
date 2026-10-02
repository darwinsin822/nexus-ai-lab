import { execSync } from 'node:child_process';
import { logger } from '../core/logger.js';

export class GitSafety {
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
  }

  isGitRepo(dir = this.cwd) {
    try {
      execSync('git rev-parse --is-inside-work-tree', { cwd: dir, stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  getStatus(dir = this.cwd) {
    if (!this.isGitRepo(dir)) {
      return { isRepo: false, clean: true, branch: null, files: [] };
    }

    try {
      const branch = execSync('git branch --show-current', { cwd: dir, encoding: 'utf8' }).trim();
      const statusOut = execSync('git status --porcelain', { cwd: dir, encoding: 'utf8' }).trim();
      const files = statusOut ? statusOut.split('\n').map(l => l.trim()) : [];
      return {
        isRepo: true,
        clean: files.length === 0,
        branch: branch || 'HEAD',
        files
      };
    } catch (err) {
      return { isRepo: true, clean: false, branch: null, error: err.message, files: [] };
    }
  }

  createCheckpoint(taskId, dir = this.cwd) {
    if (!this.isGitRepo(dir)) return null;

    try {
      const status = this.getStatus(dir);
      if (!status.clean) {
        logger.info(`Creating Git checkpoint for ${taskId}...`);
        execSync(`git stash create "nexus-checkpoint-${taskId}"`, { cwd: dir, encoding: 'utf8' });
      }
      const commit = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim();
      return commit;
    } catch (err) {
      logger.warn(`Could not create checkpoint commit: ${err.message}`);
      return null;
    }
  }

  createTaskBranch(taskId, dir = this.cwd) {
    if (!this.isGitRepo(dir)) return null;

    const branchName = `nexus/${taskId}`;
    try {
      // Check if branch already exists
      const branches = execSync('git branch --list', { cwd: dir, encoding: 'utf8' });
      if (branches.includes(branchName)) {
        execSync(`git checkout ${branchName}`, { cwd: dir, stdio: 'ignore' });
      } else {
        execSync(`git checkout -b ${branchName}`, { cwd: dir, stdio: 'ignore' });
        logger.success(`Created isolated Git branch: ${branchName}`);
      }
      return branchName;
    } catch (err) {
      logger.warn(`Failed to create/switch branch ${branchName}: ${err.message}`);
      return null;
    }
  }

  getDiff(dir = this.cwd) {
    if (!this.isGitRepo(dir)) return '';
    try {
      return execSync('git diff', { cwd: dir, encoding: 'utf8' });
    } catch (err) {
      return '';
    }
  }

  /**
   * Strictly audits commands to prevent destructive actions
   */
  validateCommandSafety(command = '') {
    const dangerousCommands = [
      'git reset --hard',
      'git clean -fd',
      'git clean -f',
      'rm -rf /',
      'mkfs',
      'dd if='
    ];

    for (const dangerous of dangerousCommands) {
      if (command.includes(dangerous)) {
        return {
          safe: false,
          violation: dangerous,
          message: `Blocked destructive command execution: '${dangerous}' is strictly prohibited by Nexus Git Safety.`
        };
      }
    }
    return { safe: true };
  }
}

export const gitSafety = new GitSafety();
