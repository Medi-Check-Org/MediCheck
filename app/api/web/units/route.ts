import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import {
  registerUnitOnOrganizationManagedRegistry,
  logOrgMintedUnitEvent,
} from "@/lib/hedera";
import { generateMintedUnitQRPayload } from "@/lib/qrPayload";
import { runInBatches } from "@/utils/helpers/batch";

export const runtime = "nodejs";

const UNIT_REG_CONCURRENCY = parseInt(process.env.UNIT_REG_CONCURRENCY || "10");

const QR_SECRET = process.env.QR_SECRET || "dev-secret";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { productQuantity, orgId, productId } = body;

    if (!productQuantity || productQuantity <= 0 || !orgId || !productId) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
        },
        { status: 400 },
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { users: true },
    });

    if (organization?.users.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "User does not belong to this organization" },
        { status: 404 },
      );
    }

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.numberOfProductAvailable < productQuantity) {
      return NextResponse.json(
        { error: "Insufficient inventory available" },
        { status: 400 },
      );
    }

    // Find last minted unit for this org + product
    const lastUnit = await prisma.medicationUnit.findFirst({
      where: {
        orgId,
        productId,
      },
      orderBy: {
        mintedUnitId: "desc",
      },
      select: {
        mintedUnitId: true,
      },
    });

    const lastNumber = lastUnit
      ? parseInt(lastUnit?.mintedUnitId ?? "", 10)
      : 0;

    // Start new mint sequence
    const startIndex = lastNumber + 1;

    const unitsData: Array<{
      serialNumber: string;
      registrySequence: number;
      qrCode: string;
      productId: string;
      qrSignature: string;
      mintedUnitId: string;
      orgId: string;
    }> = [];

    const unitIndexes = Array.from({ length: productQuantity }, (_, i) => i);

    const concurrency = UNIT_REG_CONCURRENCY > 0 ? UNIT_REG_CONCURRENCY : 10;

    await runInBatches<number>(unitIndexes, concurrency, async (i) => {
      const numericId = startIndex + i;

      const mintedUnitId = String(numericId).padStart(4, "0");

      const unitNumber = String(numericId + i).padStart(4, "0");

      const randomSuffix = nanoid(3);

      const serialNumber = `UNIT-${orgId}-${unitNumber}${randomSuffix}`;

      // Register unit on HCS-2 registry
      const registrySequence = await registerUnitOnOrganizationManagedRegistry(
        organization.managedRegistry as string,
        {
          serialNumber,
          drugName: product.name,
          mintedUnitId,
          orgId,
          productId,
        },
      );

      const qrUnitPayload = generateMintedUnitQRPayload(
        serialNumber,
        orgId,
        registrySequence,
        QR_SECRET,
        BASE_URL,
      );

      unitsData.push({
        serialNumber,
        registrySequence,
        qrCode: qrUnitPayload.url,
        productId,
        qrSignature: qrUnitPayload.signature,
        mintedUnitId,
        orgId: organization.id,
      });
    });

    await logOrgMintedUnitEvent(
      organization.managedRegistry as string,
      "UNIT_MINTED",
      {
        organizationId: organization.id,
        units: unitsData.map((u) => ({
          serialNumber: u.serialNumber,
          mintedId: u.mintedUnitId,
          orgId: u.orgId,
        })),
      },
    );

    await prisma.$transaction([
      prisma.medicationUnit.createMany({
        data: unitsData,
      }),

      prisma.product.update({
        where: { id: product.id },
        data: {
          numberOfProductAvailable: {
            decrement: productQuantity,
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        units: unitsData,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Product Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to mint units" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);

    const orgId = url.searchParams.get("orgId") ?? "";
    
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });


    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const units = await prisma.medicationUnit.findMany({
      where: {
        orgId,
      },
      include: {
        product: true,
      },
      orderBy: {
        mintedUnitId: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        units,
        message: "Units fetched successfully",
      },
      { status: 200 },
    );


  }
  catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to get units" },
      { status: 500 },
    );
  }
}