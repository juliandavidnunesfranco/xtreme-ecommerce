import { NextResponse } from "next/server";

// This endpoint is deprecated and no longer in use.
// The new logic handles pending orders directly in the checkout flow.
export async function POST(request: Request) {
  return NextResponse.json(
    { message: "Endpoint deprecated." },
    { status: 200 }
  );
}
