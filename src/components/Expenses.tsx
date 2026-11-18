"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/format";
import ExpenseModal from "@/components/ExpenseModal";
type Category = { _id: string; name: string };
type Expense = {
  _id: string;
  title: string;
  amount: number;
  date: string;
  categoryId: { _id: string; name: string };
};
export default function Expenses() {
  const params = useSearchParams();
  const [items, setItems] = useState<Expense[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<Expense | null | undefined>(undefined);
  async function load() {
    setLoading(true);
    setError(false);
    try {
      const [e, c] = await Promise.all([
        fetch(
          `/api/expenses?page=${page}&limit=10&search=${encodeURIComponent(search)}&categoryId=${categoryId}`,
        ),
        fetch("/api/categories"),
      ]);
      if (!e.ok || !c.ok) throw new Error();
      const d = await e.json();
      setItems(d.items);
      setTotal(d.total);
      setCats((await c.json()).items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [page, search, categoryId]);
  useEffect(() => {
    if (params.get("new")) setEditing(null);
  }, [params]);
  async function remove(item: Expense) {
    if (!confirm(`Delete “${item.title}” (${formatINR(item.amount)})?`)) return;
    const r = await fetch(`/api/expenses/${item._id}`, { method: "DELETE" });
    if (r.ok) {
      if (items.length === 1 && page > 1) setPage(page - 1);
      else load();
    } else alert((await r.json()).error || "Something went wrong.");
  }
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
        <div>
          <p className="muted">Keep every transaction in one place</p>
          <h1 className="text-3xl font-bold mt-1">Expenses</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(null)}>
          ＋ Add expense
        </button>
      </div>
      <div className="card p-4 flex flex-col sm:flex-row gap-3 mb-5">
        <input
          className="input"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input sm:max-w-56"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="card overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            Could not load expenses.{" "}
            <button onClick={load} className="text-indigo-600">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 space-y-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ width: `${80 + (i % 3) * 7}%` }}
              />
            ))}
          </div>
        ) : !items.length ? (
          <div className="p-12 text-center">
            <h3 className="font-bold">No expenses found.</h3>
            <p className="muted mt-2">Try changing your search or filters.</p>
            <button
              className="text-indigo-600 mt-3"
              onClick={() => {
                setSearch("");
                setCategoryId("");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e._id}>
                      <td className="font-semibold">{e.title}</td>
                      <td>
                        <span className="badge">
                          {e.categoryId?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="font-semibold">{formatINR(e.amount)}</td>
                      <td>
                        {new Date(e.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <button
                          className="text-indigo-600 mr-3"
                          onClick={() => setEditing(e)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600"
                          onClick={() => remove(e)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center p-4 text-sm">
              <span className="muted">
                {total} expenses · Page {page} of{" "}
                {Math.max(1, Math.ceil(total / 10))}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary !py-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary !py-2"
                  disabled={page >= Math.ceil(total / 10)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {editing !== undefined && (
        <ExpenseModal
          expense={editing}
          categories={cats}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            load();
          }}
        />
      )}
    </>
  );
}
