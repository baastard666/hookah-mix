import { NextResponse } from "next/server";
import { z } from "zod";
import { flavorInclude, mapFlavor } from "@/lib/flavor-mapper";
import { calculateMixAnalysis } from "@/lib/mix-analysis";
import { analyzeMix, BOWL_TYPES } from "@/lib/mix-analyzer";
import { fromPrismaFlavor } from "@/lib/mix-profile";
import { prisma } from "@/lib/prisma";

const schema = z.object({ components: z.array(z.object({ flavorId: z.number().int(), percentage: z.number().int().positive() })).min(2).max(5), bowlType: z.enum(BOWL_TYPES), coalCount: z.union([z.literal(2), z.literal(3), z.literal(4)]), warmupMinutes: z.number().int().min(0).max(20) });

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    if (new Set(input.components.map(component => component.flavorId)).size !== input.components.length) throw new Error("Табаки не должны повторяться");
    const raw = await prisma.flavor.findMany({ where: { id: { in: input.components.map(component => component.flavorId) } }, include: flavorInclude });
    if (raw.length !== input.components.length) throw new Error("Один из табаков не найден");
    const legacyComponents = input.components.map(component => ({ flavor: mapFlavor(raw.find(flavor => flavor.id === component.flavorId)!), percentage: component.percentage }));
    const canonicalComponents = input.components.map(component => fromPrismaFlavor(raw.find(flavor => flavor.id === component.flavorId)!, component.percentage));
    const analysis = calculateMixAnalysis({ components: canonicalComponents });
    const legacyAnalysis = analyzeMix(legacyComponents, input);
    const title = analysis.mixProfile.dominantNotes.slice(0, 2).map(note => note.noteName).join(" + ") || "Авторский микс";
    const mix = await prisma.mix.create({ data: { title, bowlType: input.bowlType, coalCount: input.coalCount, warmupMinutes: input.warmupMinutes, compatibilityScore: analysis.compatibility.compatibilityScore, components: { create: input.components.map(component => ({ flavorId: component.flavorId, percentage: component.percentage })) } } });
    return NextResponse.json({
      id: mix.id,
      predictedScore: analysis.scoring.predictedQualityScore,
      confidenceLabel: analysis.scoring.predictionConfidence.finalConfidenceLabel,
      dataQuality: analysis.scoring.dataQuality,
      scoreBreakdown: analysis.scoring.scoreBreakdown,
      riskFlags: analysis.scoring.riskFlags,
      isVerifiedSmokeScore: analysis.scoring.isVerifiedSmokeScore,
      canonicalComponents: analysis.canonicalMix.components.map(component => ({
        canonicalProductId: component.resolution.canonicalProductId,
        normalizedManufacturer: component.brandName,
        normalizedProductLine: component.resolution.canonicalProductLine,
        normalizedProductName: component.flavorName,
        resolutionStatus: component.resolution.status,
        profileReliability: component.effectiveProfile.profileReliability,
        percentage: component.percentage,
      })),
      legacyHeatRisk: legacyAnalysis.overheatingRisk,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Некорректные данные" }, { status: 400 });
  }
}
