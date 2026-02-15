// /app/api/web/batches/[batchId]/units/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ batchId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { batchId } = await params;

    const units = await prisma.medicationUnit.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(units);
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to fetch units";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
