import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== Fixing あさひ's stuck registration ===\n");

  // Account 1 is stuck in AWAITING_EMAIL
  const stuckLineId = "Uf201e908360c1a5a6b8ecad8d461bd2f";

  const user = await prisma.user.findUnique({
    where: { lineId: stuckLineId },
    select: {
      id: true,
      name: true,
      registrationStep: true,
    },
  });

  if (!user) {
    console.log("❌ User not found");
    process.exit(1);
  }

  console.log("Current state:");
  console.log(`  Name: ${user.name}`);
  console.log(`  Registration Step: ${user.registrationStep}`);
  console.log();

  if (user.registrationStep !== "AWAITING_EMAIL") {
    console.log("✅ User is not stuck in AWAITING_EMAIL");
    process.exit(0);
  }

  // Fix: Set registration to COMPLETED
  await prisma.user.update({
    where: { id: user.id },
    data: {
      registrationStep: "COMPLETED",
    },
  });

  console.log("✅ Fixed! Registration step set to COMPLETED");
  console.log();
  console.log("The user can now send 'ステータス' to check their status.");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
