import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/verifySignature";
import { getAllEventLogs } from "@/lib/hedera";
import { runAllUnitAuthenticityChecks } from "@/lib/safetyChecks";
import { auth } from "@clerk/nextjs/server";
import { logBatchEvent, logOrgMintedUnitEvent } from "@/lib/hedera";
import { runUnitOriginChecks } from "@/lib/independentUnitSafetyCheck";
import { runHybridUnitChecks } from "@/lib/hybridSafetyCheck";
import { runMLInference } from "@/lib/ml-background";
import { getRegionFromCoords } from "@/lib/geocoding";
import { getFullLineageTopicIds } from "@/lib/hierarchy";

const QR_SECRET = process.env.QR_SECRET || "dev-secret";

const parseMetadata = (e: any) => {
  try {
    return JSON.parse(e.message.metadata || "");
  } catch {
    return null;
  }
};

export async function GET(
  req: Request,
  context: { params: Promise<{ serialNumber: string }> },
) {

  const { userId } = await auth();
  const { serialNumber } = await context.params;
  const { searchParams } = new URL(req.url);
  const sig = searchParams.get("sig");
  const latitude = parseFloat(searchParams.get("lat") || "0");
  const longitude = parseFloat(searchParams.get("long") || "0");

  if (!sig)
    return NextResponse.json(
      { valid: false, error: "Missing signature" },
      { status: 400 },
    );

  const unit = await prisma.medicationUnit.findUnique({
    where: { serialNumber },
    include: {
      batch: { include: { organization: true } },
      organization: true,
    },
  });

  if (!unit)
    return NextResponse.json(
      { valid: false, error: "Unit not found" },
      { status: 404 },
    );

  const isBatched = !!unit.batchId;

  const isHybrid = isBatched && !!unit.organization?.managedRegistry;

  const contextId =
    isHybrid || !isBatched ? unit.organization?.id : unit.batch?.batchId;
  
  const topicId = isBatched
    ? unit.batch?.registryTopicId
    : unit.organization?.managedRegistry;

  if (!topicId || !contextId)
    return NextResponse.json(
      { valid: false, error: "Registry context incomplete" },
      { status: 400 },
    );

  const data = `${unit.serialNumber}|${contextId}|${unit.registrySequence}`;

  const isValidSig = verifySignature(data, sig, QR_SECRET);

  if (!isValidSig)
    return NextResponse.json(
      { valid: false, error: "Tampered signature" },
      { status: 400 },
    );

  // --- NEW: RECURSIVE LINEAGE FETCHING ---
  const allTopicIds = isBatched
    ? await getFullLineageTopicIds(unit.batchId!)
    : [unit.organization?.managedRegistry!];

  const allRawLogs = await Promise.all(
    allTopicIds.map((id) => getAllEventLogs(id)),
  );

  const flattenedBatchLogs = allRawLogs
    .flat()
    .map(parseMetadata)
    .filter((e) => e?.type === "EVENT_LOG");

  let safetyResult;

  if (isHybrid) {

    // For Hybrid, we still need the Org logs for the Birth Certificate
    const rawOrgLogs: any[] = await getAllEventLogs(
      unit.organization!.managedRegistry!,
    );

    const orgLogs = rawOrgLogs
      .map(parseMetadata)
      .filter((e) => e?.type === "EVENT_LOG");

    safetyResult = await runHybridUnitChecks({
      orgLogs,
      batchLogs: flattenedBatchLogs, // Now contains Parent Batch history too
      serialNumber,
      unitId: unit.id,
      batchId: unit.batchId!,
      organizationId: unit.organization!.id,
      topicId: unit.batch!.registryTopicId!,
      lat: latitude,
      long: longitude,
    });
  }
  else {
    if (isBatched) {
      safetyResult = await runAllUnitAuthenticityChecks(
        flattenedBatchLogs,
        unit.id,
        unit.batch!.batchId,
        unit.batch!.organizationId,
        topicId!,
        serialNumber,
      );
    }
    else {
      const filteredOrgLogs = flattenedBatchLogs.filter((e) => {
        if (e.serialNumber === serialNumber) return true;
        return (
          Array.isArray(e.units) &&
          e.units.some(
            (u: any) => u?.serialNumber === serialNumber || u === serialNumber,
          )
        );
      });

      safetyResult = await runUnitOriginChecks(
        filteredOrgLogs,
        serialNumber,
        latitude,
        longitude,
        topicId!,
        unit?.orgId ?? "",
        unit.id,
      );
    }
  }

  const regionName = await getRegionFromCoords(latitude, longitude);

  // 5. Logging, ML, and Final Response
  if (!(safetyResult as any)?.duplicateScan) {

    const scanResult =
      safetyResult.status === "NOT_SAFE" ? "SUSPICIOUS" : "GENUINE";

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId ?? "" },
      include: { consumer: true },
    });

    const consumer = user
      ? await prisma.consumer.findUnique({ where: { userId: user.id } })
      : null;
    
    const savedScan = await prisma.scanHistory.create({
      data: {
        unitId: unit.id,
        consumerId: consumer?.id || null,
        isAnonymous: !user,
        region: regionName,
        scanResult,
        latitude,
        longitude,
        timestamp: new Date(),
      },
    });

    const logPayload = {
      scanResult: scanResult as "SUSPICIOUS" | "GENUINE",
      serialNumber,
      latitude,
      longitude,
      timestamp: new Date(),
    };

    // Note: We always log the scan to the immediate topicId (the unit's current batch)
    if (isBatched) {
      await logBatchEvent(topicId!, "UNIT_SCANNED", {
        batchId: unit.batch!.batchId,
        ...logPayload,
      });
    }
    else {
      await logOrgMintedUnitEvent(topicId!, "UNIT_SCANNED", {
        organizationId: unit.organization!.id,
        ...logPayload,
      });
    }

    runMLInference(
      savedScan.id,
      regionName,
      latitude,
      longitude,
      consumer?.id,
    ).catch((err) => console.error("ML Trigger Error", err));

  }

  return NextResponse.json({
    valid: isValidSig && safetyResult.status !== "NOT_SAFE",
    unit,
    batch: unit.batch,
    authenticityResultCheck: safetyResult,
  });

}