import { BOWL_TYPES, type BowlType } from "../../lib/mix-analyzer";

export type BuilderInitialRow = { readonly flavorId: number; readonly percentage: number };
export type BuilderInitialState = { readonly rows: readonly BuilderInitialRow[]; readonly bowlType?: BowlType; readonly coalCount?: 2 | 3 | 4; readonly warmupMinutes?: number };

export const parseBuilderInitialState = (query: { readonly components?: string; readonly bowl?: string; readonly coals?: string; readonly warmup?: string }, validFlavorIds: ReadonlySet<number>): BuilderInitialState | undefined => {
  if (!query.components) return undefined;
  const rows = query.components.split(",").map(item => {
    const [id, percentage] = item.split(":");
    return { flavorId: Number(id), percentage: Number(percentage) };
  });
  const validRows = rows.length >= 2 && rows.length <= 5
    && rows.every(row => Number.isInteger(row.flavorId) && validFlavorIds.has(row.flavorId) && Number.isFinite(row.percentage) && row.percentage > 0 && row.percentage < 100)
    && new Set(rows.map(row => row.flavorId)).size === rows.length
    && Math.abs(rows.reduce((sum, row) => sum + row.percentage, 0) - 100) <= 0.0001;
  if (!validRows) return undefined;
  const bowlType = BOWL_TYPES.includes(query.bowl as BowlType) ? query.bowl as BowlType : undefined;
  const coal = Number(query.coals);
  const coalCount = ([2, 3, 4] as const).find(value => value === coal);
  const warmup = Number(query.warmup);
  const warmupMinutes = Number.isInteger(warmup) && warmup >= 0 && warmup <= 20 ? warmup : undefined;
  return { rows, bowlType, coalCount, warmupMinutes };
};
