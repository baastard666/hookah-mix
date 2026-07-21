import { createTobaccoIdentityDecisionRegistry } from "./decision-registry";
import { P0_IDENTITY_DECISIONS_BATCH_1 } from "./p0-decisions-batch-1";
import { P1_IDENTITY_DECISIONS_BATCH_1 } from "./p1-decisions-batch-1";
import type { TobaccoIdentityDecision } from "./types";

export const TOBACCO_IDENTITY_DECISIONS: readonly TobaccoIdentityDecision[] = Object.freeze([
  ...P1_IDENTITY_DECISIONS_BATCH_1,
  ...P0_IDENTITY_DECISIONS_BATCH_1,
]);

export const TOBACCO_IDENTITY_DECISION_REGISTRY = createTobaccoIdentityDecisionRegistry(TOBACCO_IDENTITY_DECISIONS);
