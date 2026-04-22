import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegulatorContext } from "@/core/auth/regulator";
import { toErrorResponse } from "@/utils/types/errors";

export async function GET(request: NextRequest) {
  try {
    await getRegulatorContext();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Analytics data for reports
    const analytics = {
      // Scan activities by organization type
      scansByOrgType: await prisma.scanHistory.groupBy({
        by: ["region"],
        where: {
          scanDate: { gte: startOfMonth },
        },
        _count: {
          id: true,
        },
      }),

      // Counterfeit reports by severity
      counterfeitBySeverity: await prisma.counterfeitReport.groupBy({
        by: ["severity"],
        where: {
          createdAt: { gte: startOfMonth },
        },
        _count: {
          id: true,
        },
      }),

      // Monthly trends for investigations
      monthlyInvestigations: await prisma.counterfeitReport.groupBy({
        by: ["createdAt"],
        where: {
          createdAt: { gte: startOfYear },
        },
        _count: {
          id: true,
        },
      }),

      // Organization verification status
      organizationStats: await prisma.organization.groupBy({
        by: ["organizationType", "isVerified"],
        where: {
          organizationType: { not: "REGULATOR" },
        },
        _count: {
          id: true,
        },
      }),

      // Transfer status distribution
      transferStats: await prisma.ownershipTransfer.groupBy({
        by: ["status"],
        where: {
          transferDate: { gte: startOfMonth },
        },
        _count: {
          id: true,
        },
      }),

      // Batch status overview
      batchStats: await prisma.medicationBatch.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),

      // Geographic distribution of scans
      scansByRegion: await prisma.scanHistory.groupBy({
        by: ["region"],
        where: {
          scanDate: { gte: startOfMonth },
          region: { not: null },
        },
        _count: {
          id: true,
        },
      }),

      // Summary statistics
      summary: {
        totalOrganizations: await prisma.organization.count({
          where: { organizationType: { not: "REGULATOR" } },
        }),
        verifiedOrganizations: await prisma.organization.count({
          where: {
            organizationType: { not: "REGULATOR" },
            isVerified: true,
          },
        }),
        totalBatches: await prisma.medicationBatch.count(),
        totalScans: await prisma.scanHistory.count({
          where: { scanDate: { gte: startOfMonth } },
        }),
        totalInvestigations: await prisma.counterfeitReport.count(),
        activeInvestigations: await prisma.counterfeitReport.count({
          where: { status: { in: ["PENDING", "INVESTIGATING"] } },
        }),
        resolvedInvestigations: await prisma.counterfeitReport.count({
          where: { status: "RESOLVED" },
        }),
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
