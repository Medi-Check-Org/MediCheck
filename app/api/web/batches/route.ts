import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/web/batches?organizationId=ORG_ID
// Returns batches for an organization, including product and unit counts,
// shaped to match MedicationBatchInfoProps and the new Prisma schema.
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      prisma.medicationBatch.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: {
          product: true, // Product carries manufacturingDate & expiryDate in new schema
          _count: {
            select: {
              medicationUnits: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.medicationBatch.count({
        where: { organizationId },
      }),
    ]);

    return NextResponse.json({
      batches,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

/**
 * Web API: List Batches
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/core/auth";
import { listBatches } from "@/core/usecases/batches/listBatches";
import { toErrorResponse } from "@/utils/types/errors";

export async function GET(req: NextRequest) {
  try {
    
    const actor = await getActorFromClerk();

    // Extract query params
    const { searchParams } = new URL(req.url);

    const input = {
      organizationId: searchParams.get("organizationId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
    };

    const result = await listBatches(input, actor);

    return NextResponse.json({ success: true, data: result });

  }
  catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
