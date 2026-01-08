/**
 * User Repository
 *
 * Handles all database operations related to users and team members.
 */

import { prisma } from "@/lib/prisma";
import type { User, TeamMember } from "@/lib/generated/prisma";
import { NotFoundError } from "@/utils/types/errors";

export interface UserWithTeamMember extends User {
  teamMember:
    | (TeamMember & {
        organization: {
          id: string;
          companyName: string;
          organizationType: string;
        };
      })
    | null;
}

export class UserRepository {
  /**
   * Find user by Clerk user ID
   */
  async findByClerkId(clerkUserId: string): Promise<UserWithTeamMember | null> {
    return prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        teamMember: {
          include: {
            organization: {
              select: {
                id: true,
                companyName: true,
                organizationType: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserWithTeamMember | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        teamMember: {
          include: {
            organization: {
              select: {
                id: true,
                companyName: true,
                organizationType: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get or throw if not found
   */
  async getByClerkIdOrThrow(clerkUserId: string): Promise<UserWithTeamMember> {
    const user = await this.findByClerkId(clerkUserId);
    if (!user) {
      throw new NotFoundError("User", clerkUserId);
    }
    return user;
  }

  /**
   * Verify user has team member
   */
  async verifyHasTeamMember(clerkUserId: string): Promise<void> {
    const user = await this.getByClerkIdOrThrow(clerkUserId);
    if (!user.teamMember) {
      throw new Error("User is not associated with any organization");
    }
  }
}

// Singleton instance
export const userRepository = new UserRepository();
