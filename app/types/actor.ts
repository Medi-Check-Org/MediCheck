/**
 * Actor - Unified Identity Model
 * 
 * Represents any authenticated entity (human or machine) interacting with MediCheck.
 * Business logic works with Actor, never caring about the authentication method.
 */

export type ActorType = "human" | "machine";

export interface Actor {
  /**
   * Unique identifier for the actor
   * - For humans: Clerk user ID
   * - For machines: API key ID
   */
  id: string;

  /**
   * Organization this actor belongs to
   */
  organizationId: string;

  /**
   * Type of actor
   */
  type: ActorType;

  /**
   * Permissions/scopes granted to this actor
   * Examples: ["batches:create", "batches:read", "transfers:initiate"]
   */
  permissions: string[];

  /**
   * Optional metadata about the actor
   */
  metadata?: {
    name?: string;
    email?: string;
    role?: string;
    teamMemberId?: string;
    [key: string]: unknown;
  };
}

/**
 * Permission constants for type safety
 */
export const Permissions = {
  // Batches
  BATCHES_CREATE: "batches:create",
  BATCHES_READ: "batches:read",
  BATCHES_UPDATE: "batches:update",
  BATCHES_DELETE: "batches:delete",

  // Transfers
  TRANSFERS_INITIATE: "transfers:initiate",
  TRANSFERS_READ: "transfers:read",
  TRANSFERS_UPDATE: "transfers:update",
  TRANSFERS_ACCEPT: "transfers:accept",
  TRANSFERS_REJECT: "transfers:reject",

  // Verification
  VERIFICATION_SCAN: "verification:scan",
  VERIFICATION_READ: "verification:read",

  // Organizations
  ORGANIZATIONS_READ: "organizations:read",
  ORGANIZATIONS_UPDATE: "organizations:update",
  ORGANIZATIONS_LIST: "organizations:list",

  // Team Members
  TEAM_MEMBERS_MANAGE: "team-members:manage",

  // Wildcard (admin)
  ALL: "*",
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

/**
 * Permission check helper
 */
export function hasPermission(actor: Actor, permission: Permission | string): boolean {
  return actor.permissions.includes(permission) || actor.permissions.includes(Permissions.ALL);
}

/**
 * Multiple permission check helper (requires all)
 */
export function hasAllPermissions(actor: Actor, permissions: (Permission | string)[]): boolean {
  return permissions.every(p => hasPermission(actor, p));
}

/**
 * Multiple permission check helper (requires any)
 */
export function hasAnyPermission(actor: Actor, permissions: (Permission | string)[]): boolean {
  return permissions.some(p => hasPermission(actor, p));
}

/**
 * Permission enforcement helper (throws if unauthorized)
 */
export function requirePermission(actor: Actor, permission: Permission | string): void {
  if (!hasPermission(actor, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
