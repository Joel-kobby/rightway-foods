import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RecordSaleForm } from "@/components/sales/RecordSaleForm";

export const dynamic = "force-dynamic";

export default async function RecordSalePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowed = ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) redirect("/unauthorized");

  const [products, customers] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          include: { inventory: { select: { quantity: true } } },
        },
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.customer.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, businessName: true, phone: true, customerId: true },
      orderBy: { firstName: "asc" },
      take: 500,
    }),
  ]);

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Record Sale</h1>
        <p className="text-sm text-gray-500">Complete in under 30 seconds.</p>
      </div>
      <RecordSaleForm products={products} customers={customers} />
    </div>
  );
}
