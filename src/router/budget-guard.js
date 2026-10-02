/**
 * Gemini Budget Guard
 * Enforces strict protection against unnecessary consumption of Gemini credits
 */
export class GeminiBudgetGuard {
  /**
   * Determines if Gemini is legitimately justified or if it should be blocked and routed to OpenCode / Local AI
   */
  evaluate(task, category, complexity) {
    const text = (task.description || task.title || '').toLowerCase();

    // 1. Mechanical, repetitive, or basic operations -> STRICTLY PROHIBITED FOR GEMINI
    const prohibitedPatterns = [
      'formatear código', 'format code', 'prettier', 'eslint',
      'renombrar variable', 'rename variable',
      'crear archivo simple', 'touch file', 'boilerplate simple',
      'ejecutar test', 'run tests', 'corre los tests',
      'documentación básica', 'comenta el código',
      'operación mecánica', 'búsqueda simple'
    ];

    for (const pattern of prohibitedPatterns) {
      if (text.includes(pattern)) {
        return {
          allowed: false,
          reason: `Gemini Budget Guard: '${pattern}' is a mechanical/routine task. Routing to OpenCode to preserve Gemini credits.`
        };
      }
    }

    // 2. High-complexity architectural, deep reasoning, or escalation tasks -> JUSTIFIED
    if (category === 'ARCHITECTURE' || complexity === 'HIGH') {
      return {
        allowed: true,
        reason: 'Gemini justified: High-level architectural reasoning and complex design.'
      };
    }

    if (task.escalated) {
      return {
        allowed: true,
        reason: 'Gemini justified: Task escalated after previous engine retries failed.'
      };
    }

    // 3. By default in ECONOMY / BALANCED, routine coding belongs to OpenCode
    return {
      allowed: false,
      reason: 'Gemini Budget Guard: Routine code, debugging, or test implementation can be fulfilled by OpenCode at zero or minimal cost.'
    };
  }
}

export const budgetGuard = new GeminiBudgetGuard();
