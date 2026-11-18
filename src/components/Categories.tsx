"use client";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
type Cat = {
  _id: string;
  name: string;
  expenseCount: number;
  totalAmount: number;
};
export default function Categories() {
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Cat | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/categories");
      if (!r.ok) throw new Error();
      setItems((await r.json()).items);
    } catch {
      setError("Could not load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function open(item: Cat | null) {
    setEditing(item);
    setName(item?.name || "");
    setError("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        editing ? `/api/categories/${editing._id}` : "/api/categories",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Something went wrong.");
        return;
      }
      setEditing(undefined);
      load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(c: Cat) {
    if (c.expenseCount > 0) return;
    if (!confirm(`Delete category “${c.name}”?`)) return;
    const r = await fetch(`/api/categories/${c._id}`, { method: "DELETE" });
    if (r.ok) load();
    else {
      const d = await r.json();
      alert(d.error || "Something went wrong.");
    }
  }
  return (
    <>
      <div className="flex justify-between items-end mb-7">
        <div>
          <p className="muted">Organize expenses your way</p>
          <h1 className="text-3xl font-bold mt-1">Categories</h1>
        </div>
        <button className="btn btn-primary" onClick={() => open(null)}>
          ＋ Add category
        </button>
      </div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-5">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            {error}
            <button onClick={load} className="text-indigo-600 ml-2">
              Retry
            </button>
          </div>
        ) : !items.length ? (
          <div className="p-12 text-center">
            <h3 className="font-bold">No categories yet.</h3>
            <p className="muted mt-2">
              Create your first category to start tracking expenses.
            </p>
            <button className="btn btn-primary mt-5" onClick={() => open(null)}>
              ＋ Add category
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category name</th>
                  <th>Expenses</th>
                  <th>Total amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id}>
                    <td className="font-semibold">{c.name}</td>
                    <td>{c.expenseCount}</td>
                    <td>{formatINR(c.totalAmount)}</td>
                    <td>
                      <button
                        className="text-indigo-600 mr-3"
                        onClick={() => open(c)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${c.expenseCount ? "text-slate-300" : "text-red-600"}`}
                        disabled={c.expenseCount > 0}
                        title={
                          c.expenseCount
                            ? `This category has ${c.expenseCount} expenses. Move or delete them first.`
                            : "Delete category"
                        }
                        onClick={() => remove(c)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing !== undefined && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <form onSubmit={save} className="card p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold">
              {editing ? "Edit category" : "Add category"}
            </h2>
            <label className="label mt-5">Category name</label>
            <input
              className="input"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
            {error && <p className="error">{error}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditing(undefined)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : editing ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
