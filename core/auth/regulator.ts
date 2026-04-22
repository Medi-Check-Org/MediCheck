import { prisma } from "@/lib/prisma";
import { getActorFromClerk } from "./clerk";
import { ForbiddenError } from "@/utils/types/errors";

type RegulatorContext = {
  user: Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>;
  organization: Awaited<ReturnType<typeof prisma.organization.findFirstOrThrow>>;
};

export async function getRegulatorContext(): Promise<RegulatorContext> {
  const actor = await getActorFromClerk();

  const user = await prisma.user.findUnique({
    where: { clerkUserId: actor.id },
  });

  if (!user) {
    throw new ForbiddenError("Regulator user not found");
  }

  const organization = await prisma.organization.findFirst({
    where: {
      id: actor.organizationId,
      organizationType: "REGULATOR",
    },
  });

  if (!organization) {
    throw new ForbiddenError("Regulator access denied");
  }

  return { user, organization };
}
