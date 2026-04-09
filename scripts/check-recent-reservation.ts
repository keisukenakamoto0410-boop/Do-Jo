import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== Checking recent reservation ===\n");

  // Get most recent reservation
  const reservation = await prisma.reservation.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      slot: true,
      learner: {
        select: { id: true, name: true, email: true },
      },
      host: {
        select: { id: true, name: true, email: true, lineId: true },
      },
    },
  });

  if (!reservation) {
    console.log("❌ No reservations found");
    process.exit(1);
  }

  console.log("📅 Most Recent Reservation:");
  console.log(`  ID: ${reservation.id}`);
  console.log(`  Created: ${reservation.createdAt}`);
  console.log(`  Status: ${reservation.status}`);
  console.log(`  Session Time: ${reservation.slot.startTime}`);
  console.log();

  console.log("👤 Learner:");
  console.log(`  Name: ${reservation.learner.name}`);
  console.log(`  Email: ${reservation.learner.email}`);
  console.log();

  console.log("🏠 Host (Senior):");
  console.log(`  Name: ${reservation.host.name}`);
  console.log(`  Email: ${reservation.host.email}`);
  console.log(`  LINE ID: ${reservation.host.lineId || "❌ NOT SET"}`);
  console.log();

  if (reservation.host.lineId) {
    console.log("✅ Host has LINE ID - LINE notification should have been sent");
    console.log(`   LINE User ID: ${reservation.host.lineId}`);
  } else {
    console.log("❌ Host does NOT have LINE ID - LINE notification was NOT sent");
    console.log("   Only email notification would be attempted");
  }
  console.log();

  if (reservation.host.email.endsWith("@line.local")) {
    console.log("📧 Host email is @line.local - Email was SKIPPED (correct behavior)");
  } else {
    console.log("📧 Host email is real - Email should have been sent");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
