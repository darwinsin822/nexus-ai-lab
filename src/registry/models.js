import { opencodeAdapter } from '../engines/opencode/adapter.js';

export class ModelRegistry {
  constructor() {
    this.models = new Map();
    this.cachedList = null;
  }

  async refresh() {
    const list = await opencodeAdapter.listModels();
    this.cachedList = list;
    this.models.clear();

    for (const m of list) {
      this.models.set(m.id, m);
    }

    // Add Gemini models
    this.models.set('gemini/gemini-3.8-flash', {
      id: 'gemini/gemini-3.8-flash',
      provider: 'gemini',
      name: 'Gemini 3.8 Flash',
      description: 'Ultra-fast, state-of-the-art multimodal reasoning',
      context: 1048576,
      cost: { input: 0.15, output: 0.60 },
      tool_call: true,
      reasoning: true,
      tier: 'premium'
    });

    this.models.set('gemini/gemini-2.5-pro', {
      id: 'gemini/gemini-2.5-pro',
      provider: 'gemini',
      name: 'Gemini 2.5 Pro',
      description: 'Deep architectural reasoning and complex debugging',
      context: 2097152,
      cost: { input: 1.25, output: 5.00 },
      tool_call: true,
      reasoning: true,
      tier: 'flagship'
    });

    return Array.from(this.models.values());
  }

  async getAllModels() {
    if (!this.cachedList || this.models.size === 0) {
      await this.refresh();
    }
    return Array.from(this.models.values());
  }

  async getFreeModels() {
    const all = await this.getAllModels();
    return all.filter(m => {
      const id = m.id.toLowerCase();
      return id.includes('free') || m.cost?.input === 0 || id.startsWith('opencode/');
    });
  }

  async getEconomicalModels() {
    const all = await this.getAllModels();
    return all.filter(m => {
      if (m.cost?.input !== undefined && m.cost.input < 0.5) return true;
      const id = m.id.toLowerCase();
      return id.includes('flash') || id.includes('free') || id.includes('mini');
    });
  }

  async getModel(modelId) {
    if (this.models.size === 0) await this.refresh();
    return this.models.get(modelId) || null;
  }

  async selectBestModel(options = {}) {
    const mode = options.mode || 'ECONOMY';
    const engine = options.engine || 'opencode';

    if (engine === 'gemini') {
      return mode === 'PREMIUM' ? 'gemini/gemini-2.5-pro' : 'gemini/gemini-3.8-flash';
    }

    if (mode === 'ECONOMY') {
      // Prioritize free opencode models or lowest cost
      const free = await this.getFreeModels();
      const opencodeDefault = free.find(m => m.id === 'opencode/big-pickle') || free[0];
      return opencodeDefault ? opencodeDefault.id : 'opencode/big-pickle';
    }

    if (mode === 'BALANCED') {
      const econ = await this.getEconomicalModels();
      const balanced = econ.find(m => m.tool_call) || econ[0];
      return balanced ? balanced.id : 'opencode/big-pickle';
    }

    // PREMIUM
    return 'gemini/gemini-3.8-flash';
  }
}

export const modelRegistry = new ModelRegistry();
