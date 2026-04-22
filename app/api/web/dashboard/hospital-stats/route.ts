import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Batch fragment from completed-transfers include (expiry on Product) */
interface CompletedTransferBatchFragment {
  batchSize: number;
  status: string;
  product?: { expiryDate: Date | null } | null;
}

/** One row from completedTransfers findMany (batch fragment only) */
interface CompletedTransferWithBatch {
  batch: CompletedTransferBatchFragment | null;
}

/** Response shape for GET /api/web/dashboard/hospital-stats */
interface HospitalStatsResponse {
  totalMedications: number;
  medicationGrowth: number;
  verifiedToday: number;
  verificationDifference: number;
  pendingVerifications: number;
  alerts: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if the organization exists and is a hospital
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, organizationType: true }
    });

    if (!organization || organization.organizationType !== "HOSPITAL") {
      return NextResponse.json({ error: "Organization not found or not a hospital" }, { status: 404 });
    }

    // Get current date and start of today for calculations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    // 1. Total medications in hospital inventory (from completed transfers TO the hospital)
    const completedTransfers = await prisma.ownershipTransfer.findMany({
      where: {
        toOrgId: orgId,
        status: "COMPLETED"
      },
      include: {
        batch: {
          select: {
            batchSize: true,
            status: true,
            product: { select: { expiryDate: true } }
          }
        }
      }
    });

    const batchNotExpired = (batch: CompletedTransferBatchFragment): boolean =>
      batch.status !== "EXPIRED" && (!batch.product?.expiryDate || new Date(batch.product.expiryDate) > now);

    // Count total units from completed transfers (excluding expired batches)
    const totalMedications = completedTransfers.reduce(
      (total: number, transfer: CompletedTransferWithBatch) => {
        if (transfer.batch && batchNotExpired(transfer.batch)) {
          return total + transfer.batch.batchSize;
        }
        return total;
      },
      0
    );

    // Calculate medication growth (transfers completed this month vs last month)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthTransfers = await prisma.ownershipTransfer.count({
      where: {
        toOrgId: orgId,
        status: "COMPLETED",
        transferDate: { gte: thisMonthStart }
      }
    });

    const lastMonthTransfers = await prisma.ownershipTransfer.count({
      where: {
        toOrgId: orgId,
        status: "COMPLETED",
        transferDate: {
          gte: lastMonthStart,
          lt: thisMonthStart
        }
      }
    });

    const medicationGrowth = lastMonthTransfers > 0
      ? Math.round(((thisMonthTransfers - lastMonthTransfers) / lastMonthTransfers) * 100)
      : thisMonthTransfers > 0 ? 100 : 0;

    // 2. Verifications today (scans by hospital team members)
    const verifiedToday = await prisma.scanHistory.count({
      where: {
        scanDate: { gte: startOfToday },
        teamMember: {
          organizationId: orgId
        },
        scanResult: "GENUINE"
      }
    });

    // Verifications yesterday for comparison
    const verifiedYesterday = await prisma.scanHistory.count({
      where: {
        scanDate: {
          gte: startOfYesterday,
          lt: startOfToday
        },
        teamMember: {
          organizationId: orgId
        },
        scanResult: "GENUINE"
      }
    });

    const verificationDifference = verifiedToday - verifiedYesterday;

    // 3. Pending verifications (pending transfers TO this hospital)
    const pendingVerifications = await prisma.ownershipTransfer.count({
      where: {
        toOrgId: orgId,
        status: "PENDING"
      }
    });

    // 4. Active alerts (expiring medications from hospital inventory; expiry is on Product)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringMedications = completedTransfers.filter(
      (transfer: CompletedTransferWithBatch) => {
        const exp = transfer.batch?.product?.expiryDate;
        return transfer.batch && exp != null && new Date(exp) > now && new Date(exp) <= thirtyDaysFromNow;
      }
    ).length;

    // Count critical counterfeit reports for batches in hospital inventory
    const criticalReports = await prisma.counterfeitReport.count({
      where: {
        batch: {
          ownershipTransfers: {
            some: {
              toOrgId: orgId,
              status: "COMPLETED"
            }
          }
        },
        status: {
          in: ["PENDING", "INVESTIGATING"]
        },
        severity: {
          in: ["HIGH", "CRITICAL"]
        }
      }
    });

    const alerts = expiringMedications + criticalReports;

    const stats: HospitalStatsResponse = {
      totalMedications,
      medicationGrowth,
      verifiedToday,
      verificationDifference,
      pendingVerifications,
      alerts
    };

    return NextResponse.json(stats);

  } catch (error: unknown) {
    console.error("Error fetching hospital stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
