/**
 * Base Abstract Engine class
 */
export class BaseEngine {
  constructor(name) {
    this.name = name;
  }

  async detect() {
    throw new Error('detect() not implemented');
  }

  async health() {
    throw new Error('health() not implemented');
  }

  async listModels() {
    throw new Error('listModels() not implemented');
  }

  async listAgents() {
    throw new Error('listAgents() not implemented');
  }

  async execute(task, options) {
    throw new Error('execute() not implemented');
  }

  async cancel(processId) {
    throw new Error('cancel() not implemented');
  }

  capabilities() {
    return {
      name: this.name,
      supportsToolCalls: false,
      supportsStreaming: false,
      supportsSubagents: false,
      supportsLocal: false
    };
  }
}
