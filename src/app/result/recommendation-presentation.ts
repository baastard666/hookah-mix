import type { ComponentRole, RecommendationPriority, RecommendationReasonCode, RecommendationStatus, RecommendationType } from "@/lib/mix-recommendation";

// ADR-024: moved to src/lib/flavor-knowledge/category-labels.ts (single source of truth, reused by
// src/lib/mix-result-presentation) - re-exported here so existing importers of this module don't change.
// Relative path, not the "@/" alias: vitest.config.ts has no alias resolution configured (Next.js/tsc
// resolve "@/*" via tsconfig paths, vitest does not), so a real (non-type-only) "@/" import only ever
// worked here by accident while this was a type-only import that got erased before runtime resolution.
export { categoryLabels } from "../../lib/flavor-knowledge/category-labels";

export const statusLabels: Record<RecommendationStatus, string> = { NO_CHANGES_NEEDED: "Микс уже сбалансирован", MINOR_ADJUSTMENTS: "Можно слегка улучшить", SIGNIFICANT_ADJUSTMENTS: "Рекомендуются изменения", INSUFFICIENT_DATA: "Недостаточно данных" };
export const typeLabels: Record<RecommendationType, string> = { DECREASE_COMPONENT: "Уменьшить компонент", INCREASE_COMPONENT: "Увеличить компонент", REBALANCE_COMPONENTS: "Перераспределить компоненты", REMOVE_COMPONENT: "Убрать компонент", ADD_NOTE_DIRECTION: "Добавить вкусовое направление", REDUCE_PROFILE_OVERLOAD: "Снизить перегрузку профиля", PRESERVE_CURRENT_MIX: "Сохранить текущий микс", INSUFFICIENT_DATA: "Дополнить данные" };
export const priorityLabels: Record<RecommendationPriority, string> = { LOW: "Низкий", MEDIUM: "Средний", HIGH: "Высокий", CRITICAL: "Критический" };
export const roleLabels: Record<ComponentRole, string> = { BASE: "Основа", SUPPORT: "Поддержка", ACCENT: "Акцент", TRACE: "Лёгкий оттенок" };
export const reasonLabels: Record<RecommendationReasonCode, string> = {
  DOMINANT_COMPONENT_OVERUSED: "Компонент может подавлять остальные", WEAK_COMPONENT_MAY_DISAPPEAR: "Компонент может потеряться", MULTIPLE_COMPETING_BASES: "Несколько ярких основ конкурируют", NO_CLEAR_BASE: "Нет однозначной основы", EXCESSIVE_SWEETNESS: "Профиль перегружен сладостью", EXCESSIVE_COOLING: "Слишком сильный холод", FLORAL_OVERLOAD: "Цветочная нота занимает слишком большую роль", BITTER_SOUR_CONFLICT: "Высокие горечь и кислотность конфликтуют", EXCESSIVE_DRYNESS: "Профиль может быть слишком сухим", ADD_COMPLEMENTARY_CONTRAST: "Контраст поможет сбалансировать профиль", ADD_SOFTENING_DIRECTION: "Смягчающее направление выровняет профиль", MIX_ALREADY_BALANCED: "Значимые изменения не требуются", PROFILE_DATA_INCOMPLETE: "Исходный профиль подтверждён недостаточно", KNOWLEDGE_CONFIDENCE_LOW: "Недостаточно подтверждённых знаний", RISKY_CATEGORY_PAIR: "Сочетание категорий требует осторожности", MULTIPLE_PROFILE_EXTREMES: "Слишком много характеристик находятся на предельном уровне",
};
export const presentationLabel = <T extends string>(mapping: Readonly<Record<T, string>>, value: string, fallback = "Другое действие"): string => mapping[value as T] ?? fallback;
