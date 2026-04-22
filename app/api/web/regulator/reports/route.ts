import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { getRegulatorContext } from "@/core/auth/regulator";
import { toErrorResponse } from "@/utils/types/errors";

type ReportData =
  | Awaited<ReturnType<typeof generateInvestigationsReport>>
  | Awaited<ReturnType<typeof generateComplianceReport>>
  | Awaited<ReturnType<typeof generateEntitiesReport>>
  | Awaited<ReturnType<typeof generateViolationsReport>>
  | Awaited<ReturnType<typeof generateSummaryReport>>;

export async function GET(request: NextRequest) {
  try {
    const { organization } = await getRegulatorContext();

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "summary";

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let reportData: ReportData;

    switch (reportType) {
      case "investigations":
        reportData = await generateInvestigationsReport(startOfMonth);
        break;
      case "compliance":
        reportData = await generateComplianceReport(startOfMonth);
        break;
      case "entities":
        reportData = await generateEntitiesReport();
        break;
      case "violations":
        reportData = await generateViolationsReport(startOfMonth);
        break;
      case "summary":
      default:
        reportData = await generateSummaryReport(startOfMonth, startOfYear);
        break;
    }

    // Generate HTML content for the report
    const htmlContent = generateHtmlReport(
      reportType,
      reportData,
      organization,
    );

    // Dynamic import puppeteer to avoid build issues
    const puppeteerModule = await import("puppeteer");
    const puppeteer = puppeteerModule.default || puppeteerModule;

    // Launch Puppeteer and generate the PDF
    const browser = await (puppeteer as any).launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportType}-report.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating PDF:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

// Generate HTML content for different report types
function generateHtmlReport(
  reportType: string,
  reportData: ReportData,
  organization: Prisma.OrganizationGetPayload<{}>,
): string {
  const baseHtml = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { text-align: center; color: #2c3e50; }
          h2 { margin-top: 20px; color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px; }
          p, li { margin: 10px 0; }
          .summary-stats { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; min-width: 200px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #3498db; }
          .stat-label { color: #7f8c8d; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Regulatory Report</h1>
        <p><strong>Type:</strong> ${capitalize(reportType)}</p>
        <p><strong>Generated at:</strong> ${new Date().toLocaleString()}</p>
        <h2>Organization Info</h2>
        <p><strong>Regulator:</strong> ${organization.companyName} (${organization.agencyName})</p>
        <p><strong>Contact:</strong> ${organization.contactEmail}</p>
        ${generateReportContent(reportType, reportData)}
      </body>
    </html>
  `;
  return baseHtml;
}

// Generate specific report content based on type
function generateReportContent(reportType: string, data: ReportData): string {
  switch (reportType) {
    case "compliance":
      return generateComplianceHtml(
        data as Awaited<ReturnType<typeof generateComplianceReport>>,
      );
    case "investigations":
      return generateInvestigationsHtml(
        data as Awaited<ReturnType<typeof generateInvestigationsReport>>,
      );
    case "entities":
      return generateEntitiesHtml(
        data as Awaited<ReturnType<typeof generateEntitiesReport>>,
      );
    case "violations":
      return generateViolationsHtml(
        data as Awaited<ReturnType<typeof generateViolationsReport>>,
      );
    case "summary":
    default:
      return generateSummaryHtml(
        data as Awaited<ReturnType<typeof generateSummaryReport>>,
      );
  }
}

function generateComplianceHtml(
  data: Awaited<ReturnType<typeof generateComplianceReport>>,
): string {
  return `
    <h2>Compliance Summary</h2>
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-number">${data.summary.total}</div>
        <div class="stat-label">Total Transfers</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.completed}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.complianceRate}%</div>
        <div class="stat-label">Compliance Rate</div>
      </div>
    </div>
    <h2>Recent Transfers</h2>
    ${data.transfers.length === 0 ? "<p>No transfers found.</p>" : generateTransfersTable(data.transfers)}
  `;
}

function generateInvestigationsHtml(
  data: Awaited<ReturnType<typeof generateInvestigationsReport>>,
): string {
  return `
    <h2>Investigation Summary</h2>
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-number">${data.summary.total}</div>
        <div class="stat-label">Total Investigations</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.investigating}</div>
        <div class="stat-label">Investigating</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.resolved}</div>
        <div class="stat-label">Resolved</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.bySeverity.critical}</div>
        <div class="stat-label">Critical</div>
      </div>
    </div>
    <h2>Recent Investigations</h2>
    ${data.investigations.length === 0 ? "<p>No investigations found.</p>" : generateInvestigationsTable(data.investigations)}
  `;
}

function generateEntitiesHtml(
  data: Awaited<ReturnType<typeof generateEntitiesReport>>,
): string {
  return `
    <h2>Entity Summary</h2>
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-number">${data.summary.total}</div>
        <div class="stat-label">Total Organizations</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.verified}</div>
        <div class="stat-label">Verified</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.byType.manufacturers}</div>
        <div class="stat-label">Manufacturers</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.byType.hospitals}</div>
        <div class="stat-label">Hospitals</div>
      </div>
    </div>
    <h2>Recent Organizations</h2>
    ${data.organizations.length === 0 ? "<p>No organizations found.</p>" : generateOrganizationsTable(data.organizations)}
  `;
}

function generateViolationsHtml(
  data: Awaited<ReturnType<typeof generateViolationsReport>>,
): string {
  return `
    <h2>Violation Summary</h2>
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-number">${data.summary.total}</div>
        <div class="stat-label">Total Violations</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.critical}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.high}</div>
        <div class="stat-label">High</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.summary.resolved}</div>
        <div class="stat-label">Resolved</div>
      </div>
    </div>
    <h2>Recent Violations</h2>
    ${data.violations.length === 0 ? "<p>No violations found.</p>" : generateViolationsTable(data.violations)}
  `;
}

function generateSummaryHtml(
  data: Awaited<ReturnType<typeof generateSummaryReport>>,
): string {
  return `
    <h2>Overview</h2>
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-number">${data.overview.totalOrganizations}</div>
        <div class="stat-label">Total Organizations</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.overview.verificationRate}%</div>
        <div class="stat-label">Verification Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.overview.totalBatches}</div>
        <div class="stat-label">Total Batches</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.overview.monthlyScans}</div>
        <div class="stat-label">Monthly Scans</div>
      </div>
    </div>
    <h2>Compliance & Investigations</h2>
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-number">${data.compliance.complianceRate}%</div>
        <div class="stat-label">Compliance Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${data.investigations.resolutionRate}%</div>
        <div class="stat-label">Resolution Rate</div>
      </div>
    </div>
  `;
}

// Helper functions for generating tables
function generateTransfersTable(
  transfers: Awaited<ReturnType<typeof generateComplianceReport>>["transfers"],
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Drug Name</th>
          <th>Batch ID</th>
          <th>From → To</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${transfers
          .slice(0, 10)
          .map(
            (t: (typeof transfers)[number]) => `
          <tr>
            <td>${t.batch?.drugName || "N/A"}</td>
            <td>${t.batch?.batchId || "N/A"}</td>
            <td>${t.fromOrg?.companyName || "Unknown"} → ${t.toOrg?.companyName || "Unknown"}</td>
            <td>${formatDate(t.transferDate)}</td>
            <td>${t.status}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function generateInvestigationsTable(
  investigations: Awaited<
    ReturnType<typeof generateInvestigationsReport>
  >["investigations"],
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Drug Name</th>
          <th>Batch ID</th>
          <th>Status</th>
          <th>Severity</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${investigations
          .slice(0, 10)
          .map(
            (inv: (typeof investigations)[number]) => `
          <tr>
            <td>${inv.batch?.drugName || "N/A"}</td>
            <td>${inv.batch?.batchId || "N/A"}</td>
            <td>${inv.status}</td>
            <td>${inv.severity}</td>
            <td>${formatDate(inv.createdAt)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function generateOrganizationsTable(
  organizations: Awaited<
    ReturnType<typeof generateEntitiesReport>
  >["organizations"],
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Company Name</th>
          <th>Type</th>
          <th>Verified</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        ${organizations
          .slice(0, 10)
          .map(
            (org: (typeof organizations)[number]) => `
          <tr>
            <td>${org.companyName}</td>
            <td>${org.organizationType}</td>
            <td>${org.isVerified ? "Yes" : "No"}</td>
            <td>${org.isActive ? "Yes" : "No"}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function generateViolationsTable(
  violations: Awaited<
    ReturnType<typeof generateViolationsReport>
  >["violations"],
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Drug Name</th>
          <th>Batch ID</th>
          <th>Severity</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${violations
          .slice(0, 10)
          .map(
            (v: (typeof violations)[number]) => `
          <tr>
            <td>${v.batch?.drugName || "N/A"}</td>
            <td>${v.batch?.batchId || "N/A"}</td>
            <td>${v.severity}</td>
            <td>${v.status}</td>
            <td>${formatDate(v.createdAt)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// Helper to capitalize first letter
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper to format date
function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Report data generators (unchanged) ---
async function generateInvestigationsReport(startDate: Date) {
  const investigations = await prisma.counterfeitReport.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    include: {
      batch: {
        select: {
          batchId: true,
          drugName: true,
          organization: {
            select: {
              companyName: true,
              organizationType: true,
            },
          },
        },
      },
      consumers: {
        select: {
          fullName: true,
          country: true,
          state: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const summary = {
    total: investigations.length,
    pending: investigations.filter(
      (inv: (typeof investigations)[number]) => inv.status === "PENDING",
    ).length,
    investigating: investigations.filter(
      (inv: (typeof investigations)[number]) => inv.status === "INVESTIGATING",
    ).length,
    resolved: investigations.filter(
      (inv: (typeof investigations)[number]) => inv.status === "RESOLVED",
    ).length,
    dismissed: investigations.filter(
      (inv: (typeof investigations)[number]) => inv.status === "DISMISSED",
    ).length,
    bySeverity: {
      critical: investigations.filter(
        (inv: (typeof investigations)[number]) => inv.severity === "CRITICAL",
      ).length,
      high: investigations.filter(
        (inv: (typeof investigations)[number]) => inv.severity === "HIGH",
      ).length,
      medium: investigations.filter(
        (inv: (typeof investigations)[number]) => inv.severity === "MEDIUM",
      ).length,
      low: investigations.filter(
        (inv: (typeof investigations)[number]) => inv.severity === "LOW",
      ).length,
    },
  };

  return { investigations, summary };
}

async function generateComplianceReport(startDate: Date) {
  const transfers = await prisma.ownershipTransfer.findMany({
    where: {
      transferDate: { gte: startDate },
    },
    include: {
      batch: {
        select: {
          batchId: true,
          drugName: true,
          product: {
            select: {
              manufacturingDate: true,
              expiryDate: true,
            },
          },
        },
      },
      fromOrg: {
        select: {
          companyName: true,
          organizationType: true,
          isVerified: true,
        },
      },
      toOrg: {
        select: {
          companyName: true,
          organizationType: true,
          isVerified: true,
        },
      },
    },
    orderBy: {
      transferDate: "desc",
    },
  });

  const summary = {
    total: transfers.length,
    pending: transfers.filter(
      (t: (typeof transfers)[number]) => t.status === "PENDING",
    ).length,
    completed: transfers.filter(
      (t: (typeof transfers)[number]) => t.status === "COMPLETED",
    ).length,
    failed: transfers.filter(
      (t: (typeof transfers)[number]) => t.status === "FAILED",
    ).length,
    complianceRate:
      transfers.length > 0
        ? Math.round(
            (transfers.filter(
              (t: (typeof transfers)[number]) => t.status === "COMPLETED",
            ).length /
              transfers.length) *
              100,
          )
        : 0,
  };

  return { transfers, summary };
}

async function generateEntitiesReport() {
  const organizations = await prisma.organization.findMany({
    where: {
      organizationType: { not: "REGULATOR" },
    },
    include: {
      medicationBatches: {
        select: {
          id: true,
          status: true,
        },
      },
      transfersFrom: {
        select: {
          id: true,
          status: true,
        },
      },
      transfersTo: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const summary = {
    total: organizations.length,
    verified: organizations.filter(
      (org: (typeof organizations)[number]) => org.isVerified,
    ).length,
    active: organizations.filter(
      (org: (typeof organizations)[number]) => org.isActive,
    ).length,
    byType: {
      manufacturers: organizations.filter(
        (org: (typeof organizations)[number]) =>
          org.organizationType === "MANUFACTURER",
      ).length,
      distributors: organizations.filter(
        (org: (typeof organizations)[number]) =>
          org.organizationType === "DRUG_DISTRIBUTOR",
      ).length,
      hospitals: organizations.filter(
        (org: (typeof organizations)[number]) =>
          org.organizationType === "HOSPITAL",
      ).length,
      pharmacies: organizations.filter(
        (org: (typeof organizations)[number]) =>
          org.organizationType === "PHARMACY",
      ).length,
    },
  };

  return { organizations, summary };
}

async function generateViolationsReport(startDate: Date) {
  const violations = await prisma.counterfeitReport.findMany({
    where: {
      createdAt: { gte: startDate },
      severity: { in: ["HIGH", "CRITICAL"] },
    },
    include: {
      batch: {
        include: {
          organization: {
            select: {
              companyName: true,
              organizationType: true,
              contactEmail: true,
            },
          },
        },
      },
      consumers: {
        select: {
          fullName: true,
          country: true,
          state: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const summary = {
    total: violations.length,
    critical: violations.filter(
      (v: (typeof violations)[number]) => v.severity === "CRITICAL",
    ).length,
    high: violations.filter(
      (v: (typeof violations)[number]) => v.severity === "HIGH",
    ).length,
    resolved: violations.filter(
      (v: (typeof violations)[number]) => v.status === "RESOLVED",
    ).length,
    byType: violations.reduce(
      (acc: Record<string, number>, violation: (typeof violations)[number]) => {
        acc[violation.reportType] = (acc[violation.reportType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  return { violations, summary };
}

async function generateSummaryReport(startOfMonth: Date, startOfYear: Date) {
  const [
    totalOrganizations,
    verifiedOrganizations,
    totalBatches,
    activeBatches,
    monthlyScans,
    yearlyScans,
    activeInvestigations,
    resolvedInvestigations,
    pendingTransfers,
    completedTransfers,
  ] = await Promise.all([
    prisma.organization.count({
      where: { organizationType: { not: "REGULATOR" } },
    }),
    prisma.organization.count({
      where: { organizationType: { not: "REGULATOR" }, isVerified: true },
    }),
    prisma.medicationBatch.count(),
    prisma.medicationBatch.count({
      where: { status: { in: ["CREATED", "IN_TRANSIT", "DELIVERED"] } },
    }),
    prisma.scanHistory.count({ where: { scanDate: { gte: startOfMonth } } }),
    prisma.scanHistory.count({ where: { scanDate: { gte: startOfYear } } }),
    prisma.counterfeitReport.count({
      where: { status: { in: ["PENDING", "INVESTIGATING"] } },
    }),
    prisma.counterfeitReport.count({ where: { status: "RESOLVED" } }),
    prisma.ownershipTransfer.count({ where: { status: "PENDING" } }),
    prisma.ownershipTransfer.count({
      where: { status: "COMPLETED", transferDate: { gte: startOfMonth } },
    }),
  ]);

  return {
    overview: {
      totalOrganizations,
      verifiedOrganizations,
      verificationRate:
        totalOrganizations > 0
          ? Math.round((verifiedOrganizations / totalOrganizations) * 100)
          : 0,
      totalBatches,
      activeBatches,
      monthlyScans,
      yearlyScans,
    },
    compliance: {
      pendingTransfers,
      completedTransfers,
      complianceRate:
        pendingTransfers + completedTransfers > 0
          ? Math.round(
              (completedTransfers / (pendingTransfers + completedTransfers)) *
                100,
            )
          : 0,
    },
    investigations: {
      activeInvestigations,
      resolvedInvestigations,
      resolutionRate:
        activeInvestigations + resolvedInvestigations > 0
          ? Math.round(
              (resolvedInvestigations /
                (activeInvestigations + resolvedInvestigations)) *
                100,
            )
          : 0,
    },
  };
}
