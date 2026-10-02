import { opencodeAdapter } from '../engines/opencode/adapter.js';

export const ABSTRACT_PROFILES = [
  'ARCHITECT',
  'CODER',
  'DEBUGGER',
  'TESTER',
  'REVIEWER',
  'SECURITY',
  'RESEARCHER',
  'DOCUMENTATION',
  'DEVOPS',
  'DATABASE',
  'FRONTEND',
  'BACKEND'
];

export class AgentRegistry {
  constructor() {
    this.discoveredAgents = new Map([
      ['opencode', [
        { name: 'build', type: 'primary', provider: 'opencode' },
        { name: 'general', type: 'subagent', provider: 'opencode' },
        { name: 'plan', type: 'primary', provider: 'opencode' },
        { name: 'explore', type: 'subagent', provider: 'opencode' },
        { name: 'compaction', type: 'primary', provider: 'opencode' },
        { name: 'summary', type: 'primary', provider: 'opencode' },
        { name: 'title', type: 'primary', provider: 'opencode' }
      ]],
      ['gemini', [
        { name: 'self', type: 'primary', provider: 'gemini' },
        { name: 'research', type: 'subagent', provider: 'gemini' }
      ]]
    ]);
    this.customMappings = new Map();
  }

  async refresh() {
    try {
      const agents = await opencodeAdapter.listAgents();
      if (agents && agents.length > 0) {
        this.discoveredAgents.set('opencode', agents);
        return agents;
      }
    } catch (e) {}
    return this.discoveredAgents.get('opencode');
  }

  async getAvailableAgents(engine = 'opencode') {
    if (!this.discoveredAgents.has(engine)) {
      await this.refresh();
    }
    return this.discoveredAgents.get(engine) || [];
  }

  /**
   * Dynamically maps an abstract profile to the most appropriate real agent
   */
  async resolveAgent(profile, engine = 'opencode') {
    const normProfile = (profile || 'CODER').toUpperCase();
    const available = await this.getAvailableAgents(engine);
    const agentNames = available.map(a => a.name);

    if (engine === 'opencode') {
      switch (normProfile) {
        case 'ARCHITECT':
        case 'PLANNER':
          return agentNames.includes('plan') ? 'plan' : 'general';
        case 'CODER':
        case 'FRONTEND':
        case 'BACKEND':
        case 'DATABASE':
          return agentNames.includes('build') ? 'build' : 'general';
        case 'DEBUGGER':
        case 'TESTER':
          return agentNames.includes('build') ? 'build' : 'general';
        case 'RESEARCHER':
          return agentNames.includes('explore') ? 'explore' : 'general';
        case 'REVIEWER':
        case 'SECURITY':
        case 'DOCUMENTATION':
        case 'DEVOPS':
        default:
          return agentNames.includes('general') ? 'general' : (agentNames[0] || 'build');
      }
    }

    if (engine === 'gemini') {
      switch (normProfile) {
        case 'RESEARCHER':
          return 'research';
        case 'ARCHITECT':
        default:
          return 'self';
      }
    }

    return 'default';
  }

  getProfiles() {
    return ABSTRACT_PROFILES;
  }
}

export const agentRegistry = new AgentRegistry();
