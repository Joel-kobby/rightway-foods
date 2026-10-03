/**
 * Reset all staff passwords to RightWay@2026
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  console.log("🔐 Resetting staff passwords...");

  const hash = await bcrypt.hash("RightWay@2026", 10);

  const users = [
    { email: "admin@rightwayfoods.com",   name: "Admin User",   role: "SUPER_ADMIN" },
    { email: "kofi@rightwayfoods.com",    name: "Kofi Mensah",  role: "SALESPERSON"  },
    { email: "ama@rightwayfoods.com",     name: "Ama Owusu",    role: "SALESPERSON"  },
    { email: "cashier@rightwayfoods.com", name: "Abena Appiah", role: "CASHIER"      },
  ];

  for (const u of users) {
    await db.user.upsert({
      where:  { email: u.email },
      update: { password: hash, isActive: true },
      create: { email: u.email, name: u.name, role: u.role, password: hash, isActive: true, isDemo: true },
    });
    console.log(`  ✓ ${u.email} — password reset`);
  }

  console.log("🎉 All passwords reset to: RightWay@2026");
  await db.$disconnect();
}

main().catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); });
