import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/validation";
import { setSession } from "@/lib/session";
import { apiError, handleApiError } from "@/lib/api";
export async function POST(req: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success)
      return apiError(parsed.error.issues[0]?.message || "Invalid input.", 400);
    await connectDB();
    const user = await User.findOne({
      email: parsed.data.email.toLowerCase().trim(),
    });
    const valid = user
      ? await bcrypt.compare(parsed.data.password, user.passwordHash)
      : false;
    if (!valid) return apiError("Invalid email or password.", 401);
    await setSession(user.id);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
