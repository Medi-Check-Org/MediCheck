import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Check if the organization exists and is a hospital
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, organizationType: true }
    });

    if (!organization || organization.organizationType !== "HOSPITAL") {
      return NextResponse.json({ error: "Organization not found or not a hospital" }, { status: 404 });
    }

    // Get all completed transfers TO this hospital
    const transfers = await prisma.ownershipTransfer.findMany({
      where: {
        toOrgId: orgId,
        status: "COMPLETED",
        batch: {
          organizationId: orgId,
        },
      },
      include: {
        batch: {
          select: {
            id: true,
            batchId: true,
            drugName: true,
            batchSize: true,
            status: true,
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
          },
        },
      },
      orderBy: {
        transferDate: "desc",
      },
    });

    // Transform the data to match the expected format
    type TransferWithBatch = Prisma.OwnershipTransferGetPayload<{
      include: {
        batch: {
          include: {
            product: {
              select: {
                expiryDate: true,
                manufacturingDate: true
              }
            }
          }
        },
        fromOrg: { select: { companyName: true, organizationType: true } }
      }
    }>;

    const inventory = transfers
      .filter((transfer: TransferWithBatch) => transfer.batch)
      .map((transfer: TransferWithBatch) => {
        const batch = transfer.batch!;
        const product = batch.product;
        return {
          id: batch.id,
          batchId: batch.batchId,
          drugName: batch.drugName,
          batchSize: batch.batchSize,
          expiryDate: product?.expiryDate?.toISOString() ?? null,
          status: batch.status,
          manufacturingDate: product?.manufacturingDate?.toISOString() ?? null,
          transferDate: transfer.transferDate.toISOString(),
          receivedFrom: transfer.fromOrg.companyName,
          fromOrgType: transfer.fromOrg.organizationType
        };
      });

    return NextResponse.json(inventory);

  } catch (error: unknown) {
    console.error("Error fetching hospital inventory:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}