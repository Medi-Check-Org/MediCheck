import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Type Definitions
 */
interface PartnerData {
  lastTransferDate: Date;
  transferCount: number;
}

interface TransferRecord {
  toOrgId: string;
  createdAt: Date;
}

interface IncomingTransferRecord {
  fromOrgId: string;
  createdAt: Date;
}

interface OrganizationData {
  id: string;
  companyName: string | null;
  organizationType: string;
  address: string | null;
  state: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface PartnerResponse {
  id: string;
  name: string | null;
  type: string;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  lastTransferDate: Date;
  totalTransfers: number;
  status: "Active" | "Inactive";
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId: string | null = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get all outgoing transfers
    const outgoingTransfers: TransferRecord[] = await prisma.ownershipTransfer.findMany({
      where: { fromOrgId: orgId },
      select: {
        toOrgId: true,
        createdAt: true,
      },
    });

    // Get all incoming transfers
    const incomingTransfers: IncomingTransferRecord[] = await prisma.ownershipTransfer.findMany({
      where: { toOrgId: orgId },
      select: {
        fromOrgId: true,
        createdAt: true,
      },
    });

    // Collect unique partner IDs and their last transfer date
    const partnerData = new Map<string, PartnerData>();

    outgoingTransfers.forEach((t: TransferRecord) => {
      const existing: PartnerData | undefined = partnerData.get(t.toOrgId);
      if (!existing || t.createdAt > existing.lastTransferDate) {
        partnerData.set(t.toOrgId, {
          lastTransferDate: t.createdAt,
          transferCount: (existing?.transferCount || 0) + 1,
        });
      } else {
        partnerData.set(t.toOrgId, {
          ...existing,
          transferCount: existing.transferCount + 1,
        });
      }
    });

    incomingTransfers.forEach((t: IncomingTransferRecord) => {
      const existing: PartnerData | undefined = partnerData.get(t.fromOrgId);
      if (!existing || t.createdAt > existing.lastTransferDate) {
        partnerData.set(t.fromOrgId, {
          lastTransferDate: t.createdAt,
          transferCount: (existing?.transferCount || 0) + 1,
        });
      } else {
        partnerData.set(t.fromOrgId, {
          ...existing,
          transferCount: existing.transferCount + 1,
        });
      }
    });

    // Fetch organization details for all partners
    const partnerIds: string[] = Array.from(partnerData.keys());

    const partners: OrganizationData[] = await prisma.organization.findMany({
      where: {
        id: {
          in: partnerIds,
        },
      },
      select: {
        id: true,
        companyName: true,
        organizationType: true,
        address: true,
        state: true,
        contactEmail: true,
        contactPhone: true,
      },
    });

    // Combine organization details with transfer data
    const formattedPartners: PartnerResponse[] = partners.map((partner: OrganizationData) => {
      const data: PartnerData = partnerData.get(partner.id)!;
      const thirtyDaysAgo: Date = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return {
        id: partner.id,
        name: partner.companyName,
        type: partner.organizationType,
        location: partner.state || partner.address,
        contactEmail: partner.contactEmail,
        contactPhone: partner.contactPhone,
        lastTransferDate: data.lastTransferDate,
        totalTransfers: data.transferCount,
        status: data.lastTransferDate > thirtyDaysAgo ? "Active" : "Inactive",
      };
    });

    // Sort by last transfer date (most recent first)
    formattedPartners.sort(
      (a: PartnerResponse, b: PartnerResponse) =>
        b.lastTransferDate.getTime() - a.lastTransferDate.getTime()
    );

    return NextResponse.json({ partners: formattedPartners });
  } catch (error: unknown) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}