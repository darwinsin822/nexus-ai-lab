import fs from 'node:fs';
import path from 'node:path';
import { findNexusRoot } from '../core/config.js';

export class SkillsLoader {
  constructor(options = {}) {
    this.root = options.root || findNexusRoot();
    this.localSkillsDir = path.join(this.root, 'skills');
    this.globalSkillsDir = path.join(process.env.HOME || '/home/darwinsin', '.gemini', 'config', 'skills');
  }

  listSkills() {
    const skills = [];

    // 1. Scan project-local skills
    if (fs.existsSync(this.localSkillsDir)) {
      try {
        const dirs = fs.readdirSync(this.localSkillsDir);
        for (const dir of dirs) {
          const skillFile = path.join(this.localSkillsDir, dir, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            skills.push({
              name: dir,
              scope: 'project',
              path: skillFile
            });
          }
        }
      } catch (e) {}
    }

    // 2. Scan global ecosystem skills
    if (fs.existsSync(this.globalSkillsDir)) {
      try {
        const dirs = fs.readdirSync(this.globalSkillsDir);
        for (const dir of dirs) {
          const skillFile = path.join(this.globalSkillsDir, dir, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            // Avoid duplicate if overridden locally
            if (!skills.some(s => s.name === dir)) {
              skills.push({
                name: dir,
                scope: 'global',
                path: skillFile
              });
            }
          }
        }
      } catch (e) {}
    }

    return skills;
  }

  loadSkill(name) {
    const all = this.listSkills();
    const found = all.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!found) return null;

    try {
      const content = fs.readFileSync(found.path, 'utf8');
      return {
        ...found,
        content
      };
    } catch (e) {
      return null;
    }
  }
}

export const skillsLoader = new SkillsLoader();
