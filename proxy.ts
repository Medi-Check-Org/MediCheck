import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { handleWebAuth } from "./lib/auth/handleWebAuth";
import { handlePartnerAuth } from "./lib/auth/handlePartnerAuth";

function isPartnerApiRoute(pathname: string) {
  return pathname.startsWith("/api/partners/");
}

function isWebRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/consumer") ||
    pathname.startsWith("/api/web/")
  );
}

export default clerkMiddleware(async (auth, req) => {

  const pathname = req.nextUrl.pathname;
  
  const { sessionClaims } = await auth();

  if (pathname.startsWith("/api/partners/") && sessionClaims){
    // Ignore it - partner routes are handled elsewhere
    return NextResponse.next();
  }

  if (isPartnerApiRoute(pathname)) {
    return handlePartnerAuth(req)
  }

  if (isWebRoute(pathname)) {
    return handleWebAuth(auth, req)
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/auth|api/register|api/public|monitoring).*)",
  ],
};