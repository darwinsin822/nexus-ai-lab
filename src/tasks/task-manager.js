import fs from 'node:fs';
import path from 'node:path';
import { findNexusRoot } from '../core/config.js';
import { taskClassifier } from './classifier.js';

export const TASK_STATUS = [
  'PENDING',
  'PLANNING',
  'RUNNING',
  'WAITING',
  'REVIEW',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
];

export class TaskManager {
  constructor(options = {}) {
    this.root = options.root || findNexusRoot();
    this.tasksDir = path.join(this.root, '.nexus', 'tasks');
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.tasksDir)) {
      try {
        fs.mkdirSync(this.tasksDir, { recursive: true });
      } catch (e) {}
    }
  }

  getNextTaskId() {
    this.ensureDir();
    let max = 0;
    try {
      const files = fs.readdirSync(this.tasksDir);
      for (const f of files) {
        const match = f.match(/^task-(\d+)\.json$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > max) max = num;
        }
      }
    } catch (e) {}
    return `task-${String(max + 1).padStart(4, '0')}`;
  }

  createTask(title, description = '', meta = {}) {
    this.ensureDir();
    const id = meta.id || this.getNextTaskId();
    const classification = taskClassifier.classify(description || title);

    const task = {
      id,
      title,
      description: description || title,
      status: 'PENDING',
      priority: meta.priority || 'NORMAL',
      category: classification.category,
      profile: classification.profile,
      engine: meta.engine || null,       // Determined by AI Router if null
      agent: meta.agent || null,
      model: meta.model || null,
      mode: meta.mode || 'ECONOMY',
      risk: classification.risk,
      complexity: classification.complexity,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      files: meta.files || [],
      dependencies: meta.dependencies || [],
      result: null,
      errors: [],
      durationMs: 0
    };

    this.saveTask(task);
    return task;
  }

  saveTask(task) {
    this.ensureDir();
    task.updated = new Date().toISOString();
    const filePath = path.join(this.tasksDir, `${task.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(task, null, 2), 'utf8');
    return task;
  }

  getTask(id) {
    this.ensureDir();
    const cleanId = id.endsWith('.json') ? id : `${id}.json`;
    const filePath = path.join(this.tasksDir, cleanId);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  updateTaskStatus(id, status, extra = {}) {
    const task = this.getTask(id);
    if (!task) throw new Error(`Task ${id} not found`);

    if (!TASK_STATUS.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    task.status = status;
    Object.assign(task, extra);
    return this.saveTask(task);
  }

  listTasks(filter = {}) {
    this.ensureDir();
    const list = [];
    try {
      const files = fs.readdirSync(this.tasksDir);
      for (const f of files) {
        if (f.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(this.tasksDir, f), 'utf8'));
            if (filter.status && data.status !== filter.status) continue;
            if (filter.engine && data.engine !== filter.engine) continue;
            list.push(data);
          } catch (e) {}
        }
      }
    } catch (e) {}

    // Sort by creation time descending
    return list.sort((a, b) => new Date(b.created) - new Date(a.created));
  }
}

export const taskManager = new TaskManager();
