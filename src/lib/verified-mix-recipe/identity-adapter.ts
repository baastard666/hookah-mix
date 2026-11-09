import { deepCloneAndFreeze } from "../expert-mix-knowledge/normalizer";
import type { ExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import type { NormalizedMixComponentStagingRecord } from "../expert-mix-knowledge-import";
import type { TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";

// The importer remains the source of expert knowledge. This adapter only overlays a confirmed,
// exact decision onto the matching imported component; it never guesses an identity.
export const applyIdentityDecisionsToExpertMixKnowledge = (
  records: readonly ExpertMixKnowledgeRecord[],
  stagingComponents: readonly NormalizedMixComponentStagingRecord[],
  decisions: TobaccoIdentityDecisionRegistry,
): readonly ExpertMixKnowledgeRecord[] => {
  const stagingById = new Map(stagingComponents.map(component => [component.componentId, component]));
  return deepCloneAndFreeze(records.map(record => ({
    ...record,
    components: record.components.map(component => {
      const staged = stagingById.get(component.componentId);
      if (!staged) return component;
      const lookup = decisions.getBySourceIdentity(staged.manufacturer, staged.productLine, staged.productName);
      if (lookup.status !== "FOUND") return component;
      const decision = lookup.decision.decision;
      if (decision.status === "RESOLVED" && decision.canonicalProductId && decision.manufacturerId && decision.canonicalProductName) {
        return {
          ...component,
          identityStatus: "RESOLVED" as const,
          canonicalProductId: decision.canonicalProductId,
          manufacturerId: decision.manufacturerId,
          ...(decision.productLineId ? { productLineId: decision.productLineId } : {}),
          canonicalProductName: decision.canonicalProductName,
        };
      }
      if (decision.status === "MANUFACTURER_ONLY" || decision.status === "UNRESOLVED" || decision.status === "AMBIGUOUS") {
        const { canonicalProductId: _canonicalProductId, canonicalProductName: _canonicalProductName, ...withoutCanonical } = component;
        void _canonicalProductId; void _canonicalProductName;
        return { ...withoutCanonical, identityStatus: decision.status };
      }
      return component;
    }),
  })) as readonly ExpertMixKnowledgeRecord[]);
};
