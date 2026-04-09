import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegulatorContext } from "@/core/auth/regulator";
import { toErrorResponse } from "@/utils/types/errors";

export async function GET(request: NextRequest) {
  try {
    await getRegulatorContext();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get critical alerts from multiple sources
    const alerts = [];

    // 1. Critical counterfeit reports (high and critical severity)
    const counterfeitAlerts = await prisma.counterfeitReport.findMany({
      where: {
        severity: { in: ['HIGH', 'CRITICAL'] },
        createdAt: { gte: oneDayAgo },
        status: { in: ['PENDING', 'INVESTIGATING'] }
      },
      include: {
        batch: {
          select: {
            batchId: true,
            drugName: true,
            organization: {
              select: {
                companyName: true
              }
            }
          }
        },
        consumers: {
          select: {
            fullName: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    });

    // Transform counterfeit reports to alerts
    counterfeitAlerts.forEach((report) => {
      alerts.push({
        id: `CF_${report.id}`,
        type: 'counterfeit_report',
        message: `${report.reportType.replace('_', ' ')} detected: ${report.batch?.drugName || 'Unknown'} (${report.batch?.batchId || 'N/A'})`,
        severity: report.severity.toLowerCase(),
        time: getTimeAgo(report.createdAt),
        location: report.location || report.consumers?.address || 'Unknown',
        reporter: report.consumers?.fullName || 'Anonymous',
        details: {
          batchId: report.batch?.batchId,
          drugName: report.batch?.drugName,
          manufacturer: report.batch?.organization?.companyName,
          description: report.description
        }
      });
    });

    // 2. Suspicious scan patterns (multiple suspicious scans for same batch)
    const suspiciousScans = await prisma.scanHistory.groupBy({
      by: ['batchId'],
      where: {
        scanDate: { gte: oneDayAgo },
        scanResult: 'SUSPICIOUS',
        batchId: { not: null }
      },
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gte: 3 // 3 or more suspicious scans
          }
        }
      }
    });

    // Get batch details for suspicious scans
    for (const scan of suspiciousScans) {
      if (scan.batchId) {
        const batch = await prisma.medicationBatch.findUnique({
          where: { id: scan.batchId },
          select: {
            batchId: true,
            drugName: true,
            organization: {
              select: {
                companyName: true
              }
            }
          }
        });

        if (batch) {
          alerts.push({
            id: `SUS_${scan.batchId}`,
            type: 'suspicious_pattern',
            message: `Suspicious scan pattern detected: ${batch.drugName} (${batch.batchId})`,
            severity: 'warning',
            time: 'Recent',
            location: 'Multiple locations',
            reporter: 'System Alert',
            details: {
              batchId: batch.batchId,
              drugName: batch.drugName,
              manufacturer: batch.organization?.companyName,
              scanCount: scan._count.id
            }
          });
        }
      }
    }

    // 3. Failed ownership transfers (regulatory approval needed)
    const failedTransfers = await prisma.ownershipTransfer.findMany({
      where: {
        status: 'FAILED',
        updatedAt: { gte: oneDayAgo }
      },
      include: {
        batch: {
          select: {
            batchId: true,
            drugName: true
          }
        },
        fromOrg: {
          select: {
            companyName: true
          }
        },
        toOrg: {
          select: {
            companyName: true
          }
        }
      },
      take: 3
    });

    failedTransfers.forEach((transfer) => {
      alerts.push({
        id: `TF_${transfer.id}`,
        type: 'failed_transfer',
        message: `Failed ownership transfer: ${transfer.batch?.drugName || 'Unknown'} from ${transfer.fromOrg?.companyName}`,
        severity: 'warning',
        time: getTimeAgo(transfer.updatedAt),
        location: 'Transfer System',
        reporter: 'Automated System',
        details: {
          batchId: transfer.batch?.batchId,
          drugName: transfer.batch?.drugName,
          fromOrg: transfer.fromOrg?.companyName,
          toOrg: transfer.toOrg?.companyName,
          notes: transfer.notes
        }
      });
    });

    // 4. Organizations with expired/expiring licenses
    const expiringOrgs = await prisma.organization.findMany({
      where: {
        organizationType: { not: 'REGULATOR' },
        isVerified: true,
        updatedAt: {
          lte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days old
        }
      },
      select: {
        id: true,
        companyName: true,
        organizationType: true,
        updatedAt: true
      },
      take: 3
    });

    expiringOrgs.forEach((org) => {
      alerts.push({
        id: `EXP_${org.id}`,
        type: 'license_expiring',
        message: `License review required: ${org.companyName}`,
        severity: 'info',
        time: getTimeAgo(org.updatedAt),
        location: 'Licensing System',
        reporter: 'Automated System',
        details: {
          companyName: org.companyName,
          organizationType: org.organizationType,
          lastUpdated: org.updatedAt
        }
      });
    });

    // Sort alerts by severity and time
    const severityOrder = { critical: 0, high: 1, warning: 2, info: 3 };
    alerts.sort((a, b) => {
      return severityOrder[a.severity as keyof typeof severityOrder] - 
             severityOrder[b.severity as keyof typeof severityOrder];
    });

    return NextResponse.json({ alerts: alerts.slice(0, 10) }); // Return top 10 alerts

  } catch (error: unknown) {
    console.error("Error fetching alerts:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} mins ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}