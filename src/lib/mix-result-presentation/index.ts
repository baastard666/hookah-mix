import type { MixAnalysisResult } from "../mix-analysis";
import type { MixAnalysis } from "../mix-analyzer";
import type { MixRecommendation, MixRecommendationResult, SuggestedMixVariant } from "../mix-recommendation";

export type BreakdownKey = keyof MixAnalysisResult["scoring"]["scoreBreakdown"];
export type PublicRiskLevel = "Низкий" | "Средний" | "Высокий";
export type PublicRisk = { readonly id: string; readonly title: string; readonly level: PublicRiskLevel; readonly reason: string; readonly recommendation: string };
export type PublicRecommendation = Omit<MixRecommendation, "id" | "reasons" | "sourceRuleIds" | "knowledgeClaimIds"> & { readonly reasons: readonly { readonly code: MixRecommendation["reasons"][number]["code"] }[] };

const TASTE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  coffee: "кофе", cream: "сливки", dairy: "сливочные ноты", roasted: "обжаренные ноты", dessert: "десертные ноты",
  banana: "банан", vanilla: "ваниль", chocolate: "шоколад", "dark chocolate": "тёмный шоколад", cocoa: "какао",
  mint: "мята", cooling: "холод", fresh: "свежесть", freshness: "свежесть", lemon: "лимон", citrus: "цитрус",
  mango: "манго", coconut: "кокос", berry: "ягоды", fruit: "фрукты", tropical: "тропические фрукты",
  floral: "цветочные ноты", herbal: "травяные ноты", spice: "специи", smoky: "дымные ноты", tobacco: "табачные ноты",
  sweet: "сладость", sour: "кислые ноты", bakery: "выпечка", candy: "конфеты", nut: "орехи", beverage: "напиток", tea: "чай",
});

const normalizeTag = (value: string): string => value.trim().replace(/([a-zа-яё])([A-ZА-ЯЁ])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
export const localizeTasteTag = (value: string): string => {
  const normalized = normalizeTag(value);
  if (!normalized) return "другая вкусовая нота";
  return TASTE_LABELS[normalized] ?? normalized;
};

const formatList = (items: readonly string[]): string => {
  const unique = [...new Set(items.filter(Boolean))];
  if (unique.length < 2) return unique[0] ?? "мягкий смешанный профиль";
  return `${unique.slice(0, -1).join(", ")} и ${unique.at(-1)}`;
};
const scoreExplanation = (key: BreakdownKey, value: number): string => {
  const strong = value >= 8; const weak = value < 6;
  const messages: Record<BreakdownKey, [string, string, string]> = {
    compatibility: ["Вкусовые направления хорошо поддерживают друг друга.", "Сочетание в целом согласовано, но отдельные ноты требуют внимания.", "Между вкусовыми направлениями есть заметное напряжение."],
    proportions: ["Доли помогают компонентам раскрыться без потери роли.", "Пропорции рабочие, хотя влияние компонентов распределено не идеально.", "Некоторые компоненты могут потеряться или подавить остальные."],
    componentQuality: ["Характеристики выбранных компонентов хорошо подходят для смеси.", "Характеристики компонентов дают устойчивую основу.", "Профили компонентов ограничивают предсказуемость результата."],
    balance: ["Интенсивность и вкусовой профиль распределены ровно.", "Общий баланс приемлем, но есть выраженные акценты.", "Один или несколько акцентов заметно нарушают баланс."],
    risks: ["Существенных вкусовых рисков не выявлено.", "Есть контролируемые риски, которые стоит учесть.", "Обнаружены факторы, способные заметно ухудшить результат."],
    confirmations: ["Расчёт опирается на хорошо подтверждённые данные.", "Часть исходных данных подтверждена, часть остаётся предварительной.", "Подтверждений пока недостаточно для высокой уверенности."],
  };
  return messages[key][strong ? 0 : weak ? 2 : 1];
};
const breakdownLabels: Record<BreakdownKey, string> = { compatibility: "Совместимость", proportions: "Пропорции", componentQuality: "Качество компонентов", balance: "Баланс", risks: "Риски", confirmations: "Подтверждения" };

const statusLabel = (status: MixAnalysisResult["canonicalMix"]["componentResolutions"][number]["resolution"]["status"]): string => ({
  RESOLVED: "Распознан точно", MANUFACTURER_ONLY: "Распознан только производитель", AMBIGUOUS: "Распознан неоднозначно", UNRESOLVED: "Не распознан",
}[status]);

const recommendationKey = (item: MixRecommendation): string => {
  const reason = [...new Set(item.reasons.map(entry => entry.code))].sort().join("|");
  const components = [...item.componentIds].map(String).sort().join("|");
  const categories = [...item.categoryIds].sort().join("|");
  const family = item.type === "PRESERVE_CURRENT_MIX" ? "preserve" : item.type === "INSUFFICIENT_DATA" ? "data" : item.type;
  return `${family}:${reason}:${components}:${categories}`;
};
export const deduplicateRecommendations = (result: MixRecommendationResult): readonly MixRecommendation[] => {
  const visible = result.recommendations.filter(item => !["PRESERVE_CURRENT_MIX", "INSUFFICIENT_DATA"].includes(item.type));
  return [...new Map(visible.map(item => [recommendationKey(item), item])).values()];
};
const toPublicRecommendation = (item: MixRecommendation): PublicRecommendation => ({
  type: item.type, priority: item.priority, confidenceScore: item.confidenceScore, impactScore: item.impactScore,
  componentIds: item.componentIds, characteristicKeys: item.characteristicKeys, noteIds: item.noteIds, categoryIds: item.categoryIds,
  action: item.action, reasons: [...new Map(item.reasons.map(reason => [reason.code, { code: reason.code }])).values()],
});

const buildHeatRisk = (legacy: MixAnalysis, options: { bowlType: string; coalCount: number; warmupMinutes: number }, heatResistance: number): PublicRisk | null => {
  if (legacy.overheatingRisk === "низкий") return null;
  const reasons: string[] = [];
  if (options.coalCount === 4) reasons.push("используются четыре угля");
  if (options.warmupMinutes > 6) reasons.push(`прогрев длится ${options.warmupMinutes} минут`);
  if (heatResistance < 7) reasons.push(`средняя жаростойкость смеси ${heatResistance}/10`);
  if (/турк|Turkish/i.test(options.bowlType)) reasons.push("турка концентрирует жар");
  const reason = reasons.length ? `Риск повышен: ${formatList(reasons)}.` : "Текущий режим жара требует контроля во время сессии.";
  return { id: "heat", title: "Перегрев", level: legacy.overheatingRisk === "высокий" ? "Высокий" : "Средний", reason, recommendation: options.coalCount === 4 ? "После прогрева перейдите на три угля и держите их ближе к краю." : "Контролируйте горечь и при её появлении уменьшите жар." };
};

const riskRecommendation = (ruleId: string): string => {
  if (ruleId.includes("cooling")) return "Снизьте долю холодного компонента или сделайте его лёгким акцентом.";
  if (ruleId.includes("acidity") || ruleId.includes("sour")) return "Уменьшите долю кислого направления на 5–10% и перепроверьте баланс.";
  if (ruleId.includes("domin") || ruleId.includes("bright") || ruleId.includes("overload") || ruleId.includes("extreme")) return "Снизьте долю самого интенсивного компонента на 5–10%.";
  if (ruleId.includes("proportion") || ruleId.includes("lost") || ruleId.includes("weak")) return "Перераспределите 5–10% в пользу теряющегося компонента.";
  return "Скорректируйте конфликтующее направление небольшим шагом в 5–10%.";
};

export const buildMixResultPresentation = (input: {
  readonly analysis: MixAnalysisResult;
  readonly legacyAnalysis: MixAnalysis;
  readonly preparation: { readonly bowlType: string; readonly coalCount: number; readonly warmupMinutes: number };
}) => {
  const { analysis, legacyAnalysis, preparation } = input;
  const resolutions = analysis.canonicalMix.componentResolutions;
  const counts = { RESOLVED: 0, MANUFACTURER_ONLY: 0, AMBIGUOUS: 0, UNRESOLVED: 0 };
  for (const item of resolutions) counts[item.resolution.status] += 1;
  const resolved = counts.RESOLVED; const total = resolutions.length;
  const uncertain = counts.MANUFACTURER_ONLY + counts.AMBIGUOUS + counts.UNRESOLVED;
  const confidenceReasons: string[] = [resolved === total ? `Все ${total} компонента распознаны точно.` : `${resolved} из ${total} компонентов распознаны точно; ${uncertain} ${uncertain === 1 ? "требует" : "требуют"} уточнения.`];
  if (analysis.scoring.predictionConfidence.profileCoverage < 75) confidenceReasons.push(`Надёжность вкусовых профилей составляет ${analysis.scoring.predictionConfidence.profileCoverage}%.`);
  if (!analysis.scoring.isVerifiedSmokeScore) confidenceReasons.push("Результат реального покура пока отсутствует.");
  else confidenceReasons.push("Результат реального покура сохранён отдельно от прогноза.");
  const fallbackShare = analysis.canonicalMix.components.filter(item => item.effectiveProfile.usedFallback).reduce((sum, item) => sum + item.percentage, 0);
  const lowReliabilityShare = analysis.canonicalMix.components.filter(item => item.effectiveProfile.profileReliability === "LOW").reduce((sum, item) => sum + item.percentage, 0);
  const qualityReasons: string[] = [];
  if (fallbackShare > 0) qualityReasons.push(`Для ${Math.round(fallbackShare)}% смеси использован нейтральный резервный профиль${lowReliabilityShare > 0 ? " с низкой надёжностью" : ""}.`);
  else if (lowReliabilityShare > 0) qualityReasons.push(`У ${Math.round(lowReliabilityShare)}% смеси низкая надёжность профильных данных.`);
  if (uncertain) qualityReasons.push("Часть компонентов распознана не полностью или неоднозначно.");
  if (!analysis.scoring.isVerifiedSmokeScore) qualityReasons.push("Оценка реального покура ещё не добавлена.");
  if (!qualityReasons.length) qualityReasons.push("Идентичность и профильные данные компонентов подтверждены.");

  const compatibilityRisks: PublicRisk[] = analysis.compatibility.conflicts.map(item => ({ id: item.ruleId, title: item.title, level: item.severity === "HIGH" ? "Высокий" : item.severity === "MEDIUM" ? "Средний" : "Низкий", reason: item.description, recommendation: riskRecommendation(item.ruleId) }));
  const warningRisks: PublicRisk[] = analysis.compatibility.warnings.filter(item => item.impact < 0).map(item => ({ id: item.ruleId, title: item.title, level: Math.abs(item.impact) >= 0.7 ? "Высокий" : Math.abs(item.impact) >= 0.5 ? "Средний" : "Низкий", reason: item.description, recommendation: riskRecommendation(item.ruleId) }));
  const heatRisk = buildHeatRisk(legacyAnalysis, preparation, analysis.mixProfile.profile.heatResistance);
  const risks = [...new Map([...(heatRisk ? [heatRisk] : []), ...compatibilityRisks, ...warningRisks].map(item => [item.id, item])).values()];
  const dominantNotes = analysis.mixProfile.dominantNotes.map(note => localizeTasteTag(note.noteSlug || note.noteName));
  const backgroundNotes = analysis.mixProfile.backgroundNotes.map(note => localizeTasteTag(note.noteSlug || note.noteName));
  const profileSummary = `Ведущее направление — ${formatList(dominantNotes)}. ${analysis.mixProfile.dominantComponent.brandName} ${analysis.mixProfile.dominantComponent.flavorName} задаёт ${analysis.mixProfile.dominanceLevel === "CLEAR" ? "ясную основу" : "заметную основу"} смеси.`;
  const strengths = [...new Map(analysis.compatibility.positiveFactors.map(item => [item.category, item.description])).values()].slice(0, 3);

  return {
    predictedScore: { title: "Прогнозная оценка", value: analysis.scoring.predictedQualityScore, description: "Оценка рассчитана на основе состава, пропорций и известных характеристик табаков." },
    verifiedSmoke: analysis.scoring.verifiedSmokeScore === null ? { title: "Реальный покур", value: null, description: "Реальный покур ещё не добавлен." } : { title: "Оценка после покура", value: analysis.scoring.verifiedSmokeScore, description: "Практическая оценка хранится отдельно от прогноза." },
    breakdown: (Object.keys(breakdownLabels) as BreakdownKey[]).map(key => ({ key, label: breakdownLabels[key], value: analysis.scoring.scoreBreakdown[key], explanation: scoreExplanation(key, analysis.scoring.scoreBreakdown[key]) })),
    confidence: { label: analysis.scoring.predictionConfidence.finalConfidenceLabel, score: analysis.scoring.predictionConfidence.score, summary: `Уверенность ${analysis.scoring.predictionConfidence.finalConfidenceLabel.toLocaleLowerCase("ru-RU")}: ${confidenceReasons.slice(0, 3).join(" ")}`, reasons: confidenceReasons.slice(0, 3) },
    dataQuality: { value: analysis.scoring.dataQuality, reasons: qualityReasons.slice(0, 3) },
    resolution: {
      total, resolved, manufacturerOnly: counts.MANUFACTURER_ONLY, ambiguous: counts.AMBIGUOUS, unresolved: counts.UNRESOLVED,
      summary: resolved === total ? `Все компоненты распознаны точно: ${resolved} из ${total}.` : `Точно распознано ${resolved} из ${total}; требуют уточнения — ${uncertain}.`,
      components: resolutions.map(item => {
        const effective = analysis.canonicalMix.components.find(component => component.sourceComponentIds.includes(item.sourceComponentId));
        const reliability = effective?.effectiveProfile.profileReliability;
        return {
        name: [item.resolution.canonicalManufacturer ?? item.rawIdentity.manufacturer, item.resolution.canonicalProductLine, item.resolution.canonicalProductName ?? item.rawIdentity.productName].filter(Boolean).join(" ") || "Неизвестный компонент",
        percentage: item.percentage, status: statusLabel(item.resolution.status), profileReliability: reliability === "HIGH" ? "Высокая надёжность профиля" : reliability === "MEDIUM" ? "Средняя надёжность профиля" : "Низкая надёжность профиля",
      }; }),
    },
    profile: { summary: profileSummary, dominantNotes, backgroundNotes },
    strengths,
    risks,
    actions: deduplicateRecommendations(analysis.recommendations).map(toPublicRecommendation),
    recommendationStatus: analysis.recommendations.status,
    suggestedVariant: analysis.recommendations.summary.suggestedMixVariant as SuggestedMixVariant | undefined,
    preparationRecommendations: [...new Set(legacyAnalysis.heatRecommendations)],
  } as const;
};

export type MixResultPresentation = ReturnType<typeof buildMixResultPresentation>;
