import type { MixAnalysisResult } from "../mix-analysis";
import type { MixAnalysis } from "../mix-analyzer";
import { groupCompatibilityRisks } from "../canonical-mix-scoring";
import type { PreparedCanonicalComponent, PublicProfileStatus } from "../canonical-mix-scoring";
import type { MixRecommendation, MixRecommendationResult, SuggestedMixVariant } from "../mix-recommendation";
import { calculateMixProfile } from "../mix-profile";

export type BreakdownKey = keyof MixAnalysisResult["scoring"]["scoreBreakdown"];
export type PublicRiskLevel = "Низкий" | "Средний" | "Высокий";
export type PublicRisk = { readonly id: string; readonly title: string; readonly level: PublicRiskLevel; readonly reason: string; readonly recommendation: string };
export type ActualMixRole = "DOMINANT_BASE" | "DOMINANT" | "BASE" | "SUPPORT" | "SUPPORT_COOLING" | "ACCENT" | "ACCENT_COOLING";
export type PublicRecommendation = Omit<MixRecommendation, "id" | "reasons" | "sourceRuleIds" | "knowledgeClaimIds" | "categoryIds"> & {
  readonly reasons: readonly { readonly code: MixRecommendation["reasons"][number]["code"] }[];
  readonly directionLabels: readonly string[];
  readonly rangeLabel: "Рабочий диапазон" | "Предварительный диапазон" | null;
  readonly proposedActualMixRole: string | null;
};

const TASTE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  coffee: "кофе", cream: "сливки", dairy: "сливочные ноты", roasted: "обжаренные ноты", dessert: "десертные ноты",
  banana: "банан", vanilla: "ваниль", chocolate: "шоколад", "dark chocolate": "тёмный шоколад", cocoa: "какао",
  cola: "кола", mint: "мята", cooling: "холод", fresh: "свежесть", freshness: "свежесть", lemon: "лимон", citrus: "цитрус",
  mango: "манго", coconut: "кокос", berry: "ягоды", fruit: "фрукты", tropical: "тропические фрукты",
  floral: "цветочные ноты", herbal: "травянистые ноты", spice: "специи", smoky: "дымные ноты", tobacco: "табачные ноты",
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
const scoreExplanation = (key: BreakdownKey, value: number, riskCount = 0): string => {
  const strong = value >= 8; const weak = value < 6;
  const messages: Record<BreakdownKey, [string, string, string]> = {
    compatibility: ["Вкусовые направления хорошо поддерживают друг друга.", "Сочетание в целом согласовано, но отдельные ноты требуют внимания.", "Между вкусовыми направлениями есть заметное напряжение."],
    proportions: ["Доли помогают компонентам раскрыться без потери роли.", "Пропорции рабочие, хотя влияние компонентов распределено не идеально.", "Некоторые компоненты могут потеряться или подавить остальные."],
    componentQuality: ["Характеристики выбранных компонентов хорошо подходят для смеси.", "Характеристики компонентов дают устойчивую основу.", "Профили компонентов ограничивают предсказуемость результата."],
    balance: ["Интенсивность и вкусовой профиль распределены ровно.", "Общий баланс приемлем, но есть выраженные акценты.", "Один или несколько акцентов заметно нарушают баланс."],
    risks: ["Существенных вкусовых рисков не выявлено.", "Есть контролируемые риски, которые стоит учесть.", "Обнаружены факторы, способные заметно ухудшить результат."],
    confirmations: ["Расчёт опирается на хорошо подтверждённые данные.", "Часть исходных данных подтверждена, часть остаётся предварительной.", "Подтверждений пока недостаточно для высокой уверенности."],
  };
  if (key === "risks" && riskCount > 0) return value >= 8 ? "Есть отдельные риски, но они не критичны." : value >= 5 ? "В составе присутствуют заметные риски." : "Риски могут существенно ухудшить результат.";
  return messages[key][strong ? 0 : weak ? 2 : 1];
};
const breakdownLabels: Record<BreakdownKey, string> = { compatibility: "Совместимость", proportions: "Пропорции", componentQuality: "Потенциал компонентов", balance: "Баланс", risks: "Устойчивость к рискам", confirmations: "Подтверждения" };

const statusLabel = (status: MixAnalysisResult["canonicalMix"]["componentResolutions"][number]["resolution"]["status"], catalogFound: boolean): string => ({
  RESOLVED: "Точно сопоставлен",
  MANUFACTURER_ONLY: "Подтверждён производитель, но конкретный продукт не определён",
  AMBIGUOUS: "Найдено несколько вариантов сопоставления; конкретная линейка не выбрана",
  UNRESOLVED: catalogFound ? "Товар найден в каталоге, но точное сопоставление с базой продуктов пока не подтверждено" : "Точное сопоставление с базой продуктов отсутствует",
}[status]);

const profileStatusLabel = (status: PublicProfileStatus): string => ({
  CONFIRMED: "Подтверждённый профиль", HIGH_RELIABILITY: "Высокая надёжность профиля", MEDIUM_RELIABILITY: "Средняя надёжность профиля",
  PRELIMINARY: "Для расчёта используется предварительный профиль", FALLBACK: "Для расчёта используется предварительный профиль", MISSING: "Вкусовой профиль отсутствует",
}[status]);

export const actualMixRoleFor = (component: PreparedCanonicalComponent, dominantId: string): ActualMixRole => {
  const dominant = String(component.flavorId) === dominantId;
  // ADR-015: cooling is a secondary field and may be null ("not measured") - an unmeasured component is never treated as cooling.
  const cooling = component.profile.cooling !== null && component.profile.cooling >= 7;
  if (dominant && component.percentage >= 45) return "DOMINANT_BASE";
  if (dominant) return "DOMINANT";
  if (component.percentage >= 45) return "BASE";
  if (component.percentage >= 20) return cooling ? "SUPPORT_COOLING" : "SUPPORT";
  return cooling ? "ACCENT_COOLING" : "ACCENT";
};
const actualRoleLabel = (role: ActualMixRole): string => ({ DOMINANT_BASE: "основа и доминирующий компонент", DOMINANT: "доминирующий компонент", BASE: "основа", SUPPORT: "поддержка", SUPPORT_COOLING: "поддержка и холодящий компонент", ACCENT: "акцент", ACCENT_COOLING: "холодящий акцент" }[role]);
const recommendedRoleLabel = (role: PreparedCanonicalComponent["effectiveProfile"]["recommendedRole"]): string | null => role ? ({ BASE: "основа", SUPPORT: "поддержка", ACCENT: "акцент", COOLING: "холодящий компонент", ACIDIFIER: "кислотный акцент", SWEETENER: "подсластитель", TEXTURE: "текстура", SPICE: "пряный акцент" }[role]) : null;

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
type EffectivePresentationMix = Pick<MixAnalysisResult, "canonicalMix" | "mixProfile">;

const directionLabelFor = (noteLabel: string, category: string): string => {
  if (["DRINK", "BEVERAGE"].includes(category)) return "Напиток";
  if (category === "MINT") return noteLabel[0]?.toLocaleUpperCase("ru-RU") + noteLabel.slice(1);
  if (category === "COOLING" && !["холод", "свежесть"].includes(noteLabel)) return noteLabel[0]?.toLocaleUpperCase("ru-RU") + noteLabel.slice(1);
  const labels: Readonly<Record<string, string>> = {
    BERRY: "Ягоды", FRUIT: "Фрукты", CITRUS: "Цитрус", TROPICAL: "Тропики", FLORAL: "Цветы", HERBAL: "Травы",
    MINT: "Мята", COOLING: "Холод", SPICE: "Специи", DESSERT: "Десерт", DAIRY: "Сливочность", CREAMY: "Сливочность",
    VANILLA: "Ваниль", TEA: "Чай", COFFEE: "Кофе", NUT: "Орех", BAKERY: "Выпечка", CANDY: "Конфеты",
    CHOCOLATE: "Шоколад", ALCOHOL: "Алкогольное направление", WOODY: "Древесность", SMOKY: "Дымность", TOBACCO: "Табачность",
    SOUR: "Кислое направление", FRESH: "Свежесть",
  };
  return labels[category] ?? (noteLabel[0]?.toLocaleUpperCase("ru-RU") + noteLabel.slice(1));
};

const effectiveDirectionLabels = (mix: EffectivePresentationMix): readonly string[] => {
  const meaningful = meaningfulProfileNotes(mix);
  const directions = meaningful.dominant.map(noteLabel => {
    const source = mix.canonicalMix.components.flatMap(component => component.notes)
      .find(note => localizeTasteTag(note.noteSlug || note.noteName) === noteLabel);
    return directionLabelFor(noteLabel, source?.category ?? "OTHER");
  });
  const hasCoolingDirection = (mix.mixProfile.profile.cooling !== null && mix.mixProfile.profile.cooling >= 2)
    || mix.canonicalMix.components.some(component => component.percentage >= 15 && component.profile.cooling !== null && component.profile.cooling >= 7);
  if (hasCoolingDirection) directions.push("Холод");
  return [...new Set(directions)].slice(0, 4);
};

const actionComponentId = (item: MixRecommendation): string | null => {
  if (item.action.type === "DECREASE_COMPONENT" || item.action.type === "INCREASE_COMPONENT" || item.action.type === "REMOVE_COMPONENT") return item.action.componentId;
  if (item.action.type === "REBALANCE_COMPONENTS") return item.action.primaryComponentId ?? item.action.adjustments[0]?.componentId ?? null;
  return item.componentIds[0] ?? null;
};

const actionHasRange = (item: MixRecommendation): boolean => ["DECREASE_COMPONENT", "INCREASE_COMPONENT"].includes(item.action.type)
  || (item.action.type === "REBALANCE_COMPONENTS" && item.action.adjustments.length > 0);

const toPublicRecommendation = (item: MixRecommendation, mix: EffectivePresentationMix, proposed: boolean): PublicRecommendation => {
  const componentId = actionComponentId(item);
  const component = componentId ? mix.canonicalMix.components.find(entry => String(entry.flavorId) === componentId) : undefined;
  const dominantId = String(mix.mixProfile.dominantComponent.flavorId);
  return {
    type: item.type, priority: item.priority, confidenceScore: item.confidenceScore, impactScore: item.impactScore,
    componentIds: item.componentIds, characteristicKeys: item.characteristicKeys, noteIds: item.noteIds,
    action: item.action, reasons: [...new Map(item.reasons.map(reason => [reason.code, { code: reason.code }])).values()],
    directionLabels: effectiveDirectionLabels(mix),
    rangeLabel: actionHasRange(item) ? (component?.profileStatus === "CONFIRMED" ? "Рабочий диапазон" : "Предварительный диапазон") : null,
    proposedActualMixRole: proposed && component ? actualRoleLabel(actualMixRoleFor(component, dominantId)) : null,
  };
};

// ADR-017: heatResistance may be null ("not measured" for the whole mix) - the reason line about it is
// simply omitted rather than computed from a guessed number.
const buildHeatRisk = (legacy: MixAnalysis, options: { bowlType: string; coalCount: number; warmupMinutes: number }, heatResistance: number | null): PublicRisk | null => {
  if (legacy.overheatingRisk === "низкий") return null;
  const reasons: string[] = [];
  if (options.coalCount === 4) reasons.push("используются четыре угля");
  if (options.warmupMinutes > 6) reasons.push(`прогрев длится ${options.warmupMinutes} минут`);
  if (heatResistance !== null && heatResistance < 7) reasons.push(`средняя жаростойкость смеси ${heatResistance}/10`);
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

const compatibilityPublicRisks = (analysis: MixAnalysisResult): PublicRisk[] => groupCompatibilityRisks(analysis.compatibility).map(group => {
  const component = group.componentId ? analysis.canonicalMix.components.find(item => String(item.flavorId) === group.componentId) : undefined;
  const componentName = component ? `${component.brandName} ${component.flavorName}` : "Компонент";
  if (group.causeKey.startsWith("DOMINANT_COMPONENT_HIGH_SHARE:")) {
    return {
      id: group.causeKey,
      title: "Сильное доминирование компонента",
      level: group.severity === "HIGH" ? "Высокий" : group.severity === "MEDIUM" ? "Средний" : "Низкий",
      reason: `${componentName} занимает ${component?.percentage ?? 0}% смеси и может подавить остальные ноты.`,
      recommendation: `Уменьшите долю ${component ? componentName : "доминирующего компонента"}.`,
    };
  }
  const strongest = group.factors[0];
  return {
    id: group.causeKey,
    title: strongest.title,
    level: group.severity === "HIGH" ? "Высокий" : group.severity === "MEDIUM" ? "Средний" : "Низкий",
    reason: [...new Set(group.factors.map(item => item.description))].join(" "),
    recommendation: riskRecommendation(strongest.ruleId),
  };
});

const meaningfulProfileNotes = (analysis: EffectivePresentationMix): { dominant: string[]; background: string[] } => {
  const significantComponentNotes = analysis.canonicalMix.components
    .filter(component => component.percentage >= 15)
    .map(component => component.notes.filter(note => note.noteType === "DOMINANT").sort((a, b) => b.intensity - a.intensity || a.noteSlug.localeCompare(b.noteSlug, "en"))[0])
    .filter((note): note is NonNullable<typeof note> => Boolean(note))
    .map(note => localizeTasteTag(note.noteSlug || note.noteName));
  const analytical = analysis.mixProfile.dominantNotes.map(note => localizeTasteTag(note.noteSlug || note.noteName));
  const significant = [...new Set(significantComponentNotes)];
  const dominant = (significant.length >= 2 ? significant : [...new Set([...significant, ...analytical])]).slice(0, 3);
  const otherNotes = [...analysis.mixProfile.secondaryNotes, ...analysis.mixProfile.backgroundNotes, ...analysis.mixProfile.dominantNotes]
    .map(note => localizeTasteTag(note.noteSlug || note.noteName))
    .filter(note => !dominant.includes(note));
  return { dominant, background: [...new Set(otherNotes)].slice(0, 5) };
};

// ADR-015: creaminess/bitterness may be null ("not measured") for the aggregated mix profile - render an
// explicit "нет данных" state instead of computing a number from null (which would look like a real 0/10 reading).
const displayMetric = (value: number | null, reliability: "LOW" | "MEDIUM" | "HIGH"): string => {
  if (value === null) return "нет данных";
  if (reliability === "HIGH") return `${value}/10`;
  if (reliability === "MEDIUM") return `ориентировочно ${Math.round(value * 2) / 2}/10`;
  return `около ${Math.round(value)}/10`;
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
  // ADR-022: methodological transparency, not an excuse - совпадение пропорций с проверенным рецептом и число
  // независимых источников по конкретному сочетанию сегодня физически не отслеживаются ни для одного продукта
  // в каталоге, поэтому эти оси не участвуют в весе оценки уверенности (см. ADR-021/ADR-022).
  confidenceReasons.push("Совпадение пропорций с проверенным рецептом и число независимых источников по этому сочетанию пока не отслеживаются и не влияют на оценку уверенности.");
  const fallbackShare = analysis.canonicalMix.components.filter(item => item.effectiveProfile.usedFallback).reduce((sum, item) => sum + item.percentage, 0);
  const lowReliabilityShare = analysis.canonicalMix.components.filter(item => item.effectiveProfile.profileReliability === "LOW").reduce((sum, item) => sum + item.percentage, 0);
  const qualityReasons: string[] = [];
  const preliminaryShare = analysis.canonicalMix.components.filter(item => item.profileStatus === "PRELIMINARY").reduce((sum, item) => sum + item.percentage, 0);
  if (fallbackShare > 0) qualityReasons.push(`Для ${Math.round(fallbackShare)}% смеси использован нейтральный резервный профиль${lowReliabilityShare > 0 ? " с низкой надёжностью" : ""}.`);
  else if (preliminaryShare > 0) qualityReasons.push(`Для ${Math.round(preliminaryShare)}% смеси используются предварительные вкусовые профили.`);
  else if (lowReliabilityShare > 0) qualityReasons.push(`У ${Math.round(lowReliabilityShare)}% смеси низкая надёжность профильных данных.`);
  if (uncertain) qualityReasons.push("Часть компонентов распознана не полностью или неоднозначно.");
  if (!analysis.scoring.isVerifiedSmokeScore) qualityReasons.push("Оценка реального покура ещё не добавлена.");
  if (!qualityReasons.length) qualityReasons.push("Идентичность и профильные данные компонентов подтверждены.");

  const heatRisk = buildHeatRisk(legacyAnalysis, preparation, analysis.mixProfile.profile.heatResistance);
  const risks = [...(heatRisk ? [heatRisk] : []), ...compatibilityPublicRisks(analysis)];
  const profileNotes = meaningfulProfileNotes(analysis);
  const dominantNotes = profileNotes.dominant;
  const backgroundNotes = profileNotes.background;
  const profileTitle = dominantNotes.slice(0, 2).map((note, index) => index === 0 ? note[0].toLocaleUpperCase("ru-RU") + note.slice(1) : note).join(" + ");
  const profileSummary = `${profileTitle}. ${analysis.mixProfile.dominantComponent.brandName} ${analysis.mixProfile.dominantComponent.flavorName} задаёт ${analysis.mixProfile.dominanceLevel === "CLEAR" ? "ясную основу" : "заметную основу"} смеси.`;
  const strengths = [...new Map(analysis.compatibility.positiveFactors.map(item => [item.category, item.description])).values()].slice(0, 3);
  const dominantId = String(analysis.mixProfile.dominantComponent.flavorId);
  const hasPreliminary = analysis.canonicalMix.components.some(component => ["PRELIMINARY", "FALLBACK", "MISSING"].includes(component.profileStatus));
  const displayReliability: "LOW" | "MEDIUM" | "HIGH" = hasPreliminary ? "LOW" : analysis.canonicalMix.components.some(component => component.effectiveProfile.profileReliability !== "HIGH") ? "MEDIUM" : "HIGH";
  const acceptedProposal = analysis.proposalComparison?.accepted ? analysis.proposalComparison : undefined;
  const proposedPercentages = new Map(acceptedProposal?.variant.components.map(component => [component.componentId, component.suggestedPercentage]) ?? []);
  const proposedComponents = analysis.canonicalMix.components.map(component => ({
    ...component,
    percentage: proposedPercentages.get(String(component.flavorId)) ?? component.percentage,
  }));
  const proposedEffectiveMix: EffectivePresentationMix | undefined = acceptedProposal ? {
    canonicalMix: { ...analysis.canonicalMix, components: proposedComponents },
    mixProfile: calculateMixProfile(proposedComponents),
  } : undefined;
  const mainRisk = risks.find(risk => risk.id !== "heat");
  const proposalChange = acceptedProposal?.variant.components.find(component => component.suggestedPercentage < component.currentPercentage)
    ?? acceptedProposal?.variant.components.find(component => component.currentPercentage !== component.suggestedPercentage);
  const proposalComponent = proposalChange ? analysis.canonicalMix.components.find(component => String(component.flavorId) === proposalChange.componentId) : undefined;
  const summary = mainRisk
    ? `${hasPreliminary ? "Предварительно рабочее" : "Рабочее"} сочетание, но ${mainRisk.reason}`
    : `${hasPreliminary ? "Предварительно " : ""}сочетание выглядит рабочим; значимых вкусовых рисков не выявлено.`;
  const changedProposalComponents = acceptedProposal?.variant.components.filter(component => component.currentPercentage !== component.suggestedPercentage) ?? [];
  const decreased = changedProposalComponents.find(change => change.suggestedPercentage < change.currentPercentage);
  const increased = changedProposalComponents.find(change => change.suggestedPercentage > change.currentPercentage);
  const decreasedComponent = decreased ? analysis.canonicalMix.components.find(item => String(item.flavorId) === decreased.componentId) : undefined;
  const increasedComponent = increased ? analysis.canonicalMix.components.find(item => String(item.flavorId) === increased.componentId) : undefined;
  const exactTwoComponentAction = acceptedProposal?.variant.components.length === 2 && decreased && increased && decreasedComponent && increasedComponent
    ? `Уменьшите долю ${decreasedComponent.brandName} ${decreasedComponent.flavorName} до ${decreased.suggestedPercentage}%, а долю ${increasedComponent.brandName} ${increasedComponent.flavorName} увеличьте до ${increased.suggestedPercentage}%.`
    : null;
  const primaryAction = exactTwoComponentAction
    ? exactTwoComponentAction
    : acceptedProposal && proposalChange && proposalComponent
    ? `Попробуйте уменьшить долю ${proposalComponent.brandName} ${proposalComponent.flavorName} до ${proposalChange.suggestedPercentage}% и перераспределить освободившуюся долю между остальными компонентами.`
    : "Точные пропорции стоит подтвердить контрольным покуром.";

  return {
    summary: { text: summary, primaryAction },
    predictedScore: { title: displayReliability === "LOW" ? "Ориентировочная прогнозная оценка" : "Прогнозная оценка", value: analysis.scoring.predictedQualityScore, description: "Оценка рассчитана на основе состава, пропорций и известных характеристик табаков." },
    verifiedSmoke: analysis.scoring.verifiedSmokeScore === null ? { title: "Реальный покур", value: null, description: "Реальный покур ещё не добавлен." } : { title: "Оценка после покура", value: analysis.scoring.verifiedSmokeScore, description: "Практическая оценка хранится отдельно от прогноза." },
    breakdown: (Object.keys(breakdownLabels) as BreakdownKey[]).map(key => ({ key, label: breakdownLabels[key], value: analysis.scoring.scoreBreakdown[key], explanation: scoreExplanation(key, analysis.scoring.scoreBreakdown[key], key === "risks" ? groupCompatibilityRisks(analysis.compatibility).length : 0) })),
    confidence: { label: analysis.scoring.predictionConfidence.finalConfidenceLabel, score: analysis.scoring.predictionConfidence.score, summary: `Уверенность ${analysis.scoring.predictionConfidence.finalConfidenceLabel.toLocaleLowerCase("ru-RU")}: ${confidenceReasons.slice(0, 4).join(" ")}`, reasons: confidenceReasons.slice(0, 4) },
    dataQuality: { value: analysis.scoring.dataQuality, reasons: qualityReasons.slice(0, 3) },
    resolution: {
      total, resolved, manufacturerOnly: counts.MANUFACTURER_ONLY, ambiguous: counts.AMBIGUOUS, unresolved: counts.UNRESOLVED,
      summary: resolved === total ? `Все компоненты распознаны точно: ${resolved} из ${total}.` : `Точно распознано ${resolved} из ${total}; требуют уточнения — ${uncertain}.`,
      components: resolutions.map(item => {
        const effective = analysis.canonicalMix.components.find(component => component.sourceComponentIds.includes(item.sourceComponentId));
        const reliability = effective?.effectiveProfile.profileReliability;
        return {
        name: [item.resolution.canonicalManufacturer ?? item.rawIdentity.manufacturer, item.resolution.canonicalProductLine, item.resolution.canonicalProductName ?? item.rawIdentity.productName].filter(Boolean).join(" ") || "Неизвестный компонент",
        percentage: item.percentage,
        catalogStatus: effective?.catalogStatus === "FOUND" ? "Товар найден в каталоге" : "Товар отсутствует в каталоге",
        status: statusLabel(item.resolution.status, effective?.catalogStatus === "FOUND"),
        profileStatus: profileStatusLabel(effective?.profileStatus ?? "MISSING"),
        profileReliability: reliability === "HIGH" ? "Высокая надёжность профиля" : reliability === "MEDIUM" ? "Средняя надёжность профиля" : "Низкая надёжность профиля",
        actualMixRole: effective ? actualRoleLabel(actualMixRoleFor(effective, dominantId)) : "роль не определена",
        recommendedCatalogRole: effective?.profileStatus === "CONFIRMED" ? recommendedRoleLabel(effective.effectiveProfile.recommendedRole) : null,
      }; }),
    },
    profile: {
      title: profileTitle, summary: profileSummary, dominantNotes, backgroundNotes,
      metrics: (["strength", "sweetness", "acidity", "freshness", "creaminess", "bitterness"] as const).map(key => ({ key, value: analysis.mixProfile.profile[key], displayValue: displayMetric(analysis.mixProfile.profile[key], displayReliability) })),
    },
    strengths,
    risks,
    actions: deduplicateRecommendations(analysis.recommendations).map(item => toPublicRecommendation(
      item,
      proposedEffectiveMix ?? analysis,
      Boolean(acceptedProposal),
    )),
    recommendationStatus: analysis.recommendations.status,
    suggestedVariant: acceptedProposal?.variant as SuggestedMixVariant | undefined,
    proposalComparison: acceptedProposal ? {
      current: acceptedProposal.current,
      proposed: acceptedProposal.proposed,
      changes: acceptedProposal.variant.components,
    } : undefined,
    preparation: { sourceLabel: "Параметры исходного рецепта", recommendations: [...new Set(legacyAnalysis.heatRecommendations)] },
  } as const;
};

export type MixResultPresentation = ReturnType<typeof buildMixResultPresentation>;
