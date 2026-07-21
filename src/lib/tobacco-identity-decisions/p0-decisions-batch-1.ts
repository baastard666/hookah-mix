import { createCanonicalTobaccoProductId, normalizeDecisionText } from "./normalization";
import type {
  ProductLineInterpretation,
  TobaccoIdentityConfidence,
  TobaccoIdentityDecision,
  TobaccoIdentityEvidence,
  TobaccoIdentityEvidenceType,
} from "./types";

const REVIEW_DATE = "2026-07-21";

type PublicEvidenceInput = {
  readonly sourceType: TobaccoIdentityEvidenceType;
  readonly sourceReference: string;
  readonly sourceUrl: string;
  readonly confidence: TobaccoIdentityConfidence;
};

type ResolvedP0Input = {
  readonly groupId: string;
  readonly manufacturer: string;
  readonly sourceProductName: string;
  readonly manufacturerId: string;
  readonly canonicalManufacturerName: string;
  readonly productLineId: string | null;
  readonly canonicalProductLineName: string | null;
  readonly canonicalProductName: string;
  readonly aliases: readonly string[];
  readonly evidence: readonly PublicEvidenceInput[];
  readonly catalogOccurrence: boolean;
};

const evidence = (input: PublicEvidenceInput): TobaccoIdentityEvidence => ({
  ...input,
  checkedAt: REVIEW_DATE,
  publicSafe: true,
});

const resolvedDecision = (input: ResolvedP0Input): TobaccoIdentityDecision => {
  const productLineInterpretation: ProductLineInterpretation = input.productLineId ? "CONFIRMED" : "CONFIRMED_NONE";
  const canonicalProductId = createCanonicalTobaccoProductId(input.manufacturerId, input.productLineId, input.canonicalProductName);
  if (!canonicalProductId) throw new Error(`Cannot create canonical product ID for ${input.groupId}.`);
  return {
    id: `p0-batch-1-${input.groupId}`,
    sourceIdentity: {
      manufacturer: input.manufacturer,
      productLine: null,
      productName: input.sourceProductName,
      normalizedManufacturer: normalizeDecisionText(input.manufacturer),
      normalizedProductLine: "",
      normalizedProductName: normalizeDecisionText(input.sourceProductName),
      sourceGroupId: input.groupId,
      sourcePriority: "P0",
      sourceSheets: input.catalogOccurrence ? ["Mix_Components", "ОСНОВНАЯ_БАЗА"] : ["Mix_Components"],
      sourceRows: [],
      productLineInterpretation,
    },
    decision: {
      status: "RESOLVED",
      manufacturerId: input.manufacturerId,
      productLineId: input.productLineId,
      canonicalProductId,
      canonicalManufacturerName: input.canonicalManufacturerName,
      canonicalProductLineName: input.canonicalProductLineName,
      canonicalProductName: input.canonicalProductName,
      aliases: [...new Set(input.aliases)],
    },
    evidence: input.evidence.map(evidence),
    review: {
      state: "CONFIRMED",
      reviewedByType: "INTERNAL_EXPERT",
      reviewedAt: REVIEW_DATE,
      reviewerNotes: null,
    },
    metadata: {
      version: "tobacco-identity-decision-v1",
      createdAt: REVIEW_DATE,
      updatedAt: REVIEW_DATE,
    },
  };
};

const official = (sourceReference: string, sourceUrl: string): readonly PublicEvidenceInput[] => [{
  sourceType: "OFFICIAL_PRODUCT_PAGE",
  sourceReference,
  sourceUrl,
  confidence: "HIGH",
}];

export const P0_IDENTITY_DECISIONS_BATCH_1: readonly TobaccoIdentityDecision[] = Object.freeze([
  resolvedDecision({
    groupId: "identity-group-0041", manufacturer: "Sapphire Crown", sourceProductName: "Dried Plum",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", productLineId: null,
    canonicalProductLineName: null, canonicalProductName: "Dried Plum", aliases: [], catalogOccurrence: false,
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration: Sapphire Crown assortment includes Dried Plum", sourceUrl: "https://xn----7sbajahheyaepn1ca0aveqcb0fxl.xn--p1acf/document/eaes-n-ru-d-rura03v0922425/", confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Dried Plum product card", sourceUrl: "https://b2hookah.com/products/sapphire-crown-tobacco-dried-plum", confidence: "MEDIUM" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0046", manufacturer: "Sapphire", sourceProductName: "Go Bananas",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", productLineId: null,
    canonicalProductLineName: null, canonicalProductName: "Go Bananas!", aliases: ["Go Bananas"], catalogOccurrence: true,
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration: Sapphire Crown assortment includes Go Bananas!", sourceUrl: "https://xn----7sbajahheyaepn1ca0aveqcb0fxl.xn--p1acf/document/eaes-n-ru-d-rura03v0922425/", confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Go Bananas product card", sourceUrl: "https://blackshisha.com/shisha-tobacco/sapphire-crown-tobacco/sapphire-crown-200-gr-go-bananas-tobacco", confidence: "MEDIUM" },
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "Sapphire Crown release coverage uses shortened Sapphire name", sourceUrl: "https://hub.hookahbattle.com/en/new-drop-sapphire-crown/", confidence: "MEDIUM" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0062", manufacturer: "Banger", sourceProductName: "Абрикосовый джем",
    manufacturerId: "banger", canonicalManufacturerName: "Banger", productLineId: null,
    canonicalProductLineName: null, canonicalProductName: "Apricot Jam", aliases: ["Абрикосовый джем"], catalogOccurrence: true,
    evidence: [{ sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "Banger catalog: Apricot Jam / Абрикосовый джем", sourceUrl: "https://www.bangertobacco.com/menu", confidence: "HIGH" }],
  }),
  resolvedDecision({
    groupId: "identity-group-0069", manufacturer: "Brusko", sourceProductName: "Цитрусовый чай",
    manufacturerId: "brusko", canonicalManufacturerName: "Brusko", productLineId: "brusko-medium",
    canonicalProductLineName: "Medium", canonicalProductName: "Цитрусовый чай", aliases: [], catalogOccurrence: true,
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Brusko Medium (чайная смесь): Цитрусовый чай", sourceUrl: "https://htreviews.org/tobaccos/brusko/brusko-medium-chaynaya-smes", confidence: "MEDIUM" },
      { sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "Brusko tobacco manufacturer catalog", sourceUrl: "https://www.brusko-world.com/ru/products-pages/brusko-tobacco", confidence: "MEDIUM" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0072", manufacturer: "Chabacco", sourceProductName: "Апельсин-сливки",
    manufacturerId: "chabacco", canonicalManufacturerName: "Chabacco", productLineId: "chabacco-mix",
    canonicalProductLineName: "Mix", canonicalProductName: "Апельсин-сливки", aliases: [], catalogOccurrence: true,
    evidence: official("Chabacco Mix: Апельсин-сливки", "https://chabacco.ru/product/chabacco_mix"),
  }),
  resolvedDecision({
    groupId: "identity-group-0060", manufacturer: "Chabacco", sourceProductName: "Банановый милкшейк",
    manufacturerId: "chabacco", canonicalManufacturerName: "Chabacco", productLineId: "chabacco-mix",
    canonicalProductLineName: "Mix", canonicalProductName: "Банановый милкшейк", aliases: [], catalogOccurrence: true,
    evidence: official("Chabacco Mix: Банановый милкшейк", "https://chabacco.ru/product/chabacco_mix"),
  }),
  resolvedDecision({
    groupId: "identity-group-0073", manufacturer: "Chabacco", sourceProductName: "Бельгийский сидр",
    manufacturerId: "chabacco", canonicalManufacturerName: "Chabacco", productLineId: "chabacco-medium",
    canonicalProductLineName: "Medium", canonicalProductName: "Belgian Cider", aliases: ["Бельгийский сидр"], catalogOccurrence: true,
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Chabacco Medium: Belgian Cider / Бельгийский сидр", sourceUrl: "https://htreviews.org/tobaccos/chabacco/chabacco-lineika-medium/belgian-cider", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Chabacco Belgian Cider product listing", sourceUrl: "https://hookamarket.kz/tabak/404/black-currant-chernaya-smorodina-14-detail", confidence: "MEDIUM" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0103", manufacturer: "Chabacco", sourceProductName: "Гренадин Drops",
    manufacturerId: "chabacco", canonicalManufacturerName: "Chabacco", productLineId: "chabacco-mix",
    canonicalProductLineName: "Mix", canonicalProductName: "Гренадин Дропс", aliases: ["Гренадин Drops"], catalogOccurrence: true,
    evidence: official("Chabacco Mix: Гренадин Дропс", "https://chabacco.ru/product/chabacco_mix"),
  }),
  resolvedDecision({
    groupId: "identity-group-0049", manufacturer: "Chabacco", sourceProductName: "Морозная мята",
    manufacturerId: "chabacco", canonicalManufacturerName: "Chabacco", productLineId: null,
    canonicalProductLineName: null, canonicalProductName: "Морозная мята", aliases: [], catalogOccurrence: true,
    evidence: official("Chabacco mono assortment: Морозная мята", "https://chabacco.ru/product/chabacco"),
  }),
  resolvedDecision({
    groupId: "identity-group-0108", manufacturer: "Chabacco", sourceProductName: "Фруктовый лед",
    manufacturerId: "chabacco", canonicalManufacturerName: "Chabacco", productLineId: "chabacco-mix",
    canonicalProductLineName: "Mix", canonicalProductName: "Фруктовый лед", aliases: ["Fruit Ice"], catalogOccurrence: true,
    evidence: official("Chabacco Mix: Fruit Ice / Фруктовый лед", "https://chabacco.ru/mix50/tproduct/308717395-911134989481-fruit-ice-fruktovii-led"),
  }),
  resolvedDecision({
    groupId: "identity-group-0018", manufacturer: "Daily Hookah", sourceProductName: "Сливочный крем",
    manufacturerId: "daily-hookah", canonicalManufacturerName: "Daily Hookah", productLineId: null,
    canonicalProductLineName: null, canonicalProductName: "Сливочный крем", aliases: [], catalogOccurrence: true,
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "Daily Hookah: Сливочный крем product reference", sourceUrl: "https://nn-kalyan.ru/daily-hookah-slivochnyy-krem-opisanie-miksy/", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Daily Hookah Сливочный крем product card", sourceUrl: "https://molodechno.by-sweet-smoke.su/shop/product/1789", confidence: "MEDIUM" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0020", manufacturer: "Deus", sourceProductName: "Skittles",
    manufacturerId: "deus", canonicalManufacturerName: "Deus", productLineId: null,
    canonicalProductLineName: null, canonicalProductName: "Skittles", aliases: [], catalogOccurrence: true,
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration: Deus assortment includes Skittles", sourceUrl: "https://xn----7sbajahheyaepn1ca0aveqcb0fxl.xn--p1acf/document/eaes-n-ru-d-rura03v9433624/", confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Deus Skittles product reference", sourceUrl: "https://shisha.today/tobacco/deus-skittles", confidence: "MEDIUM" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0086", manufacturer: "Dozaj", sourceProductName: "Mint",
    manufacturerId: "dozaj", canonicalManufacturerName: "Dozaj", productLineId: null,
    canonicalProductLineName: null, canonicalProductName: "Mint", aliases: [], catalogOccurrence: true,
    evidence: [
      { sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "Dozaj official flavor catalog", sourceUrl: "https://dozaj.jp/flavor/", confidence: "HIGH" },
      { sourceType: "OFFICIAL_PRODUCT_PAGE", sourceReference: "Dozaj official Mint product article", sourceUrl: "https://dozaj.jp/blog/1571/", confidence: "HIGH" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0107", manufacturer: "Duft", sourceProductName: "Cherry Juice",
    manufacturerId: "duft", canonicalManufacturerName: "Duft", productLineId: "duft-solo",
    canonicalProductLineName: "Solo", canonicalProductName: "Cherry Juice", aliases: ["Вишневый сок"], catalogOccurrence: true,
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Duft Solo: Cherry Juice", sourceUrl: "https://htreviews.org/tobaccos/duft/duft-lineika-solo/cherry-juice", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Duft Solo Cherry Juice product card", sourceUrl: "https://hookah-voodoo.com/duft-cherry-juice-vishnevyj-sok-20g-akciznyj", confidence: "MEDIUM" },
    ],
  }),
  resolvedDecision({
    groupId: "identity-group-0075", manufacturer: "Duft", sourceProductName: "Orange Zest",
    manufacturerId: "duft", canonicalManufacturerName: "Duft", productLineId: "duft-solo",
    canonicalProductLineName: "Solo", canonicalProductName: "Orange Zest", aliases: ["Апельсин"], catalogOccurrence: true,
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Duft Solo: Orange Zest", sourceUrl: "https://htreviews.org/tobaccos/duft/duft-lineika-solo/orange-zest", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Duft Solo Orange Zest product card", sourceUrl: "https://hookah-voodoo.com/duft-orange-zest-apelsin-20g-akciznyj", confidence: "MEDIUM" },
    ],
  }),
]);
