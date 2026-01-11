import { NextResponse } from "next/server";
import { UserRole } from "@/lib/generated/prisma";
import { publicRoutes, authRoutes, orgnaizationRoutes } from "@/utils";
import type { Actor } from "@/utils/types/actor";
import { userRepository } from "@/core/infrastructure/db/repositories";
import { getPermissionsForRole } from "@/core/auth/clerk";

export async function handleWebAuth(auth: any, req: Request) {
  const pathname = new URL(req.url).pathname;

  console.log("Incoming pathname in handleWebAuth", pathname);

  const { userId, sessionClaims } = await auth();

  const teamMember = await userRepository.getByClerkIdOrThrow(userId);

  if (req.headers.get("authorization")?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Invalid authentication method for this route" },
      { status: 401 }
    );
  }

  // Public & auth routes
  if (
    Object.values(publicRoutes).includes(pathname) ||
    Object.values(authRoutes).includes(pathname)
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/verify") || // instead of listing them, we can create an object called public route and list them there just like we are doing to routes, makes it cleaner
    pathname.startsWith("/api/hotspots") ||
    pathname.startsWith("/api/geminiTranslation") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL(authRoutes.login, req.url));
  }

  const publicMetadata = sessionClaims?.publicMetadata as any;

  let role = publicMetadata?.role as UserRole | undefined;
  let orgType = publicMetadata?.organizationType as string | undefined;
  let organizationId = publicMetadata?.organizationId as string | undefined;

  // Cookie fallback (unchanged logic)
  if (!role || !orgType || !organizationId) {
    const cookie = (req as any).cookies?.get("user_fallback");
    if (cookie) {
      try {
        const parsed = JSON.parse(cookie.value);
        role ??= parsed.role;
        orgType ??= parsed.organizationType;
        organizationId ??= parsed.organizationId;
      } catch (error) {
        console.log("Error parsing cookie fallback:", error);
      }
    } else {
      console.log("No cookie fallback available");
    }
  }

  const permissions = getPermissionsForRole(teamMember.userRole);

  // Build normalized actor
  const actor: Actor = {
    type: "human",
    id: userId,
    metadata: { role: role },
    permissions: permissions, // To be implemented
    organizationId: organizationId!,
  };

  //Consumer route authorization
  if (pathname.startsWith("/consumer") && role !== UserRole.CONSUMER) {
    return NextResponse.redirect(new URL(publicRoutes.unauthorized, req.url));
  }

  // Dashboard authorization
  if (pathname.startsWith("/dashboard")) {
    if (role !== UserRole.ORGANIZATION_MEMBER) {
      return NextResponse.redirect(new URL(publicRoutes.unauthorized, req.url));
    }

    const allowedRoute = orgType
      ? orgnaizationRoutes[orgType.toLowerCase()]
      : undefined;

    if (!allowedRoute) {
      if (userId && role === UserRole.ORGANIZATION_MEMBER) {
        console.log(
          "Org member without orgType detected - redirecting to general dashboard"
        );
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.redirect(new URL(publicRoutes.unauthorized, req.url));
    }

    if (allowedRoute && !pathname.startsWith(allowedRoute)) {
      return NextResponse.redirect(new URL(allowedRoute, req.url));
    }
  }

  // Attach actor for downstream use
  const res = NextResponse.next();
  res.headers.set("x-actor", JSON.stringify(actor));
  return res;
}
