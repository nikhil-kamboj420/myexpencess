import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/session";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell userName={user.name}>{children}</AppShell>;
}
