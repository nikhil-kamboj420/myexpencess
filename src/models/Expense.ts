import { Schema, models, model } from "mongoose";
const expenseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    amount: { type: Number, required: true, min: 0.01, max: 1000000 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
  },
  { timestamps: true },
);
expenseSchema.index({ userId: 1, date: -1 });
const Expense = models.Expense || model("Expense", expenseSchema);
export default Expense;
