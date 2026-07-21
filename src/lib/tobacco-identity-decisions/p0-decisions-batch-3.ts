import { createCanonicalTobaccoProductId, normalizeDecisionText } from "./normalization";
import type { TobaccoIdentityConfidence, TobaccoIdentityDecision, TobaccoIdentityEvidence, TobaccoIdentityEvidenceType } from "./types";

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
  readonly canonicalProductName?: string;
  readonly aliases?: readonly string[];
  readonly evidence: readonly PublicEvidenceInput[];
};

const toEvidence = (input: PublicEvidenceInput): TobaccoIdentityEvidence => ({
  ...input,
  checkedAt: REVIEW_DATE,
  publicSafe: true,
});

const decision = (input: BatchInput): TobaccoIdentityDecision => {
  const canonicalProductName = input.canonicalProductName ?? input.sourceProductName;
  const canonicalProductId = createCanonicalTobaccoProductId(input.manufacturerId, null, canonicalProductName);
  if (!canonicalProductId) throw new Error(`Cannot create canonical product ID for ${input.groupId}.`);
  return {
    id: `p0-batch-3-${input.groupId}`,
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
      productLineInterpretation: "CONFIRMED_NONE",
    },
    decision: {
      status: "RESOLVED",
      manufacturerId: input.manufacturerId,
      productLineId: null,
      canonicalProductId,
      canonicalManufacturerName: input.canonicalManufacturerName,
      canonicalProductLineName: null,
      canonicalProductName,
      aliases: [...new Set(input.aliases ?? [])],
    },
    evidence: input.evidence.map(toEvidence),
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

export const P0_IDENTITY_DECISIONS_BATCH_3: readonly TobaccoIdentityDecision[] = Object.freeze([
  decision({
    groupId: "identity-group-0078", manufacturer: "Husky", sourceProductName: "Маракуйя",
    manufacturerId: "husky", canonicalManufacturerName: "Husky", canonicalProductName: "Passion Fruit", aliases: ["Маракуйя"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Husky main: Passion Fruit / Маракуйя", sourceUrl: "https://htreviews.org/tobaccos/husky/main/passion-fruit", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Husky Passion Fruit / Маракуйя product card", sourceUrl: "https://hookah-voodoo.com/husky-passion-fruit-marakujya-25g", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0029", manufacturer: "Jam", sourceProductName: "Арбузный Rondo",
    manufacturerId: "jam", canonicalManufacturerName: "JAM", canonicalProductName: "Арбузный рондо", aliases: ["Арбузный Rondo"],
    evidence: [
      { sourceType: "OFFICIAL_PRODUCT_PAGE", sourceReference: "JAM product page: Арбузный рондо", sourceUrl: "https://jamtobacco.ru/watermelon_rondo", confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "JAM main assortment: Арбузный рондо", sourceUrl: "https://htreviews.org/tobaccos/jam/jam-main", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0104", manufacturer: "Jam", sourceProductName: "Гранатовый сок",
    manufacturerId: "jam", canonicalManufacturerName: "JAM",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "JAM assortment includes Гранатовый сок", sourceUrl: "https://hookahblog.ru/kalyannye-smesi/jam/obzor-kalyannoy-smesi-jam/", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "JAM catalog listing includes Гранатовый сок", sourceUrl: "https://kurgan.smokemarket.cc/kalyany/tabak-dlya-kalyana/smesi/jam/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0111", manufacturer: "Jam", sourceProductName: "Конфеты с ананасом",
    manufacturerId: "jam", canonicalManufacturerName: "JAM",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "JAM main: Конфеты с ананасом", sourceUrl: "https://htreviews.org/tobaccos/jam/jam-main/konfety-s-ananasom", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "JAM review confirms Конфеты с ананасом", sourceUrl: "https://hookahblog.ru/kalyannye-smesi/jam/obzor-kalyannoy-smesi-jam/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0070", manufacturer: "Jam", sourceProductName: "Красная смородина",
    manufacturerId: "jam", canonicalManufacturerName: "JAM",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "JAM main: Красная смородина", sourceUrl: "https://htreviews.org/tobaccos/jam/jam-main/krasnaya-smorodina", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "JAM Красная смородина product listing", sourceUrl: "https://smolandshop.com/shop/smes-jam---krasnaya-smorodina-250-gr/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0030", manufacturer: "Jam", sourceProductName: "Спелая маракуйя",
    manufacturerId: "jam", canonicalManufacturerName: "JAM",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "JAM main records the renamed Спелая маракуйя product", sourceUrl: "https://htreviews.org/tobaccos/jam/jam-main", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "JAM Спелая маракуйя product card", sourceUrl: "https://kurgan.smokemarket.cc/product/smes-dlya-kalyana-jam-spelaya-marakuyya-50gr", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0102", manufacturer: "MattPear", sourceProductName: "Ginger Feel",
    manufacturerId: "mattpear", canonicalManufacturerName: "MattPear",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "MattPear catalog includes Ginger Feel", sourceUrl: "https://smokedex.info/en/shisha/brand/mattpear", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "MattPear Ginger Feel product card", sourceUrl: "https://spb.smogus.me/shop/tob/mattpear-ginger-feel-imbir/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0042", manufacturer: "OVERDOSE", sourceProductName: "Apple Juicy",
    manufacturerId: "overdose", canonicalManufacturerName: "Overdose",
    evidence: [
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Overdose Apple Juicy product card", sourceUrl: "https://hookahstuff.com/products/overdose-apple-juicy", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose Apple Juicy reference entry", sourceUrl: "https://shisha.today/tobacco/overdose-apple-juicy", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0071", manufacturer: "OVERDOSE", sourceProductName: "Coffee",
    manufacturerId: "overdose", canonicalManufacturerName: "Overdose",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose main: Coffee", sourceUrl: "https://htreviews.org/tobaccos/overdose/overdose-main/coffee", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose catalog lists Coffee", sourceUrl: "https://htreviews.org/tobaccos/overdose", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0026", manufacturer: "OVERDOSE", sourceProductName: "Jelly Grape",
    manufacturerId: "overdose", canonicalManufacturerName: "Overdose",
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose main: Jelly Grape", sourceUrl: "https://htreviews.org/tobaccos/overdose/overdose-main/jelly-grape", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Overdose assortment includes Jelly Grape", sourceUrl: "https://blackshisha.com/brands/overdose/page/2", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0059", manufacturer: "OVERDOSE", sourceProductName: "Клубника",
    manufacturerId: "overdose", canonicalManufacturerName: "Overdose", canonicalProductName: "Strawberry", aliases: ["Клубника"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose main: Strawberry / Клубника", sourceUrl: "https://htreviews.org/tobaccos/overdose/overdose-main/strawberry", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose main catalog includes Strawberry", sourceUrl: "https://htreviews.org/tobaccos/overdose/overdose-main", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0035", manufacturer: "OVERDOSE", sourceProductName: "Самаркандская дыня",
    manufacturerId: "overdose", canonicalManufacturerName: "Overdose", canonicalProductName: "Samarkand Melon", aliases: ["Самаркандская дыня"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose main: Samarkand Melon / Самаркандская дыня", sourceUrl: "https://htreviews.org/tobaccos/overdose/overdose-main/samarkand-melon", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Overdose Samarkand Melon product listing", sourceUrl: "https://kurgan.smokemarket.cc/kalyany/tabak-dlya-kalyana/gotovyy-tabak/overdose/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0021", manufacturer: "OVERDOSE", sourceProductName: "Чай масала",
    manufacturerId: "overdose", canonicalManufacturerName: "Overdose", canonicalProductName: "Masala Tea", aliases: ["Чай масала"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Overdose main: Masala Tea / Чай масала", sourceUrl: "https://htreviews.org/tobaccos/overdose/overdose-main/masala-tea", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Overdose Masala Tea product card", sourceUrl: "https://b.t-p.cc/product/tabak-overdose-masala-tea-25g/", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0110", manufacturer: "Peter Ralf", sourceProductName: "Dolche de Lechee",
    manufacturerId: "peter-ralf", canonicalManufacturerName: "Peter Ralf", canonicalProductName: "Dolce de Lechee", aliases: ["Dolche de Lechee"],
    evidence: [
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Peter Ralf catalog: Dolce de Lechee", sourceUrl: "https://smokedex.info/en/shisha/brand/peter-ralf", confidence: "MEDIUM" },
      { sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "Peter Ralf Dolce de Lechee product card", sourceUrl: "https://blackshisha.com/shisha-tobacco/peter-ralf-tobacco/peter-ralf-250-gr-dolce-de-lechee-tobacco", confidence: "MEDIUM" },
    ],
  }),
  decision({
    groupId: "identity-group-0043", manufacturer: "Sapphire", sourceProductName: "Bitter Cherry",
    manufacturerId: "sapphire-crown", canonicalManufacturerName: "Sapphire Crown",
    evidence: [
      { sourceType: "OTHER_VERIFIED_SOURCE", sourceReference: "EAEU declaration lists Sapphire Crown Bitter Cherry", sourceUrl: "https://reestrinform.ru/reestr-declaratcii-sootvetstviia/reg_number-%D0%95%D0%90%D0%AD%D0%A1_N_RU_%D0%94-RU.%D0%A0%D0%9004.%D0%92.86313--23.html", confidence: "HIGH" },
      { sourceType: "VERIFIED_REVIEW_DATABASE", sourceReference: "Sapphire Crown main: Bitter Cherry", sourceUrl: "https://htreviews.org/tobaccos/sapphire-crown/main/bitter-cherry", confidence: "MEDIUM" },
    ],
  }),
]);
