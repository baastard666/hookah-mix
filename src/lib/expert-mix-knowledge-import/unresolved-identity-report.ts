import type { ExpertMixIdentityStatus } from "../expert-mix-knowledge";
import { normalizeTobaccoIdentityText } from "../tobacco-product-identity";
import type { ManufacturerProfile, ProductLineProfile } from "../tobacco-profile";
import type { NormalizedMixComponentStagingRecord, NormalizedMixStagingRecord, NormalizedTobaccoStagingRecord } from "./types";

export type UnresolvedIdentityPriority = "P0" | "P1" | "P2" | "P3";
export type MissingIdentityField = "manufacturer" | "productLine" | "productName";

export type ExactIdentityAliasCandidate = {
  readonly kind: "MANUFACTURER" | "PRODUCT_LINE";
  readonly registryId: string;
  readonly canonicalValue: string;
  readonly matchedAlias: string;
};

export type UnresolvedIdentityGroup = {
  readonly groupId: string;
  readonly normalizedIdentity: {
    readonly manufacturer: string;
    readonly productLine: string;
    readonly productName: string;
  };
  readonly displayIdentity: {
    readonly manufacturer: string | null;
    readonly productLine: string | null;
    readonly productName: string | null;
  };
  readonly occurrenceCount: number;
  readonly componentOccurrenceCount: number;
  readonly catalogOccurrenceCount: number;
  readonly verifiedMixCount: number;
  readonly currentStatus: ExpertMixIdentityStatus;
  readonly observedStatuses: readonly ExpertMixIdentityStatus[];
  readonly manufacturerKnown: boolean;
  readonly productLineKnown: boolean;
  readonly hasExactAliasCandidates: boolean;
  readonly exactAliasCandidates: readonly ExactIdentityAliasCandidate[];
  readonly missingFields: readonly MissingIdentityField[];
  readonly priority: UnresolvedIdentityPriority;
};

export type UnresolvedIdentityReport = {
  readonly reportVersion: "unresolved-identity-report-v1";
  readonly grouping: "exact-normalized-manufacturer-productLine-productName";
  readonly sourceOrder: readonly ["Mix_Components", "ОСНОВНАЯ_БАЗА"];
  readonly statusRule: "component-statuses-first-AMBIGUOUS-UNRESOLVED-MANUFACTURER_ONLY-NOT_CHECKED-RESOLVED";
  readonly registryMatching: "exact-normalized-canonical-or-alias-only";
  readonly fuzzyMatching: false;
  readonly canonicalIdAssignment: false;
  readonly summary: {
    readonly componentRows: number;
    readonly catalogRows: number;
    readonly groupCount: number;
    readonly priorityCounts: Readonly<Record<UnresolvedIdentityPriority, number>>;
  };
  readonly groups: readonly UnresolvedIdentityGroup[];
  readonly priorityList: Readonly<Record<UnresolvedIdentityPriority, readonly string[]>>;
};

export type CreateUnresolvedIdentityReportInput = {
  readonly components: readonly NormalizedMixComponentStagingRecord[];
  readonly catalog: readonly NormalizedTobaccoStagingRecord[];
  readonly mixes: readonly NormalizedMixStagingRecord[];
  readonly manufacturers: readonly Readonly<ManufacturerProfile>[];
  readonly productLines: readonly Readonly<ProductLineProfile>[];
};

type IdentityRecord = Pick<NormalizedMixComponentStagingRecord, "manufacturer" | "productLine" | "productName" | "identityStatus">;
type MutableGroup = {
  readonly displayIdentity: UnresolvedIdentityGroup["displayIdentity"];
  readonly normalizedIdentity: UnresolvedIdentityGroup["normalizedIdentity"];
  readonly componentRecords: { readonly status: ExpertMixIdentityStatus; readonly mixId: string }[];
  readonly catalogStatuses: ExpertMixIdentityStatus[];
  componentOccurrenceCount: number;
  catalogOccurrenceCount: number;
};

const normalize = (value: string | null): string => value?.trim() ? normalizeTobaccoIdentityText(value) : "";
const identity = (record: IdentityRecord): UnresolvedIdentityGroup["normalizedIdentity"] => ({
  manufacturer: normalize(record.manufacturer),
  productLine: normalize(record.productLine),
  productName: normalize(record.productName),
});
const identityKey = (value: UnresolvedIdentityGroup["normalizedIdentity"]): string =>
  JSON.stringify([value.manufacturer, value.productLine, value.productName]);

const statusRank: Readonly<Record<ExpertMixIdentityStatus, number>> = {
  AMBIGUOUS: 0,
  UNRESOLVED: 1,
  MANUFACTURER_ONLY: 2,
  NOT_CHECKED: 3,
  RESOLVED: 4,
};
const orderedStatuses = (statuses: readonly ExpertMixIdentityStatus[]): ExpertMixIdentityStatus[] =>
  [...new Set(statuses)].sort((left, right) => statusRank[left] - statusRank[right]);

const exactAliases = (
  normalizedIdentity: UnresolvedIdentityGroup["normalizedIdentity"],
  manufacturers: readonly Readonly<ManufacturerProfile>[],
  productLines: readonly Readonly<ProductLineProfile>[],
): { manufacturerKnown: boolean; productLineKnown: boolean; candidates: ExactIdentityAliasCandidate[] } => {
  const manufacturerMatches = normalizedIdentity.manufacturer
    ? manufacturers.filter(profile => [profile.manufacturer, ...profile.aliases].some(value => normalize(value) === normalizedIdentity.manufacturer))
    : [];
  const manufacturerIds = new Set(manufacturerMatches.map(profile => profile.manufacturerId));
  const lineMatches = normalizedIdentity.productLine
    ? productLines.filter(profile => manufacturerIds.has(profile.manufacturerId) && [profile.productLine, ...profile.aliases].some(value => normalize(value) === normalizedIdentity.productLine))
    : [];
  const candidates: ExactIdentityAliasCandidate[] = [
    ...manufacturerMatches.flatMap(profile => profile.aliases
      .filter(alias => normalize(alias) === normalizedIdentity.manufacturer)
      .map(alias => ({ kind: "MANUFACTURER" as const, registryId: profile.manufacturerId, canonicalValue: profile.manufacturer, matchedAlias: alias }))),
    ...lineMatches.flatMap(profile => profile.aliases
      .filter(alias => normalize(alias) === normalizedIdentity.productLine)
      .map(alias => ({ kind: "PRODUCT_LINE" as const, registryId: profile.productLineId, canonicalValue: profile.productLine, matchedAlias: alias }))),
  ].sort((left, right) => `${left.kind}:${left.registryId}:${left.matchedAlias}`.localeCompare(`${right.kind}:${right.registryId}:${right.matchedAlias}`, "ru"));
  return { manufacturerKnown: manufacturerMatches.length > 0, productLineKnown: lineMatches.length > 0, candidates };
};

const missingFields = (value: UnresolvedIdentityGroup["normalizedIdentity"]): MissingIdentityField[] =>
  (["manufacturer", "productLine", "productName"] as const).filter(field => !value[field]);

export const createUnresolvedIdentityReport = (input: CreateUnresolvedIdentityReportInput): UnresolvedIdentityReport => {
  const groups = new Map<string, MutableGroup>();
  const ensure = (record: IdentityRecord): MutableGroup => {
    const normalizedIdentity = identity(record);
    const key = identityKey(normalizedIdentity);
    const existing = groups.get(key);
    if (existing) return existing;
    const created: MutableGroup = {
      displayIdentity: { manufacturer: record.manufacturer, productLine: record.productLine, productName: record.productName },
      normalizedIdentity,
      componentRecords: [],
      catalogStatuses: [],
      componentOccurrenceCount: 0,
      catalogOccurrenceCount: 0,
    };
    groups.set(key, created);
    return created;
  };

  for (const component of input.components) {
    const group = ensure(component);
    group.componentOccurrenceCount += 1;
    group.componentRecords.push({ status: component.identityStatus, mixId: component.mixId });
  }
  for (const catalogItem of input.catalog) {
    const group = ensure(catalogItem);
    group.catalogOccurrenceCount += 1;
    group.catalogStatuses.push(catalogItem.identityStatus);
  }

  const verifiedMixIds = new Set(input.mixes.filter(mix => mix.status === "VERIFIED").map(mix => mix.mixId));
  const resultGroups: UnresolvedIdentityGroup[] = [...groups.values()].map((group, index) => {
    const componentStatuses = group.componentRecords.map(record => record.status);
    const observedStatuses = orderedStatuses(componentStatuses.length ? componentStatuses : group.catalogStatuses);
    const currentStatus = observedStatuses[0] ?? "NOT_CHECKED";
    const verifiedComponents = group.componentRecords.filter(record => verifiedMixIds.has(record.mixId));
    const verifiedMixCount = new Set(verifiedComponents.map(record => record.mixId)).size;
    const priority: UnresolvedIdentityPriority = verifiedComponents.some(record => record.status === "UNRESOLVED")
      ? "P0"
      : verifiedComponents.some(record => record.status === "MANUFACTURER_ONLY")
        ? "P1"
        : group.componentOccurrenceCount > 0 ? "P2" : "P3";
    const registry = exactAliases(group.normalizedIdentity, input.manufacturers, input.productLines);
    return {
      groupId: `identity-group-${String(index + 1).padStart(4, "0")}`,
      normalizedIdentity: group.normalizedIdentity,
      displayIdentity: group.displayIdentity,
      occurrenceCount: group.componentOccurrenceCount + group.catalogOccurrenceCount,
      componentOccurrenceCount: group.componentOccurrenceCount,
      catalogOccurrenceCount: group.catalogOccurrenceCount,
      verifiedMixCount,
      currentStatus,
      observedStatuses,
      manufacturerKnown: registry.manufacturerKnown,
      productLineKnown: registry.productLineKnown,
      hasExactAliasCandidates: registry.candidates.length > 0,
      exactAliasCandidates: registry.candidates,
      missingFields: missingFields(group.normalizedIdentity),
      priority,
    };
  });
  const priorities: UnresolvedIdentityPriority[] = ["P0", "P1", "P2", "P3"];
  const priorityList = Object.fromEntries(priorities.map(priority => [priority, resultGroups.filter(group => group.priority === priority).map(group => group.groupId)])) as Record<UnresolvedIdentityPriority, string[]>;
  const priorityCounts = Object.fromEntries(priorities.map(priority => [priority, priorityList[priority].length])) as Record<UnresolvedIdentityPriority, number>;
  return {
    reportVersion: "unresolved-identity-report-v1",
    grouping: "exact-normalized-manufacturer-productLine-productName",
    sourceOrder: ["Mix_Components", "ОСНОВНАЯ_БАЗА"],
    statusRule: "component-statuses-first-AMBIGUOUS-UNRESOLVED-MANUFACTURER_ONLY-NOT_CHECKED-RESOLVED",
    registryMatching: "exact-normalized-canonical-or-alias-only",
    fuzzyMatching: false,
    canonicalIdAssignment: false,
    summary: { componentRows: input.components.length, catalogRows: input.catalog.length, groupCount: resultGroups.length, priorityCounts },
    groups: resultGroups,
    priorityList,
  };
};
