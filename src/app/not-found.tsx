import Link from "next/link";
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <p className="text-6xl font-bold text-indigo-600">404</p>
        <h1 className="text-2xl font-bold mt-4">Page not found.</h1>
        <p className="muted mt-2">
          The page you are looking for does not exist.
        </p>
        <Link className="btn btn-primary mt-6" href="/dashboard">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
