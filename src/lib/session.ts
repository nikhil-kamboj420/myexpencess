import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const COOKIE_NAME = "myexpencess_session";
const SEVEN_DAYS = 7 * 24 * 60 * 60;
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}
function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}
export function createSessionToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + SEVEN_DAYS,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function verifySessionToken(token?: string) {
  if (!token) return null;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;
  const expected = signature(payload);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      sub: string;
      exp: number;
    };
    if (!data.sub || data.exp < Date.now() / 1000) return null;
    return data.sub;
  } catch {
    return null;
  }
}
export async function setSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
}
export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
export async function getCurrentUser() {
  const store = await cookies();
  const id = verifySessionToken(store.get(COOKIE_NAME)?.value);
  if (!id) return null;
  await connectDB();
  return User.findById(id).select("name email").lean();
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
export { COOKIE_NAME };
