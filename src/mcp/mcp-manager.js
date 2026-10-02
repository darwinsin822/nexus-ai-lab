import fs from 'node:fs';
import path from 'node:path';
import { findNexusRoot } from '../core/config.js';

export class MCPManager {
  constructor(options = {}) {
    this.root = options.root || findNexusRoot();
    this.globalConfig = path.join(process.env.HOME || '/home/darwinsin', '.gemini', 'config', 'mcp_config.json');
    this.antigravityMcpDir = path.join(process.env.HOME || '/home/darwinsin', '.gemini', 'antigravity', 'mcp');
  }

  detectServers() {
    const servers = [];

    // 1. Read global mcp_config.json
    if (fs.existsSync(this.globalConfig)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.globalConfig, 'utf8'));
        if (data.mcpServers) {
          for (const [name, cfg] of Object.entries(data.mcpServers)) {
            servers.push({
              name,
              command: cfg.command,
              args: cfg.args || [],
              source: 'gemini-config'
            });
          }
        }
      } catch (e) {}
    }

    // 2. Read Antigravity MCP directory
    if (fs.existsSync(this.antigravityMcpDir)) {
      try {
        const dirs = fs.readdirSync(this.antigravityMcpDir);
        for (const d of dirs) {
          const full = path.join(this.antigravityMcpDir, d);
          if (fs.statSync(full).isDirectory()) {
            if (!servers.some(s => s.name === d)) {
              servers.push({
                name: d,
                source: 'antigravity-mcp',
                path: full
              });
            }
          }
        }
      } catch (e) {}
    }

    return servers;
  }
}

export const mcpManager = new MCPManager();
