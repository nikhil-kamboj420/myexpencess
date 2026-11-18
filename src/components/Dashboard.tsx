"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/format";
type Data = {
  total: number;
  count: number;
  byCategory: { name: string; amount: number; percentage: number }[];
  recent: {
    _id: string;
    title: string;
    amount: number;
    date: string;
    categoryName: string;
  }[];
};
export default function Dashboard() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch(`/api/dashboard?month=${month}`);
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [month]);
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <p className="muted">Your finances at a glance</p>
          <h1 className="text-3xl font-bold mt-1">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <input
            aria-label="Select month"
            type="month"
            className="input !w-auto"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <Link href="/expenses?new=1" className="btn btn-primary">
            ＋ Add expense
          </Link>
        </div>
      </div>
      {error ? (
        <div className="card p-8 text-center">
          <p>Could not load data. Please try again.</p>
          <button className="btn btn-secondary mt-4" onClick={load}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-6 h-32 skeleton" />
          <div className="card p-6 h-32 skeleton" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-6">
              <p className="muted text-sm">Total this month</p>
              <p className="text-3xl font-bold mt-3">
                {formatINR(data?.total || 0)}
              </p>
              <p className="text-xs muted mt-2">Selected month</p>
            </div>
            <div className="card p-6">
              <p className="muted text-sm">Transactions</p>
              <p className="text-3xl font-bold mt-3">{data?.count || 0}</p>
              <p className="text-xs muted mt-2">Expenses recorded</p>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-5 mt-5">
            <section className="card">
              <div className="p-5 border-b">
                <h2 className="font-bold">Category breakdown</h2>
                <p className="text-xs muted mt-1">
                  How your spending is distributed
                </p>
              </div>
              {!data?.byCategory.length ? (
                <p className="p-8 text-center muted">
                  No expenses for this month yet.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCategory.map((c) => (
                        <tr key={c.name}>
                          <td className="font-medium">{c.name}</td>
                          <td>{formatINR(c.amount)}</td>
                          <td>{c.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section className="card">
              <div className="p-5 border-b flex justify-between">
                <h2 className="font-bold">Recent expenses</h2>
                <Link
                  href="/expenses"
                  className="text-xs text-indigo-600 font-semibold"
                >
                  View all →
                </Link>
              </div>
              {!data?.recent.length ? (
                <div className="p-8 text-center">
                  <p className="muted">No expenses yet.</p>
                  <Link
                    href="/categories"
                    className="text-indigo-600 text-sm mt-2 inline-block"
                  >
                    Create a category first
                  </Link>
                </div>
              ) : (
                <div>
                  {data.recent.map((e) => (
                    <div
                      key={e._id}
                      className="flex justify-between items-center p-4 border-b last:border-0"
                    >
                      <div>
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-xs muted mt-1">
                          {e.categoryName} ·{" "}
                          {new Date(e.date).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <p className="font-semibold">{formatINR(e.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
