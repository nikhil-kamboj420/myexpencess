import { NextResponse } from "next/server";
import { clearSession, getCurrentUser } from "@/lib/session";
import { apiError } from "@/lib/api";
export async function POST() {
  if (!(await getCurrentUser())) return apiError("Unauthorized.", 401);
  await clearSession();
  return NextResponse.json({ success: true });
}
