export const TASK_CATEGORIES = [
  'CODE',
  'DEBUG',
  'TEST',
  'REFACTOR',
  'PLANNING',
  'ARCHITECTURE',
  'RESEARCH',
  'DOCUMENTATION',
  'SECURITY',
  'DEVOPS',
  'DATABASE',
  'UI',
  'GENERAL'
];

export class TaskClassifier {
  /**
   * Classifies task prompt into a standard category and estimated complexity
   */
  classify(prompt = '') {
    const text = prompt.toLowerCase();

    // Architecture / High Complexity
    if (
      text.includes('arquitectura') ||
      text.includes('architecture') ||
      text.includes('diseña el sistema') ||
      text.includes('system design') ||
      text.includes('diseña la arquitectura') ||
      text.includes('patrón de diseño')
    ) {
      return {
        category: 'ARCHITECTURE',
        complexity: 'HIGH',
        profile: 'ARCHITECT',
        risk: 'MEDIUM'
      };
    }

    // Planning / Task breakdown
    if (
      text.includes('planifica') ||
      text.includes('plan ') ||
      text.startsWith('plan') ||
      text.includes('roadmap') ||
      text.includes('plan de trabajo') ||
      text.includes('desglose de tareas') ||
      text.includes('planea')
    ) {
      return {
        category: 'PLANNING',
        complexity: 'MEDIUM',
        profile: 'PLANNER',
        risk: 'LOW'
      };
    }

    // Debugging / Errors
    if (
      text.includes('error') ||
      text.includes('bug') ||
      text.includes('corrige') ||
      text.includes('fix') ||
      text.includes('debug') ||
      text.includes('falla') ||
      text.includes('crash') ||
      text.includes('exception')
    ) {
      return {
        category: 'DEBUG',
        complexity: 'MEDIUM',
        profile: 'DEBUGGER',
        risk: 'LOW'
      };
    }

    // Testing
    if (
      text.includes('test') ||
      text.includes('prueba') ||
      text.includes('qa') ||
      text.includes('tdd') ||
      text.includes('unit test') ||
      text.includes('cobertura') ||
      text.includes('assert')
    ) {
      return {
        category: 'TEST',
        complexity: 'LOW',
        profile: 'TESTER',
        risk: 'LOW'
      };
    }

    // Security
    if (
      text.includes('seguridad') ||
      text.includes('security') ||
      text.includes('vulnerab') ||
      text.includes('sanitiz') ||
      text.includes('malware') ||
      text.includes('auth') ||
      text.includes('cifrado')
    ) {
      return {
        category: 'SECURITY',
        complexity: 'HIGH',
        profile: 'SECURITY',
        risk: 'HIGH'
      };
    }

    // UI / Frontend
    if (
      text.includes('interfaz') ||
      text.includes('ui') ||
      text.includes('ux') ||
      text.includes('css') ||
      text.includes('layout') ||
      text.includes('frontend') ||
      text.includes('componente visual') ||
      text.includes('pantalla')
    ) {
      return {
        category: 'UI',
        complexity: 'MEDIUM',
        profile: 'FRONTEND',
        risk: 'LOW'
      };
    }

    // Database
    if (
      text.includes('database') ||
      text.includes('base de datos') ||
      text.includes('sql') ||
      text.includes('migración') ||
      text.includes('sqlite') ||
      text.includes('postgres') ||
      text.includes('schema')
    ) {
      return {
        category: 'DATABASE',
        complexity: 'MEDIUM',
        profile: 'DATABASE',
        risk: 'MEDIUM'
      };
    }

    // Documentation
    if (
      text.includes('document') ||
      text.includes('readme') ||
      text.includes('comenta') ||
      text.includes('docstring') ||
      text.includes('manual')
    ) {
      return {
        category: 'DOCUMENTATION',
        complexity: 'LOW',
        profile: 'DOCUMENTATION',
        risk: 'LOW'
      };
    }

    // Research
    if (
      text.includes('investiga') ||
      text.includes('research') ||
      text.includes('busca información') ||
      text.includes('compara librerías') ||
      text.includes('indaga')
    ) {
      return {
        category: 'RESEARCH',
        complexity: 'MEDIUM',
        profile: 'RESEARCHER',
        risk: 'LOW'
      };
    }

    // Refactor
    if (
      text.includes('refactor') ||
      text.includes('reorganiza') ||
      text.includes('limpia el código') ||
      text.includes('modulariza')
    ) {
      return {
        category: 'REFACTOR',
        complexity: 'MEDIUM',
        profile: 'CODER',
        risk: 'MEDIUM'
      };
    }

    // DevOps
    if (
      text.includes('docker') ||
      text.includes('ci/cd') ||
      text.includes('pipeline') ||
      text.includes('deploy') ||
      text.includes('despliegue') ||
      text.includes('devops')
    ) {
      return {
        category: 'DEVOPS',
        complexity: 'MEDIUM',
        profile: 'DEVOPS',
        risk: 'MEDIUM'
      };
    }

    // Default Code
    if (
      text.includes('crea') ||
      text.includes('implementa') ||
      text.includes('escribe') ||
      text.includes('función') ||
      text.includes('código') ||
      text.includes('clase')
    ) {
      return {
        category: 'CODE',
        complexity: 'LOW',
        profile: 'CODER',
        risk: 'LOW'
      };
    }

    return {
      category: 'GENERAL',
      complexity: 'LOW',
      profile: 'CODER',
      risk: 'LOW'
    };
  }
}

export const taskClassifier = new TaskClassifier();
