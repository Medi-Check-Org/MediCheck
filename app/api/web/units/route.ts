import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import {
  registerUnitOnOrganizationManagedRegistry,
  logOrgMintingUnitEvent,
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

    console.log("Organization found:", organization);

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

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        mintedUnitCounter: {
          increment: productQuantity,
        },
      },
      select: {
        mintedUnitCounter: true,
      },
    });

    const newCounter = updatedProduct.mintedUnitCounter;
    
    const startIndex = newCounter - productQuantity + 1;

    const unitsData: Array<{
      serialNumber: string;
      registrySequence: number;
      qrCode: string;
      productId: string;
      qrSignature: string;
      mintedUnitId: string;
    }> = [];

    const unitIndexes = Array.from({ length: productQuantity }, (_, i) => i);

    const concurrency = UNIT_REG_CONCURRENCY > 0 ? UNIT_REG_CONCURRENCY : 10;

    await runInBatches<number>(unitIndexes, concurrency, async (i) => {
      const numericId = startIndex + i;

      const mintedUnitId = String(numericId).padStart(4, "0");

      const unitNumber = String(i + 1).padStart(4, "0");

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
      });
        
    });
      
    await logOrgMintingUnitEvent(
      organization.managedRegistry as string,
      "UNIT_MINTED",
      {
        organizationId: organization.id,
        units: unitsData.map((u) => u.serialNumber),
        count: unitsData.length,
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
  }
  catch (error: unknown) {
    console.error("Product Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
