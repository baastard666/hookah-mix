import { NextResponse } from "next/server";
import { createExactBuilderHref, getMixCatalogItemBySlug } from "@/lib/mix-catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const item = getMixCatalogItemBySlug((await params).slug);
  if (!item) return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });

  try {
    const flavors = await prisma.flavor.findMany({
      where: {
        canonicalProductId: { in: item.components.map(component => component.canonicalProductId) },
        catalogEntryType: { not: "TEST" },
      },
      select: { id: true, canonicalProductId: true },
    });
    const href = createExactBuilderHref(item, flavors.flatMap(flavor => flavor.canonicalProductId ? [{ flavorId: flavor.id, canonicalProductId: flavor.canonicalProductId }] : []));
    return NextResponse.json(href ? { status: "READY", href } : { status: "UNAVAILABLE" });
  } catch {
    // The static recipe page remains available if the local catalog is offline.
    return NextResponse.json({ status: "UNAVAILABLE" }, { status: 503 });
  }
}
