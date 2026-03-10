export type hederaEvents =
  | "BATCH_CREATED"
  | "UNIT_REGISTERING"
  | "BATCH_OWNERSHIP"
  | "BATCH_FLAG"
  | "BATCH_UNITS_REGISTERED"
  | "BATCH_TRANSFER_INITIATION"
  | "TRANSFER_CANCELLED"
  | "UNIT_SCANNED"
  | "UNIT_FLAGGED"
  | "UNIT_MINTED";


export interface HederaSafetyCheckPayload{
  eventType: hederaEvents;
  timestamp: string | Date;
  batchId: string;
  topicId: string;
  organizationId: string;
  drugName?: string;
  batchSize?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  transferFrom?: string;
  transferTo?: string;
  qrSignature?: string;
  flagReason?: string;
  scanResult?: "GENUINE" | "SUSPICIOUS";
  latitude?: number | null;
  longitude?: number | null;
}


export interface unitsOnchainMintingPayload{
  serialNumber: string;
  mintedId: string;
  orgId: string;
}

export interface HederaUnitSafetyCheckPayload {
  organizationId: string;
  units?: unitsOnchainMintingPayload[];
  eventType?: hederaEvents;

  // scanned event
  serialNumber?: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: Date;

  // flag event
  unitId?: string;
  flagReason?: string;
}
