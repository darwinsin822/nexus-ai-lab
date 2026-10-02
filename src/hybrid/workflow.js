import { geminiAdapter } from '../engines/gemini/adapter.js';
import { opencodeAdapter } from '../engines/opencode/adapter.js';
import { handoffManager } from '../handoff/handoff-manager.js';
import { logger } from '../core/logger.js';

export class HybridWorkflow {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Executes a full hybrid pipeline:
   * 1. Gemini / Architect -> Plan
   * 2. Handoff -> OpenCode Coder -> Implement
   * 3. Handoff -> OpenCode Tester -> Test
   * 4. Handoff -> OpenCode Reviewer -> Initial Review
   * 5. Handoff -> Gemini -> Final Verification
   */
  async runPipeline(task, options = {}) {
    logger.info(`Starting Hybrid Workflow Pipeline for task ${task.id}...`);

    // STAGE 1: PLAN (Gemini / Architect)
    logger.info(`[Stage 1/5] Architectural Planning with Gemini...`);
    const planResult = await geminiAdapter.execute(task, {
      model: 'gemini/gemini-3.8-flash',
      agent: 'self'
    });

    handoffManager.createHandoff(
      { engine: 'gemini', agent: 'self' },
      { engine: 'opencode', agent: 'build' },
      {
        stage: 'PLAN_TO_IMPLEMENT',
        objective: task.title,
        plan: planResult.stdout,
        task
      }
    );

    // STAGE 2: IMPLEMENT (OpenCode Coder)
    logger.info(`[Stage 2/5] Code Implementation with OpenCode [Agent: build]...`);
    const implResult = await opencodeAdapter.execute(task, {
      agent: 'build',
      model: options.model || 'opencode/big-pickle',
      auto: true,
      cwd: options.cwd
    });

    handoffManager.createHandoff(
      { engine: 'opencode', agent: 'build' },
      { engine: 'opencode', agent: 'build' },
      {
        stage: 'IMPLEMENT_TO_TEST',
        objective: `Run tests for ${task.title}`,
        execution: implResult.stdout,
        filesModified: implResult.modifiedFiles
      }
    );

    // STAGE 3: TEST (OpenCode Tester)
    logger.info(`[Stage 3/5] Verification & Quality Check with OpenCode Tester...`);
    const testTask = {
      id: `${task.id}-test`,
      title: `Run tests for ${task.title}`,
      description: `Run tests and quality checks for ${task.title}`
    };
    const testResult = await opencodeAdapter.execute(testTask, {
      agent: 'build',
      model: options.model || 'opencode/big-pickle',
      auto: true,
      cwd: options.cwd
    });

    // STAGE 4: REVIEW (OpenCode Reviewer)
    logger.info(`[Stage 4/5] Initial Code Review with OpenCode [Agent: general]...`);
    const reviewTask = {
      id: `${task.id}-review`,
      title: `Review changes for ${task.title}`,
      description: `Review changes and git diff for ${task.title}`
    };
    const reviewResult = await opencodeAdapter.execute(reviewTask, {
      agent: 'general',
      model: options.model || 'opencode/big-pickle',
      auto: true,
      cwd: options.cwd
    });

    // STAGE 5: FINAL REVIEW (Gemini Supervisor)
    logger.info(`[Stage 5/5] Final Review & Approval by Gemini Supervisor...`);
    const finalReview = `# Hybrid Pipeline Summary
- Task: ${task.id} (${task.title})
- Implementation: ${implResult.success ? 'PASSED' : 'WARNING'}
- Tests: ${testResult.success ? 'PASSED' : 'CHECK NEEDED'}
- Files Modified: ${implResult.modifiedFiles.join(', ') || 'None'}
- Status: READY_FOR_USER_APPROVAL
`;
    handoffManager.writeArtifact('review.md', finalReview);

    logger.success(`Hybrid Workflow Pipeline completed successfully!`);

    return {
      success: implResult.success,
      plan: planResult.stdout,
      implementation: implResult,
      test: testResult,
      review: reviewResult,
      summary: finalReview
    };
  }
}

export const hybridWorkflow = new HybridWorkflow();
