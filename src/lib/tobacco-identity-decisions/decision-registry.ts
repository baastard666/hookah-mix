import { TobaccoIdentityDecisionError } from "./errors";
import { auditTobaccoIdentityDecisions } from "./decision-audit";
import { createSourceIdentityKey, deepFreezeClone } from "./normalization";
import type { TobaccoIdentityDecision, TobaccoIdentityDecisionRegistry, TobaccoIdentityDecisionStatus, TobaccoIdentityLookup } from "./types";

const found = (decision: Readonly<TobaccoIdentityDecision> | undefined): TobaccoIdentityLookup => decision ? { status: "FOUND", decision } : { status: "NOT_FOUND" };
export const validateTobaccoIdentityDecisionRegistry = (decisions: readonly TobaccoIdentityDecision[]) => auditTobaccoIdentityDecisions(decisions);
export const createTobaccoIdentityDecisionRegistry = (source: readonly TobaccoIdentityDecision[]): TobaccoIdentityDecisionRegistry => {
  const issues = auditTobaccoIdentityDecisions(source);
  const errors = issues.filter(issue => issue.severity === "ERROR");
  if (errors.length) throw new TobaccoIdentityDecisionError("Identity decision registry is invalid.", errors);
  const decisions = deepFreezeClone([...source]) as readonly Readonly<TobaccoIdentityDecision>[];
  const byId = new Map(decisions.map(decision => [decision.id, decision]));
  const byGroup = new Map(decisions.map(decision => [decision.sourceIdentity.sourceGroupId, decision]));
  const bySource = new Map(decisions.map(decision => [createSourceIdentityKey(decision.sourceIdentity.manufacturer, decision.sourceIdentity.productLine, decision.sourceIdentity.productName), decision]));
  const byCanonical = new Map(decisions.filter(decision => decision.decision.canonicalProductId).map(decision => [decision.decision.canonicalProductId!, decision]));
  const registry: TobaccoIdentityDecisionRegistry = {
    version: "tobacco-identity-decision-registry-v1", size: decisions.length,
    list: () => decisions,
    getById: id => found(byId.get(id)),
    getBySourceGroupId: groupId => found(byGroup.get(groupId)),
    getBySourceIdentity: (manufacturer, productLine, productName) => found(bySource.get(createSourceIdentityKey(manufacturer, productLine, productName))),
    getByCanonicalProductId: canonicalProductId => found(byCanonical.get(canonicalProductId)),
    getByStatus: (status: TobaccoIdentityDecisionStatus) => Object.freeze(decisions.filter(decision => decision.decision.status === status)),
  };
  return Object.freeze(registry);
};
export const getTobaccoIdentityDecision = (registry: TobaccoIdentityDecisionRegistry, input: { readonly sourceGroupId?: string; readonly manufacturer?: string | null; readonly productLine?: string | null; readonly productName?: string | null }): TobaccoIdentityLookup => input.sourceGroupId ? registry.getBySourceGroupId(input.sourceGroupId) : registry.getBySourceIdentity(input.manufacturer ?? null, input.productLine ?? null, input.productName ?? null);
export const serializeTobaccoIdentityDecisionRegistry = (registry: TobaccoIdentityDecisionRegistry): string => JSON.stringify({ version: registry.version, decisions: registry.list().map(decision => ({ ...decision, review: { ...decision.review, reviewedAt: null }, metadata: { ...decision.metadata, createdAt: null, updatedAt: null } })) }, null, 2);
