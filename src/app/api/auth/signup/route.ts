import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signupSchema } from "@/lib/validation";
import { setSession } from "@/lib/session";
import { apiError, handleApiError } from "@/lib/api";
export async function POST(req: NextRequest) {
  try {
    const parsed = signupSchema.safeParse(await req.json());
    if (!parsed.success)
      return apiError(parsed.error.issues[0]?.message || "Invalid input.", 400);
    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();
    await connectDB();
    if (await User.exists({ email }))
      return apiError("This email is already registered.", 409);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    await setSession(user.id);
    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 },
    );
  } catch (e) {
    if (
      typeof e === "object" &&
      e &&
      "code" in e &&
      (e as { code: number }).code === 11000
    )
      return apiError("This email is already registered.", 409);
    return handleApiError(e);
  }
}
