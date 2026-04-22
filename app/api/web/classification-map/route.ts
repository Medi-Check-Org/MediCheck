// app/api/classification-map/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? 7);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await prisma.predictionScore.findMany({
      where: {
        predictedAt: { gte: since },
      },
      include: {
        scanHistory: {
          select: {
            latitude: true,
            longitude: true,
            region: true,
          },
        },
      },
    });

    const points = rows
      .filter(
        (r: any) =>
          r.scanHistory.latitude !== null && r.scanHistory.longitude !== null
      )
      .map((r: any) => ({
        lat: r.scanHistory.latitude as number,
        lon: r.scanHistory.longitude as number,
        region: r.scanHistory.region ?? "Unknown",
        predictedLabel: r.predictedLabel,
        probability: r.predictedProbability,
        time: r.predictedAt,
      }));

    return NextResponse.json(points);
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
