/**
 * Gemini Budget Guard
 * Enforces strict protection against unnecessary consumption of Gemini credits
 */
export class GeminiBudgetGuard {
  /**
   * Determines if Gemini is legitimately justified or if it should be blocked and routed to OpenCode
   */
  evaluate(task, category, complexity, mode = 'ECONOMY') {
    const text = (task.description || task.title || '').toLowerCase();

    // 1. Mechanical, repetitive, or basic operations -> STRICTLY PROHIBITED FOR GEMINI
    const prohibitedPatterns = [
      'formatear código', 'format code', 'prettier', 'eslint',
      'renombrar variable', 'rename variable',
      'crear archivo simple', 'touch file', 'boilerplate simple',
      'ejecutar test', 'run tests', 'corre los tests',
      'operación mecánica', 'búsqueda simple'
    ];

    for (const pattern of prohibitedPatterns) {
      if (text.includes(pattern)) {
        return {
          allowed: false,
          reason: `Gemini Budget Guard: '${pattern}' es una tarea mecánica/rutinaria. Se delega a OpenCode para preservar créditos de Gemini.`
        };
      }
    }

    // 2. DOCUMENTACIÓN -> DELEGADA A OPENCODE (Agente "general" o "build" con coste 0)
    if (
      category === 'DOCUMENTATION' ||
      text.includes('documenta') ||
      text.includes('readme') ||
      text.includes('manual') ||
      text.includes('docstring') ||
      text.includes('comenta el código') ||
      text.includes('guía de uso')
    ) {
      return {
        allowed: false,
        reason: 'Gemini Budget Guard: La documentación se realiza eficientemente con OpenCode (agente "general" / modelos libres) a coste 0.'
      };
    }

    // 3. PLANIFICACIÓN -> DELEGADA A OPENCODE (Agente nativo "plan")
    // OpenCode cuenta con un agente nativo 'plan' ideal para desglosar tareas sin consumir créditos.
    if (
      category === 'PLANNING' ||
      text.includes('planifica') ||
      text.includes('plan ') ||
      text.startsWith('plan') ||
      text.includes('roadmap') ||
      text.includes('plan de trabajo') ||
      text.includes('desglose de tareas')
    ) {
      if (mode !== 'PREMIUM') {
        return {
          allowed: false,
          reason: 'Gemini Budget Guard: La planificación se realiza con OpenCode mediante su agente nativo "plan", preservando créditos.'
        };
      }
    }

    // 4. Escalación o Modo PREMIUM explícito -> JUSTIFICADO para Gemini
    if (task.escalated) {
      return {
        allowed: true,
        reason: 'Gemini justificado: Tarea escalada tras fallos reiterados en OpenCode (Regla de Fallback).'
      };
    }

    if (mode === 'PREMIUM') {
      return {
        allowed: true,
        reason: 'Gemini justificado: Modo PREMIUM solicitado explícitamente por el usuario.'
      };
    }

    // 5. Arquitectura de alta complejidad estructural (solo en modo BALANCED o con justificación crítica)
    if ((category === 'ARCHITECTURE' || complexity === 'HIGH') && mode !== 'ECONOMY') {
      return {
        allowed: true,
        reason: 'Gemini justificado: Razonamiento arquitectónico complejo de alto impacto.'
      };
    }

    // 6. Por defecto en ECONOMY/BALANCED -> OpenCode
    return {
      allowed: false,
      reason: 'Gemini Budget Guard: Código, debugging, pruebas, planificación o documentación delegadas a OpenCode a coste 0.'
    };
  }
}

export const budgetGuard = new GeminiBudgetGuard();
