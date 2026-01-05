/**
 * Clerk Authentication Adapter
 * 
 * Converts Clerk authentication into Actor model.
 * Loads user from database and extracts organization and permissions.
 */

import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { Actor, Permissions } from "@/app/types/actor";
import { userRepository } from "@/app/infrastructure/db/repositories";
import { UnauthorizedError, ForbiddenError } from "@/app/types/errors";

/**
 * Get Actor from Clerk authentication
 * 
 * @throws {UnauthorizedError} If no user is authenticated
 * @throws {ForbiddenError} If user is not part of any organization
 */
export async function getActorFromClerk(): Promise<Actor> {
  // Get Clerk user ID
  const { userId } = await clerkAuth();
  
  if (!userId) {
    throw new UnauthorizedError("No authenticated user");
  }

  // Get current user from Clerk for name/email
  const clerkUser = await currentUser();

  // Load user with team member and organization
  const user = await userRepository.findByClerkId(userId);

  if (!user) {
    throw new UnauthorizedError("User not found in database");
  }

  if (!user.teamMember) {
    throw new ForbiddenError("User is not associated with any organization");
  }

  // Map role to permissions
  const permissions = getPermissionsForRole(user.teamMember.role);

  // Construct Actor
  const actor: Actor = {
    id: userId,
    organizationId: user.teamMember.organizationId,
    type: "human",
    permissions,
    metadata: {
      name: clerkUser?.firstName ?? undefined,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined,
      role: user.teamMember.role ?? undefined,
      teamMemberId: user.teamMember.id,
    },
  };

  return actor;
}

/**
 * Get Actor from Clerk (returns null if not authenticated)
 * Use this for optional authentication scenarios
 */
export async function getActorFromClerkOptional(): Promise<Actor | null> {
  try {
    return await getActorFromClerk();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return null;
    }
    throw error;
  }
}

/**
 * Map user role to permissions
 * This is a basic implementation - in production, you might load this from database
 */
function getPermissionsForRole(role: string | null): string[] {
  const rolePermissions: Record<string, string[]> = {
    ADMIN: [Permissions.ALL],
    MANAGER: [
      Permissions.BATCHES_CREATE,
      Permissions.BATCHES_READ,
      Permissions.BATCHES_UPDATE,
      Permissions.TRANSFERS_INITIATE,
      Permissions.TRANSFERS_READ,
      Permissions.TRANSFERS_UPDATE,
      Permissions.TRANSFERS_ACCEPT,
      Permissions.TRANSFERS_REJECT,
      Permissions.VERIFICATION_SCAN,
      Permissions.VERIFICATION_READ,
      Permissions.ORGANIZATIONS_READ,
      Permissions.ORGANIZATIONS_UPDATE,
      Permissions.TEAM_MEMBERS_MANAGE,
    ],
    MEMBER: [
      Permissions.BATCHES_READ,
      Permissions.TRANSFERS_READ,
      Permissions.VERIFICATION_SCAN,
      Permissions.VERIFICATION_READ,
      Permissions.ORGANIZATIONS_READ,
    ],
    VIEWER: [
      Permissions.BATCHES_READ,
      Permissions.TRANSFERS_READ,
      Permissions.VERIFICATION_READ,
      Permissions.ORGANIZATIONS_READ,
    ],
  };

  return rolePermissions[role ?? "MEMBER"] ?? rolePermissions.MEMBER;
}
