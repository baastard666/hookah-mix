import type { KnowledgeClaim, KnowledgeEvidence } from "./types";

export const KNOWLEDGE_EVIDENCE: readonly KnowledgeEvidence[] = [
  { id: "evidence.internal.rules", type: "INTERNAL_EXPERT_RULE", sourceName: "hookah-mix", reference: "knowledge-v1", weight: 0.65 },
  { id: "evidence.editorial.taxonomy", type: "EDITORIAL_RESEARCH", sourceName: "hookah-mix editorial", reference: "taxonomy-v1", weight: 0.72 },
  { id: "evidence.verified.core-pairs", type: "VERIFIED_TEST", sourceName: "hookah-mix fixtures", reference: "core-pairs-v1", weight: 0.9 },
  { id: "evidence.manufacturer.descriptions", type: "MANUFACTURER_DESCRIPTION", sourceName: "manufacturer descriptions", reference: "seed-descriptions-v1", weight: 0.55 },
  { id: "evidence.community.aggregate", type: "COMMUNITY_AGGREGATE", sourceName: "future aggregate fixture", reference: "aggregate-fixture-v1", weight: 0.6 },
  { id: "evidence.inferred.taxonomy", type: "INFERRED_RELATION", sourceName: "taxonomy inference", reference: "parent-child-v1", weight: 0.3 },
  // ADR-019: category-compatibility research aggregated from public sources (manufacturer pages,
  // HTReviews, community forums, retail descriptions) via LLM web search - not a direct manual
  // verification, kept below evidence.verified.core-pairs (0.9) and evidence.internal.rules (0.65)
  // for the same reason evidence.editorial.taxonomy already sits below verified test data.
  { id: "evidence.aggregated-research.high", type: "AGGREGATED_RESEARCH", sourceName: "aggregated public research (LLM web search)", reference: "category-compatibility-v1", weight: 0.7, notes: "Несколько независимых типов источников (официальный сайт/рецепт производителя, обзорный агрегатор, готовый вкус на рынке)." },
  { id: "evidence.aggregated-research.medium", type: "AGGREGATED_RESEARCH", sourceName: "aggregated public research (LLM web search)", reference: "category-compatibility-v1", weight: 0.5, notes: "Один тип источника или менее устойчивое сочетание подтверждений (например только обзорный агрегатор)." },
  { id: "evidence.aggregated-research.low", type: "AGGREGATED_RESEARCH", sourceName: "aggregated public research (LLM web search)", reference: "category-compatibility-v1", weight: 0.3, notes: "Единичный пользовательский отзыв или сообщество - самый слабый уровень из общей выборки." },
  // ADR-019 п.2: намеренно ниже evidence.aggregated-research.low и ниже ЛЮБОГО другого веса в этой
  // таблице (текущий минимум был evidence.inferred.taxonomy=0.3). Розничное описание ОДНОГО товара
  // (Deus Vanilla Berries) - это маркетинговый текст про конкретный продукт, а не независимое
  // подтверждение сочетаемости категорий в целом.
  { id: "evidence.aggregated-research.single-product-marketing", type: "AGGREGATED_RESEARCH", sourceName: "aggregated public research (LLM web search)", reference: "category-compatibility-v1", weight: 0.15, notes: "Розничное описание единственного товара (Deus Vanilla Berries) - НЕ независимое подтверждение для категорий в целом, только маркетинговый текст про один продукт." },
  // ADR-020 (проект, веса подлежат подтверждению): собственная эмпирическая статистика по 37
  // status=VERIFIED миксам (Mixes_Internal + Mix_Components, реально протестированные рецепты с
  // зафиксированным reaction_class) - НЕ внешний источник, это внутренние данные проекта. Confidence
  // разбит на 3 уровня по размеру выборки n (число вхождений конкретной пары категорий в истории):
  // n>=10 -> HIGH, n=5-9 -> MEDIUM, n=3-4 -> LOW. Пары с n<3 (83 из 120 обнаруженных) статистически
  // слишком слабы и не рассматриваются вообще - см. docs/adr/ADR-020.
  // ВАЖНАЯ ОГОВОРКА: во всех 37 миксах reaction_class ни разу не был "negative" (только
  // very_positive/positive/mixed/unknown) - это ограничение выборки (только внутренние тестовые
  // миксы авторов, не репрезентативная выборка всех возможных сочетаний), а не доказательство, что
  // плохих сочетаний не существует. Отсутствие negative-примеров НЕ должно само по себе повышать
  // confidence или тип связи до STRONG_MATCH.
  { id: "evidence.verified-mix-history.high", type: "VERIFIED_MIX_HISTORY", sourceName: "hookah-mix verified mixes (Mixes_Internal)", reference: "verified-mix-history-v1", weight: 0.75, notes: "n>=10 вхождений пары категорий среди 37 verified-миксов." },
  { id: "evidence.verified-mix-history.medium", type: "VERIFIED_MIX_HISTORY", sourceName: "hookah-mix verified mixes (Mixes_Internal)", reference: "verified-mix-history-v1", weight: 0.55, notes: "n=5-9 вхождений пары категорий среди 37 verified-миксов." },
  { id: "evidence.verified-mix-history.low", type: "VERIFIED_MIX_HISTORY", sourceName: "hookah-mix verified mixes (Mixes_Internal)", reference: "verified-mix-history-v1", weight: 0.35, notes: "n=3-4 вхождения пары категорий среди 37 verified-миксов - минимальный принимаемый порог выборки." },
];

export const KNOWLEDGE_CLAIMS: readonly KnowledgeClaim[] = [
  { id: "claim.note.blueberry-category", subjectType: "NOTE", subjectIds: ["blueberry"], claimType: "HAS_CATEGORY", value: "BERRY", evidenceIds: ["evidence.editorial.taxonomy", "evidence.manufacturer.descriptions"] },
  { id: "claim.note.lavender-category", subjectType: "NOTE", subjectIds: ["lavender"], claimType: "HAS_CATEGORY", value: "FLORAL", evidenceIds: ["evidence.editorial.taxonomy", "evidence.inferred.taxonomy"] },
  { id: "claim.relation.berry-floral", subjectType: "CATEGORY_RELATION", subjectIds: ["BERRY", "FLORAL"], claimType: "USUALLY_MATCHES", value: "GOOD_MATCH", evidenceIds: ["evidence.internal.rules", "evidence.verified.core-pairs"] },
  { id: "claim.relation.coffee-creamy", subjectType: "CATEGORY_RELATION", subjectIds: ["COFFEE", "CREAMY"], claimType: "USUALLY_MATCHES", value: "STRONG_MATCH", evidenceIds: ["evidence.internal.rules", "evidence.verified.core-pairs", "evidence.editorial.taxonomy"] },
  { id: "claim.relation.coffee-citrus", subjectType: "CATEGORY_RELATION", subjectIds: ["COFFEE", "CITRUS"], claimType: "HAS_RISK", value: "RISKY", evidenceIds: ["evidence.internal.rules"] },
  { id: "claim.relation.candy-smoky", subjectType: "CATEGORY_RELATION", subjectIds: ["CANDY", "SMOKY"], claimType: "HAS_CONFLICT", value: "CONFLICT", evidenceIds: ["evidence.internal.rules", "evidence.inferred.taxonomy"] },
  { id: "claim.note.mint-cooling", subjectType: "NOTE_RELATION", subjectIds: ["mint", "cooling"], claimType: "RELATED", value: true, evidenceIds: ["evidence.inferred.taxonomy"] },
];
