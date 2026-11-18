import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Expense from "@/models/Expense";
import Category from "@/models/Category";
import { expenseSchema } from "@/lib/validation";
import { apiError, handleApiError } from "@/lib/api";
type Ctx = { params: Promise<{ id: string }> };
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    const { id } = await ctx.params;
    const parsed = expenseSchema.safeParse(await req.json());
    if (!parsed.success)
      return apiError(parsed.error.issues[0]?.message || "Invalid input.", 400);
    await connectDB();
    const category = await Category.findOne({
      _id: parsed.data.categoryId,
      userId: user._id,
    });
    if (!category) return apiError("Not found.", 404);
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: user._id },
      {
        ...parsed.data,
        amount: Math.round(parsed.data.amount * 100) / 100,
        date: new Date(`${parsed.data.date}T12:00:00`),
      },
      { new: true, runValidators: true },
    );
    if (!expense) return apiError("Not found.", 404);
    return NextResponse.json({ expense });
  } catch (e) {
    return handleApiError(e);
  }
}
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    const { id } = await ctx.params;
    await connectDB();
    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: user._id,
    });
    if (!expense) return apiError("Not found.", 404);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
