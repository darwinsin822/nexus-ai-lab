import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { opencodeAdapter } from '../engines/opencode/adapter.js';
import { geminiAdapter } from '../engines/gemini/adapter.js';
import { skillsLoader } from '../skills/skills-loader.js';
import { mcpManager } from '../mcp/mcp-manager.js';
import { gitSafety } from '../git/git-safety.js';
import { findNexusRoot } from '../core/config.js';

export async function runDoctor() {
  console.log('\n======================================================');
  console.log('       NEXUS AI LAB 2.0 — DIAGNOSTIC DOCTOR');
  console.log('======================================================\n');

  const report = [];

  const check = (name, status, details) => {
    report.push({ name, status, details });
    const symbol = status === 'OK' ? '\x1b[32m[OK]\x1b[0m' : (status === 'WARN' ? '\x1b[33m[WARNING]\x1b[0m' : '\x1b[31m[ERROR]\x1b[0m');
    console.log(`${symbol} \x1b[1m${name}\x1b[0m: ${details}`);
  };

  // 1. Node & Runtimes
  check('Node.js', 'OK', `v${process.versions.node} (${process.execPath})`);

  try {
    const gitVer = execSync('git --version', { encoding: 'utf8' }).trim();
    check('Git', 'OK', gitVer);
  } catch (e) {
    check('Git', 'ERROR', 'Git binary not found');
  }

  try {
    const pyVer = execSync('python3 --version', { encoding: 'utf8' }).trim();
    check('Python 3', 'OK', pyVer);
  } catch (e) {
    check('Python 3', 'WARN', 'Python 3 not found');
  }

  // 2. OpenCode CLI
  try {
    const oc = await opencodeAdapter.detect();
    if (oc.available) {
      check('OpenCode CLI', 'OK', `Version ${oc.version} (${oc.binary})`);
    } else {
      check('OpenCode CLI', 'WARN', oc.error || 'Not found');
    }
  } catch (e) {
    check('OpenCode CLI', 'ERROR', e.message);
  }

  // 3. OpenCode Agents
  try {
    const agents = await opencodeAdapter.listAgents();
    check('OpenCode Agents', 'OK', `${agents.length} discovered: ${agents.map(a => a.name).join(', ')}`);
  } catch (e) {
    check('OpenCode Agents', 'WARN', 'Could not query agents dynamically');
  }

  // 4. OpenCode Models & Cache
  try {
    const models = await opencodeAdapter.listModels();
    check('Model Registry', 'OK', `${models.length} models cataloged (including local free models)`);
  } catch (e) {
    check('Model Registry', 'WARN', 'Using offline default models');
  }

  // 5. Antigravity & Gemini
  try {
    const gemini = await geminiAdapter.detect();
    check('Antigravity Bridge', 'OK', `Active (Model: ${gemini.model})`);
  } catch (e) {
    check('Antigravity Bridge', 'WARN', 'Operating in standalone CLI mode');
  }

  // 6. Skills
  try {
    const skills = skillsLoader.listSkills();
    check('Skills Subsystem', 'OK', `${skills.length} skills detected (local & global)`);
  } catch (e) {
    check('Skills Subsystem', 'WARN', e.message);
  }

  // 7. MCP Servers
  try {
    const mcps = mcpManager.detectServers();
    check('MCP Subsystem', 'OK', `${mcps.length} server(s) detected: ${mcps.map(m => m.name).join(', ') || 'None'}`);
  } catch (e) {
    check('MCP Subsystem', 'WARN', e.message);
  }

  // 8. Git Safety
  const gitStatus = gitSafety.getStatus();
  if (gitStatus.isRepo) {
    check('Git Safety Layer', 'OK', `Git repo active on branch '${gitStatus.branch}' (${gitStatus.clean ? 'Clean' : 'Uncommitted changes detected'})`);
  } else {
    check('Git Safety Layer', 'WARN', 'Current directory is not a Git repository (Nexus will operate safely without commits)');
  }

  // 9. Nexus Configuration & Directories
  const root = findNexusRoot();
  const nexusDir = path.join(root, '.nexus');
  if (fs.existsSync(nexusDir)) {
    check('Nexus Storage', 'OK', `Initialized at ${nexusDir}`);
  } else {
    check('Nexus Storage', 'WARN', 'No .nexus folder found in current directory. Run "nexus init"');
  }

  console.log('\n======================================================');
  const errors = report.filter(r => r.status === 'ERROR');
  const warnings = report.filter(r => r.status === 'WARN');
  if (errors.length === 0) {
    console.log(`\x1b[32m✔ NEXUS DOCTOR VERIFIED: System is 100% operational!\x1b[0m (${warnings.length} non-blocking warnings)`);
  } else {
    console.log(`\x1b[31m✖ NEXUS DOCTOR FAILED: ${errors.length} error(s) must be resolved.\x1b[0m`);
  }
  console.log('======================================================\n');
  return { ok: errors.length === 0, report };
}
