import { taskManager } from '../tasks/task-manager.js';
import { resourceManager } from '../telemetry/resource-manager.js';
import { gitSafety } from '../git/git-safety.js';
import { opencodeAdapter } from '../engines/opencode/adapter.js';

export async function showDashboard() {
  const tasks = taskManager.listTasks();
  const activeTasks = tasks.filter(t => ['PENDING', 'PLANNING', 'RUNNING'].includes(t.status));
  const recentTasks = tasks.slice(0, 5);
  const git = gitSafety.getStatus();
  const oc = await opencodeAdapter.detect();

  console.clear();
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║               NEXUS AI LAB 2.0 — DASHBOARD                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Engines:                                                      ║`);
  console.log(`║    • OpenCode:   \x1b[32m${oc.available ? `ONLINE (v${oc.version})` : 'OFFLINE'}\x1b[0m`);
  console.log(`║    • Gemini:     \x1b[32mONLINE (Antigravity Bridge)\x1b[0m                  ║`);
  console.log(`║    • Local AI:   \x1b[33mSTANDBY\x1b[0m                                       ║`);
  console.log('║                                                                ║');
  console.log(`║  Git Status:                                                   ║`);
  console.log(`║    • Branch:     ${git.branch || 'None (no repo)'}`);
  console.log(`║    • Working:    ${git.clean ? '\x1b[32mClean\x1b[0m' : `\x1b[33m${git.files.length} uncommitted file(s)\x1b[0m`}`);
  console.log('║                                                                ║');
  console.log(`║  Tasks Summary:                                                ║`);
  console.log(`║    • Active:     ${activeTasks.length}`);
  console.log(`║    • Total:      ${tasks.length}`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  Recent Tasks:                                                 ║');

  if (recentTasks.length === 0) {
    console.log('║    (No tasks recorded yet. Run "nexus run <prompt>")           ║');
  } else {
    for (const t of recentTasks) {
      const statusColor = t.status === 'COMPLETED' ? '\x1b[32m' : (t.status === 'FAILED' ? '\x1b[31m' : '\x1b[33m');
      console.log(`║    • [${t.id}] ${statusColor}${t.status}\x1b[0m - ${t.title.slice(0, 35)} (${t.engine || 'auto'})`);
    }
  }

  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  Resource Manager:                                             ║');
  console.log(resourceManager.getReport().split('\n').map(l => `║  ${l}`).join('\n'));
  console.log('╚════════════════════════════════════════════════════════════════╝');
}

export function showLabMode(task, currentStatus = 'RUNNING') {
  console.log('\n────────────────────────────────────────────────────────');
  console.log('                  NEXUS LAB MONITOR');
  console.log('────────────────────────────────────────────────────────');
  console.log(`Engine:  ${task.engine || 'OpenCode'}`);
  console.log(`Agent:   ${task.agent || 'build'}`);
  console.log(`Model:   ${task.model || 'opencode/big-pickle'}`);
  console.log(`Task:    [${task.id}] ${task.title}`);
  console.log(`Status:  \x1b[33m${currentStatus}\x1b[0m`);
  console.log(`Risk:    ${task.risk || 'LOW'}`);
  console.log(`Git:     ${task.branch || 'main'}`);
  console.log('────────────────────────────────────────────────────────\n');
}
