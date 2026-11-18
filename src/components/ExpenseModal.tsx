"use client";
import { useState } from "react";
import { dateInputValue } from "@/lib/format";
type Category = { _id: string; name: string };
type Expense = {
  _id: string;
  title: string;
  amount: number;
  date: string;
  categoryId: { _id: string; name: string };
};
export default function ExpenseModal({
  expense,
  categories,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: expense?.title || "",
    amount: expense ? String(expense.amount) : "",
    categoryId: expense?.categoryId?._id || "",
    date: expense ? dateInputValue(new Date(expense.date)) : dateInputValue(),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        expense ? `/api/expenses/${expense._id}` : "/api/expenses",
        {
          method: expense ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Something went wrong. Please try again.");
        return;
      }
      onSaved();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" className="card w-full max-w-md p-6">
        <div className="flex justify-between">
          <h2 className="text-xl font-bold">
            {expense ? "Edit expense" : "Add expense"}
          </h2>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {!categories.length ? (
          <div className="mt-6">
            <p>Create a category first to add an expense.</p>
            <a
              href="/categories"
              className="text-indigo-600 font-semibold inline-block mt-3"
            >
              Manage categories →
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                maxLength={80}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input
                className="input"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                max={dateInputValue()}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy
                  ? expense
                    ? "Updating..."
                    : "Saving..."
                  : expense
                    ? "Update"
                    : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
