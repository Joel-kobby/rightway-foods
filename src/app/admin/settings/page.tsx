import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const settings = await db.systemSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
