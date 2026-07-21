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

type BatchInput = {
  readonly groupId: string;
  readonly manufacturer: string;
  readonly sourceProductName: string;
  readonly manufacturerId: string;
  readonly canonicalManufacturerName: string;
  readonly productLineId?: string | null;
  readonly canonicalProductLineName?: string | null;
  readonly canonicalProductName?: string;
  readonly aliases?: readonly string[];
  readonly evidence: readonly PublicEvidenceInput[];
  readonly status?: "RESOLVED" | "AMBIGUOUS";
};

const toEvidence = (input: PublicEvidenceInput): TobaccoIdentityEvidence => ({
  ...input,
  checkedAt: REVIEW_DATE,
  publicSafe: true,
});

const decision = (input: BatchInput): TobaccoIdentityDecision => {
  const status = input.status ?? "RESOLVED";
  const productLineInterpretation: ProductLineInterpretation = status === "AMBIGUOUS"
    ? "AMBIGUOUS"
    : input.productLineId
      ? "CONFIRMED"
      : "CONFIRMED_NONE";
  const canonicalProductId = status === "RESOLVED"
    ? createCanonicalTobaccoProductId(input.manufacturerId, input.productLineId ?? null, input.canonicalProductName ?? input.sourceProductName)
    : null;
  if (status === "RESOLVED" && !canonicalProductId) throw new Error(`Cannot create canonical product ID for ${input.groupId}.`);
  return {
    id: `p0-batch-2-${input.groupId}`,
    sourceIdentity: {
      manufacturer: input.manufacturer,
      productLine: null,
      productName: input.sourceProductName,
      normalizedManufacturer: normalizeDecisionText(input.manufacturer),
      normalizedProductLine: "",
      normalizedProductName: normalizeDecisionText(input.sourceProductName),
      sourceGroupId: input.groupId,
      sourcePriority: "P0",
      sourceSheets: ["Mix_Components", "ОСНОВНАЯ_БАЗА"],
      sourceRows: [],
      productLineInterpretation,
    },
    decision: {
      status,
      manufacturerId: input.manufacturerId,
      productLineId: status === "RESOLVED" ? input.productLineId ?? null : null,
      canonicalProductId,
      canonicalManufacturerName: input.canonicalManufacturerName,
      canonicalProductLineName: status === "RESOLVED" ? input.canonicalProductLineName ?? null : null,
      canonicalProductName: status === "RESOLVED" ? input.canonicalProductName ?? input.sourceProductName : null,
      aliases: status === "RESOLVED" ? [...new Set(input.aliases ?? [])] : [],
    },
    evidence: input.evidence.map(toEvidence),
    review: {
      state: status === "RESOLVED" ? "CONFIRMED" : "AMBIGUOUS",
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

export const P0_IDENTITY_DECISIONS_BATCH_2: readonly TobaccoIdentityDecision[] = Object.freeze([
  decision({
    groupId: "identity-group-0109", manufacturer: "Duft", sourceProductName: "Papaya",
    manufacturerId: "duft", canonicalManufacturerName: "Duft", status: "AMBIGUOUS",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Duft Strong assortment includes Papaya", sourceUrl: "https://htreviews.org/tobaccos/duft/duft-lineika-strong", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Duft Solo assortment also includes Papaya", sourceUrl: "https://htreviews.org/tobaccos/duft/duft-lineika-solo", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0052", manufacturer: "Element", sourceProductName: "Feijoa Lemonade",
    manufacturerId: "element", canonicalManufacturerName: "Element", status: "AMBIGUOUS",
    evidence: [
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Element Water Feijoa Lemonade product card", sourceUrl: "https://www.hookahvault.com/products/element-tobacco-feijoa-lemonade", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Element Earth Feijoa Lemonade product card", sourceUrl: "https://hookahministry.com/products/element-tobacco-earth-line-feijoa-lemonade-200-gr", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0100", manufacturer: "Element", sourceProductName: "Milky Mouse",
    manufacturerId: "element", canonicalManufacturerName: "Element", productLineId: "element-air",
    canonicalProductLineName: "Air", canonicalProductName: "Milky Mouse",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Element Air: Milky Mouse", sourceUrl: "https://htreviews.org/tobaccos/element/vozdukh/milky-mouse", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Element Air Milky Mouse product card", sourceUrl: "https://hookahhub.store/product/element-air-milky-mouse-200g?lang=en", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0002", manufacturer: "Element", sourceProductName: "Персик",
    manufacturerId: "element", canonicalManufacturerName: "Element", status: "AMBIGUOUS",
    evidence: [{ sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Element Peach is documented in both Water and Earth lines", sourceUrl: "https://nn-kalyan.ru/element-peach-persik-opisanie-miksy-otzyvy/", confidence: "MEDIUM" }],
  }),
  decision({
    groupId: "identity-group-0097", manufacturer: "Endorphin", sourceProductName: "Apple",
    manufacturerId: "endorphin", canonicalManufacturerName: "Endorphin", canonicalProductName: "Apple",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Endorphin catalog includes Apple", sourceUrl: "https://smokedex.info/en/shisha/brand/endorphin", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Endorphin assortment includes Apple", sourceUrl: "https://hookahhouse.ru/catalog/tabak_dlya_kalyana/endorphin/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0096", manufacturer: "Endorphin", sourceProductName: "Napoleon",
    manufacturerId: "endorphin", canonicalManufacturerName: "Endorphin", canonicalProductName: "Napoleon",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Endorphin Napoleon product entry", sourceUrl: "https://htreviews.org/tobaccos/endorphin/endorphin-main/napoleon", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Endorphin Napoleon product card", sourceUrl: "https://smolandshop.com/shop/tabak/tabak-endorphin/tabak-endorphin-125-gr/tabak-endorphin-napoleon-s-aromatom-torta-napoleon/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0095", manufacturer: "Fake", sourceProductName: "Holod",
    manufacturerId: "fake", canonicalManufacturerName: "FAKE", canonicalProductName: "Holod", aliases: ["Холодок"],
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "FAKE announced Holod as a new flavor", sourceUrl: "https://hub.hookahbattle.com/uz/satyr-prickly-apple-fake-holod-and-mumbai-tea/", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "FAKE Holod product card", sourceUrl: "https://hookah-voodoo.com/fake-holod-holodok-100g", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0094", manufacturer: "Fake", sourceProductName: "Mumbai Tea",
    manufacturerId: "fake", canonicalManufacturerName: "FAKE", canonicalProductName: "Mumbai Tea", aliases: ["Чай Масала"],
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "FAKE announced Mumbai Tea as a new flavor", sourceUrl: "https://hub.hookahbattle.com/uz/satyr-prickly-apple-fake-holod-and-mumbai-tea/", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "FAKE Mumbai Tea product card", sourceUrl: "https://www.cigarpro.ru/narghile-tobacco/fake/tabak-dlia-kaliana-fake-mumbai-tea-40g/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0044", manufacturer: "Hook", sourceProductName: "Гранатовый",
    manufacturerId: "hook", canonicalManufacturerName: "HOOK by Chabacco", canonicalProductName: "Гранатовый",
    evidence: [
      { sourceType: "OFFICIAL_SOCIAL_ANNOUNCEMENT", sourceReference: "Official Chabacco announcement: Гранатовый HOOK", sourceUrl: "https://t.me/s/chabacco_official/1067", confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "HOOK by Chabacco assortment includes Гранатовый", sourceUrl: "https://ivankalyanshop.ru/blog-obzor-hook", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0074", manufacturer: "Hook", sourceProductName: "Инжирный",
    manufacturerId: "hook", canonicalManufacturerName: "HOOK by Chabacco", canonicalProductName: "Инжирный",
    evidence: [{ sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "HOOK by Chabacco catalog: Инжирный", sourceUrl: "https://chabacco.ru/hook", confidence: "HIGH" }],
  }),
  decision({
    groupId: "identity-group-0031", manufacturer: "Hook", sourceProductName: "Лимон-лайм",
    manufacturerId: "hook", canonicalManufacturerName: "HOOK by Chabacco", canonicalProductName: "Лимон Лайм", aliases: ["Лимон-лайм"],
    evidence: [{ sourceType: "OFFICIAL_MANUFACTURER_CATALOG", sourceReference: "HOOK by Chabacco catalog: Лимон Лайм", sourceUrl: "https://chabacco.ru/hook", confidence: "HIGH" }],
  }),
  decision({
    groupId: "identity-group-0084", manufacturer: "Husky", sourceProductName: "Caipirinha",
    manufacturerId: "husky", canonicalManufacturerName: "Husky", canonicalProductName: "Caipirinha",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Husky main assortment: Caipirinha", sourceUrl: "https://htreviews.org/tobaccos/husky/main", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "HUSKY Caipirinha product listing", sourceUrl: "https://tyumen.indi-shop.ru/kalyany/tabak-kalyan/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0038", manufacturer: "Husky", sourceProductName: "Kiwano",
    manufacturerId: "husky", canonicalManufacturerName: "Husky", canonicalProductName: "Kiwano",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Husky main assortment: Kiwano", sourceUrl: "https://htreviews.org/tobaccos/husky/main/kiwano", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "HUSKY Kiwano product listing", sourceUrl: "https://tyumen.indi-shop.ru/kalyany/tabak-kalyan/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0083", manufacturer: "Husky", sourceProductName: "Marzipan",
    manufacturerId: "husky", canonicalManufacturerName: "Husky", canonicalProductName: "Marzipan",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Husky main: Marzipan", sourceUrl: "https://htreviews.org/tobaccos/husky/main/marzipan", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "HUSKY Marzipan product card", sourceUrl: "https://el-cigarette.com/product/tabak-dlya-kalyana-husky-marzipan-25-gr/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0077", manufacturer: "Husky", sourceProductName: "Ананас",
    manufacturerId: "husky", canonicalManufacturerName: "Husky", canonicalProductName: "Pineapple", aliases: ["Ананас"],
    evidence: [{ sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Husky main: Pineapple / Ананас", sourceUrl: "https://htreviews.org/tobaccos/husky/main/pineapple", confidence: "MEDIUM" }],
  }),
]);
