import { prisma } from "@/lib/prisma";

async function migrateAsahiAccount() {
  console.log("Migrating Asahi's account to new LINE ID...\n");

  const oldLineId = "U54c120927f04b7c2987376f0d5fdccd0";
  const newLineId = "Uf201e908360c1a5a6b8ecad8d461bd2f";

  // Find both accounts
  const oldAccount = await prisma.user.findUnique({
    where: { lineId: oldLineId },
    include: {
      _count: {
        select: {
          slots: true,
          reservationsAsLearner: true,
        },
      },
    },
  });

  const newAccount = await prisma.user.findUnique({
    where: { lineId: newLineId },
    include: {
      _count: {
        select: {
          slots: true,
          reservationsAsLearner: true,
        },
      },
    },
  });

  if (!oldAccount) {
    console.log("❌ Old account not found");
    return;
  }

  if (!newAccount) {
    console.log("❌ New account not found");
    return;
  }

  console.log("📋 Old Account:");
  console.log("   ID:", oldAccount.id);
  console.log("   Name:", oldAccount.name);
  console.log("   LINE ID:", oldAccount.lineId);
  console.log("   Slots:", oldAccount._count.slots);
  console.log("   Reservations:", oldAccount._count.reservationsAsLearner);

  console.log("\n📋 New Account:");
  console.log("   ID:", newAccount.id);
  console.log("   Name:", newAccount.name);
  console.log("   LINE ID:", newAccount.lineId);
  console.log("   Slots:", newAccount._count.slots);
  console.log("   Reservations:", newAccount._count.reservationsAsLearner);

  console.log("\n🔄 Starting migration...");

  try {
    await prisma.$transaction(async (tx) => {
      // Update all slots to point to new account
      const slotsUpdated = await tx.slot.updateMany({
        where: { hostId: oldAccount.id },
        data: { hostId: newAccount.id },
      });
      console.log(`   ✅ Migrated ${slotsUpdated.count} slots`);

      // Update all reservations to point to new account
      const reservationsUpdated = await tx.reservation.updateMany({
        where: { hostId: oldAccount.id },
        data: { hostId: newAccount.id },
      });
      console.log(`   ✅ Migrated ${reservationsUpdated.count} reservations`);

      // Delete the old account
      await tx.user.delete({
        where: { id: oldAccount.id },
      });
      console.log(`   ✅ Deleted old account`);
    });

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Test sending a notification to Asahi");
    console.log("   2. Verify Asahi receives notifications for existing reservations");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAsahiAccount().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
