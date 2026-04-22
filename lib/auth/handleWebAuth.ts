import { NextResponse } from "next/server";
import { UserRole } from "../generated/prisma/enums";
import { publicRoutes, authRoutes, orgnaizationRoutes } from "@/utils";
import type { Actor } from "@/utils/types/actor";
import { userRepository } from "@/core/infrastructure/db/repositories";
import { getPermissionsForRole } from "@/core/auth/clerk";

export async function handleWebAuth(auth: any, req: Request) {
  const pathname = new URL(req.url).pathname;

  console.log("Incoming pathname in handleWebAuth", pathname);

  if (
    // instead of listing them, we can create an object called public route and list them there just like we are doing to routes, makes it cleanerv
    pathname.startsWith("/api/web/verify") ||
    pathname.startsWith("/api/web/hotspots") ||
    pathname.startsWith("/api/web/geminiTranslation") ||
    pathname.startsWith("/api/web/auth") ||
    pathname.startsWith("/api/web/register") ||
    pathname.startsWith("/api/web/failed/registration/cleanup")
  ) {
    return NextResponse.next();
  }

  // Public & auth routes
  if (
    Object.values(publicRoutes).includes(pathname) ||
    Object.values(authRoutes).includes(pathname)
  ) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Invalid authentication" },
      { status: 401 },
    );
  }

  console.log("Clerk auth result in handleWebAuth", { userId, sessionClaims });

  const teamMember = await userRepository.getByClerkIdOrThrow(userId);

  if (req.headers.get("authorization")?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Invalid authentication method for this route" },
      { status: 401 },
    );
  }

  if (!userId) {
    return NextResponse.redirect(new URL(authRoutes.login, req.url));
  }

  const publicMetadata = sessionClaims?.publicMetadata as any;

  let role = publicMetadata?.role as UserRole | undefined;
  let orgType = publicMetadata?.organizationType as string | undefined;
  let organizationId = publicMetadata?.organizationId as string | undefined;

  console.log("Extracted metadata from session claims", { role, orgType, organizationId });

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

  console.log("Finalized actor attributes", { role, orgType, organizationId, permissions });

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
          "Org member without orgType detected - redirecting to general dashboard",
        );
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.redirect(new URL(publicRoutes.unauthorized, req.url));
    }

    if (allowedRoute && !pathname.startsWith(allowedRoute)) {
      return NextResponse.redirect(new URL(allowedRoute, req.url));
    }
  }

  console.log("User authorized for requested route, proceeding with request");

  // Attach actor for downstream use
  const res = NextResponse.next();
  res.headers.set("x-actor", JSON.stringify(actor));
  return res;

}
