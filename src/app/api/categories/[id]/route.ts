import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Category from "@/models/Category";
import Expense from "@/models/Expense";
import { categorySchema } from "@/lib/validation";
import { apiError, handleApiError } from "@/lib/api";
type Ctx = { params: Promise<{ id: string }> };
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    const { id } = await ctx.params;
    const parsed = categorySchema.safeParse(await req.json());
    if (!parsed.success)
      return apiError(parsed.error.issues[0]?.message || "Invalid input.", 400);
    await connectDB();
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      userId: user._id,
      name: parsed.data.name,
    }).collation({ locale: "en", strength: 2 });
    if (duplicate)
      return apiError("A category with this name already exists.", 409);
    const category = await Category.findOneAndUpdate(
      { _id: id, userId: user._id },
      { name: parsed.data.name },
      { new: true, runValidators: true },
    );
    if (!category) return apiError("Not found.", 404);
    return NextResponse.json({ category });
  } catch (e) {
    if (
      typeof e === "object" &&
      e &&
      "code" in e &&
      (e as { code: number }).code === 11000
    )
      return apiError("A category with this name already exists.", 409);
    return handleApiError(e);
  }
}
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    const { id } = await ctx.params;
    await connectDB();
    const category = await Category.findOne({ _id: id, userId: user._id });
    if (!category) return apiError("Not found.", 404);
    const count = await Expense.countDocuments({
      userId: user._id,
      categoryId: id,
    });
    if (count)
      return apiError(
        "This category has expenses. Move or delete them first.",
        409,
      );
    await category.deleteOne();
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
