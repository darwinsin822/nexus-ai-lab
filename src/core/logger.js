import fs from 'node:fs';
import path from 'node:path';
import { findNexusRoot } from './config.js';

const SENSITIVE_PATTERNS = [
  /AIza[0-9A-Za-z-_]{20,}/g,                    // Google API Keys
  /sk-[a-zA-Z0-9]{20,}/g,                       // OpenAI / Generic secret keys
  /ghp_[a-zA-Z0-9]{20,}/g,                      // GitHub tokens
  /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,           // Bearer tokens
  /"(?:api_?key|token|secret)":\s*"[^"]+"/gi    // JSON credential fields
];

export function sanitize(text) {
  if (typeof text !== 'string') return text;
  let clean = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    clean = clean.replace(pattern, '[REDACTED_SECRET]');
  }
  return clean;
}

export class Logger {
  constructor(options = {}) {
    this.root = options.root || findNexusRoot();
    this.logDir = path.join(this.root, '.nexus', 'logs');
    this.level = options.level || 'INFO';
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (err) {
        // Fallback to silent or console
      }
    }
  }

  format(level, msg, meta = {}) {
    const timestamp = new Date().toISOString();
    const cleanMsg = sanitize(msg);
    const cleanMeta = JSON.parse(sanitize(JSON.stringify(meta)));
    return {
      timestamp,
      level,
      message: cleanMsg,
      ...cleanMeta
    };
  }

  write(entry) {
    const line = `[${entry.timestamp}] [${entry.level}] ${entry.message} ${entry.taskId ? `(Task: ${entry.taskId})` : ''}\n`;
    try {
      this.ensureDir();
      fs.appendFileSync(path.join(this.logDir, 'nexus.log'), line, 'utf8');
      fs.appendFileSync(path.join(this.logDir, 'events.jsonl'), JSON.stringify(entry) + '\n', 'utf8');
    } catch (err) {
      // Ignored if logs folder is unavailable
    }
  }

  info(msg, meta = {}) {
    const entry = this.format('INFO', msg, meta);
    console.log(`\x1b[36mℹ [NEXUS]\x1b[0m ${entry.message}`);
    this.write(entry);
  }

  success(msg, meta = {}) {
    const entry = this.format('SUCCESS', msg, meta);
    console.log(`\x1b[32m✔ [NEXUS]\x1b[0m ${entry.message}`);
    this.write(entry);
  }

  warn(msg, meta = {}) {
    const entry = this.format('WARN', msg, meta);
    console.warn(`\x1b[33m⚠ [NEXUS]\x1b[0m ${entry.message}`);
    this.write(entry);
  }

  error(msg, meta = {}) {
    const entry = this.format('ERROR', msg, meta);
    console.error(`\x1b[31m✖ [NEXUS]\x1b[0m ${entry.message}`);
    this.write(entry);
  }

  debug(msg, meta = {}) {
    if (this.level === 'DEBUG') {
      const entry = this.format('DEBUG', msg, meta);
      console.log(`\x1b[90m⚙ [DEBUG]\x1b[0m ${entry.message}`);
      this.write(entry);
    }
  }
}

export const logger = new Logger();
