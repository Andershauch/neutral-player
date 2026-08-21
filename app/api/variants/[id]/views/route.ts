import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentYearMonth } from "@/lib/plan-limits";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const variant = await prisma.variant.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: { organizationId: true, durationSeconds: true },
    });

    // Leveringsminutter er et estimat: én afspilningsstart regnes som hele varigheden.
    // Det er et konservativt overslag indtil Mux Data-afstemning er koblet på.
    if (variant.organizationId) {
      const estimatedMinutes = Math.ceil((variant.durationSeconds || 0) / 60);
      const yearMonth = getCurrentYearMonth();

      await prisma.usageMonth.upsert({
        where: {
          organizationId_yearMonth: {
            organizationId: variant.organizationId,
            yearMonth,
          },
        },
        create: {
          organizationId: variant.organizationId,
          yearMonth,
          playStarts: 1,
          deliveryMinutes: estimatedMinutes,
        },
        update: {
          playStarts: { increment: 1 },
          deliveryMinutes: { increment: estimatedMinutes },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
