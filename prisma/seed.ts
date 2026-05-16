import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  const staffPassword = await bcrypt.hash("Staff@123", 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@quickbill.com" },
    update: {},
    create: {
      email: "admin@quickbill.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  // Create staff user
  const staff = await prisma.user.upsert({
    where: { email: "staff@quickbill.com" },
    update: {},
    create: {
      email: "staff@quickbill.com",
      name: "Counter Staff",
      password: staffPassword,
      role: "STAFF",
      isActive: true,
    },
  });

  console.log(`✅ Admin user: ${admin.email} / Admin@123`);
  console.log(`✅ Staff user: ${staff.email} / Staff@123`);
  console.log("");
  console.log("🎉 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
