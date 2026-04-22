import { prisma } from "./prisma";
import { logOrgMintedUnitEvent } from "./hedera";

export async function autoFlagIndependentUnit(
  unitId: string,
  orgManagedRegistry: string,
  organizationId: string,
  serialNumber: string,
  flagReason: string,
) {
  // 1. Update the unit in Postgres first
  await prisma.medicationUnit.update({
    where: { id: unitId },
    data: {
      status: "FLAGGED",
    },
  });

  await logOrgMintedUnitEvent(orgManagedRegistry as string, "UNIT_FLAGGED", {
    organizationId: organizationId,
    serialNumber: serialNumber,
    unitId,
    flagReason,
    timestamp: new Date(),
  });
}
