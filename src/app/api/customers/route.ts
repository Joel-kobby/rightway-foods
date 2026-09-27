import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type");

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"].includes(session.user.role);
  const isSalesperson = session.user.role === "SALESPERSON";

  const where: Record<string, unknown> = { isActive: true };
  if (type) where.customerType = type;
  if (!isAdmin && isSalesperson) where.assignedToId = session.user.id;
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { businessName: { contains: q } },
      { phone: { contains: q } },
      { customerId: { contains: q } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { sales: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, businessName, email, phone, phone2, customerType, region, city, address, landmark, notes, assignedToId } = body;

  if (!firstName || !phone) {
    return NextResponse.json({ error: "First name and phone are required." }, { status: 400 });
  }

  // Generate customer ID
  const count = await db.customer.count();
  const customerId = `RWC-${String(count + 1).padStart(6, "0")}`;

  const customer = await db.customer.create({
    data: {
      customerId, firstName, lastName, businessName, email,
      phone, phone2, customerType: customerType ?? "RETAIL",
      region, city, address, landmark, notes,
      assignedToId: assignedToId ?? session.user.id,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
