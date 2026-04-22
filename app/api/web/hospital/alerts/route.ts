import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Check if the organization exists and is a hospital
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, organizationType: true },
    });

    if (!organization || organization.organizationType !== "HOSPITAL") {
      return NextResponse.json(
        { error: "Organization not found or not a hospital" },
        { status: 404 },
      );
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Expiry is on Product; get batches whose product expires in the window
    const expiringBatches = await prisma.medicationBatch.findMany({
      where: {
        organizationId: orgId,
        product: {
          expiryDate: {
            lte: thirtyDaysFromNow,
            gte: now,
          },
        },
        status: {
          in: ["DELIVERED", "IN_TRANSIT", "CREATED"],
        },
      },
      select: {
        id: true,
        batchId: true,
        drugName: true,
        batchSize: true,
        product: {
          select: { expiryDate: true },
        },
      },
    });

    const getExpiry = (batch: {
      product: { expiryDate: Date | null } | null;
    }) =>
      batch.product?.expiryDate ? new Date(batch.product.expiryDate) : null;

    type BatchWithProduct = (typeof expiringBatches)[number];

    const expiringWithin10Days = expiringBatches.filter(
      (batch: BatchWithProduct) => {
        const exp = getExpiry(batch);
        return exp != null && exp <= tenDaysFromNow;
      },
    );
    const expiringWithin30Days = expiringBatches.filter(
      (batch: BatchWithProduct) => {
        const exp = getExpiry(batch);
        return exp != null && exp > tenDaysFromNow;
      },
    );

    const response = {
      criticalAlerts: [],
      expiryWarnings: {
        urgent: expiringWithin10Days.map((batch) => {
          const exp = getExpiry(batch)!;
          return {
            id: batch.id,
            type: "expiry_urgent",
            title: "Medication expiring within 10 days",
            description: `${batch.drugName} (Batch: ${batch.batchId}) - ${batch.batchSize} units`,
            expiryDate: exp.toISOString(),
            daysUntilExpiry: Math.ceil(
              (exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            ),
          };
        }),
        warning: expiringWithin30Days.map((batch) => {
          const exp = getExpiry(batch)!;
          return {
            id: batch.id,
            type: "expiry_warning",
            title: "Medication expiring within 30 days",
            description: `${batch.drugName} (Batch: ${batch.batchId}) - ${batch.batchSize} units`,
            expiryDate: exp.toISOString(),
            daysUntilExpiry: Math.ceil(
              (exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            ),
          };
        }),
      },
      systemNotifications: [],
      suspiciousActivity: [],
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error fetching hospital alerts:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  } else {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }
}
