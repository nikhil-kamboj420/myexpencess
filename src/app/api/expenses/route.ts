import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Expense from "@/models/Expense";
import Category from "@/models/Category";
import { expenseSchema } from "@/lib/validation";
import { apiError, handleApiError } from "@/lib/api";

// Escape regex metacharacters so a search term is treated as plain text.
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);

    const query = req.nextUrl.searchParams;
    const rawPage = Number(query.get("page") || 1);
    const rawLimit = Number(query.get("limit") || 10);
    if (
      !Number.isInteger(rawPage) ||
      rawPage < 1 ||
      !Number.isInteger(rawLimit) ||
      rawLimit < 1
    ) {
      return apiError("Invalid query.", 400);
    }
    const page = rawPage;
    const limit = Math.min(10, rawLimit);
    const filter: Record<string, unknown> = { userId: user._id };

    const categoryId = query.get("categoryId");
    if (categoryId) filter.categoryId = categoryId;
    const search = query.get("search")?.trim();
    if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

    await connectDB();
    const [items, total] = await Promise.all([
      Expense.find(filter)
        .populate("categoryId", "name")
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);
    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    const parsed = expenseSchema.safeParse(await req.json());
    if (!parsed.success)
      return apiError(parsed.error.issues[0]?.message || "Invalid input.", 400);

    await connectDB();
    // A category ID from another account must never be accepted.
    const category = await Category.findOne({
      _id: parsed.data.categoryId,
      userId: user._id,
    });
    if (!category) return apiError("Not found.", 404);

    const expense = await Expense.create({
      ...parsed.data,
      amount: Math.round(parsed.data.amount * 100) / 100,
      date: new Date(`${parsed.data.date}T12:00:00`),
      userId: user._id,
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
