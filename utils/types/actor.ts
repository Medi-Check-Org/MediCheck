// lib/auth/actor.ts

import { UserRole } from "@/lib/generated/prisma";

export type ActorType = "human" | "machine";

export type Actor = {
  type: ActorType;

  organizationId: string;

  // web auth
  userId?: string;
  role?: UserRole;

  // machine auth
  apiKeyId?: string;
  permissions?: string[];
};
