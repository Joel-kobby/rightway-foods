import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/unauthorized");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userName={session.user.name} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div />
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>Welcome, <strong>{session.user.name}</strong></span>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
