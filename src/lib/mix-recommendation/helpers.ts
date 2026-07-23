import { calculateKnowledgeConfidenceForClaim, getClaimsForSubject, getCategoryRelation, toKnowledgeCategory, type FlavorNoteCategory } from "../flavor-knowledge";
import type { FlavorNoteCategory as LegacyFlavorNoteCategory, FlavorProfileField } from "../flavors/types";
import type { AnalysisFactor, MixConflict } from "../mix-compatibility";
import { clamp, PRIORITY_ORDER, round } from "./constants";
import type { MixRecommendation, RecommendationComponentInput, RecommendationPriority, RecommendationReason, RecommendationReasonCode } from "./types";

export const componentId = (value: number | string): string => String(value);
export const findComponent = (components: readonly RecommendationComponentInput[], id: number | string) => components.find(item => componentId(item.flavorId) === componentId(id));
export const componentCategories = (component: RecommendationComponentInput): FlavorNoteCategory[] => [...new Set(component.notes.map(note => toKnowledgeCategory(note.category)).filter((value): value is FlavorNoteCategory => Boolean(value)))].sort();
export const allCategories = (components: readonly RecommendationComponentInput[]): FlavorNoteCategory[] => [...new Set(components.flatMap(componentCategories))].sort();
export const rules = (items: readonly (AnalysisFactor | MixConflict)[]): string[] => [...new Set(items.map(item => item.ruleId))].sort();
export const hasRule = (ruleIds: readonly string[], prefix: string): boolean => ruleIds.some(id => id === prefix || id.startsWith(prefix));
export const relatedComponentIds = (items: readonly AnalysisFactor[]): string[] => [...new Set(items.flatMap(item => item.relatedComponents.map(componentId)))].sort();

export const roleFor = (percentage: number): "BASE" | "SUPPORT" | "ACCENT" | "TRACE" => percentage >= 45 ? "BASE" : percentage >= 20 ? "SUPPORT" : percentage >= 5 ? "ACCENT" : "TRACE";
export const range = (min: number, max: number) => ({ min: clamp(round(min), 1, 99), max: clamp(round(Math.max(min, max)), 1, 99) });
export const decreaseRange = (component: RecommendationComponentInput, accent = false) => accent ? range(5, Math.min(15, component.percentage - 5)) : range(Math.max(5, component.percentage - 20), component.percentage - 5);
export const increaseRange = (component: RecommendationComponentInput) => range(Math.max(8, component.percentage + 3), Math.max(15, component.percentage + 8));

export const makeReason = (
  code: RecommendationReasonCode,
  sourceRuleIds: readonly string[] = [],
  componentIds: readonly string[] = [],
  characteristicKeys: readonly FlavorProfileField[] = [],
  noteIds: readonly string[] = [],
  categoryIds: readonly FlavorNoteCategory[] = [],
  metadata: Readonly<Record<string, unknown>> = {},
): RecommendationReason => ({ code, sourceRuleIds: [...sourceRuleIds].sort(), componentIds: [...componentIds].sort(), characteristicKeys: [...characteristicKeys].sort(), noteIds: [...noteIds].sort(), categoryIds: [...categoryIds].sort(), metadata });

export const confidenceFor = (dataConfidence: number, sourceRuleIds: readonly string[], claimIds: readonly string[], unambiguous = true): number => {
  const claimConfidence = claimIds.length ? claimIds.reduce((sum, id) => sum + calculateKnowledgeConfidenceForClaim(id).score, 0) / claimIds.length : 50;
  return clamp(round(35 + (sourceRuleIds.length ? 15 : 0) + claimConfidence * 0.25 + dataConfidence * 0.25 + (unambiguous ? 10 : 0)), 0, 100);
};

export const compatibleDirection = (candidates: readonly FlavorNoteCategory[], current: readonly FlavorNoteCategory[]) => candidates.find(candidate => current.every(existing => !["CONFLICT", "RISKY"].includes(getCategoryRelation(candidate, existing).type)));

export const claimsForRelation = (candidate: FlavorNoteCategory, current: readonly FlavorNoteCategory[]): string[] => {
  const currentSet = new Set(current);
  return getClaimsForSubject(candidate).filter(claim => claim.subjectType === "CATEGORY_RELATION" && claim.subjectIds.some(id => currentSet.has(id as FlavorNoteCategory))).map(claim => claim.id).sort();
};

// ADR-015: `key` may be a secondary field that is null ("not measured") for some components. Those
// components are excluded from the ranking rather than treated as contributing 0 - only when nothing
// in the mix has a measured value for this characteristic do we fall back to a percentage-based pick.
export const sourceComponentForCharacteristic = (components: readonly RecommendationComponentInput[], key: FlavorProfileField): RecommendationComponentInput => {
  const measured = components.filter(component => component.profile[key] !== null);
  const pool = measured.length ? measured : components;
  const scoreFor = (component: RecommendationComponentInput): number => { const value = component.profile[key]; return value === null ? 0 : value * component.percentage; };
  return [...pool].sort((a, b) => scoreFor(b) - scoreFor(a) || b.percentage - a.percentage || componentId(a.flavorId).localeCompare(componentId(b.flavorId), "en"))[0];
};

export const knowledgeCategoryForLegacy = (category: LegacyFlavorNoteCategory): FlavorNoteCategory | undefined => toKnowledgeCategory(category);

export const rankRecommendations = (items: readonly MixRecommendation[]): MixRecommendation[] => {
  const sorted = [...items].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.impactScore - a.impactScore || a.id.localeCompare(b.id, "en"));
  const grouped: MixRecommendation[] = [];
  const groupIndexes = new Map<string, number>();
  for (const item of sorted) {
    const mergeable = item.type === "DECREASE_COMPONENT" || item.type === "INCREASE_COMPONENT" || item.type === "REMOVE_COMPONENT";
    const key = mergeable ? `${item.type}:${item.componentIds[0] ?? ""}` : item.id;
    const index = groupIndexes.get(key);
    if (index === undefined) { groupIndexes.set(key, grouped.length); grouped.push(item); continue; }
    const current = grouped[index];
    grouped[index] = {
      ...current,
      confidenceScore: Math.max(current.confidenceScore, item.confidenceScore),
      impactScore: Math.max(current.impactScore, item.impactScore),
      characteristicKeys: [...new Set([...current.characteristicKeys, ...item.characteristicKeys])].sort(),
      noteIds: [...new Set([...current.noteIds, ...item.noteIds])].sort(),
      categoryIds: [...new Set([...current.categoryIds, ...item.categoryIds])].sort(),
      reasons: [...current.reasons, ...item.reasons].sort((a, b) => a.code.localeCompare(b.code, "en")),
      sourceRuleIds: [...new Set([...current.sourceRuleIds, ...item.sourceRuleIds])].sort(),
      knowledgeClaimIds: [...new Set([...current.knowledgeClaimIds, ...item.knowledgeClaimIds])].sort(),
    };
  }
  const seen = new Set<string>();
  const componentDirections = new Map<string, "increase" | "decrease" | "remove">();
  return grouped.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    const direction = item.type === "INCREASE_COMPONENT" ? "increase" : item.type === "DECREASE_COMPONENT" ? "decrease" : item.type === "REMOVE_COMPONENT" ? "remove" : undefined;
    if (!direction) return true;
    const id = item.componentIds[0];
    if (!id || componentDirections.has(id)) return false;
    componentDirections.set(id, direction);
    return true;
  });
};

export const priorityFromImpact = (impact: number, conflict = false): RecommendationPriority => conflict || impact >= 75 ? "CRITICAL" : impact >= 55 ? "HIGH" : impact >= 30 ? "MEDIUM" : "LOW";
