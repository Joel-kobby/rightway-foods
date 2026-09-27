import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/shared/SignOutButton";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "BRANCH_MANAGER"];

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED.includes(session.user.role)) redirect("/unauthorized");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[hsl(142,71%,25%)] text-white px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">RightWay Foods — Sales</span>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-80">{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
