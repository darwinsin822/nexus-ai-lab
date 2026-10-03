import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export class ProviderRegistry {
  constructor() {
    this.authPath = path.join(process.env.HOME || '/home/darwinsin', '.local', 'share', 'opencode', 'auth.json');
  }

  async getProviders() {
    const providers = [];

    // Check OpenCode native provider credentials
    let localCredentials = {};
    if (fs.existsSync(this.authPath)) {
      try {
        localCredentials = JSON.parse(fs.readFileSync(this.authPath, 'utf8'));
      } catch (e) {
        // Empty or unreadable
      }
    }

    const credCount = Object.keys(localCredentials).length;
    providers.push({
      id: 'opencode',
      name: 'OpenCode Free Models & Zen',
      configured: true,
      credentialsCount: credCount,
      status: 'ACTIVE'
    });

    // Gemini via Antigravity session
    providers.push({
      id: 'gemini',
      name: 'Google Gemini (via Antigravity Host Bridge)',
      configured: true,
      credentialsCount: 1,
      status: 'ACTIVE'
    });

    // Local AI is disabled due to hardware limits (8 GB RAM / 4 cores)
    providers.push({
      id: 'local',
      name: 'Local AI (Ollama / LM-Studio)',
      configured: false,
      credentialsCount: 0,
      status: 'DISABLED (RAM Protection: 8GB limit)'
    });

    return providers;
  }
}

export const providerRegistry = new ProviderRegistry();
