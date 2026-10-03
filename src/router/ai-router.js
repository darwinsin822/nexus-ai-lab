import { taskClassifier } from '../tasks/classifier.js';
import { budgetGuard } from './budget-guard.js';
import { agentRegistry } from '../registry/agents.js';
import { modelRegistry } from '../registry/models.js';
import { loadConfig } from '../core/config.js';

export class AIRouter {
  constructor(config = null) {
    this.config = config || loadConfig();
  }

  /**
   * Main AI routing engine
   */
  async route(task, requestedEngine = null, requestedMode = null) {
    const config = this.config;
    const mode = (requestedMode || task.mode || config.default_mode || 'ECONOMY').toUpperCase();
    const classification = taskClassifier.classify(task.description || task.title);

    let engine = requestedEngine || task.engine;
    let reason = '';

    // If local engine requested, reject due to hardware constraints
    if (engine === 'local') {
      engine = 'opencode';
      reason = 'Soporte local deshabilitado por restricción de hardware (8 GB RAM / 4 núcleos). Enrutado a OpenCode.';
    } else if (!engine) {
      if (mode === 'PREMIUM') {
        engine = 'gemini';
        reason = 'Mode PREMIUM: Prioritizing maximum cognitive and reasoning power.';
      } else if (mode === 'ECONOMY' || mode === 'BALANCED') {
        const bgEvaluation = budgetGuard.evaluate(task, classification.category, classification.complexity, mode);
        if (bgEvaluation.allowed) {
          engine = 'gemini';
          reason = bgEvaluation.reason;
        } else {
          engine = 'opencode';
          reason = bgEvaluation.reason;
        }
      } else {
        engine = 'opencode';
        reason = 'Defaulting to OpenCode for routine code tasks.';
      }
    } else {
      reason = `Explicit engine override requested: ${engine}.`;
    }

    // Agent Resolution
    const agent = await agentRegistry.resolveAgent(classification.profile, engine);

    // Model Resolution
    const model = await modelRegistry.selectBestModel({
      engine,
      mode,
      category: classification.category
    });

    // Risk Analysis
    let risk = classification.risk || 'LOW';
    const taskContent = `${task.description || ''} ${task.title || ''}`.toLowerCase();
    if (taskContent.includes('delete') || taskContent.includes('rm -rf') || taskContent.includes('drop table')) {
      risk = 'DANGEROUS';
    }

    // Permissions based on Autonomy Level
    const autonomy = config.autonomy_mode || 'SAFE';
    const permissions = {
      autoApprove: autonomy === 'FULL' || (autonomy === 'AUTO' && risk !== 'DANGEROUS'),
      requireConfirmation: risk === 'DANGEROUS' || autonomy === 'SAFE',
      autonomy
    };

    return {
      engine,
      agent,
      model,
      mode,
      risk,
      profile: classification.profile,
      category: classification.category,
      permissions,
      reason
    };
  }
}

export const aiRouter = new AIRouter();
