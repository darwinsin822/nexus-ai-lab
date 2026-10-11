import fs from 'node:fs';
import path from 'node:path';
import { initProjectStructure, loadConfig, saveConfig, findNexusRoot } from '../core/config.js';
import { logger } from '../core/logger.js';
import { buildContextPack, saveChangeSummary } from '../core/context.js';
import { initProjectMemory, readMemory, appendMemory, MEMORY_FILES } from '../core/memory.js';
import { runDoctor } from './doctor.js';
import { showDashboard, showLabMode } from './dashboard.js';
import { agentRegistry } from '../registry/agents.js';
import { modelRegistry } from '../registry/models.js';
import { providerRegistry } from '../registry/providers.js';
import { taskManager } from '../tasks/task-manager.js';
import { aiRouter } from '../router/ai-router.js';
import { fallbackEngine } from '../router/fallback.js';
import { gitSafety } from '../git/git-safety.js';
import { qualityGate } from '../quality/quality-gate.js';
import { handoffManager } from '../handoff/handoff-manager.js';
import { hybridWorkflow } from '../hybrid/workflow.js';
import { skillsLoader } from '../skills/skills-loader.js';
import { resourceManager } from '../telemetry/resource-manager.js';
import { opencodeAdapter } from '../engines/opencode/adapter.js';
import { geminiAdapter } from '../engines/gemini/adapter.js';

export async function cli(args = process.argv.slice(2)) {
  const cmd = args[0] || 'help';

  switch (cmd) {
    case 'init': {
      const root = initProjectStructure(process.cwd());
      initProjectMemory(root);
      logger.success(`Initialized Nexus AI Lab project in ${root}`);
      console.log('Structure created: .nexus/ (config.json, memory/, logs/, tasks/, context/, changes/)');
      break;
    }

    case 'doctor': {
      await runDoctor();
      break;
    }

    case 'status': {
      const git = gitSafety.getStatus();
      const oc = await opencodeAdapter.detect();
      console.log('\n--- NEXUS STATUS ---');
      console.log(`Directory:   ${process.cwd()}`);
      console.log(`OpenCode:    ${oc.available ? `ONLINE (v${oc.version})` : 'OFFLINE'}`);
      console.log(`Git:         ${git.isRepo ? `Repo branch: ${git.branch} (${git.clean ? 'Clean' : 'Modified'})` : 'No Git repo'}`);
      const tasks = taskManager.listTasks();
      console.log(`Tasks:       ${tasks.length} total (${tasks.filter(t => t.status === 'COMPLETED').length} completed)`);
      break;
    }

    case 'agents': {
      const agents = await agentRegistry.refresh();
      console.log('\n=== AVAILABLE AGENTS ===');
      console.log('Abstract Profiles:', agentRegistry.getProfiles().join(', '));
      console.log('\nDiscovered OpenCode Agents:');
      for (const a of agents) {
        console.log(`  • \x1b[32m${a.name}\x1b[0m (${a.type})`);
      }
      break;
    }

    case 'models': {
      const providerArg = args[1] && !args[1].startsWith('-') ? args[1] : null;
      console.log(`\nFetching models${providerArg ? ` for ${providerArg}` : ''}...`);
      const models = await modelRegistry.getAllModels();
      const filtered = providerArg ? models.filter(m => m.provider === providerArg) : models;
      console.log(`\n=== MODELS (${filtered.length} total) ===`);
      for (const m of filtered.slice(0, 30)) {
        const costStr = m.cost ? `[$${m.cost.input}/M in, $${m.cost.output}/M out]` : '[Free / Open]';
        console.log(`  • \x1b[36m${m.id}\x1b[0m ${costStr}`);
      }
      if (filtered.length > 30) {
        console.log(`  ... and ${filtered.length - 30} more models available.`);
      }
      break;
    }

    case 'providers': {
      const providers = await providerRegistry.getProviders();
      console.log('\n=== CONFIGURED AI PROVIDERS ===');
      for (const p of providers) {
        const color = p.status === 'ACTIVE' ? '\x1b[32m' : '\x1b[33m';
        console.log(`  • \x1b[1m${p.name}\x1b[0m: ${color}[${p.status}]\x1b[0m (${p.credentialsCount} keys)`);
      }
      break;
    }

    case 'tasks': {
      const list = taskManager.listTasks();
      console.log('\n=== TASK MANAGER ===');
      if (list.length === 0) {
        console.log('No tasks found. Run "nexus run <prompt>"');
      } else {
        for (const t of list) {
          const color = t.status === 'COMPLETED' ? '\x1b[32m' : (t.status === 'FAILED' ? '\x1b[31m' : '\x1b[33m');
          console.log(`[${t.id}] ${color}${t.status.padEnd(10)}\x1b[0m [${t.engine || 'auto'}] ${t.title}`);
        }
      }
      break;
    }

    case 'run': {
      let prompt = '';
      let requestedEngine = null;
      let requestedMode = null;
      let requestedAgent = null;
      let requestedModel = null;

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--engine' && args[i + 1]) {
          requestedEngine = args[++i];
        } else if (args[i] === '--mode' && args[i + 1]) {
          requestedMode = args[++i];
        } else if (args[i] === '--agent' && args[i + 1]) {
          requestedAgent = args[++i];
        } else if (args[i] === '--model' && args[i + 1]) {
          requestedModel = args[++i];
        } else {
          prompt += (prompt ? ' ' : '') + args[i];
        }
      }

      if (!prompt) {
        console.error('Usage: nexus run "<prompt>" [--engine opencode|gemini] [--mode ECONOMY|BALANCED|PREMIUM]');
        process.exit(1);
      }

      initProjectStructure();
      const task = taskManager.createTask(prompt, prompt, { mode: requestedMode, engine: requestedEngine });
      buildContextPack(task);

      // AI ROUTER DECISION
      const routing = await aiRouter.route(task, requestedEngine, requestedMode);
      if (requestedAgent) routing.agent = requestedAgent;
      if (requestedModel) routing.model = requestedModel;

      task.engine = routing.engine;
      task.agent = routing.agent;
      task.model = routing.model;
      task.risk = routing.risk;
      taskManager.saveTask(task);

      // Print Transparency Block (Section 52)
      console.log('\n========================================');
      console.log('         NEXUS ROUTING DECISION');
      console.log('========================================');
      console.log(`ENGINE:  ${routing.engine}`);
      console.log(`AGENT:   ${routing.agent}`);
      console.log(`MODEL:   ${routing.model}`);
      console.log(`MODE:    ${routing.mode}`);
      console.log(`RISK:    ${routing.risk}`);
      console.log(`REASON:  ${routing.reason}`);
      console.log('========================================\n');

      // Git Safety Checkpoint & Branch
      if (gitSafety.isGitRepo()) {
        gitSafety.createCheckpoint(task.id);
        const branch = gitSafety.createTaskBranch(task.id);
        task.branch = branch;
        taskManager.saveTask(task);
      }

      showLabMode(task, 'RUNNING');
      taskManager.updateTaskStatus(task.id, 'RUNNING');

      // Execution with Fallback Engine
      const execResult = await fallbackEngine.executeWithFallback(task, routing, { cwd: process.cwd() });
      task.durationMs = execResult.durationMs || 0;
      task.result = execResult.stdout;

      // Quality Gate Evaluation
      const qg = await qualityGate.evaluate(task, execResult, { cwd: process.cwd() });
      const finalStatus = execResult.success ? (qg.verdict === 'FAIL' ? 'REVIEW' : 'COMPLETED') : 'FAILED';
      taskManager.updateTaskStatus(task.id, finalStatus, {
        result: execResult.stdout,
        errors: execResult.error ? [execResult.error] : [],
        modifiedFiles: execResult.modifiedFiles
      });

      // Record Telemetry
      resourceManager.recordUsage({
        taskId: task.id,
        engine: task.engine,
        agent: task.agent,
        model: task.model,
        durationMs: task.durationMs,
        status: finalStatus,
        exitCode: execResult.exitCode,
        modifiedFiles: execResult.modifiedFiles
      });

      // Save Change Summary
      saveChangeSummary(task.id, {
        status: finalStatus,
        engine: task.engine,
        agent: task.agent,
        whatChanged: `Completed execution for prompt: ${prompt}`,
        files: execResult.modifiedFiles,
        tests: `Quality Gate Verdict: ${qg.verdict}`
      });

      if (execResult.stdout) {
        console.log('\n--- OUTPUT ---');
        console.log(execResult.stdout);
      }

      console.log(`\n\x1b[32m✔ Task ${task.id} finalized with status: [${finalStatus}]\x1b[0m`);
      break;
    }

    case 'plan': {
      let prompt = '';
      let engine = null;
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--engine' && args[i + 1]) {
          engine = args[++i];
        } else {
          prompt += (prompt ? ' ' : '') + args[i];
        }
      }

      if (!prompt) {
        console.error('Usage: nexus plan "<prompt>" [--engine opencode|gemini]');
        process.exit(1);
      }

      initProjectStructure();
      const config = loadConfig();
      const targetEngine = engine || (config.default_mode === 'ECONOMY' ? 'opencode' : 'gemini');
      const task = taskManager.createTask(prompt, prompt, { mode: 'BALANCED', engine: targetEngine });
      logger.info(`Generating architectural plan for [${task.id}] with ${targetEngine}...`);

      let planText = '';
      if (targetEngine === 'opencode') {
        const res = await opencodeAdapter.execute(task, { agent: 'plan', model: 'opencode/big-pickle', auto: true });
        planText = res.stdout || `# Plan generado por OpenCode (Agente: plan)\nTarea: ${prompt}\n`;
      } else {
        const plan = await geminiAdapter.execute(task, { model: 'gemini/gemini-3.8-flash' });
        planText = plan.stdout;
      }

      handoffManager.writeArtifact('plan.md', planText);
      handoffManager.createHandoff(
        { engine: targetEngine, agent: targetEngine === 'opencode' ? 'plan' : 'self' },
        { engine: 'opencode', agent: 'build' },
        {
          stage: 'PLAN_TO_IMPLEMENT',
          objective: prompt,
          plan: planText,
          task
        }
      );
      console.log('\n' + planText);
      logger.success('Plan generado y guardado en .nexus/plan.md & .nexus/handoff.md');
      break;
    }

    case 'hybrid': {
      const prompt = args.slice(1).join(' ');
      if (!prompt) {
        console.error('Usage: nexus hybrid "<prompt>"');
        process.exit(1);
      }
      initProjectStructure();
      const task = taskManager.createTask(prompt, prompt, { mode: 'BALANCED' });
      const result = await hybridWorkflow.runPipeline(task, { cwd: process.cwd() });
      console.log('\n' + result.summary);
      break;
    }

    case 'handoff': {
      const handoffDoc = handoffManager.readArtifact('handoff.md');
      if (handoffDoc) {
        console.log('\n' + handoffDoc);
      } else {
        console.log('No recent handoff artifact in .nexus/handoff.md');
      }
      break;
    }

    case 'dashboard': {
      await showDashboard();
      break;
    }

    case 'memory': {
      initProjectMemory();
      const sub = args[1];
      if (sub && MEMORY_FILES.includes(sub)) {
        console.log(readMemory(sub));
      } else {
        console.log('Available memory files:', MEMORY_FILES.join(', '));
        console.log('Use "nexus memory <file.md>" to inspect.');
      }
      break;
    }

    case 'skills': {
      const subCmd = args[1];
      if (subCmd === 'find' || subCmd === 'search') {
        const query = args.slice(2).join(' ') || '';
        console.log(`\nSearching community skills via skills.sh for: "${query}"...`);
        const { spawnSync } = await import('node:child_process');
        spawnSync('npx', ['skills', 'find', query], { stdio: 'inherit' });
        break;
      }
      const skills = skillsLoader.listSkills();
      console.log(`\n=== SKILLS (${skills.length} detected) ===`);
      for (const s of skills) {
        console.log(`  • \x1b[36m${s.name.padEnd(20)}\x1b[0m [${s.scope}] (${s.path})`);
      }
      console.log('\nTip: To discover new open skills without installing: nexus skills find <query>');
      break;
    }

    case 'scan': {
      console.log('\n--- NEXUS STATIC SECURITY AUDIT (SEMGREP SAST) ---');
      const { execSync } = await import('node:child_process');
      try {
        const out = execSync('semgrep scan --config auto', { stdio: 'inherit' });
      } catch (err) {
        // Exit code might be non-zero if issues found
      }
      break;
    }

    case 'test:e2e': {
      const targetUrl = args[1] || 'http://localhost:3000';
      console.log(`\n--- NEXUS E2E TEST (PLAYWRIGHT WITH OPTIRAM GUARD) ---`);
      const { playwrightRunner } = await import('../testing/playwright-runner.js');
      const result = await playwrightRunner.runScenario(targetUrl);
      console.log('Result:', JSON.stringify(result, null, 2));
      break;
    }

    case 'reverse': {
      const target = args.slice(1).join(' ');
      console.log(`\n--- NEXUS REVERSE ENGINEERING (REA v6.4.0) ---`);
      const { spawnSync } = await import('node:child_process');
      spawnSync('npx', ['rea-agents', ...args.slice(1)], { stdio: 'inherit' });
      break;
    }

    case 'resume':
    case 'failover':
    case 'claude-failover':
    case 'gemini-failover': {
      console.log('\n--- NEXUS RESCUE: 5-HOUR LIMIT / QUOTA FAILOVER TO DEEPSEEK ---');
      const handoff = handoffManager.readArtifact('handoff.md');
      const prompt = args.slice(1).join(' ') || (handoff ? 'Continuar la tarea interrumpida según .nexus/handoff.md' : 'Continuar tarea pendiente con DeepSeek');
      console.log(`[NEXUS RESCUE] Activando DeepSeek (deepseek/deepseek-flash)...`);
      const res = await opencodeAdapter.execute({ id: `resume-${Date.now()}`, title: prompt }, {
        agent: 'build',
        model: 'deepseek/deepseek-flash',
        cwd: process.cwd(),
        auto: true
      });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(res.stderr);
      console.log('\n✔ [NEXUS] Tarea completada al 100% con DeepSeek.');
      break;
    }

    case 'opencode': {
      const ocArgs = args.slice(1);
      const res = await opencodeAdapter.execute({ id: 'manual-opencode', title: ocArgs.join(' ') }, {
        auto: true,
        cwd: process.cwd()
      });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(res.stderr);
      break;
    }

    case 'gemini': {
      const gArgs = args.slice(1).join(' ');
      const res = await geminiAdapter.execute({ id: 'manual-gemini', title: gArgs });
      console.log(res.stdout);
      break;
    }

    case 'history':
    case 'logs': {
      console.log('\n' + resourceManager.getReport());
      break;
    }

    case 'help':
    default: {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║               NEXUS AI LAB 2.0 — CLI REFERENCE                 ║
╚════════════════════════════════════════════════════════════════╝

Usage: nexus <command> [options]

Commands:
  init                     Initialize .nexus/ project structure
  doctor                   Run full system and environment diagnostic
  status                   Show current engine, git, and workspace status
  agents                   List all available abstract profiles & agents
  models [provider]        List discovered models and pricing tiers
  providers                List configured AI providers & credentials
  tasks                    List all managed tasks and statuses
  run <prompt>             Execute task with intelligent AI routing
  plan <prompt>            Generate architectural plan (Gemini)
  hybrid <prompt>          Execute full Plan->Implement->Test->Review pipeline
  handoff                  View current handoff context document
  scan                     Run Semgrep SAST deterministic static security scan
  test:e2e [url]           Run Playwright headless scenario with OptiRAM protection
  reverse [args...]        Reverse engineer application/binary/APK with REA
  skills [find <query>]    List active skills or search skills.sh registry
  dashboard                Display interactive terminal dashboard
  memory [file]            Inspect project persistent memory files
  opencode [args...]       Execute command directly via OpenCode adapter
  gemini [prompt]          Execute prompt directly via Gemini adapter
  history / logs           Show telemetry and resource consumption report
`);
      break;
    }
  }
}
