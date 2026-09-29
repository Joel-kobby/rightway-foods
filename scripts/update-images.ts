import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Real food photography from Unsplash (free to use)
  await db.product.update({
    where: { slug: "coconut-oil" },
    data: { imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80" },
  });

  await db.product.update({
    where: { slug: "palm-oil" },
    data: { imageUrl: "https://i.ibb.co/CsnN81Mb/Whats-App-Image-2026-09-29-at-05-02-34.jpg" },
  });

  await db.product.update({
    where: { slug: "eggs" },
    data: { imageUrl: "https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=600&q=80" },
  });

  console.log("✅ Product images updated on production DB");
  await db.$disconnect();
}

main().catch(console.error);
