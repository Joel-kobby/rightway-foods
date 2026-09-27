import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "RightWay Foods — Quality Ghanaian Food Products",
    template: "%s | RightWay Foods",
  },
  description:
    "Premium Ghanaian food products delivered to your door. Palm Oil, Coconut Oil, Fresh Eggs and more.",
  keywords: ["palm oil Ghana", "coconut oil Ghana", "eggs delivery Ghana", "food delivery Accra"],
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: "RightWay Foods",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
