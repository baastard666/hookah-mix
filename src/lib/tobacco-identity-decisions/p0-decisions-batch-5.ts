import { createCanonicalTobaccoProductId, normalizeDecisionText } from "./normalization";
import type {
  ProductLineInterpretation,
  TobaccoIdentityConfidence,
  TobaccoIdentityDecision,
  TobaccoIdentityDecisionStatus,
  TobaccoIdentityEvidence,
  TobaccoIdentityEvidenceType,
  TobaccoIdentityReviewState,
} from "./types";

const REVIEW_DATE = "2026-07-21";

type PublicEvidenceInput = {
  readonly sourceType: TobaccoIdentityEvidenceType;
  readonly sourceReference: string;
  readonly sourceUrl: string;
  readonly confidence: TobaccoIdentityConfidence;
};

type BatchInput = {
  readonly groupId: string;
  readonly manufacturer: string;
  readonly sourceProductLine?: string | null;
  readonly sourceProductName: string;
  readonly sourceSheets: readonly string[];
  readonly manufacturerId?: string | null;
  readonly canonicalManufacturerName?: string | null;
  readonly productLineId?: string | null;
  readonly canonicalProductLineName?: string | null;
  readonly canonicalProductName?: string;
  readonly aliases?: readonly string[];
  readonly evidence: readonly PublicEvidenceInput[];
  readonly status?: TobaccoIdentityDecisionStatus;
  readonly reviewState?: TobaccoIdentityReviewState;
  readonly productLineInterpretation?: ProductLineInterpretation;
};

const toEvidence = (input: PublicEvidenceInput): TobaccoIdentityEvidence => ({
  ...input,
  checkedAt: REVIEW_DATE,
  publicSafe: true,
});

const decision = (input: BatchInput): TobaccoIdentityDecision => {
  const status = input.status ?? "RESOLVED";
  const reviewState = input.reviewState ?? (status === "RESOLVED" ? "CONFIRMED" : status === "AMBIGUOUS" ? "AMBIGUOUS" : "DEFERRED");
  const productLineInterpretation = input.productLineInterpretation ?? (status === "AMBIGUOUS" ? "AMBIGUOUS" : input.productLineId ? "CONFIRMED" : "CONFIRMED_NONE");
  const canonicalProductName = input.canonicalProductName ?? input.sourceProductName;
  if (status === "RESOLVED" && !input.manufacturerId) throw new Error(`Manufacturer ID is required for ${input.groupId}.`);
  const canonicalProductId = status === "RESOLVED"
    ? createCanonicalTobaccoProductId(input.manufacturerId!, input.productLineId ?? null, canonicalProductName)
    : null;
  if (status === "RESOLVED" && !canonicalProductId) throw new Error(`Cannot create canonical product ID for ${input.groupId}.`);
  return {
    id: `p0-batch-5-${input.groupId}`,
    sourceIdentity: {
      manufacturer: input.manufacturer,
      productLine: input.sourceProductLine ?? null,
      productName: input.sourceProductName,
      normalizedManufacturer: normalizeDecisionText(input.manufacturer),
      normalizedProductLine: normalizeDecisionText(input.sourceProductLine ?? null),
      normalizedProductName: normalizeDecisionText(input.sourceProductName),
      sourceGroupId: input.groupId,
      sourcePriority: "P0",
      sourceSheets: input.sourceSheets,
      sourceRows: [],
      productLineInterpretation,
    },
    decision: {
      status,
      manufacturerId: input.manufacturerId ?? null,
      productLineId: status === "RESOLVED" ? input.productLineId ?? null : null,
      canonicalProductId,
      canonicalManufacturerName: input.canonicalManufacturerName ?? null,
      canonicalProductLineName: status === "RESOLVED" ? input.canonicalProductLineName ?? null : null,
      canonicalProductName: status === "RESOLVED" ? canonicalProductName : null,
      aliases: status === "RESOLVED" ? [...new Set(input.aliases ?? [])] : [],
    },
    evidence: input.evidence.map(toEvidence),
    review: {
      state: reviewState,
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

const COMPONENT_ONLY = ["Mix_Components"] as const;
const COMPONENT_AND_CATALOG = ["Mix_Components", "ОСНОВНАЯ_БАЗА"] as const;
const SAPPHIRE_DECLARATION_URL = "https://www.xn----7sbajahheyaepn1ca0aveqcb0fxl.xn--p1acf/document/eaes-n-ru-d-rura03v0922425/";

const batch5Decisions: readonly TobaccoIdentityDecision[] = [
  decision({
    groupId: "identity-group-0081", manufacturer: "Deus Perfume", sourceProductName: "Black Afgano", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "deus", canonicalManufacturerName: "Deus", productLineId: "deus-perfume", canonicalProductLineName: "Perfume", canonicalProductName: "Black Afgano", aliases: ["Блэк афгано"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Deus Perfume catalog lists Black Afgano", sourceUrl: "https://htreviews.org/tobaccos/deus/perfume", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Independent Deus Perfume Black Afgano product listing", sourceUrl: "https://tabak-belgorod.ru/products/category/5434901", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0019", manufacturer: "Element Earth", sourceProductName: "Wildberry Mors", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "element", canonicalManufacturerName: "Element", productLineId: "element-earth", canonicalProductLineName: "Earth", canonicalProductName: "Wildberry Mors", aliases: ["Ягодный морс"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Element Earth assortment lists Wildberry Mors", sourceUrl: "https://htreviews.org/tobaccos/element/zemlya", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Element Earth Wildberry Mors product card", sourceUrl: "https://hookah-voodoo.com/element-zemlya-wildberry-mors-yagodnyj-mors-25g-akciznyj", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0065", manufacturer: "Sapphire Crown", sourceProductName: "Kiwi Fruit", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", status: "UNRESOLVED", reviewState: "DEFERRED", productLineInterpretation: "CONFIRMED_NONE",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Kiwi Fruit", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sapphire Crown catalog confirms Kiwi Fruit", sourceUrl: "https://htreviews.org/tobaccos/sapphire-crown/main/kiwi-fruit", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0017", manufacturer: "Sapphire Crown", sourceProductName: "Pumpkin RAF", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Pumpkin RAF",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Pumpkin RAF", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Pumpkin RAF product card", sourceUrl: "https://smoxygen.com/products/sapphire-crown-pumpkin-raf-hookah-tobacco", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0027", manufacturer: "Sapphire Crown", sourceProductName: "Sunny Peach", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Sunny Peach",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Sunny Peach", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Sunny Peach product card", sourceUrl: "https://www.hookahvault.com/products/sapphire-crown-sunny-peach", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0068", manufacturer: "Sapphire Crown", sourceProductName: "Yuzu-Honey", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Yuzu-Honey",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Yuzu-Honey", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Yuzu-Honey product card", sourceUrl: "https://oshisha.net/catalog/product/sapphire_crown_yuzu_honey_25gr/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0033", manufacturer: "Sarma 360", sourceProductLine: "крепкая", sourceProductName: "Горная лаванда", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sarma", canonicalManufacturerName: "Sarma", productLineId: "sarma-360", canonicalProductLineName: "360 Крепкая", canonicalProductName: "Горная лаванда",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sarma 360 strong catalog lists Горная лаванда", sourceUrl: "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360/gornaya-lavanda", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sarma 360 Горная лаванда product card", sourceUrl: "https://justfreid.ru/catalog/tabak/sarma/sarma_38477.html", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0032", manufacturer: "Sarma 360", sourceProductLine: "крепкая", sourceProductName: "Джин", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sarma", canonicalManufacturerName: "Sarma", productLineId: "sarma-360", canonicalProductLineName: "360 Крепкая", canonicalProductName: "Джин",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sarma 360 strong catalog lists Джин", sourceUrl: "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sarma 360 Крепкая Джин product card", sourceUrl: "https://www.milkyshisha.ru/sarma-360-krepkaya-dzhin-25g", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0012", manufacturer: "Sarma 360", sourceProductLine: "крепкая", sourceProductName: "Персик", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sarma", canonicalManufacturerName: "Sarma", productLineId: "sarma-360", canonicalProductLineName: "360 Крепкая", canonicalProductName: "Персик",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sarma 360 strong catalog distinguishes Персик", sourceUrl: "https://htreviews.org/tobaccos/sarma/krepkaya-sarma-360/persik", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sarma 360 strong assortment lists Персик separately", sourceUrl: "https://www.hookahhouse.ru/catalog/tabak_dlya_kalyana/sarma/360_krepkaya/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0011", manufacturer: "Sarma 360", sourceProductLine: "лёгкая", sourceProductName: "Шампанское", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sarma", canonicalManufacturerName: "Sarma", productLineId: "sarma-360-light", canonicalProductLineName: "360 Лёгкая", canonicalProductName: "Шампанское",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sarma 360 light catalog lists Шампанское", sourceUrl: "https://htreviews.org/tobaccos/sarma/legkaya-sarma-360", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sarma 360 Лёгкая Шампанское product listing", sourceUrl: "https://oshisha.net/catalog/sarma_360_lyegkaya_40_gr/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0106", manufacturer: "Sebero", sourceProductName: "Vanilla", sourceSheets: COMPONENT_ONLY,
    manufacturerId: "sebero", canonicalManufacturerName: "Sebero", status: "AMBIGUOUS", productLineInterpretation: "AMBIGUOUS",
    evidence: [
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sebero Classic assortment includes Vanilla", sourceUrl: "https://dotsmoke.ru/collection/sebero-classic", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sebero Black also includes Vanilla", sourceUrl: "https://htreviews.org/tobaccos/sebero/sebero-black/vanilla", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0037", manufacturer: "не указан", sourceProductName: "Освежающий мохито", sourceSheets: COMPONENT_AND_CATALOG,
    status: "UNRESOLVED", reviewState: "DEFERRED", productLineInterpretation: "UNKNOWN",
    evidence: [
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "The exact phrase is used for a JAM product, but the workbook source has no manufacturer", sourceUrl: "https://hookah-voodoo.com/tabak-jam-osvezhayushchij-mohito-30g", confidence: "LOW" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Multiple manufacturers use Mojito product names and refreshing descriptions", sourceUrl: "https://tabakdelux.com.ua/ru/tabak-yummy/3767-yummy-mojito-100-gramm", confidence: "LOW" },
    ],
  }),
  decision({
    groupId: "identity-group-0066", manufacturer: "Urban Soul", sourceProductName: "Клубника", sourceSheets: COMPONENT_AND_CATALOG,
    manufacturerId: "urban-soul", canonicalManufacturerName: "Urban Soul", canonicalProductName: "Strawberry", aliases: ["Клубника"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Urban Soul catalog confirms Strawberry / Клубника", sourceUrl: "https://htreviews.org/tobaccos/urban-soul/urban-soul-main/strawberry", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Urban Soul retail catalog lists Клубника", sourceUrl: "https://ekaterinburg.smokemarket.cc/kalyany/tabak-dlya-kalyana/gotovyy-tabak/urban-soul/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0105", manufacturer: "Северный", sourceProductName: "Крепкий орешек", sourceSheets: COMPONENT_AND_CATALOG,
    manufacturerId: "severnyi", canonicalManufacturerName: "Северный", canonicalProductName: "Крепкий орешек",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Северный Крепкий орешек", sourceUrl: "https://xn----7sbajahheyaepn1ca0aveqcb0fxl.xn--p1acf/document/eaes-n-ru-d-rura07v7421625/", confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Северный catalog confirms Крепкий орешек", sourceUrl: "https://htreviews.org/tobaccos/severnyy/main/krepkiy-oreshek", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0085", manufacturer: "Северный", sourceProductName: "Секвойя", sourceSheets: COMPONENT_AND_CATALOG,
    manufacturerId: "severnyi", canonicalManufacturerName: "Северный", canonicalProductName: "Секвойя",
    evidence: [
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Северный catalog lists Секвойя", sourceUrl: "https://oshisha.net/catalog/severnyy/?PAGEN_1=12", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Independent review confirms Северный Секвойя", sourceUrl: "https://okolokalyana.ru/smokingroom/severelki", confidence: "MEDIUM" },
    ],
  }),
];

const BATCH_5_DETERMINISTIC_GROUP_ORDER = [
  "identity-group-0066", "identity-group-0037", "identity-group-0105", "identity-group-0085",
  "identity-group-0081", "identity-group-0019", "identity-group-0065", "identity-group-0017",
  "identity-group-0027", "identity-group-0068", "identity-group-0033", "identity-group-0032",
  "identity-group-0012", "identity-group-0011", "identity-group-0106",
] as const;

const batch5Order = new Map<string, number>(BATCH_5_DETERMINISTIC_GROUP_ORDER.map((groupId, index) => [groupId, index]));

export const P0_IDENTITY_DECISIONS_BATCH_5: readonly TobaccoIdentityDecision[] = Object.freeze(
  [...batch5Decisions].sort((left, right) =>
    (batch5Order.get(left.sourceIdentity.sourceGroupId) ?? Number.MAX_SAFE_INTEGER)
    - (batch5Order.get(right.sourceIdentity.sourceGroupId) ?? Number.MAX_SAFE_INTEGER)),
);
