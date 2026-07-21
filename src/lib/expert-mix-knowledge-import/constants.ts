import type { ExpertMixImportOptions } from "./types";

export const REQUIRED_EXPERT_MIX_SHEETS = ["ОСНОВНАЯ_БАЗА", "Mixes_Internal", "Mix_Components"] as const;
export const OPTIONAL_EXPERT_MIX_SHEETS = ["App_Tobacco", "App_Mixes"] as const;
export const DEFAULT_EXPERT_MIX_IMPORT_OPTIONS: ExpertMixImportOptions = { strictMode: false, percentageTolerance: 1, allowMissingOptionalSheets: true, includeArchived: true, includeRejected: false, includePreliminaryInferences: true, includeExternalRatings: true, includePrivateEvidence: true, failOnAmbiguousIdentity: false, failOnUnresolvedIdentity: false };
export const HEADER_ALIASES = {
  mixId: ["mix_id", "mixid", "id_микса", "ид_микса"], status: ["status", "статус"], title: ["title", "название_микса", "микс"],
  manufacturer: ["manufacturer", "brand", "производитель", "бренд"], productLine: ["product_line", "line", "линейка"], productName: ["product_name", "name", "flavor", "название", "вкус"], canonicalProductId: ["canonical_product_id", "canonical_id"],
  description: ["description", "описание"], strength: ["strength", "крепость"], tags: ["tags", "теги", "категории"], sourceUrl: ["source_url", "url", "ссылка", "источник"], author: ["author", "автор", "канал"], observation: ["observation", "experience", "реальный_опыт", "наблюдение", "отзыв"],
  rating: ["rating", "рейтинг", "оценка"], ratingScale: ["rating_scale", "шкала"], sampleSize: ["sample_size", "votes", "голоса", "количество_оценок"], preliminaryValue: ["preliminary_value", "предположение"], preliminaryConfidence: ["preliminary_confidence", "уверенность_предположения"],
  position: ["position", "index", "component_index", "позиция"], percentage: ["percentage", "percent", "процент", "%"], approximatePercentage: ["approximate_percentage", "примерный_процент"], parts: ["parts", "части"], grams: ["grams", "граммы", "вес"], totalWeight: ["total_weight", "общий_вес"], proportionType: ["proportion_type", "тип_пропорции"], role: ["role", "роль"],
} as const;
