import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lineId = process.argv[2];

  if (!lineId) {
    console.log("Usage: npx tsx scripts/check-by-line-id.ts <LINE_ID>");
    process.exit(1);
  }

  console.log(`\nSearching for LINE ID: ${lineId}\n`);

  const user = await prisma.user.findUnique({
    where: { lineId },
    select: {
      id: true,
      name: true,
      email: true,
      lineId: true,
      registrationStep: true,
      role: true,
      _count: { select: { slots: true } },
    },
  });

  if (!user) {
    console.log("❌ User not found");
  } else {
    console.log("✅ User found:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  LINE ID: ${user.lineId}`);
    console.log(`  Registration Step: ${user.registrationStep || "COMPLETED"}`);
    console.log(`  Slots: ${user._count.slots}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
