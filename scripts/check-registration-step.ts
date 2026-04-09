import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== Checking User Registration States ===\n");

  // Check あさひ's accounts
  const asahiUsers = await prisma.user.findMany({
    where: { name: { contains: "あさひ" } },
    select: {
      id: true,
      name: true,
      lineId: true,
      registrationStep: true,
      _count: { select: { slots: true } },
    },
  });

  console.log(`Found ${asahiUsers.length} あさひ account(s):\n`);
  asahiUsers.forEach((user, i) => {
    console.log(`Account ${i + 1}:`);
    console.log(`  LINE ID: ${user.lineId}`);
    console.log(`  Registration Step: ${user.registrationStep || "null (COMPLETED)"}`);
    console.log(`  Slots: ${user._count.slots}`);
    console.log();
  });

  // Check 中元景介
  const nakamotoUsers = await prisma.user.findMany({
    where: { name: { contains: "中元" } },
    select: {
      id: true,
      name: true,
      lineId: true,
      registrationStep: true,
    },
  });

  console.log("中元景介:");
  if (nakamotoUsers.length === 0) {
    console.log("  ❌ Not found in database\n");
  } else {
    nakamotoUsers.forEach((user, i) => {
      console.log(`  Account ${i + 1}:`);
      console.log(`    LINE ID: ${user.lineId}`);
      console.log(`    Registration Step: ${user.registrationStep || "COMPLETED"}`);
    });
    console.log();
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
