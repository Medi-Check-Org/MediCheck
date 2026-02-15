import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/lib/generated/prisma";

export type ActivityType = "BATCH_CREATED" | "TRANSFER" | "COUNTERFEIT_REPORT";

export interface BaseActivity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  status: string | null;
}

export interface BatchActivity extends BaseActivity {
  type: "BATCH_CREATED";
}

export interface TransferActivity extends BaseActivity {
  type: "TRANSFER";
}

export interface ReportActivity extends BaseActivity {
  type: "COUNTERFEIT_REPORT";
}

export type RegulatorActivity = BatchActivity | TransferActivity | ReportActivity;
type BatchResult = Prisma.MedicationBatchGetPayload<{
  include: { organization: { select: { companyName: true } } }
}>;

type TransferResult = Prisma.OwnershipTransferGetPayload<{
  include: {
    fromOrg: { select: { companyName: true } },
    toOrg: { select: { companyName: true } },
    batch: { select: { drugName: true } }
  }
}>;

type ReportResult = Prisma.CounterfeitReportGetPayload<{
  include: { batch: { select: { drugName: true } } }
}>;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the regulator organization for this user
    const organization = await prisma.organization.findFirst({
      where: {
        organizationType: "REGULATOR",
        OR: [
          { adminId: userId },
          { teamMembers: { some: { userId: userId } } }
        ]
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Regulator organization not found or access denied" }, { status: 403 });
    }

    // Fetch batch creations with explicit payload typing
    const batches: BatchResult[] = await prisma.medicationBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        organization: {
          select: { companyName: true }
        }
      }
    });

    // Fetch ownership transfers with explicit payload typing
    const transfers: TransferResult[] = await prisma.ownershipTransfer.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        fromOrg: { select: { companyName: true } },
        toOrg: { select: { companyName: true } },
        batch: { select: { drugName: true } }
      }
    });

    // Fetch counterfeit reports with explicit payload typing
    const reports: ReportResult[] = await prisma.counterfeitReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        batch: { select: { drugName: true } }
      }
    });

    // Transform raw results into domain-specific RegulatorActivity items
    const activities: RegulatorActivity[] = [
      ...batches.map((batch: BatchResult): BatchActivity => ({
        id: `batch-${batch.id}`,
        type: "BATCH_CREATED",
        description: `${batch.organization.companyName} created batch ${batch.batchId} (${batch.drugName})`,
        timestamp: batch.createdAt,
        status: String(batch.status)
      })),
      ...transfers.map((transfer: TransferResult): TransferActivity => ({
        id: `transfer-${transfer.id}`,
        type: "TRANSFER",
        description: `Transfer from ${transfer.fromOrg.companyName} to ${transfer.toOrg.companyName} for ${transfer.batch.drugName}`,
        timestamp: transfer.createdAt,
        status: String(transfer.status)
      })),
      ...reports.map((report: ReportResult): ReportActivity => ({
        id: `report-${report.id}`,
        type: "COUNTERFEIT_REPORT",
        description: `New ${report.reportType} report ${report.batch ? `for ${report.batch.drugName}` : ''} - Severity: ${report.severity}`,
        timestamp: report.createdAt,
        status: String(report.status)
      }))
    ];

    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    return NextResponse.json<RegulatorActivity[]>(sortedActivities);

  } catch (error: unknown) {
    console.error("Error fetching regulator activities:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
