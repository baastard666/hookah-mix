import type { ExpertMixImportResult, UnresolvedIdentityReport } from "../expert-mix-knowledge-import";
import { createSourceIdentityKey, deepFreezeClone } from "./normalization";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityReviewPlan, TobaccoIdentitySourcePriority } from "./types";

export const adaptExpertMixImportForIdentityDecisions = (imported: ExpertMixImportResult, unresolvedReport: UnresolvedIdentityReport, reviewPlan: TobaccoIdentityReviewPlan): readonly DecisionApplicableIdentityRecord[] => {
  const priorityByIdentity = new Map<string, TobaccoIdentitySourcePriority>(unresolvedReport.groups.map(group => [createSourceIdentityKey(group.displayIdentity.manufacturer, group.displayIdentity.productLine, group.displayIdentity.productName), group.priority]));
  const verifiedMixIds = new Set(imported.mixes.filter(mix => mix.status === "VERIFIED").map(mix => mix.mixId));
  const components: DecisionApplicableIdentityRecord[] = imported.components.map(component => ({
    recordId: component.componentId, scope: "COMPONENT", sourcePriority: priorityByIdentity.get(createSourceIdentityKey(component.manufacturer, component.productLine, component.productName)) ?? "P2", usedInVerifiedMix: verifiedMixIds.has(component.mixId),
    manufacturer: component.manufacturer, productLine: component.productLine, productName: component.productName, identityStatus: component.identityStatus,
    manufacturerId: component.manufacturerId, productLineId: component.productLineId, canonicalProductId: component.canonicalProductId, canonicalProductName: component.productName,
    confidence: null, evidenceTypes: [], confirmedDecision: false,
  }));
  const catalog: DecisionApplicableIdentityRecord[] = imported.tobacco.map(item => ({
    recordId: item.stagingId, scope: "CATALOG", sourcePriority: priorityByIdentity.get(createSourceIdentityKey(item.manufacturer, item.productLine, item.productName)) ?? "P3", usedInVerifiedMix: false,
    manufacturer: item.manufacturer, productLine: item.productLine, productName: item.productName, identityStatus: item.identityStatus,
    manufacturerId: item.manufacturerId, productLineId: item.productLineId, canonicalProductId: item.canonicalProductId, canonicalProductName: item.productName,
    confidence: null, evidenceTypes: [], confirmedDecision: false,
  }));
  const userPriority: DecisionApplicableIdentityRecord[] = reviewPlan.userPriority.map(item => ({
    recordId: `user:${item.groupId}`, scope: "USER_PRIORITY", sourcePriority: "USER_PRIORITY", usedInVerifiedMix: item.verifiedMixCount > 0,
    manufacturer: item.manufacturer, productLine: item.productLine, productName: item.productName, identityStatus: item.currentStatus,
    manufacturerId: null, productLineId: null, canonicalProductId: null, canonicalProductName: null, confidence: null, evidenceTypes: [], confirmedDecision: false,
  }));
  return deepFreezeClone([...components, ...catalog, ...userPriority]) as readonly DecisionApplicableIdentityRecord[];
};
