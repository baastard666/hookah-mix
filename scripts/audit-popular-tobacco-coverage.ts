import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import { listProductFlavorProfiles } from "../src/lib/product-flavor-profile";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";
import { applyIdentityDecisionsToExpertMixKnowledge, createVerifiedMixRecipeRegistry } from "../src/lib/verified-mix-recipe";
import { getMixCatalogSnapshot } from "../src/lib/mix-catalog";

type BrandCoverage = {
  readonly brand: string;
  readonly manufacturerId: string | null;
  /** Products visible to the public catalog; test fixtures are excluded. */
  readonly prismaProducts: number;
  readonly testProducts: number;
  readonly canonicalResolvedProducts: number;
  readonly productFlavorProfiles: number;
  readonly productsWithDominantCategories: number;
  readonly expertKnowledgeProducts: number;
  readonly verifiedRecipeOccurrences: number;
  readonly readyMixOccurrences: number;
  readonly readyMixRecipes: number;
  readonly uniqueProductsInReadyMixes: number;
};

const countBy = <T>(items: readonly T[], key: (item: T) => string | null | undefined): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = key(item);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
};

const uniqueBy = <T>(items: readonly T[], key: (item: T) => string | null | undefined): Map<string, Set<string>> => {
  const values = new Map<string, Set<string>>();
  for (const item of items) {
    const group = key(item);
    if (!group) continue;
    const id = JSON.stringify(item);
    const current = values.get(group) ?? new Set<string>();
    current.add(id);
    values.set(group, current);
  }
  return values;
};

const main = async (): Promise<void> => {
  const snapshot = getMixCatalogSnapshot();
  const decisions = TOBACCO_IDENTITY_DECISION_REGISTRY.list();
  const resolved = decisions.filter(item => item.decision.status === "RESOLVED" && item.decision.manufacturerId && item.decision.canonicalProductId);
  const manufacturerNameById = new Map(resolved.map(item => [item.decision.manufacturerId!, item.decision.canonicalManufacturerName ?? item.sourceIdentity.manufacturer ?? item.decision.manufacturerId!]));
  const canonicalManufacturerById = new Map(resolved.map(item => [item.decision.canonicalProductId!, item.decision.manufacturerId!]));
  const profiles = listProductFlavorProfiles();
  const imported = await importExpertMixKnowledge(path.resolve("data/hookah_mix_database.xlsx"));
  const enrichedRecords = applyIdentityDecisionsToExpertMixKnowledge(imported.registry.records, imported.components, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const verifiedRecipes = createVerifiedMixRecipeRegistry(enrichedRecords, TOBACCO_IDENTITY_DECISION_REGISTRY).list();
  const dbBrands = await prisma.brand.findMany({ include: { flavors: { select: { canonicalProductId: true, catalogEntryType: true } } }, orderBy: { name: "asc" } });
  const normalizedName = (value: string): string => value.toLocaleLowerCase("ru-RU").trim();
  const manufacturerIdByName = new Map([...manufacturerNameById.entries()].map(([id, name]) => [normalizedName(name), id]));

  const profileByManufacturer = countBy(profiles, profile => canonicalManufacturerById.get(profile.canonicalProductId));
  const categorizedProfilesByManufacturer = countBy(profiles.filter(profile => profile.dominantNoteIds.length > 0), profile => canonicalManufacturerById.get(profile.canonicalProductId));
  const canonicalProductsByManufacturer = uniqueBy(resolved, decision => decision.decision.manufacturerId).entries();
  const canonicalProductCounts = new Map([...canonicalProductsByManufacturer].map(([id, values]) => [id, values.size]));
  const expertComponents = enrichedRecords.flatMap(record => record.components);
  const expertProductsByManufacturer = new Map<string, Set<string>>();
  for (const component of expertComponents) {
    if (!component.manufacturerId || !component.canonicalProductId) continue;
    const products = expertProductsByManufacturer.get(component.manufacturerId) ?? new Set<string>();
    products.add(component.canonicalProductId);
    expertProductsByManufacturer.set(component.manufacturerId, products);
  }
  const verifiedOccurrences = countBy(verifiedRecipes.flatMap(recipe => recipe.components), component => canonicalManufacturerById.get(component.canonicalProductId));
  const snapshotOccurrences = countBy(snapshot.items.flatMap(item => item.components), component => manufacturerIdByName.get(normalizedName(component.manufacturer)) ?? component.manufacturer);
  const snapshotRecipeSets = new Map<string, Set<string>>();
  const snapshotProducts = new Map<string, Set<string>>();
  for (const item of snapshot.items) for (const component of item.components) {
    const key = manufacturerIdByName.get(normalizedName(component.manufacturer)) ?? component.manufacturer;
    const recipes = snapshotRecipeSets.get(key) ?? new Set<string>(); recipes.add(item.recipeId); snapshotRecipeSets.set(key, recipes);
    const products = snapshotProducts.get(key) ?? new Set<string>(); products.add(component.canonicalProductId); snapshotProducts.set(key, products);
  }

  const rowInputs = new Map<string, { brand: string; manufacturerId: string | null; prismaProducts: number; testProducts: number }>();
  for (const brand of dbBrands) {
    const ids = new Set(brand.flavors.flatMap(flavor => flavor.canonicalProductId ? [canonicalManufacturerById.get(flavor.canonicalProductId)].filter((id): id is string => Boolean(id)) : []));
    const manufacturerId = ids.size === 1 ? [...ids][0]! : manufacturerIdByName.get(normalizedName(brand.name)) ?? null;
    const key = manufacturerId ?? `db:${normalizedName(brand.name)}`;
    const current = rowInputs.get(key);
    const publicProductCount = brand.flavors.filter(flavor => flavor.catalogEntryType !== "TEST").length;
    const testProductCount = brand.flavors.length - publicProductCount;
    rowInputs.set(key, {
      brand: manufacturerId ? manufacturerNameById.get(manufacturerId) ?? brand.name : brand.name,
      manufacturerId,
      prismaProducts: (current?.prismaProducts ?? 0) + publicProductCount,
      testProducts: (current?.testProducts ?? 0) + testProductCount,
    });
  }
  for (const [manufacturerId, brand] of manufacturerNameById) if (!rowInputs.has(manufacturerId)) rowInputs.set(manufacturerId, { brand, manufacturerId, prismaProducts: 0, testProducts: 0 });
  for (const manufacturer of snapshotOccurrences.keys()) if (!rowInputs.has(manufacturer)) rowInputs.set(manufacturer, { brand: manufacturerNameById.get(manufacturer) ?? manufacturer, manufacturerId: manufacturerNameById.has(manufacturer) ? manufacturer : null, prismaProducts: 0, testProducts: 0 });

  const rows: BrandCoverage[] = [...rowInputs.values()].map(current => {
    const manufacturerId = current.manufacturerId;
    return {
      brand: current.brand,
      manufacturerId,
      prismaProducts: current.prismaProducts,
      testProducts: current.testProducts,
      canonicalResolvedProducts: manufacturerId ? canonicalProductCounts.get(manufacturerId) ?? 0 : 0,
      productFlavorProfiles: manufacturerId ? profileByManufacturer.get(manufacturerId) ?? 0 : 0,
      productsWithDominantCategories: manufacturerId ? categorizedProfilesByManufacturer.get(manufacturerId) ?? 0 : 0,
      expertKnowledgeProducts: manufacturerId ? expertProductsByManufacturer.get(manufacturerId)?.size ?? 0 : 0,
      verifiedRecipeOccurrences: manufacturerId ? verifiedOccurrences.get(manufacturerId) ?? 0 : 0,
      readyMixOccurrences: snapshotOccurrences.get(manufacturerId ?? current.brand) ?? 0,
      readyMixRecipes: snapshotRecipeSets.get(manufacturerId ?? current.brand)?.size ?? 0,
      uniqueProductsInReadyMixes: snapshotProducts.get(manufacturerId ?? current.brand)?.size ?? 0,
    };
  }).sort((left, right) => right.readyMixOccurrences - left.readyMixOccurrences || right.productFlavorProfiles - left.productFlavorProfiles || left.brand.localeCompare(right.brand, "ru"));

  const categoryDistribution = countBy(profiles.flatMap(profile => profile.dominantNoteIds), category => category);
  const dimensionDistribution = Object.fromEntries(["strength", "sourness", "sweetness", "freshness"].map(dimension => [dimension, profiles.map(profile => profile.dimensions[dimension as keyof typeof profile.dimensions]?.value).filter((value): value is number => value !== undefined)]));
  const output = {
    schemaVersion: "popular-tobacco-coverage-audit-v1",
    generatedAt: null,
    totals: {
      prismaBrands: dbBrands.length,
      prismaFlavors: dbBrands.reduce((sum, brand) => sum + brand.flavors.length, 0),
      publicCatalogProducts: dbBrands.flatMap(brand => brand.flavors).filter(flavor => flavor.catalogEntryType !== "TEST").length,
      testProducts: dbBrands.flatMap(brand => brand.flavors).filter(flavor => flavor.catalogEntryType === "TEST").length,
      resolvedCanonicalProducts: new Set(resolved.map(item => item.decision.canonicalProductId)).size,
      productFlavorProfiles: profiles.length,
      verifiedRecipes: verifiedRecipes.length,
      readyMixes: snapshot.items.length,
    },
    brands: rows,
    profileCategoryDistribution: Object.fromEntries([...categoryDistribution.entries()].sort(([left], [right]) => left.localeCompare(right, "en"))),
    profileDimensions: Object.fromEntries(Object.entries(dimensionDistribution).map(([dimension, values]) => [dimension, { count: values.length, min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null, mean: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : null }])),
    snapshotManufacturerOccurrences: Object.fromEntries([...snapshotOccurrences.entries()].sort(([left], [right]) => left.localeCompare(right, "ru"))),
  };
  if (process.argv.includes("--write-report")) {
    await mkdir(path.resolve("reports"), { recursive: true });
    await writeFile(path.resolve("reports/popular-tobacco-expansion-v1-audit.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(output, null, 2));
};

main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
