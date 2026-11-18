import { Suspense } from "react";
import Expenses from "@/components/Expenses";
export const metadata = { title: "Expenses" };
export default function ExpensesPage() {
  // useSearchParams inside the interactive table requires a Suspense boundary.
  return (
    <Suspense fallback={<div className="card p-8">Loading expenses...</div>}>
      <Expenses />
    </Suspense>
  );
}
