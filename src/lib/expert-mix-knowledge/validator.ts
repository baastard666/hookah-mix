import { EXPERT_MIX_COMPONENT_LIMIT, PERCENT_EPSILON } from "./constants";
import { deepCloneAndFreeze } from "./normalizer";
import { isExpertEvidenceType, isExpertKnowledgeConfidence, isExpertMixIdentityStatus, isExpertMixRecordStatus, isExpertSourceType, isFiniteNumber, isKnowledgeOrigin, isNonEmptyString } from "./schemas";
import type { ExpertMixKnowledgeRecord, ExpertMixValidationCode, ExpertMixValidationIssue, ExpertMixValidationResult, ExpertMixValidationSeverity } from "./types";

type UnknownRecord = Record<string, unknown>;
const object = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const issue = (code: ExpertMixValidationCode, path: string, severity: ExpertMixValidationSeverity, message: string, context?: Readonly<Record<string, unknown>>): ExpertMixValidationIssue => ({ code, path, severity, message, ...(context ? { context } : {}) });
const duplicateValues = (values: readonly unknown[]): boolean => new Set(values).size !== values.length;

const validatePreparation = (preparation: unknown, errors: ExpertMixValidationIssue[]): void => {
  if (preparation === undefined) return;
  if (!object(preparation)) { errors.push(issue("INVALID_PREPARATION_VALUE", "preparation", "ERROR", "Preparation должен быть объектом.")); return; }
  const bowl = preparation.bowl;
  if (object(bowl) && bowl.capacityGrams !== undefined && (!isFiniteNumber(bowl.capacityGrams) || bowl.capacityGrams <= 0)) errors.push(issue("INVALID_PREPARATION_VALUE", "preparation.bowl.capacityGrams", "ERROR", "Вместимость чаши должна быть больше нуля."));
  const coals = preparation.coals;
  if (object(coals)) for (const field of ["initialCount", "workingCount"] as const) if (coals[field] !== undefined && (!Number.isInteger(coals[field]) || (coals[field] as number) < 0 || (coals[field] as number) > 10)) errors.push(issue("INVALID_PREPARATION_VALUE", `preparation.coals.${field}`, "ERROR", "Количество углей должно быть целым числом от 0 до 10."));
  if (object(coals) && coals.sizeMm !== undefined && (!isFiniteNumber(coals.sizeMm) || coals.sizeMm < 0)) errors.push(issue("INVALID_PREPARATION_VALUE", "preparation.coals.sizeMm", "ERROR", "Размер угля не может быть отрицательным."));
  if (preparation.warmupMinutes !== undefined && (!isFiniteNumber(preparation.warmupMinutes) || preparation.warmupMinutes < 0)) errors.push(issue("INVALID_PREPARATION_VALUE", "preparation.warmupMinutes", "ERROR", "Время прогрева не может быть отрицательным."));
};

const validateRating = (evaluation: unknown, errors: ExpertMixValidationIssue[], warnings: ExpertMixValidationIssue[]): void => {
  if (evaluation === undefined) return;
  if (!object(evaluation)) { errors.push(issue("INVALID_RATING", "evaluation", "ERROR", "Evaluation должен быть объектом.")); return; }
  if (!Array.isArray(evaluation.evidenceIds) || evaluation.evidenceIds.length === 0) warnings.push(issue("EVALUATION_WITHOUT_EVIDENCE", "evaluation.evidenceIds", "WARNING", "Оценка не связана с evidence."));
  if (evaluation.rating === undefined) return;
  const rating = evaluation.rating;
  if (!object(rating)) { errors.push(issue("INVALID_RATING", "evaluation.rating", "ERROR", "Rating должен быть объектом.")); return; }
  if (rating.scale === "QUALITATIVE") {
    if (!isNonEmptyString(rating.value)) errors.push(issue("INVALID_RATING", "evaluation.rating.value", "ERROR", "Качественный рейтинг должен содержать verdict."));
    return;
  }
  if (![5, 10, 100].includes(rating.scale as number) || !isFiniteNumber(rating.value) || rating.value < 0 || rating.value > (rating.scale as number)) errors.push(issue("INVALID_RATING", "evaluation.rating", "ERROR", "Числовой рейтинг должен находиться в исходной шкале 5, 10 или 100."));
};

export const validateExpertMixKnowledgeRecord = (input: unknown): ExpertMixValidationResult => {
  const errors: ExpertMixValidationIssue[] = [];
  const warnings: ExpertMixValidationIssue[] = [];
  if (!object(input)) return { valid: false, errors: [issue("INVALID_RECORD", "$", "ERROR", "Запись должна быть объектом.")], warnings };

  if (!isNonEmptyString(input.id)) errors.push(issue("INVALID_RECORD", "id", "ERROR", "ID записи обязателен."));
  if (!isExpertMixRecordStatus(input.status)) errors.push(issue("INVALID_RECORD", "status", "ERROR", "Неизвестный статус записи."));
  if (!isExpertKnowledgeConfidence(input.confidence)) errors.push(issue("INVALID_RECORD", "confidence", "ERROR", "Неизвестный confidence записи."));
  if (input.confidence === "LOW") warnings.push(issue("LOW_CONFIDENCE_RECORD", "confidence", "WARNING", "Запись имеет низкий confidence."));
  if (!input.checkedAt) warnings.push(issue("MISSING_CHECKED_AT", "checkedAt", "WARNING", "Дата проверки не указана."));
  if (input.schemaVersion !== "expert-mix-knowledge-v1") errors.push(issue("INVALID_RECORD", "schemaVersion", "ERROR", "Неподдерживаемая версия схемы."));

  const components = Array.isArray(input.components) ? input.components : [];
  if (components.length === 0) errors.push(issue("EMPTY_COMPONENTS", "components", "ERROR", "Нужен хотя бы один компонент."));
  if (components.length === 1) warnings.push(issue("SINGLE_COMPONENT_RECORD", "components", "WARNING", "Запись описывает моновкус, а не микс."));
  if (components.length > EXPERT_MIX_COMPONENT_LIMIT) errors.push(issue("TOO_MANY_COMPONENTS", "components", "ERROR", `Технический лимит — ${EXPERT_MIX_COMPONENT_LIMIT} компонентов.`));
  const componentIds = components.map(component => object(component) ? component.componentId : undefined);
  const positions = components.map(component => object(component) ? component.position : undefined);
  if (duplicateValues(componentIds.filter(Boolean))) errors.push(issue("DUPLICATE_COMPONENT_ID", "components", "ERROR", "componentId не должен повторяться."));
  if (duplicateValues(positions.filter(value => value !== undefined))) errors.push(issue("DUPLICATE_COMPONENT_POSITION", "components", "ERROR", "Позиция компонента не должна повторяться."));

  for (const [index, component] of components.entries()) {
    const path = `components[${index}]`;
    if (!object(component)) { errors.push(issue("INVALID_RECORD", path, "ERROR", "Компонент должен быть объектом.")); continue; }
    if (!isNonEmptyString(component.componentId)) errors.push(issue("INVALID_RECORD", `${path}.componentId`, "ERROR", "componentId обязателен."));
    if (!Number.isInteger(component.position) || (component.position as number) < 1) errors.push(issue("INVALID_RECORD", `${path}.position`, "ERROR", "Позиция должна быть положительным целым числом."));
    if (!isNonEmptyString(component.rawProductName)) errors.push(issue("EMPTY_PRODUCT_NAME", `${path}.rawProductName`, "ERROR", "Исходное название продукта обязательно."));
    if (!isExpertMixIdentityStatus(component.identityStatus)) errors.push(issue("INVALID_RECORD", `${path}.identityStatus`, "ERROR", "Неизвестный identityStatus."));
    if (component.identityStatus === "RESOLVED" && !isNonEmptyString(component.canonicalProductId)) errors.push(issue("INVALID_RECORD", `${path}.canonicalProductId`, "ERROR", "RESOLVED компоненту нужен canonicalProductId."));
    if (["UNRESOLVED", "AMBIGUOUS", "NOT_CHECKED", "MANUFACTURER_ONLY"].includes(String(component.identityStatus))) warnings.push(issue("UNRESOLVED_COMPONENT", path, "WARNING", "Компонент не имеет полностью разрешённой canonical identity."));
  }
  if (input.status === "VERIFIED" && warnings.some(item => item.code === "UNRESOLVED_COMPONENT")) warnings.push(issue("VERIFIED_WITH_UNRESOLVED_COMPONENT", "status", "WARNING", "VERIFIED запись содержит unresolved компонент."));

  const proportions = input.proportions;
  if (!object(proportions) || !["PERCENT", "PARTS", "ORDER_ONLY", "UNKNOWN"].includes(String(proportions.type))) errors.push(issue("INVALID_PROPORTION_MODEL", "proportions", "ERROR", "Неизвестная модель пропорций."));
  else if (proportions.type === "PERCENT") {
    let total = 0;
    let approximate = false;
    let tolerance = isFiniteNumber(proportions.tolerance) && proportions.tolerance >= 0 ? proportions.tolerance : 0;
    for (const [index, raw] of components.entries()) {
      const proportion = object(raw) && object(raw.proportion) ? raw.proportion : null;
      if (!proportion || !["PERCENT", "APPROXIMATE_PERCENT"].includes(String(proportion.type)) || !isFiniteNumber(proportion.value) || proportion.value <= 0 || proportion.value > 100) errors.push(issue("INVALID_PERCENT", `components[${index}].proportion`, "ERROR", "Процент должен быть конечным числом больше 0 и не больше 100."));
      else {
        total += proportion.value;
        if (proportion.type === "APPROXIMATE_PERCENT") { approximate = true; if (isFiniteNumber(proportion.tolerance) && proportion.tolerance >= 0) tolerance = Math.max(tolerance, proportion.tolerance); }
      }
    }
    if (components.length > 0 && Math.abs(total - 100) > (approximate ? tolerance : PERCENT_EPSILON) + PERCENT_EPSILON) errors.push(issue("PERCENT_TOTAL_MISMATCH", "components", "ERROR", "Сумма процентов должна равняться 100 или укладываться в явно заданную approximate tolerance.", { total, tolerance }));
  } else if (proportions.type === "PARTS") {
    let total = 0;
    for (const [index, raw] of components.entries()) {
      const proportion = object(raw) && object(raw.proportion) ? raw.proportion : null;
      if (!proportion || proportion.type !== "PARTS" || !isFiniteNumber(proportion.value) || proportion.value <= 0) errors.push(issue("INVALID_PART_VALUE", `components[${index}].proportion`, "ERROR", "Количество частей должно быть положительным конечным числом.")); else total += proportion.value;
    }
    if (proportions.totalParts !== undefined && (!isFiniteNumber(proportions.totalParts) || proportions.totalParts <= 0 || Math.abs(total - proportions.totalParts) > PERCENT_EPSILON)) errors.push(issue("INVALID_PART_VALUE", "proportions.totalParts", "ERROR", "totalParts должен совпадать с суммой частей."));
  } else if (proportions.type === "UNKNOWN") warnings.push(issue("UNKNOWN_PROPORTIONS", "proportions", "WARNING", "Пропорции источником не указаны."));

  const source = input.source;
  const sourceId = object(source) ? source.sourceId : undefined;
  if (!object(source) || !isNonEmptyString(source.sourceId) || !isExpertSourceType(source.sourceType) || !["INTERNAL_ONLY", "PUBLIC_ANONYMOUS", "PUBLIC_ALLOWED"].includes(String(source.authorVisibility))) errors.push(issue("EMPTY_SOURCE", "source", "ERROR", "Источник должен иметь sourceId, sourceType и authorVisibility."));
  else if (isNonEmptyString(source.internalLabel) && isNonEmptyString(source.publicLabel) && source.internalLabel === source.publicLabel) warnings.push(issue("PUBLIC_SOURCE_LABEL_EXPOSES_INTERNAL_NAME", "source.publicLabel", "WARNING", "Публичная метка совпадает с внутренней."));

  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const evidenceIds = evidence.map(item => object(item) ? item.evidenceId : undefined);
  if (duplicateValues(evidenceIds.filter(Boolean))) errors.push(issue("DUPLICATE_EVIDENCE_ID", "evidence", "ERROR", "evidenceId не должен повторяться."));
  for (const [index, item] of evidence.entries()) {
    const path = `evidence[${index}]`;
    if (!object(item) || !isNonEmptyString(item.evidenceId) || !isExpertEvidenceType(item.type) || !isExpertKnowledgeConfidence(item.confidence)) { errors.push(issue("INVALID_RECORD", path, "ERROR", "Некорректный evidence.")); continue; }
    if (item.sourceId !== sourceId) errors.push(issue("UNKNOWN_EVIDENCE_REFERENCE", `${path}.sourceId`, "ERROR", "Evidence должен ссылаться на источник своей записи."));
    const start = item.timestampStartSeconds;
    const end = item.timestampEndSeconds;
    if ((start !== undefined && (!isFiniteNumber(start) || start < 0)) || (end !== undefined && (!isFiniteNumber(end) || end < 0)) || (isFiniteNumber(start) && isFiniteNumber(end) && end < start)) errors.push(issue("INVALID_TIMESTAMP_RANGE", path, "ERROR", "Таймкоды должны быть неотрицательными, конец не раньше начала."));
  }

  const observations = Array.isArray(input.observations) ? input.observations : [];
  const observationIds = observations.map(item => object(item) ? item.observationId : undefined);
  if (duplicateValues(observationIds.filter(Boolean))) errors.push(issue("DUPLICATE_OBSERVATION_ID", "observations", "ERROR", "observationId не должен повторяться."));
  const knownComponents = new Set(componentIds.filter(isNonEmptyString));
  const knownEvidence = new Set(evidenceIds.filter(isNonEmptyString));
  for (const [index, observation] of observations.entries()) {
    const path = `observations[${index}]`;
    if (!object(observation) || !isNonEmptyString(observation.observationId) || !isNonEmptyString(observation.type) || !isKnowledgeOrigin(observation.origin) || !isExpertKnowledgeConfidence(observation.confidence)) { errors.push(issue("INVALID_RECORD", path, "ERROR", "Некорректное observation.")); continue; }
    const refs = Array.isArray(observation.evidenceIds) ? observation.evidenceIds : [];
    if (refs.length === 0) warnings.push(issue("OBSERVATION_WITHOUT_EVIDENCE", `${path}.evidenceIds`, "WARNING", "Наблюдение не связано с evidence."));
    for (const ref of refs) if (!knownEvidence.has(String(ref))) errors.push(issue("UNKNOWN_EVIDENCE_REFERENCE", `${path}.evidenceIds`, "ERROR", "Наблюдение ссылается на неизвестный evidenceId."));
    const subject = observation.subject;
    if (!object(subject)) { errors.push(issue("UNKNOWN_COMPONENT_REFERENCE", `${path}.subject`, "ERROR", "Некорректный subject.")); continue; }
    const subjectIds = subject.type === "COMPONENT" ? [subject.componentId] : subject.type === "COMPONENT_PAIR" && Array.isArray(subject.componentIds) ? subject.componentIds : [];
    if (subject.type === "COMPONENT_PAIR" && (subjectIds.length !== 2 || subjectIds[0] === subjectIds[1])) errors.push(issue("UNKNOWN_COMPONENT_REFERENCE", `${path}.subject.componentIds`, "ERROR", "Пара должна содержать два разных компонента."));
    for (const ref of subjectIds) if (!knownComponents.has(String(ref))) errors.push(issue("UNKNOWN_COMPONENT_REFERENCE", `${path}.subject`, "ERROR", "Наблюдение ссылается на неизвестный componentId."));
    if (observation.type === "DOMINANCE") {
      const refsToCheck = [observation.dominantComponentId, ...(Array.isArray(observation.dominatedComponentIds) ? observation.dominatedComponentIds : [])];
      for (const ref of refsToCheck) if (!knownComponents.has(String(ref))) errors.push(issue("UNKNOWN_COMPONENT_REFERENCE", path, "ERROR", "Dominance ссылается на неизвестный componentId."));
    }
    if (observation.type === "COMPATIBILITY" && !["MIX", "COMPONENT_PAIR"].includes(String(subject.type))) errors.push(issue("INVALID_RECORD", `${path}.subject`, "ERROR", "Compatibility допустим только для MIX или COMPONENT_PAIR."));
  }

  validatePreparation(input.preparation, errors);
  validateRating(input.evaluation, errors, warnings);
  if (object(input.evaluation) && Array.isArray(input.evaluation.evidenceIds)) for (const ref of input.evaluation.evidenceIds) if (!knownEvidence.has(String(ref))) errors.push(issue("UNKNOWN_EVIDENCE_REFERENCE", "evaluation.evidenceIds", "ERROR", "Evaluation ссылается на неизвестный evidenceId."));

  if (errors.length > 0) return { valid: false, errors: deepCloneAndFreeze(errors), warnings: deepCloneAndFreeze(warnings), partialRecord: deepCloneAndFreeze(input as Partial<ExpertMixKnowledgeRecord>) };
  const normalized = structuredClone(input) as ExpertMixKnowledgeRecord;
  const ordered = { ...normalized, components: [...normalized.components].sort((a, b) => a.position - b.position || a.componentId.localeCompare(b.componentId)) };
  return { valid: true, record: deepCloneAndFreeze(ordered), warnings: deepCloneAndFreeze(warnings) };
};
