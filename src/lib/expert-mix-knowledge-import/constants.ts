import type { ExpertMixImportOptions } from "./types";

export const REQUIRED_EXPERT_MIX_SHEETS = ["ОСНОВНАЯ_БАЗА", "Mixes_Internal", "Mix_Components"] as const;
export const OPTIONAL_EXPERT_MIX_SHEETS = ["App_Tobacco", "App_Mixes"] as const;
export const DEFAULT_EXPERT_MIX_IMPORT_OPTIONS: ExpertMixImportOptions = { strictMode: false, percentageTolerance: 1, allowMissingOptionalSheets: true, includeArchived: true, includeRejected: false, includePreliminaryInferences: true, includeExternalRatings: true, includePrivateEvidence: true, failOnAmbiguousIdentity: false, failOnUnresolvedIdentity: false };
export const HEADER_ALIASES = {
  mixId: ["mix_id", "mixid", "id_микса", "ид_микса"], status: ["status", "статус", "recipe_status"], title: ["title", "title_internal", "название_микса", "микс"],
  manufacturer: ["manufacturer", "brand", "производитель", "бренд"], productLine: ["product_line", "line", "линейка"], productName: ["product_name", "product", "product_raw", "normalized_product", "name", "flavor", "название", "вкус", "вкус_/_продукт"], canonicalProductId: ["canonical_product_id", "canonical_id"],
  description: ["description", "описание", "описание_вкуса", "краткое_описание"], strength: ["strength", "крепость", "крепость_1–5"], tags: ["tags", "теги", "категории", "категории_вкуса", "dominant_direction"], sourceUrl: ["source_url", "htreviews_url", "url", "ссылка", "источник"], author: ["author", "source_author", "автор", "канал"], observation: ["observation", "public_note", "experience", "реальный_опыт", "наблюдение", "отзыв"],
  rating: ["rating", "рейтинг", "оценка", "оценка_1–10"], ratingScale: ["rating_scale", "шкала"], sampleSize: ["sample_size", "votes", "голоса", "количество_оценок", "количество_обзоров"], preliminaryValue: ["preliminary_value", "предположение", "уровень_карточки"], preliminaryConfidence: ["preliminary_confidence", "уверенность_предположения", "надёжность_профиля"],
  position: ["position", "index", "component_index", "component_order", "позиция"], percentage: ["percentage", "percent", "процент", "%"], approximatePercentage: ["approximate_percentage", "примерный_процент"], parts: ["parts", "части"], grams: ["grams", "граммы", "вес"], totalWeight: ["total_weight", "общий_вес"], proportionType: ["proportion_type", "тип_пропорции", "ratio_quality"], role: ["role", "роль"],
  tested: ["tested", "протестирован"], exportReady: ["export_ready", "готов_к_экспорту"], channel: ["source_channel", "канал_источника"],
} as const;
