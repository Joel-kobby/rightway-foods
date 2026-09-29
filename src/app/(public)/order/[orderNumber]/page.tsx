import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order Confirmed — RightWay Foods" };

export default async function OrderConfirmationPage({ params }: { params: { orderNumber: string } }) {
  const order = await db.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } },
        },
      },
      deliveryZone: { select: { name: true, estimatedDays: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
        <p className="text-gray-500 mt-2">Thank you for your order. We will contact you to confirm delivery.</p>
      </div>

      {/* Order number */}
      <div className="bg-[hsl(142,71%,18%)] text-white rounded-2xl p-6 text-center mb-6">
        <p className="text-white/60 text-sm mb-1">Your Order Number</p>
        <p className="text-3xl font-black tracking-wide">{order.orderNumber}</p>
        <p className="text-white/60 text-xs mt-2">Save this number to track your order</p>
      </div>

      {/* Order details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.product.name} — {item.variant.name} × {Number(item.quantity)}
              </span>
              <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery ({order.deliveryZone?.name ?? "—"})</span>
            <span>{Number(order.deliveryFee) > 0 ? formatCurrency(order.deliveryFee) : "FREE"}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Delivery Details</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex gap-2"><span className="font-medium w-24 flex-shrink-0">Name:</span><span>{order.guestName}</span></div>
          <div className="flex gap-2"><span className="font-medium w-24 flex-shrink-0">Phone:</span><span>{order.guestPhone}</span></div>
          <div className="flex gap-2"><span className="font-medium w-24 flex-shrink-0">Address:</span><span>{[order.guestAddress, order.guestCity, order.guestRegion].filter(Boolean).join(", ")}</span></div>
          {order.deliveryZone && (
            <div className="flex gap-2"><span className="font-medium w-24 flex-shrink-0">Delivery:</span><span>{order.deliveryZone.name} — est. {order.deliveryZone.estimatedDays} day{order.deliveryZone.estimatedDays > 1 ? "s" : ""}</span></div>
          )}
          <div className="flex gap-2"><span className="font-medium w-24 flex-shrink-0">Payment:</span><span>{order.paymentMethod?.replace("_", " ") ?? "—"}</span></div>
          <div className="flex gap-2"><span className="font-medium w-24 flex-shrink-0">Placed:</span><span>{formatDateTime(order.placedAt)}</span></div>
        </div>
      </div>

      {/* What's next */}
      <div className="bg-[hsl(45,30%,96%)] rounded-xl p-5 mb-6 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">What happens next?</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Our team will review and confirm your order.</li>
          <li>We will call you on <strong>{order.guestPhone}</strong> to confirm delivery details.</li>
          <li>Your order will be prepared and dispatched.</li>
          <li>Delivery within {order.deliveryZone?.estimatedDays ?? 1}–{(order.deliveryZone?.estimatedDays ?? 1) + 1} business days.</li>
        </ol>
      </div>

      <div className="flex gap-3">
        <Link href="/products" className="flex-1 text-center bg-[hsl(142,71%,25%)] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition">
          Continue Shopping
        </Link>
        <Link href="/contact" className="flex-1 text-center border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition">
          Contact Us
        </Link>
      </div>
    </div>
  );
}
