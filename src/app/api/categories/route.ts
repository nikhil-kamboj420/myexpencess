import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Category from "@/models/Category";
import Expense from "@/models/Expense";
import { categorySchema } from "@/lib/validation";
import { apiError, handleApiError } from "@/lib/api";
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    await connectDB();
    const rows = await Category.aggregate([
      { $match: { userId: user._id } },
      {
        $lookup: {
          from: "expenses",
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$categoryId", "$$categoryId"] },
                    { $eq: ["$userId", user._id] },
                  ],
                },
              },
            },
          ],
          as: "expenses",
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          expenseCount: { $size: "$expenses" },
          totalAmount: { $sum: "$expenses.amount" },
        },
      },
      { $sort: { name: 1 } },
    ]);
    return NextResponse.json({ items: rows });
  } catch (e) {
    return handleApiError(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    const parsed = categorySchema.safeParse(await req.json());
    if (!parsed.success)
      return apiError(parsed.error.issues[0]?.message || "Invalid input.", 400);
    await connectDB();
    const exists = await Category.findOne({
      userId: user._id,
      name: parsed.data.name,
    }).collation({ locale: "en", strength: 2 });
    if (exists)
      return apiError("A category with this name already exists.", 409);
    const category = await Category.create({
      userId: user._id,
      name: parsed.data.name,
      isDefault: false,
    });
    return NextResponse.json({ category }, { status: 201 });
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
