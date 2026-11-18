import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be between 2 and 50 characters.")
    .max(50, "Name must be between 2 and 50 characters."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});
export const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "This field is required."),
});
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name must be between 1 and 30 characters.")
    .max(30, "Category name must be between 1 and 30 characters."),
});
export const expenseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "This field is required.")
      .max(80, "Title must be 80 characters or fewer."),
    amount: z.coerce
      .number()
      .min(0.01, "Amount must be between 0.01 and 10,00,000.")
      .max(1000000, "Amount must be between 0.01 and 10,00,000."),
    categoryId: z.string().min(1, "This field is required."),
    date: z.string().min(1, "This field is required."),
  })
  .refine(
    (data) => {
      // The product is INR-only and intended for India; compare calendar dates in IST.
      const todayInIndia = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(new Date());
      const validCalendarDate =
        /^\d{4}-\d{2}-\d{2}$/.test(data.date) &&
        !Number.isNaN(new Date(`${data.date}T00:00:00Z`).getTime());
      return validCalendarDate && data.date <= todayInIndia;
    },
    { path: ["date"], message: "Date cannot be in the future." },
  );
