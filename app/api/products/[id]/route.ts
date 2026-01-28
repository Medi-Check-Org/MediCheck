import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{id: string}> }
) {
    try {
      
    const { id: productId } = await params

    console.log("PATCH /api/products/[id] called with ID:", productId);
        
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
        numberOfProductAvailable
    } = body;

    // Basic validation
    if (
        !numberOfProductAvailable
    ) {
        return NextResponse.json(
        {
            error:
            "Missing required field",
        },
        { status: 400 },
        );
    }

    // Verify organization exists and user has access
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 403 },
      );
    }

    const productRequestBody = {
        numberOfProductAvailable: numberOfProductAvailable
        ? parseInt(numberOfProductAvailable)
        : 0,
    };

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: productRequestBody,
    });

    return NextResponse.json({
        success: true,
        message: "Product updated successfully",
        product
    }, { status: 200 });

  }
  catch (error) {
    console.error("Product Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}