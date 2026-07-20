import type { ConfidenceLevel, EvidencedValue, HeatResistance, LeafType, ManufacturerProfile, ProductLineProfile, SourceType, StrengthLevel, TobaccoProfileEvidence, TobaccoProfileRegistry } from "./types";

const CHECKED_AT = "2026-07-20";
const official = (title: string, reference: string, sourceType: SourceType = "MANUFACTURER_CLAIM"): TobaccoProfileEvidence => ({ sourceType, title, reference, checkedAt: CHECKED_AT });
const secondary = (title: string, reference: string): TobaccoProfileEvidence => ({ sourceType: "SECONDARY_SOURCES", title, reference, checkedAt: CHECKED_AT });
const internal = (title: string): TobaccoProfileEvidence => ({ sourceType: "INTERNAL_TEST", title, checkedAt: CHECKED_AT });
const value = <T>(item: T, confidence: ConfidenceLevel, evidence: readonly TobaccoProfileEvidence[], note?: string): EvidencedValue<T> => ({ value: item, confidence, evidence, ...(note ? { note } : {}) });

const darksideEvidence = [official("DARKSIDE — официальный сайт производителя", "https://darkside.ru/", "MANUFACTURER")];
const darksideHeat = value<HeatResistance>("HIGH", "HIGH", [...darksideEvidence, internal("Рабочая категориальная оценка жаростойкости v0.2.7")], "Категория предназначена для будущей технической модели и не задаёт режим жара.");

const manufacturers: readonly ManufacturerProfile[] = [
  { manufacturerId: "darkside", manufacturer: "Darkside", aliases: ["DARKSIDE"], heatResistance: darksideHeat, leafTypes: value<readonly LeafType[]>(["BLEND"], "MEDIUM", darksideEvidence, "Состав может различаться между линейками."), dataConfidence: "HIGH", sourceTypes: ["MANUFACTURER", "INTERNAL_TEST"], notes: ["Единая крепость намеренно не задана: она зависит от линейки."] },
  { manufacturerId: "blackburn", manufacturer: "BlackBurn", aliases: ["Blackburn", "BLACKBURN"], strengthLevel: value<StrengthLevel>("MEDIUM", "MEDIUM", [official("BlackBurn — официальный сайт", "https://www.blckburn.com/", "MANUFACTURER"), internal("Рабочая категориальная оценка крепости v0.2.7")]), heatResistance: value<HeatResistance>("HIGH", "MEDIUM", [official("Заявление BlackBurn о жаростойкости", "https://www.blckburn.com/")], "Высокая жаростойкость является заявлением производителя."), leafTypes: value<readonly LeafType[]>(["BLEND"], "MEDIUM", [secondary("Burn Community: материалы о сырье BlackBurn", "https://burncommunity.com/")]), dataConfidence: "MEDIUM", sourceTypes: ["MANUFACTURER", "MANUFACTURER_CLAIM", "SECONDARY_SOURCES", "INTERNAL_TEST"], notes: ["Точные числовые показатели намеренно не используются."] },
  { manufacturerId: "dogma", manufacturer: "Dogma", aliases: ["DOGMA", "Догма"], strengthLevel: value<StrengthLevel>("MEDIUM_HIGH", "MEDIUM", [internal("Рабочая категориальная оценка крепости v0.2.7")]), heatResistance: value<HeatResistance>("MEDIUM", "MEDIUM", [internal("Рабочая категориальная оценка жаростойкости v0.2.7")]), leafTypes: value<readonly LeafType[]>(["CIGAR"], "HIGH", [official("DOGMA: 100% сигарный табак", "https://dogma-tobacco.ru/", "MANUFACTURER")]), dataConfidence: "MEDIUM", sourceTypes: ["MANUFACTURER", "INTERNAL_TEST"], notes: ["Тип листа подтверждён производителем; сила и жаростойкость оставлены рабочими категориями."] },
  { manufacturerId: "hooligan", manufacturer: "Хулиган", aliases: ["Hooligan", "HLGN"], dataConfidence: "MEDIUM", sourceTypes: ["SECONDARY_SOURCES", "INTERNAL_TEST"], notes: ["Единая крепость не задана: Medium и Hard различаются."] },
  { manufacturerId: "musthave", manufacturer: "Musthave", aliases: ["MustHave", "Must Have", "MUSTHAVE"], strengthLevel: value<StrengthLevel>("MEDIUM", "MEDIUM", [official("MUSTHAVE: оптимальная средняя крепость", "https://musthave.ru/o-brende/")], "Самоописание производителя, без числовой шкалы."), heatResistance: value<HeatResistance>("MEDIUM", "MEDIUM", [secondary("Розничные спецификации MUSTHAVE", "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/musthave/")]), leafTypes: value<readonly LeafType[]>(["BURLEY"], "MEDIUM", [official("MUSTHAVE Tobacco: Burley tobacco", "https://musthavetobacco.de/pages/unsere-story", "OFFICIAL_MATERIAL")]), dataConfidence: "MEDIUM", sourceTypes: ["MANUFACTURER_CLAIM", "OFFICIAL_MATERIAL", "SECONDARY_SOURCES"], notes: ["Каноническое написание соответствует текущему Brand в проекте."] },
  { manufacturerId: "muassel", manufacturer: "MUASSEL", aliases: ["Muassel", "Муассель"], heatResistance: value<HeatResistance>("HIGH", "MEDIUM", [official("MUASSEL: заявление о жаростойкости", "https://muassel.ru/")], "Это заявление производителя, а не независимое измерение."), dataConfidence: "MEDIUM", sourceTypes: ["MANUFACTURER_CLAIM"], notes: ["Крепость и лист задаются на уровне линейки."] },
  { manufacturerId: "jent", manufacturer: "Jent", aliases: ["JENT"], strengthLevel: value<StrengthLevel>("MEDIUM", "MEDIUM", [secondary("OSHISHA: обзор Jent", "https://oshisha.cc/catalog/jent/")]), heatResistance: value<HeatResistance>("UNKNOWN", "LOW", [secondary("OSHISHA: обзор Jent", "https://oshisha.cc/catalog/jent/"), internal("Фиксация расхождения доступных описаний v0.2.7")], "Доступные вторичные источники расходятся; категория оставлена UNKNOWN."), leafTypes: value<readonly LeafType[]>(["BLEND"], "MEDIUM", [secondary("OSHISHA: Burley, Virginia и сигарный лист", "https://oshisha.cc/catalog/jent/")]), dataConfidence: "LOW", sourceTypes: ["SECONDARY_SOURCES", "INTERNAL_TEST"], notes: ["Жаростойкость требует независимой проверки."] },
];

const line = (productLineId: string, manufacturerId: string, manufacturer: string, productLine: string, strengthLevel: StrengthLevel, leafTypes?: readonly LeafType[], options?: { heatResistance?: EvidencedValue<HeatResistance>; confidence?: ConfidenceLevel; aliases?: readonly string[]; evidence?: readonly TobaccoProfileEvidence[]; notes?: readonly string[] }): ProductLineProfile => {
  const evidence = options?.evidence ?? [internal(`Рабочий профиль ${manufacturer} ${productLine} v0.2.7`)];
  const sourceTypes = [...new Set(evidence.map(item => item.sourceType))];
  return { productLineId, manufacturerId, manufacturer, productLine, aliases: options?.aliases ?? [`${manufacturer} ${productLine}`], strengthLevel: value(strengthLevel, options?.confidence ?? "MEDIUM", evidence), ...(leafTypes ? { leafTypes: value(leafTypes, options?.confidence ?? "MEDIUM", evidence) } : {}), ...(options?.heatResistance ? { heatResistance: options.heatResistance } : {}), dataConfidence: options?.confidence ?? "MEDIUM", sourceTypes, notes: options?.notes ?? [] };
};

const muasselClaim = official("MUASSEL: официально заявленные линейки 4/10, 6/10 и 8/10", "https://muassel.ru/");
const productLines: readonly ProductLineProfile[] = [
  line("darkside-base", "darkside", "Darkside", "Base", "MEDIUM_LOW"),
  line("darkside-core", "darkside", "Darkside", "Core", "MEDIUM"),
  line("darkside-rare", "darkside", "Darkside", "Rare", "HIGH"),
  line("darkside-sabotage", "darkside", "Darkside", "Sabotage", "HIGH"),
  line("hooligan-medium", "hooligan", "Хулиган", "Medium", "MEDIUM", ["BLEND"], { aliases: ["Хулиган Medium", "Hooligan Medium", "HLGN Medium"] }),
  line("hooligan-hard", "hooligan", "Хулиган", "Hard", "HIGH", ["BLEND"], { aliases: ["Хулиган Hard", "Hooligan Hard", "HLGN Hard"], heatResistance: value("HIGH", "MEDIUM", [internal("Рабочая оценка Хулиган Hard v0.2.7")], "Категория требует дополнительной независимой проверки.") }),
  line("muassel-medium", "muassel", "MUASSEL", "Medium", "MEDIUM", ["VIRGINIA"], { evidence: [muasselClaim], aliases: ["MUASSEL Medium", "Muassel Medium"], notes: ["Заявленная производителем крепость 4/10 сохранена как claim."] }),
  line("muassel-strong", "muassel", "MUASSEL", "Strong", "MEDIUM_HIGH", ["BLEND"], { evidence: [muasselClaim], aliases: ["MUASSEL Strong", "Muassel Strong"], notes: ["Бленд Burley с добавлением сигарного листа; заявленная крепость 6/10."] }),
  line("muassel-extra-strong", "muassel", "MUASSEL", "Extra Strong", "HIGH", ["CIGAR"], { evidence: [muasselClaim], aliases: ["MUASSEL Extra Strong", "Muassel Extra Strong"], notes: ["100% сигарный лист и крепость 8/10 — заявления производителя."] }),
];

const deepFreeze = <T>(item: T): Readonly<T> => {
  if (item !== null && typeof item === "object" && !Object.isFrozen(item)) {
    Object.freeze(item);
    Object.values(item as Record<string, unknown>).forEach(nested => deepFreeze(nested));
  }
  return item;
};

export const TOBACCO_PROFILE_REGISTRY: TobaccoProfileRegistry = deepFreeze({ manufacturers: [...manufacturers], productLines: [...productLines], products: [] });
