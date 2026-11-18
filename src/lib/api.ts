import { NextResponse } from "next/server";

// Keep API error payloads consistent with the product API contract.
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
export function handleApiError(error: unknown) {
  console.error(error);
  return apiError("Something went wrong. Please try again.", 500);
}
