import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "./withRateLimit";

/* -------------------- HANDLERS -------------------- */

async function getHandler(req: NextRequest) {
  return NextResponse.json({ data: "Fetched resource" });
}

async function postHandler(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ message: "Created", body }, { status: 201 });
}

async function putHandler(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ message: "Updated", body });
}

async function patchHandler(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ message: "Patched", body });
}

async function deleteHandler(req: NextRequest) {
  return NextResponse.json({ message: "Deleted" }, { status: 204 });
}

/* -------------------- EXPORTS -------------------- */

// Less strict (read-heavy)

export const GET = withRateLimit(getHandler);

// Strict (write-heavy)

export const POST = withRateLimit(postHandler, { strict: true });
export const PUT = withRateLimit(putHandler, { strict: true });
export const PATCH = withRateLimit(patchHandler, { strict: true });
export const DELETE = withRateLimit(deleteHandler, { strict: true });
