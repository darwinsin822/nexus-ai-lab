import { BaseEngine } from '../base.js';

export class LocalAdapter extends BaseEngine {
  constructor() {
    super('local');
  }

  async detect() {
    return {
      available: false,
      reason: 'Soporte de modelos locales deshabilitado: La máquina anfitriona cuenta con recursos limitados (8 GB RAM / 4 núcleos). Para evitar sobrecarga de memoria o congelamiento del sistema, toda ejecución económica se delega a OpenCode.'
    };
  }

  async health() {
    return {
      status: 'DISABLED',
      engine: 'local',
      reason: 'Host RAM Protection (8 GB limit preserved)'
    };
  }

  async listModels() {
    return [];
  }

  async listAgents() {
    return [];
  }

  async execute() {
    throw new Error('El motor Local está deshabilitado por política de protección de hardware (8 GB RAM). Utiliza OpenCode.');
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
      supportsLocal: false,
      disabled: true
    };
  }
}

export const localAdapter = new LocalAdapter();
