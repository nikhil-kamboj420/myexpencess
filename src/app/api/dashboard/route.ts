import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Expense from "@/models/Expense";
import { apiError, handleApiError } from "@/lib/api";
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized.", 401);
    const month =
      req.nextUrl.searchParams.get("month") ||
      new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      return apiError("Invalid month.", 400);
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    await connectDB();
    const [summary, recent] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: user._id, date: { $gte: start, $lt: end } } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.name",
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      Expense.find({ userId: user._id, date: { $gte: start, $lt: end } })
        .populate("categoryId", "name")
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),
    ]);
    const total = summary.reduce((s, x) => s + x.amount, 0);
    const count = summary.reduce((s, x) => s + x.count, 0);
    return NextResponse.json({
      total,
      count,
      byCategory: summary.map((x) => ({
        name: x._id,
        amount: x.amount,
        percentage: total ? (x.amount / total) * 100 : 0,
      })),
      recent: recent.map((x) => ({
        _id: String(x._id),
        title: x.title,
        amount: x.amount,
        date: x.date,
        categoryName:
          (x.categoryId as unknown as { name: string })?.name || "Unknown",
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
