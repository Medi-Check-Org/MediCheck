import { HederaUnitSafetyCheckPayload } from "@/utils/types/hedera";
import { autoFlagIndependentUnit } from "./autoFlagIndependendUnit";

export function checkUnitMinted(
  events: HederaUnitSafetyCheckPayload[],
  unitSerialNumber: string,
) {
  const mintedEvents = events.filter(
    (event) => event.eventType === "UNIT_MINTED",
  );

  const matchingUnits = mintedEvents.flatMap((event) =>
    (event?.units ?? []).filter((unit) => unit.serialNumber === unitSerialNumber),
  );

  if (matchingUnits.length === 0) {
    return {
      passed: false,
      reasonIfFail:
        "This unit has no mint record on Hedera — it may not originate from an authorized manufacturer.",
    };
  }

  if (matchingUnits.length > 1) {
    return {
      passed: false,
      reasonIfFail:
        "Duplicate mint detected for this serial number. The unit may be counterfeit.",
    };
  }

  return {
    passed: true,
    reasonIfFail: "",
  };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // km

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function checkUnitPreviouslyScanned(
  events: any[],
  unitSerialNumber: string,
  currentLat: number,
  currentLon: number,
  managedRegistry: string,
  organizationId: string,
  unitId: string,
) {
  const scanEvents = events
    .filter(
      (event) =>
        event.eventType === "UNIT_SCANNED" &&
        event.serialNumber === unitSerialNumber,
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  if (scanEvents.length === 0) {
    return {
      passed: true,
      reasonIfFail: "",
      isDuplicatePresent: false,
    };
  }

  const lastScan = scanEvents[0];

  const distance = haversineDistance(
    lastScan.latitude,
    lastScan.longitude,
    currentLat,
    currentLon,
  );

  const minutesSinceLastScan =
    (new Date().getTime() - new Date(lastScan.timestamp).getTime()) / 60000;

  // 3️⃣ Fail if duplicate scan (same coordinates within 1 hour)
  const isDuplicatePresent = minutesSinceLastScan < 60;

  let passed = true;
  let reasonIfFail = "";

  if (isDuplicatePresent) {
    passed = false;
    reasonIfFail = `Duplicate scan detected. Last scan was ${minutesSinceLastScan.toFixed(
      1,
    )} minutes ago and ${distance.toFixed(2)} km away.`;
  }

  // we can safely say that one duplicate is 
  const flaggedEvent = events.filter(
    (event) => event.eventType === "UNIT_FLAGGED",
  );
  if (flaggedEvent.length === 0) {
    // only flag once no point doing this every time
    // Auto-flag the batch immediately with reason should a back up if it does not work
    await autoFlagIndependentUnit(
      unitId,
      managedRegistry,
      organizationId,
      unitSerialNumber,
      reasonIfFail,
    );
  }

  return {
    passed,
    reasonIfFail,
    isDuplicatePresent,
  };
}

export async function runUnitOriginChecks(
  events: HederaUnitSafetyCheckPayload[],
  unitSerialNumber: string,
  latitude: number,
  longitude: number,
  managedRegistry: string,
  organizationId: string,
  unitId: string,
) {

  const checkForPreviousScans = await checkUnitPreviouslyScanned(
    events,
    unitSerialNumber,
    latitude,
    longitude,
    managedRegistry,
    organizationId,
    unitId,
  );
  const syncChecks = [
    checkUnitMinted(events, unitSerialNumber),
    checkForPreviousScans,
  ];

  const failedChecks = syncChecks.filter((c) => !c.passed);

  const status = failedChecks.length > 0 ? "NOT_SAFE" : "AUTHENTIC";

  const reasons = failedChecks.length
    ? failedChecks.map((c) => c.reasonIfFail)
    : ["All unit-level checks passed."];

  const recommendedAction =
    status === "NOT_SAFE"
      ? "Do not use this medicine. Contact your pharmacist or regulator immediately."
      : "This medicine is authentic and safe to use as prescribed.";

  return {
    status,
    reasons,
    recommendedAction,
    duplicateScan: checkForPreviousScans.isDuplicatePresent
  };
}
