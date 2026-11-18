"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/expenses", label: "Expenses", icon: "↗" },
  { href: "/categories", label: "Categories", icon: "▦" },
];
export default function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <div className="min-h-screen">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 p-6 flex-col">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          ✦ myexpencess
        </Link>
        <p className="text-xs muted mt-2">PERSONAL FINANCE</p>
        <nav className="mt-12 space-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${path === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="border-t pt-5">
            <p className="font-semibold truncate">{userName}</p>
            <p className="text-xs muted">Personal account</p>
            <button
              onClick={logout}
              className="text-sm text-slate-500 mt-4 hover:text-red-600"
            >
              ↪ Log out
            </button>
          </div>
        </div>
      </aside>
      <div className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-5 md:px-9">
          <span className="font-semibold md:hidden text-indigo-600">
            ✦ myexpencess
          </span>
          <span className="hidden md:block text-sm muted">
            Good to see you, {userName}
          </span>
          <span className="text-xs muted">INR · India</span>
        </header>
        <main className="container py-8">{children}</main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-3 z-20">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-xs flex flex-col items-center gap-1 ${path === l.href ? "text-indigo-600 font-bold" : "text-slate-500"}`}
          >
            <span className="text-lg">{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <button
          onClick={logout}
          className="text-xs text-slate-500 flex flex-col items-center gap-1"
        >
          <span className="text-lg">↪</span>Logout
        </button>
      </nav>
    </div>
  );
}
