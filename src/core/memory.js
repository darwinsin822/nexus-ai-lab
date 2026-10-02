import fs from 'node:fs';
import path from 'node:path';
import { findNexusRoot } from './config.js';

export const MEMORY_FILES = [
  'architecture.md',
  'decisions.md',
  'conventions.md',
  'known-issues.md',
  'environment.md',
  'agents.md'
];

export function initProjectMemory(targetDir = process.cwd()) {
  const root = findNexusRoot(targetDir);
  const memoryDir = path.join(root, '.nexus', 'memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  const templates = {
    'architecture.md': '# Project Architecture\n\nHigh-level architectural patterns, modules, and structure.\n',
    'decisions.md': '# Technical Decisions\n\nLog of significant architectural and technical choices.\n',
    'conventions.md': '# Code Conventions & Standards\n\nFormatting, naming conventions, and project standards.\n',
    'known-issues.md': '# Known Issues & Edge Cases\n\nDocumented gotchas, workarounds, and unresolved bugs.\n',
    'environment.md': '# Environment & Tooling\n\nRuntime versions, local tooling requirements, and dependencies.\n',
    'agents.md': '# Agent Mappings & Roles\n\nActive agent mappings, preferred profiles, and execution history.\n'
  };

  for (const [file, content] of Object.entries(templates)) {
    const full = path.join(memoryDir, file);
    if (!fs.existsSync(full)) {
      fs.writeFileSync(full, content, 'utf8');
    }
  }

  return memoryDir;
}

export function readMemory(file, targetDir = process.cwd()) {
  const root = findNexusRoot(targetDir);
  const full = path.join(root, '.nexus', 'memory', file);
  if (fs.existsSync(full)) {
    return fs.readFileSync(full, 'utf8');
  }
  return null;
}

export function appendMemory(file, section, text, targetDir = process.cwd()) {
  const root = findNexusRoot(targetDir);
  const full = path.join(root, '.nexus', 'memory', file);
  const timestamp = new Date().toISOString();
  const entry = `\n### [${timestamp}] ${section}\n${text.trim()}\n`;
  if (!fs.existsSync(full)) {
    initProjectMemory(targetDir);
  }
  fs.appendFileSync(full, entry, 'utf8');
}
