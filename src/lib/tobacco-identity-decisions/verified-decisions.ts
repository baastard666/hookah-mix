import { createTobaccoIdentityDecisionRegistry } from "./decision-registry";
import { LEGACY_CANONICAL_PRODUCT_ID_ALIASES } from "./legacy-canonical-product-id-aliases";
import { P0_IDENTITY_DECISIONS_BATCH_1 } from "./p0-decisions-batch-1";
import { P0_IDENTITY_DECISIONS_BATCH_2 } from "./p0-decisions-batch-2";
import { P0_IDENTITY_DECISIONS_BATCH_3 } from "./p0-decisions-batch-3";
import { P0_IDENTITY_DECISIONS_BATCH_4 } from "./p0-decisions-batch-4";
import { P1_IDENTITY_DECISIONS_BATCH_1 } from "./p1-decisions-batch-1";
import type { TobaccoIdentityDecision } from "./types";

export const TOBACCO_IDENTITY_DECISIONS: readonly TobaccoIdentityDecision[] = Object.freeze([
  ...P1_IDENTITY_DECISIONS_BATCH_1,
  ...P0_IDENTITY_DECISIONS_BATCH_1,
  ...P0_IDENTITY_DECISIONS_BATCH_2,
  ...P0_IDENTITY_DECISIONS_BATCH_3,
  ...P0_IDENTITY_DECISIONS_BATCH_4,
]);

export const TOBACCO_IDENTITY_DECISION_REGISTRY = createTobaccoIdentityDecisionRegistry(TOBACCO_IDENTITY_DECISIONS, LEGACY_CANONICAL_PRODUCT_ID_ALIASES);
