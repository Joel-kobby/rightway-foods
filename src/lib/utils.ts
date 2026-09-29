import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Ghana Cedi — accepts number, string, or Prisma Decimal
export function formatCurrency(amount: number | string | { toString(): string } | null | undefined): string {
  if (amount === null || amount === undefined) return "₵0.00";
  const num = typeof amount === "number" ? amount : parseFloat(amount.toString());
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

// Generate human-readable IDs
export function generateOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `RW-${year}-${String(sequence).padStart(6, "0")}`;
}

export function generateSaleNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `RWS-${year}-${String(sequence).padStart(6, "0")}`;
}

export function generatePaymentRef(sequence: number): string {
  const year = new Date().getFullYear();
  return `RWP-${year}-${String(sequence).padStart(6, "0")}`;
}

export function generateExpenseRef(sequence: number): string {
  const year = new Date().getFullYear();
  return `RWE-${year}-${String(sequence).padStart(6, "0")}`;
}

export function generateCustomerId(sequence: number): string {
  return `RWC-${String(sequence).padStart(6, "0")}`;
}

// Date formatting
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Slugify
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
