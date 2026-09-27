import { Metadata } from "next";
import { CartPage } from "@/components/public/CartPage";

export const metadata: Metadata = { title: "Cart — RightWay Foods" };

export default function Cart() {
  return <CartPage />;
}
