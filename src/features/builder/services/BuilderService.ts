import type { BuilderStep } from '@/shared/types/domain';

import {
  builderCapabilityAuditBaseline,
  builderInitialState,
  builderInitialStep,
  builderStepOrder,
  builderStepResponsibilities,
  createEmptyBuilderDraftPayload,
  summarizeBuilderIssues,
} from '@/features/builder/types';

export class BuilderService {
  readonly steps: readonly BuilderStep[] = builderStepOrder;
  readonly initialStep = builderInitialStep;
  readonly initialState = builderInitialState;
  readonly capabilityAudit = builderCapabilityAuditBaseline;
  readonly stepResponsibilities = builderStepResponsibilities;

  getNextStep(step: BuilderStep) {
    const stepIndex = this.steps.indexOf(step);
    return stepIndex >= 0 && stepIndex < this.steps.length - 1 ? this.steps[stepIndex + 1] : null;
  }

  getPreviousStep(step: BuilderStep) {
    const stepIndex = this.steps.indexOf(step);
    return stepIndex > 0 ? this.steps[stepIndex - 1] : null;
  }

  createEmptyDraftPayload(characterName: string) {
    return createEmptyBuilderDraftPayload(characterName);
  }

  summarizeIssues(issues: Parameters<typeof summarizeBuilderIssues>[0]) {
    return summarizeBuilderIssues(issues);
  }

  canComplete(issues: Parameters<typeof summarizeBuilderIssues>[0]) {
    return this.summarizeIssues(issues).canComplete;
  }
}
