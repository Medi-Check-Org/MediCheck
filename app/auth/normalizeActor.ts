/**
 * Actor Normalizer
 * 
 * Shared utility for normalizing Actor objects from different auth sources.
 * Ensures consistent Actor structure regardless of authentication method.
 */

import { Actor } from "@/app/types/actor";

/**
 * Normalize Actor object
 * 
 * Ensures all required fields are present and properly formatted.
 * This is useful when creating Actors from different sources.
 */
export function normalizeActor(actor: Partial<Actor>): Actor {
  if (!actor.id) {
    throw new Error("Actor must have an id");
  }

  if (!actor.organizationId) {
    throw new Error("Actor must have an organizationId");
  }

  if (!actor.type) {
    throw new Error("Actor must have a type");
  }

  return {
    id: actor.id,
    organizationId: actor.organizationId,
    type: actor.type,
    permissions: actor.permissions ?? [],
    metadata: actor.metadata ?? {},
  };
}

/**
 * Merge permissions from multiple sources
 * 
 * Useful when Actor has both role-based and custom permissions
 */
export function mergePermissions(...permissionSets: string[][]): string[] {
  const allPermissions = new Set<string>();
  
  for (const set of permissionSets) {
    for (const permission of set) {
      allPermissions.add(permission);
    }
  }

  return Array.from(allPermissions);
}

/**
 * Sanitize Actor for logging
 * 
 * Removes sensitive metadata before logging
 */
export function sanitizeActorForLogging(actor: Actor): Partial<Actor> {
  return {
    id: actor.id,
    organizationId: actor.organizationId,
    type: actor.type,
    permissions: actor.permissions,
    // Don't log metadata as it may contain sensitive info
  };
}
