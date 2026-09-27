import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { NewProductForm } from "@/components/products/NewProductForm";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const [categories, suppliers] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new product with variants and pricing.</p>
      </div>
      <NewProductForm categories={categories} suppliers={suppliers} />
    </div>
  );
}
