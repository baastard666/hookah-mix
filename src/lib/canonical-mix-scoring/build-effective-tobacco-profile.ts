import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import type { FlavorProfile, FlavorProfileField } from "../flavors/types";
import { resolveTobaccoProfile } from "../tobacco-profile";
import type { ConfidenceLevel, HeatResistance, StrengthLevel } from "../tobacco-profile";
import { clamp, PROFILE_SOURCE_PRIORITY, round } from "./constants";
import type { CanonicalMixComponentInput, EffectiveParameter, EffectiveProfileCandidate, EffectiveProfileReliability, EffectiveProfileSource, EffectiveTobaccoProfile, MixComponentResolution } from "./types";

const neutralProfile = (): FlavorProfile => Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, 5])) as FlavorProfile;
const confidenceScore: Readonly<Record<ConfidenceLevel, number>> = { LOW: 35, MEDIUM: 65, HIGH: 90 };
const strengthValue: Readonly<Record<StrengthLevel, number | null>> = { LOW: 2, MEDIUM_LOW: 4, MEDIUM: 6, MEDIUM_HIGH: 8, HIGH: 9, UNKNOWN: null };
const heatValue: Readonly<Record<HeatResistance, number | null>> = { LOW: 3, MEDIUM: 6, HIGH: 9, UNKNOWN: null };
const reliabilityLabel = (score: number): EffectiveProfileReliability => score >= 75 ? "HIGH" : score >= 45 ? "MEDIUM" : "LOW";
const sourcePriority = (source: EffectiveProfileSource, reliabilityScore: number): number =>
  source === "CANONICAL_PRODUCT_PROFILE" && reliabilityScore < 75 ? PROFILE_SOURCE_PRIORITY.PRELIMINARY_PROFILE : PROFILE_SOURCE_PRIORITY[source];

const validCandidate = (candidate: EffectiveProfileCandidate): EffectiveProfileCandidate => ({ ...candidate, reliabilityScore: clamp(candidate.reliabilityScore) });
const sortCandidates = (items: readonly EffectiveProfileCandidate[]): EffectiveProfileCandidate[] => [...items].map(validCandidate).sort((a, b) =>
  sourcePriority(b.type, b.reliabilityScore) - sourcePriority(a.type, a.reliabilityScore) || b.reliabilityScore - a.reliabilityScore || (a.profileId ?? "").localeCompare(b.profileId ?? "", "en"));

const technicalCandidate = (resolution: MixComponentResolution): EffectiveProfileCandidate | null => {
  if (resolution.resolution.status !== "RESOLVED") return null;
  const manufacturer = resolution.resolution.canonicalManufacturer; if (!manufacturer) return null;
  const technical = resolveTobaccoProfile({ manufacturer, productLine: resolution.resolution.canonicalProductLine });
  if (technical.status !== "FOUND") return null;
  const profile: Partial<FlavorProfile> = {};
  const strength = technical.strengthLevel ? strengthValue[technical.strengthLevel.value] : null;
  const heat = technical.heatResistance ? heatValue[technical.heatResistance.value] : null;
  if (strength !== null) profile.strength = strength;
  if (heat !== null) profile.heatResistance = heat;
  if (!Object.keys(profile).length) return null;
  return { type: "CANONICAL_TECHNICAL_PROFILE", profileId: `technical:${technical.manufacturer}:${technical.productLine ?? "manufacturer"}`, profile, reliabilityScore: confidenceScore[technical.dataConfidence] };
};

const fallbackNote = (component: CanonicalMixComponentInput) => {
  const name = component.identity?.rawProductName?.trim() || component.flavorName.trim() || "Неизвестный вкус";
  const slug = name.normalize("NFKC").toLocaleLowerCase("ru-RU").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || `unknown-${String(component.flavorId)}`;
  return { noteId: `fallback:${String(component.flavorId)}`, noteName: name, noteSlug: slug, category: "OTHER" as const, intensity: 5, noteType: "DOMINANT" as const };
};

export const buildEffectiveTobaccoProfile = (component: CanonicalMixComponentInput, resolution: MixComponentResolution): EffectiveTobaccoProfile => {
  const candidates: EffectiveProfileCandidate[] = [...(component.profileCandidates ?? [])];
  if (component.sourceProfileAvailable !== false) candidates.push({ type: "SOURCE_PROFILE", profileId: `source:${String(component.flavorId)}`, profile: component.profile, notes: component.notes, reliabilityScore: component.sourceProfileReliabilityScore ?? component.dataConfidenceScore ?? 80 });
  const technical = technicalCandidate(resolution); if (technical) candidates.push(technical);
  const fallback: EffectiveProfileCandidate = { type: "NEUTRAL_FALLBACK", profileId: null, profile: neutralProfile(), notes: [fallbackNote(component)], reliabilityScore: 15 };
  candidates.push(fallback);
  const sorted = sortCandidates(candidates);
  const parameters = {} as Record<FlavorProfileField, EffectiveParameter>;
  for (const field of FLAVOR_PROFILE_FIELDS) {
    const chosen = sorted.find(candidate => Number.isFinite(candidate.profile[field]) && candidate.profile[field]! >= 0 && candidate.profile[field]! <= 10) ?? fallback;
    parameters[field] = { value: chosen.profile[field]!, source: chosen.type, reliabilityScore: chosen.reliabilityScore, profileId: chosen.profileId ?? null };
  }
  const profile = Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, parameters[field].value])) as FlavorProfile;
  const noteCandidate = sorted.find(candidate => candidate.notes?.length) ?? fallback;
  const roleCandidate = sorted.find(candidate => candidate.recommendedRole);
  const rangeCandidate = sorted.find(candidate => candidate.confirmedPercentageRange && candidate.confirmedPercentageRange.min > 0 && candidate.confirmedPercentageRange.max < 100 && candidate.confirmedPercentageRange.min <= candidate.confirmedPercentageRange.max);
  const profileReliabilityScore = round(FLAVOR_PROFILE_FIELDS.reduce((sum, field) => sum + parameters[field].reliabilityScore, 0) / FLAVOR_PROFILE_FIELDS.length, 1);
  const contributing = [...new Map(FLAVOR_PROFILE_FIELDS.map(field => parameters[field]).map(item => [`${item.source}:${item.profileId ?? ""}`, item])).values()];
  const dominantSource = [...contributing].sort((a, b) => sourcePriority(b.source, b.reliabilityScore) - sourcePriority(a.source, a.reliabilityScore) || b.reliabilityScore - a.reliabilityScore)[0];
  return {
    profile, notes: structuredClone(noteCandidate.notes ?? [fallbackNote(component)]), strengthLevel5: clamp(Math.round(profile.strength! / 2), 1, 5), parameters,
    profileId: dominantSource.profileId, profileSource: dominantSource.source, profileReliability: reliabilityLabel(profileReliabilityScore), profileReliabilityScore,
    usedFallback: FLAVOR_PROFILE_FIELDS.some(field => parameters[field].source === "NEUTRAL_FALLBACK") || noteCandidate.type === "NEUTRAL_FALLBACK",
    recommendedRole: roleCandidate?.recommendedRole ?? null, confirmedPercentageRange: rangeCandidate?.confirmedPercentageRange ?? null,
    provenance: contributing.map(item => ({ source: item.source as EffectiveProfileSource, profileId: item.profileId, reliabilityScore: item.reliabilityScore })).sort((a, b) => sourcePriority(b.source, b.reliabilityScore) - sourcePriority(a.source, a.reliabilityScore) || (a.profileId ?? "").localeCompare(b.profileId ?? "", "en")),
  };
};
