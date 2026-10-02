import { BaseEngine } from '../base.js';

export class LocalAdapter extends BaseEngine {
  constructor() {
    super('local');
  }

  async detect() {
    return {
      available: false,
      reason: 'No active local OpenAI-compatible endpoint (Ollama/LM Studio) detected on localhost:11434 or localhost:1234.'
    };
  }

  async health() {
    return {
      status: 'STANDBY',
      engine: 'local'
    };
  }

  async listModels() {
    return [];
  }

  async listAgents() {
    return [];
  }

  async execute() {
    throw new Error('Local engine is in STANDBY. Launch Ollama or LM Studio to enable local execution.');
  }

  async cancel() {
    return true;
  }

  capabilities() {
    return {
      name: 'local',
      supportsToolCalls: false,
      supportsStreaming: false,
      supportsSubagents: false,
      supportsLocal: true
    };
  }
}

export const localAdapter = new LocalAdapter();
