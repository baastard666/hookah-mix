import { createTobaccoIdentityDecisionRegistry } from "./decision-registry";
import { LEGACY_CANONICAL_PRODUCT_ID_ALIASES } from "./legacy-canonical-product-id-aliases";
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

type ResolvedP1Input = {
  readonly groupId: string;
  readonly manufacturer: "MustHave" | "BlackBurn" | "НАШ";
  readonly sourceProductName: string;
  readonly manufacturerId: "musthave" | "blackburn" | "nash";
  readonly canonicalManufacturerName: "Musthave" | "BlackBurn" | "НАШ";
  readonly productLineId: string | null;
  readonly canonicalProductLineName: string | null;
  readonly canonicalProductName: string;
  readonly aliases: readonly string[];
  readonly evidence: readonly PublicEvidenceInput[];
  readonly catalogOccurrence?: boolean;
};

const evidence = (input: PublicEvidenceInput): TobaccoIdentityEvidence => ({
  ...input,
  checkedAt: REVIEW_DATE,
  publicSafe: true,
});

const sourceSheets = (catalogOccurrence = true): readonly string[] =>
  catalogOccurrence ? ["Mix_Components", "ОСНОВНАЯ_БАЗА"] : ["Mix_Components"];

const resolvedDecision = (input: ResolvedP1Input): TobaccoIdentityDecision => {
  const productLineInterpretation: ProductLineInterpretation = input.productLineId ? "CONFIRMED" : "CONFIRMED_NONE";
  const canonicalProductId = createCanonicalTobaccoProductId(input.manufacturerId, input.productLineId, input.canonicalProductName);
  if (!canonicalProductId) throw new Error(`Cannot create canonical product ID for ${input.groupId}.`);
  return {
    id: `p1-batch-1-${input.groupId}`,
    sourceIdentity: {
      manufacturer: input.manufacturer,
      productLine: null,
      productName: input.sourceProductName,
      normalizedManufacturer: normalizeDecisionText(input.manufacturer),
      normalizedProductLine: "",
      normalizedProductName: normalizeDecisionText(input.sourceProductName),
      sourceGroupId: input.groupId,
      sourcePriority: "P1",
      sourceSheets: sourceSheets(input.catalogOccurrence),
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

const officialMusthave = (sourceReference: string, sourceUrl: string): readonly PublicEvidenceInput[] => [{
  sourceType: "OFFICIAL_PRODUCT_PAGE",
  sourceReference,
  sourceUrl,
  confidence: "HIGH",
}];

const officialBlackburn = (sourceReference: string, sourceUrl: string): readonly PublicEvidenceInput[] => [{
  sourceType: "OFFICIAL_PRODUCT_PAGE",
  sourceReference,
  sourceUrl,
  confidence: "HIGH",
}];

const resolved: readonly TobaccoIdentityDecision[] = [
  resolvedDecision({ groupId: "identity-group-0001", manufacturer: "MustHave", sourceProductName: "Клубничный сорбет", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Sorbetto", aliases: ["Клубничный сорбет"], evidence: [{ sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "MUSTHAVE: Клубничный сорбет (Sorbetto)", sourceUrl: "https://musthave.ru/category/tabak-dlya-kalyana/", confidence: "HIGH" }] }),
  resolvedDecision({ groupId: "identity-group-0003", manufacturer: "BlackBurn", sourceProductName: "Банановое суфле", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: null, canonicalProductLineName: null, canonicalProductName: "На расслабоне", aliases: ["Банановое суфле"], evidence: officialBlackburn("BLACKBURN: На расслабоне / Банановое суфле", "https://www.blckburn.com/taste/tproduct/596214532-870961101401-na-rasslabone") }),
  resolvedDecision({ groupId: "identity-group-0004", manufacturer: "BlackBurn", sourceProductName: "Клюквенный морс", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Клюквенный морс", aliases: [], evidence: [
    { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "BLACKBURN: Клюквенный морс, карточка 25 г", sourceUrl: "https://dymteam.ru/product/tabak-dlya-kalyana-blackburn-s-aromatom-klyukvennyy-mors-25g", confidence: "MEDIUM" },
    { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "BLACKBURN: Клюквенный морс, карточка 200 г", sourceUrl: "https://ivankalyanshop.ru/tobacco/blackburn/200/25110", confidence: "MEDIUM" },
  ] }),
  resolvedDecision({ groupId: "identity-group-0005", manufacturer: "BlackBurn", sourceProductName: "На чиле", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: null, canonicalProductLineName: null, canonicalProductName: "На чилле", aliases: ["На чиле", "Тропический сок"], evidence: officialBlackburn("BLACKBURN: На чилле / Тропический сок", "https://www.blckburn.com/taste/tproduct/596214532-134223456101-na-chille") }),
  resolvedDecision({ groupId: "identity-group-0006", manufacturer: "MustHave", sourceProductName: "Ежевика", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Blackberry", aliases: ["Ежевика"], evidence: officialMusthave("MUSTHAVE Blackberry / Ежевика", "https://musthave.ru/tabak-dlya-kalyana-musthave-blackberry/") }),
  resolvedDecision({ groupId: "identity-group-0007", manufacturer: "MustHave", sourceProductName: "Кислые ягоды", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Sour Berries", aliases: ["Кислые ягоды"], evidence: officialMusthave("MUSTHAVE Sour Berries / Кислые ягоды", "https://musthave.ru/tabak-dlya-kalyana-musthave-sour-berries/") }),
  resolvedDecision({ groupId: "identity-group-0008", manufacturer: "BlackBurn", sourceProductName: "Tic Tac", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Tic Tac", aliases: ["Tik Tak"], evidence: [
    { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "BLACKBURN Tic Tac, карточка 60 г", sourceUrl: "https://www.goosto.co.il/product/black-burn-tic-tac/", confidence: "MEDIUM" },
    { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "BLACKBURN Tik Tak, карточка 25 г", sourceUrl: "https://narghileadelux.ro/p/tutun-narghilea-blackburn-25g-tik-tak-tic-tac/", confidence: "MEDIUM" },
  ] }),
  resolvedDecision({ groupId: "identity-group-0009", manufacturer: "BlackBurn", sourceProductName: "Ice Baby", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Ice Baby", aliases: ["BLACKBURN feat. GUF - ICE BABY", "Ягодный сорбет с грейпфрутом"], evidence: officialBlackburn("BLACKBURN feat. GUF: Ice Baby", "https://www.blckburn.com/taste/tproduct/596214532-363609907231-blackburn-feat-guf-ice-baby") }),
  resolvedDecision({ groupId: "identity-group-0010", manufacturer: "MustHave", sourceProductName: "Кислые тропики", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Sour Tropic", aliases: ["Кислые тропики"], evidence: officialMusthave("MUSTHAVE Sour Tropic / Кислые тропики", "https://musthave.ru/tabak-dlya-kalyana-musthave-sour-tropic/") }),
  resolvedDecision({ groupId: "identity-group-0013", manufacturer: "MustHave", sourceProductName: "Кислый цитрус", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Sour Citrus", aliases: ["Кислый цитрус", "Кислые цитрусы"], evidence: officialMusthave("MUSTHAVE Sour Citrus / Кислые цитрусы", "https://musthave.ru/tabak-dlya-kalyana-musthave-sour-citrus/") }),
  resolvedDecision({ groupId: "identity-group-0016", manufacturer: "НАШ", sourceProductName: "Карамель-цитрус", manufacturerId: "nash", canonicalManufacturerName: "НАШ", productLineId: "nash-white-line", canonicalProductLineName: "White Line", canonicalProductName: "Карамель цитрус", aliases: ["Карамель-цитрус", "Citrus Caramel"], evidence: [
    { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Nаш White Line: Карамель цитрус", sourceUrl: "https://htreviews.org/tobaccos/nash/white-line/karamel-tsitrus", confidence: "MEDIUM" },
    { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "НАШ White Line: Карамель цитрус", sourceUrl: "https://ivankalyanshop.ru/tobacco/nash/nw40/9014", confidence: "MEDIUM" },
  ] }),
  resolvedDecision({ groupId: "identity-group-0025", manufacturer: "BlackBurn", sourceProductName: "Raspberry Shock", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: "blackburn-shock", canonicalProductLineName: "Shock", canonicalProductName: "Raspberry", aliases: ["Raspberry Shock", "Кислая малина"], evidence: [
    { sourceType: "OFFICIAL_PRODUCT_PAGE", sourceReference: "BLACKBURN Raspberry Shock / Кислая малина", sourceUrl: "https://www.blckburn.com/taste/tproduct/596214532-176459686391-raspberry-shock", confidence: "HIGH" },
    { sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "BLACKBURN: линейка Shock", sourceUrl: "https://www.blckburn.com/", confidence: "HIGH" },
  ] }),
  resolvedDecision({ groupId: "identity-group-0028", manufacturer: "BlackBurn", sourceProductName: "Green Tea", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Green Tea", aliases: ["Зеленый чай", "Зелёный чай"], evidence: officialBlackburn("BLACKBURN Green Tea / Зеленый чай", "https://www.blckburn.com/taste/tproduct/596214532-990469141861-green-tea") }),
  resolvedDecision({ groupId: "identity-group-0034", manufacturer: "BlackBurn", sourceProductName: "Миндальная груша", manufacturerId: "blackburn", canonicalManufacturerName: "BlackBurn", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Almond Pear", aliases: ["Миндальная груша"], evidence: [
    { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "BLACKBURN Almond Pear / Миндальная груша", sourceUrl: "https://htreviews.org/tobaccos/black-burn/black-burn-main/almond-pear", confidence: "MEDIUM" },
    { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "BLACKBURN Almond Pear / Миндальная груша", sourceUrl: "https://tumen-tabak.ru/product/tabak-burn-black-mindalnaya-grusha-25g/", confidence: "MEDIUM" },
  ] }),
  resolvedDecision({ groupId: "identity-group-0036", manufacturer: "MustHave", sourceProductName: "Яблочные леденцы", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Apple Drops", aliases: ["Яблочные леденцы"], evidence: officialMusthave("MUSTHAVE Apple Drops / Яблочные леденцы", "https://musthave.ru/tabak-dlya-kalyana-musthave-apple-drops/"), catalogOccurrence: false }),
  resolvedDecision({ groupId: "identity-group-0067", manufacturer: "MustHave", sourceProductName: "Pineapple Rings", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Pineapple Rings", aliases: ["Ананасовый колечки"], evidence: officialMusthave("MUSTHAVE Pineapple Rings / Ананасовый колечки", "https://musthave.ru/tabak-dlya-kalyana-musthave-pineapple-rings/") }),
  resolvedDecision({ groupId: "identity-group-0076", manufacturer: "НАШ", sourceProductName: "Арбуз", manufacturerId: "nash", canonicalManufacturerName: "НАШ", productLineId: "nash-black-line", canonicalProductLineName: "Black Line", canonicalProductName: "Арбуз", aliases: [], evidence: [{ sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Nаш Black Line: Арбуз", sourceUrl: "https://htreviews.org/tobaccos/nash/black-line", confidence: "MEDIUM" }] }),
  resolvedDecision({ groupId: "identity-group-0098", manufacturer: "MustHave", sourceProductName: "Ванильный крем", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Vanilla Cream", aliases: ["Ванильный крем"], evidence: officialMusthave("MUSTHAVE Vanilla Cream / Ванильный крем", "https://musthave.ru/tabak-dlya-kalyana-musthave-vanilla-cream/") }),
  resolvedDecision({ groupId: "identity-group-0099", manufacturer: "MustHave", sourceProductName: "Кленовый пекан", manufacturerId: "musthave", canonicalManufacturerName: "Musthave", productLineId: null, canonicalProductLineName: null, canonicalProductName: "Maple Pecan", aliases: ["Кленовый пекан"], evidence: officialMusthave("MUSTHAVE Maple Pecan / Кленовый пекан", "https://musthave.ru/tabak-dlya-kalyana-musthave-maple-pecan/") }),
];

const manufacturerOnly: TobaccoIdentityDecision = {
  id: "p1-batch-1-identity-group-0022",
  sourceIdentity: {
    manufacturer: "MustHave",
    productLine: null,
    productName: "Ананас",
    normalizedManufacturer: normalizeDecisionText("MustHave"),
    normalizedProductLine: "",
    normalizedProductName: normalizeDecisionText("Ананас"),
    sourceGroupId: "identity-group-0022",
    sourcePriority: "P1",
    sourceSheets: sourceSheets(),
    sourceRows: [],
    productLineInterpretation: "UNKNOWN",
  },
  decision: {
    status: "MANUFACTURER_ONLY",
    manufacturerId: "musthave",
    productLineId: null,
    canonicalProductId: null,
    canonicalManufacturerName: "Musthave",
    canonicalProductLineName: null,
    canonicalProductName: null,
    aliases: [],
  },
  evidence: [evidence({
    sourceType: "OFFICIAL_MANUFACTURER_CATALOG",
    sourceReference: "MUSTHAVE: официальный каталог; отдельного продукта «Ананас» не подтверждено",
    sourceUrl: "https://musthave.ru/category/tabak-dlya-kalyana/",
    confidence: "HIGH",
  })],
  review: {
    state: "NEEDS_MORE_EVIDENCE",
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

export const P1_IDENTITY_DECISIONS_BATCH_1: readonly TobaccoIdentityDecision[] = Object.freeze([...resolved, manufacturerOnly]);
export const P1_IDENTITY_DECISION_REGISTRY_BATCH_1 = createTobaccoIdentityDecisionRegistry(P1_IDENTITY_DECISIONS_BATCH_1, LEGACY_CANONICAL_PRODUCT_ID_ALIASES);
