import { getManufacturerProfile } from "../tobacco-profile";
import { resolveCatalogTobaccoIdentity } from "../tobacco-product-identity";
import { normalizeDecisionText, TOBACCO_IDENTITY_DECISION_REGISTRY, validateTobaccoIdentityDecision } from "../tobacco-identity-decisions";
import type { TobaccoIdentityDecision, TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import type { CanonicalMixComponentInput, MixComponentResolution, MixComponentResolutionConfidence } from "./types";

const confidenceRank: Readonly<Record<MixComponentResolutionConfidence, number>> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const decisionConfidence = (decision: Readonly<TobaccoIdentityDecision>): MixComponentResolutionConfidence =>
  decision.evidence.reduce<MixComponentResolutionConfidence>((best, item) => confidenceRank[item.confidence] > confidenceRank[best] ? item.confidence : best, "LOW");

const sourceId = (component: CanonicalMixComponentInput): string => component.identity?.sourceComponentId?.trim() || String(component.flavorId);
const base = (component: CanonicalMixComponentInput) => {
  const rawIdentity = {
    manufacturer: component.identity?.rawManufacturer?.trim() || component.brandName?.trim() || null,
    productLine: component.identity?.rawProductLine?.trim() || null,
    productName: component.identity?.rawProductName?.trim() || component.flavorName?.trim() || null,
  };
  return {
    sourceComponentId: sourceId(component), percentage: component.percentage, rawIdentity,
    normalizedIdentity: {
      manufacturer: component.identity?.normalizedManufacturer?.trim() || normalizeDecisionText(rawIdentity.manufacturer),
      productLine: component.identity?.normalizedProductLine?.trim() || normalizeDecisionText(rawIdentity.productLine),
      productName: component.identity?.normalizedProductName?.trim() || normalizeDecisionText(rawIdentity.productName),
    },
    sourceRow: component.identity?.sourceRow ?? null,
  };
};

const fromDecision = (component: CanonicalMixComponentInput, decision: Readonly<TobaccoIdentityDecision>, method: MixComponentResolution["resolution"]["matchMethod"], matchedAlias: string | null): MixComponentResolution => {
  const common = base(component); const value = decision.decision; const confidence = decisionConfidence(decision);
  const status = value.status === "REJECTED" ? "UNRESOLVED" : value.status;
  return {
    ...common,
    resolution: {
      status,
      decisionId: decision.id,
      canonicalProductId: status === "RESOLVED" ? value.canonicalProductId : null,
      canonicalManufacturer: value.canonicalManufacturerName,
      canonicalProductLine: status === "RESOLVED" ? value.canonicalProductLineName : null,
      canonicalProductName: status === "RESOLVED" ? value.canonicalProductName : null,
      matchedAlias,
      matchMethod: status === "MANUFACTURER_ONLY" ? "MANUFACTURER_ONLY" : method,
      confidence,
    },
    debugReasons: status === "RESOLVED" ? ["AUTHORITATIVE_DECISION_APPLIED"] : [`AUTHORITATIVE_${value.status}_DECISION_PRESERVED`],
  };
};

const aliasCandidates = (component: CanonicalMixComponentInput, registry: TobaccoIdentityDecisionRegistry): readonly { readonly decision: Readonly<TobaccoIdentityDecision>; readonly alias: string }[] => {
  const item = base(component); const manufacturer = item.normalizedIdentity.manufacturer; const line = item.normalizedIdentity.productLine; const name = item.normalizedIdentity.productName;
  return registry.list().flatMap(decision => {
    if (decision.decision.status !== "RESOLVED" || !validateTobaccoIdentityDecision(decision).applicable) return [];
    const manufacturerNames = [decision.sourceIdentity.manufacturer, decision.decision.canonicalManufacturerName].map(normalizeDecisionText);
    const manufacturerProfile = item.rawIdentity.manufacturer ? getManufacturerProfile(item.rawIdentity.manufacturer) : null;
    const manufacturerMatches = manufacturerNames.includes(manufacturer) || Boolean(manufacturerProfile && manufacturerProfile.manufacturerId === decision.decision.manufacturerId);
    if (!manufacturerMatches) return [];
    const lineNames = [decision.sourceIdentity.productLine, decision.decision.canonicalProductLineName].map(normalizeDecisionText).filter(Boolean);
    if (line && !lineNames.includes(line)) return [];
    const alias = decision.decision.aliases.find(value => normalizeDecisionText(value) === name);
    return alias ? [{ decision, alias }] : [];
  });
};

export const resolveMixComponentIdentity = (component: CanonicalMixComponentInput, registry: TobaccoIdentityDecisionRegistry = TOBACCO_IDENTITY_DECISION_REGISTRY): MixComponentResolution => {
  const common = base(component);
  const exact = registry.getBySourceIdentity(common.rawIdentity.manufacturer, common.rawIdentity.productLine, common.rawIdentity.productName);
  if (exact.status === "FOUND") return fromDecision(component, exact.decision, "EXACT_SOURCE_IDENTITY", null);

  const explicitCanonicalId = component.identity?.canonicalProductId?.trim();
  if (explicitCanonicalId) {
    const canonical = registry.getByCanonicalProductId(explicitCanonicalId);
    if (canonical.status === "FOUND" && canonical.decision.decision.status === "RESOLVED") return fromDecision(component, canonical.decision, "CANONICAL_ID", null);
  }

  const aliases = aliasCandidates(component, registry);
  if (aliases.length === 1) return fromDecision(component, aliases[0].decision, "EXACT_ALIAS", aliases[0].alias);
  if (aliases.length > 1) return { ...common, resolution: { status: "AMBIGUOUS", decisionId: null, canonicalProductId: null, canonicalManufacturer: common.rawIdentity.manufacturer, canonicalProductLine: null, canonicalProductName: null, matchedAlias: null, matchMethod: "NONE", confidence: "LOW" }, debugReasons: ["MULTIPLE_EXACT_ALIAS_CANDIDATES"] };

  const technical = resolveCatalogTobaccoIdentity({ brand: common.rawIdentity.manufacturer, productLine: common.rawIdentity.productLine, name: common.rawIdentity.productName });
  if (technical.status === "AMBIGUOUS") return { ...common, resolution: { status: "AMBIGUOUS", decisionId: null, canonicalProductId: null, canonicalManufacturer: common.rawIdentity.manufacturer, canonicalProductLine: null, canonicalProductName: null, matchedAlias: null, matchMethod: "NONE", confidence: "LOW" }, debugReasons: ["TECHNICAL_DIRECTORY_AMBIGUOUS"] };
  if (technical.status === "MANUFACTURER_ONLY" || technical.status === "RESOLVED") return { ...common, resolution: { status: "MANUFACTURER_ONLY", decisionId: null, canonicalProductId: null, canonicalManufacturer: technical.manufacturer, canonicalProductLine: null, canonicalProductName: null, matchedAlias: null, matchMethod: "MANUFACTURER_ONLY", confidence: technical.confidence }, debugReasons: ["MANUFACTURER_CONFIRMED_WITHOUT_AUTHORITATIVE_PRODUCT"] };
  return { ...common, resolution: { status: "UNRESOLVED", decisionId: null, canonicalProductId: null, canonicalManufacturer: null, canonicalProductLine: null, canonicalProductName: null, matchedAlias: null, matchMethod: "NONE", confidence: "LOW" }, debugReasons: ["AUTHORITATIVE_IDENTITY_NOT_FOUND"] };
};
