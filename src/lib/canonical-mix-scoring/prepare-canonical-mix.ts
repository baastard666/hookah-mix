import { round } from "./constants";
import { buildEffectiveTobaccoProfile } from "./build-effective-tobacco-profile";
import { resolveMixComponentIdentity } from "./resolve-mix-component-identity";
import type { CanonicalMixComponentInput, CanonicalMixWarning, PreparedCanonicalComponent, PreparedCanonicalMix } from "./types";

type PreparedRaw = { readonly component: PreparedCanonicalComponent; readonly identity: ReturnType<typeof resolveMixComponentIdentity>; readonly index: number };
const groupKey = (item: PreparedRaw): string => item.component.resolution.status === "RESOLVED" && item.component.resolution.canonicalProductId
  ? `canonical:${item.component.resolution.canonicalProductId}` : `raw:${item.component.sourceComponentIds[0]}`;

export const prepareCanonicalMix = (components: readonly CanonicalMixComponentInput[]): PreparedCanonicalMix => {
  const preparedRaw: PreparedRaw[] = components.map((input, index) => {
    const identity = resolveMixComponentIdentity(input); const effective = buildEffectiveTobaccoProfile(input, identity);
    const resolved = identity.resolution.status === "RESOLVED";
    const flavorId = resolved && identity.resolution.canonicalProductId ? identity.resolution.canonicalProductId : input.flavorId;
    const brandName = identity.resolution.canonicalManufacturer ?? identity.rawIdentity.manufacturer ?? input.brandName;
    const flavorName = resolved && identity.resolution.canonicalProductName ? identity.resolution.canonicalProductName : identity.rawIdentity.productName ?? input.flavorName;
    const component: PreparedCanonicalComponent = {
      flavorId, brandName, flavorName, flavorSlug: resolved && identity.resolution.canonicalProductId ? identity.resolution.canonicalProductId : input.flavorSlug,
      percentage: input.percentage, profile: structuredClone(effective.profile), notes: effective.notes.map(note => ({ ...note })), dataConfidenceScore: effective.profileReliabilityScore,
      sourceComponentIds: [identity.sourceComponentId], resolution: identity.resolution, effectiveProfile: effective,
      proportionConfirmed: input.proportionConfirmed ?? false, independentEvidenceCount: Math.max(0, Math.floor(input.independentEvidenceCount ?? 0)),
    };
    return { component, identity, index };
  });
  const groups = new Map<string, PreparedRaw[]>();
  for (const item of preparedRaw) groups.set(groupKey(item), [...(groups.get(groupKey(item)) ?? []), item]);
  const warnings: CanonicalMixWarning[] = [];
  const aggregated = [...groups.values()].map(group => {
    const chosen = [...group].sort((a, b) => b.component.effectiveProfile.profileReliabilityScore - a.component.effectiveProfile.profileReliabilityScore || a.index - b.index)[0];
    const sourceComponentIds = group.flatMap(item => item.component.sourceComponentIds).sort((a, b) => a.localeCompare(b, "en"));
    const percentage = round(group.reduce((sum, item) => sum + item.component.percentage, 0), 4);
    const canonicalProductId = chosen.component.resolution.canonicalProductId;
    if (canonicalProductId && group.length > 1) warnings.push({ code: "DUPLICATE_CANONICAL_COMPONENT", canonicalProductId, sourceComponentIds });
    return {
      ...chosen.component, percentage, sourceComponentIds,
      proportionConfirmed: group.every(item => item.component.proportionConfirmed),
      independentEvidenceCount: Math.max(...group.map(item => item.component.independentEvidenceCount)),
    } satisfies PreparedCanonicalComponent;
  });
  const ordered = aggregated.sort((a, b) => {
    const aIndex = preparedRaw.find(item => item.component.sourceComponentIds.includes(a.sourceComponentIds[0]))?.index ?? 0;
    const bIndex = preparedRaw.find(item => item.component.sourceComponentIds.includes(b.sourceComponentIds[0]))?.index ?? 0;
    return aIndex - bIndex;
  });
  return {
    components: ordered, componentResolutions: preparedRaw.map(item => item.identity), warnings: warnings.sort((a, b) => a.canonicalProductId.localeCompare(b.canonicalProductId, "en")),
    rawComponentCount: components.length, effectiveComponentCount: ordered.length, totalPercentage: round(ordered.reduce((sum, item) => sum + item.percentage, 0), 4),
  };
};
