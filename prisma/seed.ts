import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hash passwords
  const adminHash = await bcrypt.hash("5678", 12);
  const emp1Hash = await bcrypt.hash("1234", 12);
  const emp2Hash = await bcrypt.hash("2345", 12);
  const emp3Hash = await bcrypt.hash("3456", 12);

  // Admin account
  await prisma.user.upsert({
    where: { code: "9001" },
    update: {},
    create: {
      code: "9001",
      passwordHash: adminHash,
      role: Role.ADMIN,
      name: "Admin",
    },
  });

  // Employee accounts
  await prisma.user.upsert({
    where: { code: "1001" },
    update: {},
    create: {
      code: "1001",
      passwordHash: emp1Hash,
      role: Role.EMPLOYEE,
      name: "Alice",
    },
  });

  await prisma.user.upsert({
    where: { code: "1002" },
    update: {},
    create: {
      code: "1002",
      passwordHash: emp2Hash,
      role: Role.EMPLOYEE,
      name: "Bob",
    },
  });

  await prisma.user.upsert({
    where: { code: "1003" },
    update: {},
    create: {
      code: "1003",
      passwordHash: emp3Hash,
      role: Role.EMPLOYEE,
      name: "Carol",
    },
  });

  // Default global ideal margin
  await prisma.appSetting.upsert({
    where: { key: "idealMargin" },
    update: {},
    create: {
      key: "idealMargin",
      value: "35.0",
    },
  });

  console.log("✅ Seed complete.");
  console.log("  Admin:    code=9001 password=5678");
  console.log("  Employee: code=1001 password=1234");
  console.log("  Employee: code=1002 password=2345");
  console.log("  Employee: code=1003 password=3456");
  console.log("  Ideal Margin: 35.0%");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
