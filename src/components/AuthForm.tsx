"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const signup = mode === "signup";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="card p-8">
      <Link href="/" className="text-indigo-600 font-bold">
        ✦ myexpencess
      </Link>
      <h1 className="text-2xl font-bold mt-7">
        {signup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="muted mt-2">
        {signup
          ? "Start building a clearer picture of your spending."
          : "Log in to continue to your expenses."}
      </p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        {signup && (
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="input"
              maxLength={50}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        )}
        {/* Email is normalized on the server before lookup. */}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            minLength={signup ? 6 : 1}
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading
            ? signup
              ? "Creating..."
              : "Logging in..."
            : signup
              ? "Create account"
              : "Login"}
        </button>
      </form>
      <p className="text-center text-sm muted mt-6">
        {signup ? "Already have an account? " : "New here? "}
        <Link
          className="text-indigo-600 font-semibold"
          href={signup ? "/login" : "/signup"}
        >
          {signup ? "Login" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}
