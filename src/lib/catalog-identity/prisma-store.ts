import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../prisma";
import type { CatalogIdentityRecord, CatalogIdentityStore, CatalogIdentityTransaction, PersistedCatalogIdentity } from "./types";

const select = { id: true, name: true, brand: { select: { name: true } }, manufacturerId: true, productLineId: true, canonicalProductName: true, canonicalProductId: true, identityStatus: true, identityVerified: true, catalogEntryType: true } as const;
type SelectedFlavor = Prisma.FlavorGetPayload<{ select: typeof select }>;
const map = (record: SelectedFlavor): CatalogIdentityRecord => ({ catalogId: record.id, brand: record.brand.name, name: record.name, manufacturerId: record.manufacturerId, productLineId: record.productLineId, canonicalProductName: record.canonicalProductName, canonicalProductId: record.canonicalProductId, identityStatus: record.identityStatus, identityVerified: record.identityVerified, catalogEntryType: record.catalogEntryType });
const numericId = (catalogId: string | number): number => typeof catalogId === "number" ? catalogId : Number(catalogId);
const data = (identity: PersistedCatalogIdentity) => ({ manufacturerId: identity.manufacturerId, productLineId: identity.productLineId, canonicalProductName: identity.canonicalProductName, canonicalProductId: identity.canonicalProductId, identityStatus: identity.identityStatus, identityVerified: identity.identityVerified, catalogEntryType: identity.catalogEntryType });

type PrismaTransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
const transactionPort = (client: PrismaTransactionClient): CatalogIdentityTransaction => ({
  findById: async catalogId => { const record = await client.flavor.findUnique({ where: { id: numericId(catalogId) }, select }); return record ? map(record) : null; },
  findByCanonicalProductId: async canonicalProductId => { const record = await client.flavor.findUnique({ where: { canonicalProductId }, select }); return record ? map(record) : null; },
  updateIdentity: async (catalogId, identity) => map(await client.flavor.update({ where: { id: numericId(catalogId) }, data: data(identity), select })),
});

export const createPrismaCatalogIdentityStore = (client: PrismaClient = prisma): CatalogIdentityStore => ({
  list: async () => (await client.flavor.findMany({ select, orderBy: { id: "asc" } })).map(map),
  transaction: operation => client.$transaction(transaction => operation(transactionPort(transaction))),
});

export const readCatalogTobaccoIdentities = async (client: PrismaClient = prisma): Promise<readonly CatalogIdentityRecord[]> => createPrismaCatalogIdentityStore(client).list();
