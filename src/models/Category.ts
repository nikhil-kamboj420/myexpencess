import mongoose, { Schema, models, model } from "mongoose";
const categorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30,
    },
    isDefault: { type: Boolean, default: false, immutable: true },
  },
  { timestamps: true },
);
// Enforce case-insensitive uniqueness per user at database level (not just in the UI).
categorySchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
const Category = models.Category || model("Category", categorySchema);
export default Category;
