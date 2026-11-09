import { validateExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import type { ExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import type { TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import { VERIFIED_MIX_RECIPE_PERCENT_EPSILON } from "./constants";
import type { VerifiedMixRecipeEligibility, VerifiedMixRecipeIssue } from "./types";

const issue = (recordId: string, code: VerifiedMixRecipeIssue["code"], message: string, componentId?: string): VerifiedMixRecipeIssue => ({ recordId, code, message, ...(componentId ? { componentId } : {}) });

export const evaluateVerifiedMixRecipeEligibility = (record: ExpertMixKnowledgeRecord, decisions: TobaccoIdentityDecisionRegistry): VerifiedMixRecipeEligibility => {
  const issues: VerifiedMixRecipeIssue[] = [];
  if (!validateExpertMixKnowledgeRecord(record).valid) issues.push(issue(record.id, "INVALID_SOURCE_RECORD", "Исходная запись ExpertMixKnowledge не прошла валидацию."));
  if (record.recordKind !== "MIX") issues.push(issue(record.id, "NOT_MIX", "Запись не является миксом."));
  if (record.status !== "VERIFIED") issues.push(issue(record.id, "NOT_VERIFIED", "Статус записи не VERIFIED."));
  if (record.components.length < 2) issues.push(issue(record.id, "TOO_FEW_COMPONENTS", "Для runtime-рецепта нужны минимум два компонента."));

  if (record.proportions.type === "UNKNOWN") issues.push(issue(record.id, "UNKNOWN_PROPORTIONS", "Источник не содержит пропорции."));
  if (record.proportions.type === "PARTS") issues.push(issue(record.id, "PARTS_ONLY", "Пропорции в частях не преобразуются в точные проценты."));
  if (record.proportions.type === "ORDER_ONLY") issues.push(issue(record.id, "ORDER_ONLY_PROPORTIONS", "Порядок компонентов не является точной пропорцией."));

  let total = 0;
  for (const component of record.components) {
    if (component.identityStatus === "UNRESOLVED" || component.identityStatus === "NOT_CHECKED") issues.push(issue(record.id, "UNRESOLVED_COMPONENT", "Компонент не имеет RESOLVED identity.", component.componentId));
    if (component.identityStatus === "AMBIGUOUS") issues.push(issue(record.id, "AMBIGUOUS_COMPONENT", "Компонент имеет неоднозначную identity.", component.componentId));
    if (component.identityStatus === "MANUFACTURER_ONLY") issues.push(issue(record.id, "MANUFACTURER_ONLY_COMPONENT", "Для компонента известен только производитель.", component.componentId));
    if (component.identityStatus === "RESOLVED" && !component.canonicalProductId) issues.push(issue(record.id, "MISSING_CANONICAL_PRODUCT_ID", "RESOLVED-компонент не содержит canonicalProductId.", component.componentId));
    if (component.canonicalProductId) {
      const lookup = decisions.getByCanonicalProductId(component.canonicalProductId);
      if (lookup.status === "NOT_FOUND") issues.push(issue(record.id, "CANONICAL_PRODUCT_NOT_FOUND", "canonicalProductId отсутствует в реестре решений.", component.componentId));
      else if (lookup.status === "FOUND" && lookup.decision.decision.status !== "RESOLVED") issues.push(issue(record.id, "CANONICAL_PRODUCT_NOT_RESOLVED", "canonicalProductId не имеет RESOLVED-решения.", component.componentId));
    }
    if (record.proportions.type !== "PERCENT") continue;
    if (!component.proportion) issues.push(issue(record.id, "MISSING_COMPONENT_PERCENTAGE", "У компонента отсутствует точный процент.", component.componentId));
    else if (component.proportion.type === "APPROXIMATE_PERCENT") issues.push(issue(record.id, "APPROXIMATE_PROPORTIONS", "Приблизительные проценты не становятся точным runtime-рецептом.", component.componentId));
    else if (component.proportion.type !== "PERCENT") issues.push(issue(record.id, "MISSING_COMPONENT_PERCENTAGE", "У компонента нет PERCENT-пропорции.", component.componentId));
    else if (!Number.isFinite(component.proportion.value) || component.proportion.value <= 0 || component.proportion.value > 100) issues.push(issue(record.id, "INVALID_COMPONENT_PERCENTAGE", "Процент компонента должен быть в диапазоне (0; 100].", component.componentId));
    else total += component.proportion.value;
  }
  if (record.proportions.type === "PERCENT" && Math.abs(total - 100) > VERIFIED_MIX_RECIPE_PERCENT_EPSILON) issues.push(issue(record.id, "PERCENT_TOTAL_MISMATCH", `Сумма точных процентов равна ${total}, а не 100.`, undefined));
  const canonicalIds = record.components.map(component => component.canonicalProductId).filter((id): id is string => Boolean(id));
  if (new Set(canonicalIds).size !== canonicalIds.length) issues.push(issue(record.id, "DUPLICATE_CANONICAL_COMPONENT", "Один canonicalProductId встретился в рецепте более одного раза."));
  return issues.length === 0 ? { eligible: true, record } : { eligible: false, recordId: record.id, issues: Object.freeze(issues) };
};
