import { Metadata } from "next";
import { db } from "@/lib/db";
import { CheckoutForm } from "@/components/public/CheckoutForm";

export const metadata: Metadata = { title: "Checkout — RightWay Foods" };

export default async function CheckoutPage() {
  const zones = await db.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { fee: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      <CheckoutForm zones={zones} />
    </div>
  );
}
