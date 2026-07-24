-- ADR-018: extends Prisma enum FlavorNoteCategory with 9 categories used by
-- PRODUCT_FLAVOR_PROFILE_REGISTRY's dominantNoteIds that had no equivalent in the
-- original 16-value enum (SOUR, CANDY, MINT, TEA, FRESH, BAKERY, ALCOHOL, WOODY, VANILLA).
-- Additive only: no existing value is renamed or removed, no existing FlavorNote row is touched.
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'SOUR';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'CANDY';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'MINT';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'TEA';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'FRESH';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'BAKERY';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'ALCOHOL';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'WOODY';
ALTER TYPE "FlavorNoteCategory" ADD VALUE 'VANILLA';
