import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="min-h-screen flex items-center">
      <div className="container grid md:grid-cols-2 gap-12 items-center py-16">
        <div>
          <div className="text-sm font-bold text-indigo-600 mb-6">
            ✦ myexpencess
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]">
            Know where your money <span className="text-indigo-600">goes.</span>
          </h1>
          <p className="text-lg muted mt-6 max-w-lg leading-8">
            A clear, simple space to record everyday spending, build your own
            categories, and understand your monthly expenses.
          </p>
          <div className="flex gap-3 mt-9">
            <Link className="btn btn-primary" href="/signup">
              Get started <span>→</span>
            </Link>
            <Link className="btn btn-secondary" href="/login">
              Login
            </Link>
          </div>
          <p className="muted text-xs mt-8">
            Your expenses. Your categories. Your clarity.
          </p>
        </div>
        <div className="card p-7 md:p-9">
          <div className="flex justify-between items-center">
            <div>
              <p className="muted text-sm">Monthly overview</p>
              <h2 className="text-2xl font-bold mt-1">
                Your money, organized.
              </h2>
            </div>
            <span className="badge">Preview</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-indigo-700 text-xs">Total spending</p>
              <p className="text-2xl font-bold mt-2">₹12,450.00</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="muted text-xs">Transactions</p>
              <p className="text-2xl font-bold mt-2">24</p>
            </div>
          </div>
          <div className="mt-8 space-y-5">
            <p className="font-semibold">Spending categories</p>
            {[
              ["Food", 55],
              ["Travel", 28],
              ["Shopping", 17],
            ].map(([n, v]) => (
              <div key={n}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{n}</span>
                  <span className="muted">{v}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs muted mt-8">
            Illustrative preview — your real data stays private to your account.
          </p>
        </div>
      </div>
    </main>
  );
}
