import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/verifySignature";
import { getAllEventLogs } from "@/lib/hedera";
import { runAllUnitAuthenticityChecks } from "@/lib/safetyChecks";
import { auth } from "@clerk/nextjs/server";
import { logBatchEvent, logOrgMintedUnitEvent } from "@/lib/hedera";
import { runUnitOriginChecks } from "@/lib/independentUnitSafetyCheck";
// import { runHybridUnitChecks } from "@/lib/hybridSafetyCheck";
import { runHybridUnitChecks } from "@/lib/hybridSafetyCheck";
import { runMLInference } from "@/lib/ml-background";
import { getRegionFromCoords } from "@/lib/geocoding";

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

  // 1. Fetch unit with ALL possible relations
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

  // 2. Identify State & Signature Context
  const isBatched = !!unit.batchId;
  const isHybrid = isBatched && !!unit.organization?.managedRegistry;

  /**
   * CONTEXT LOGIC:
   * If Hybrid: Context is ALWAYS OrgID (because it was printed at birth).
   * If Pure Batch: Context is BatchID.
   * If Pure Independent: Context is OrgID.
   */
  const contextId =
    isHybrid || !isBatched ? unit.organization?.id : unit.batch?.batchId;

  const topicId = isBatched
    ? unit.batch?.registryTopicId
    : unit.organization?.managedRegistry;

  if (!topicId || !contextId) {
    return NextResponse.json(
      { valid: false, error: "Registry context incomplete" },
      { status: 400 },
    );
  }

  // 3. Cryptographic Signature Check
  const data = `${unit.serialNumber}|${contextId}|${unit.registrySequence}`;

  const isValidSig = verifySignature(data, sig, QR_SECRET);

  if (!isValidSig) {
    return NextResponse.json(
      { valid: false, error: "Tampered QR code signature" },
      { status: 400 },
    );
  }

  // 4. Multi-Registry Safety Checks
  let safetyResult;

  if (isHybrid) {
    // HYBRID: Requires Birth Certificate (Org) + Lifecycle (Batch)
    const [rawOrgLogs, rawBatchLogs] = await Promise.all([
      getAllEventLogs(unit.organization!.managedRegistry!),
      getAllEventLogs(unit.batch!.registryTopicId ?? ""),
    ]);

    safetyResult = await runHybridUnitChecks({
      orgLogs: rawOrgLogs
        .map(parseMetadata)
        .filter((e) => e?.type === "EVENT_LOG"),
      batchLogs: rawBatchLogs
        .map(parseMetadata)
        .filter((e) => e?.type === "EVENT_LOG"),
      serialNumber,
      unitId: unit.id,
      batchId: unit.batchId!,
      organizationId: unit.organization!.id,
      topicId: unit.batch!.registryTopicId ?? "",
      lat: latitude,
      long: longitude,
    });
  } else {
    // STANDARD: Single Topic Fetch
    const logEntries = await getAllEventLogs(topicId);
    let eventLogs = logEntries
      .map(parseMetadata)
      .filter((e) => e?.type === "EVENT_LOG");

    if (isBatched) {
      safetyResult = await runAllUnitAuthenticityChecks(
        eventLogs,
        unit.id,
        unit.batch!.batchId,
        unit.batch!.organizationId,
        topicId,
        serialNumber,
      );
    } else {
      // Independent filtering
      eventLogs = eventLogs.filter((e) => {
        if (e.serialNumber === serialNumber) return true;
        if (Array.isArray(e.units)) {
          return e.units.some(
            (u: any) => u?.serialNumber === serialNumber || u === serialNumber,
          );
        }
        return false;
      });

      safetyResult = await runUnitOriginChecks(
        eventLogs,
        serialNumber,
        latitude,
        longitude,
        topicId,
        unit?.orgId ?? "",
        unit.id,
      );
    }
  }

  const regionName = await getRegionFromCoords(latitude, longitude);

  // 5. Logging, ML, and Final Response
  const isDuplicateScan = Boolean(
    (safetyResult as Partial<{ duplicateScan: boolean }>).duplicateScan,
  );

  if (!isDuplicateScan) {

    const scanResult =
      safetyResult.status === "NOT_SAFE" ? "SUSPICIOUS" : "GENUINE";

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId ?? "" },
      include: { consumer: true },
    });

    const consumer = user
      ? await prisma.consumer.findUnique({ where: { userId: user.id } })
      : null;

    // Create DB History entry
    const savedScan = await prisma.scanHistory.create({
      data: {
        unitId: unit.id,
        consumerId: user ? consumer?.id : null,
        isAnonymous: !user,
        region: regionName,
        scanResult,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date(),
      },
    });

    // Final Ledger Entry (Always log to the current Topic the unit lives in)
    const logPayload = {
      scanResult: scanResult as "SUSPICIOUS" | "GENUINE",
      serialNumber,
      latitude,
      longitude,
      timestamp: new Date(),
    };

    if (isBatched) {
      await logBatchEvent(topicId, "UNIT_SCANNED", {
        batchId: unit.batch!.batchId,
        ...logPayload,
      });
    }
    else {
      await logOrgMintedUnitEvent(topicId, "UNIT_SCANNED", {
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
