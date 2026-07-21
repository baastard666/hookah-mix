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
  const canonicalProductName = input.canonicalProductName ?? input.sourceProductName;
  const canonicalProductId = status === "RESOLVED"
    ? createCanonicalTobaccoProductId(input.manufacturerId, input.productLineId ?? null, canonicalProductName)
    : null;
  if (status === "RESOLVED" && !canonicalProductId) {
    throw new Error(`Cannot create canonical product ID for ${input.groupId}.`);
  }
  return {
    id: `p0-batch-4-${input.groupId}`,
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
      canonicalProductName: status === "RESOLVED" ? canonicalProductName : null,
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

const SAPPHIRE_DECLARATION_URL = "https://xn----7sbajahheyaepn1ca0aveqcb0fxl.xn--p1acf/document/eaes-n-ru-d-rura11v3858224/";

export const P0_IDENTITY_DECISIONS_BATCH_4: readonly TobaccoIdentityDecision[] = Object.freeze([
  decision({
    groupId: "identity-group-0064", manufacturer: "Sapphire", sourceProductName: "Blueberry Granola",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Blueberry Granola",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Blueberry Granola", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sapphire Crown interview confirms Blueberry Granola", sourceUrl: "https://mostabak.su/instructions/segodnya-u-nas-v-gostyah-alyona-direktor-po-marketingu-sapphire-crown/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0053", manufacturer: "Sapphire", sourceProductName: "Fragrant Black Currant",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Fragrant Blackcurrant", aliases: ["Fragrant Black Currant"],
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Fragrant Blackcurrant", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sapphire Crown catalog lists Fragrant Blackcurrant", sourceUrl: "https://smokedex.info/en/shisha/brand/sapphire-crown", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0087", manufacturer: "Sapphire", sourceProductName: "Lemon Lime",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Lemon Lime",
    evidence: [
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Lemon Lime product card", sourceUrl: "https://hookah-voodoo.com/sapphire-crown-lemon-lime-limon-i-lajm-25g-akciznyj", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Independent Sapphire Crown Lemon Lime product card", sourceUrl: "https://www.bigsmoke.pro/catalog/tabak-sapphire-crown-200-gr/tabak_sapphire_crown_lemon_lime_200_gr/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0061", manufacturer: "Sapphire", sourceProductName: "MeJuMi",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "MeJuMi",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown MeJuMi", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sapphire Crown interview confirms MeJuMi", sourceUrl: "https://mostabak.su/instructions/segodnya-u-nas-v-gostyah-alyona-direktor-po-marketingu-sapphire-crown/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0014", manufacturer: "Sapphire", sourceProductName: "Ананасовая фанта",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Pineapple Fanta", aliases: ["Ананасовая фанта", "Pineapple Funta"],
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Pineapple Funta", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Pineapple Fanta product card", sourceUrl: "https://b2hookah.com/products/sapphire-crown-tobacco-pineapple-fanta", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0050", manufacturer: "Sapphire", sourceProductName: "Киви",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Kiwi Fruit", aliases: ["Киви"],
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Kiwi Fruit", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sapphire Crown Kiwi Fruit product listing", sourceUrl: "https://smokershop.kz/menu-categories-crown.html", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0063", manufacturer: "Sapphire", sourceProductName: "Яблочный штрудель",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown", canonicalProductName: "Apple Strudel", aliases: ["Яблочный штрудель"],
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Apple Strudel", sourceUrl: SAPPHIRE_DECLARATION_URL, confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sapphire Crown Apple Strudel product entry", sourceUrl: "https://htreviews.org/tobaccos/sapphire-crown/main/apple-strudell", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0045", manufacturer: "Sarma", sourceProductName: "Банановое суфле",
    manufacturerId: "sarma", canonicalManufacturerName: "Sarma", productLineId: "sarma-classic", canonicalProductLineName: "Классическая", canonicalProductName: "Банановое суфле",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sarma Classic: Банановое суфле", sourceUrl: "https://htreviews.org/tobaccos/sarma/klassicheskaya/bananovoye-sufle", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sarma Банановое суфле product card", sourceUrl: "https://gustogo.ru/tabak/tabak-dlya-kalyana-sarma-bananovoe-sufle-120-gr.html", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0051", manufacturer: "Sarma", sourceProductName: "Огуречный лимонад",
    manufacturerId: "sarma", canonicalManufacturerName: "Sarma", productLineId: "sarma-360", canonicalProductLineName: "360", canonicalProductName: "Огуречный лимонад",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sarma 360 release includes Огуречный лимонад", sourceUrl: "https://hub.hookahbattle.com/ru/two-unexpected-flavors-of-sarma-360/", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Sarma 360 Огуречный лимонад product listing", sourceUrl: "https://justfreid.ru/catalog/tabak/sarma/mixes-mixes-of-tobacco-for-hookah-sarma-sarma/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0101", manufacturer: "Smoke Angels", sourceProductName: "Firestarter",
    manufacturerId: "smoke-angels", canonicalManufacturerName: "Smoke Angels", canonicalProductName: "Firestarter",
    evidence: [
      { sourceType: "OFFICIAL_PRODUCT_PAGE", sourceReference: "Smoke Angels official Firestarter product page", sourceUrl: "https://smoke-angels.com/firestarter", confidence: "HIGH" },
    ],
  }),
  decision({
    groupId: "identity-group-0039", manufacturer: "Spectrum", sourceProductName: "Ice Fruit Gum",
    manufacturerId: "spectrum", canonicalManufacturerName: "Spectrum", status: "AMBIGUOUS",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Spectrum Classic Line includes Ice Fruit Gum", sourceUrl: "https://htreviews.org/tobaccos/spectrum/classic-line/ice-fruit-gum", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Spectrum Hard Line also includes Ice Fruit Gum", sourceUrl: "https://htreviews.org/tobaccos/spectrum/hard-line/ice-fruit-gum", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0040", manufacturer: "Spectrum", sourceProductName: "Jungle Mix",
    manufacturerId: "spectrum", canonicalManufacturerName: "Spectrum", status: "AMBIGUOUS",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Spectrum Classic Line includes Jungle Mix", sourceUrl: "https://htreviews.org/tobaccos/spectrum/classic-line/jungle-mix", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Spectrum Hard Line also includes Jungle Mix", sourceUrl: "https://htreviews.org/tobaccos/spectrum/hard-line/jungle-mix", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0082", manufacturer: "Take", sourceProductName: "Ананас",
    manufacturerId: "take", canonicalManufacturerName: "Take", canonicalProductName: "Pineapple", aliases: ["Ананас"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Take main: Pineapple / Ананас", sourceUrl: "https://htreviews.org/tobaccos/take/main/ananas", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Take Pineapple / Ананас product listing", sourceUrl: "https://eltobacco.ru/store/tabak-dlya-kalyana/take/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0024", manufacturer: "Urban Soul", sourceProductName: "Berry Marmalade",
    manufacturerId: "urban-soul", canonicalManufacturerName: "Urban Soul", canonicalProductName: "Berry Marmalade", aliases: ["Ягодный мармелад"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Urban Soul main: Berry Marmalade / Ягодный мармелад", sourceUrl: "https://htreviews.org/tobaccos/urban-soul", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Urban Soul catalog lists Ягодный мармелад", sourceUrl: "https://ekaterinburg.smokemarket.cc/kalyany/tabak-dlya-kalyana/gotovyy-tabak/urban-soul/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0015", manufacturer: "Urban Soul", sourceProductName: "Ананас",
    manufacturerId: "urban-soul", canonicalManufacturerName: "Urban Soul", canonicalProductName: "Pineapple", aliases: ["Ананас"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Urban Soul main: Pineapple / Ананас", sourceUrl: "https://htreviews.org/tobaccos/urban-soul", confidence: "MEDIUM" },
    ],
  }),
]);
