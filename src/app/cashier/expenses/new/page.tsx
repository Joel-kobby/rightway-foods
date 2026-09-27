import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RecordExpenseForm } from "@/components/cashier/RecordExpenseForm";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const allowed = ["SUPER_ADMIN","ADMIN","CASHIER","BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) redirect("/unauthorized");

  const categories = await db.expenseCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Record Expense</h1>
      <RecordExpenseForm categories={categories} />
    </div>
  );
}
