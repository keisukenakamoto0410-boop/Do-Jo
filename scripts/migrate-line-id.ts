// Migrate LINE ID from new senior account to old admin account
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔄 Migrating LINE ID to admin account...\n");

  const oldAdminId = "cmnnbewef0000l9043izezdlb"; // 古いadminアカウント（スロット20個）
  const newSeniorId = "cmnpivnct0000le04bb2jd90l"; // 新しいseniorアカウント（削除予定）
  const newLineId = "U722d7cebe77d4f83582aa103ff2e141d"; // 新しいLINE ID

  // Step 1: Delete the new senior account (no slots, just created)
  console.log("Step 1: Deleting new senior account (no slots)...");
  await prisma.user.delete({
    where: { id: newSeniorId },
  });
  console.log("✅ New senior account deleted\n");

  // Step 2: Update admin account with new LINE ID
  console.log("Step 2: Updating admin account with new LINE ID...");
  const updatedUser = await prisma.user.update({
    where: { id: oldAdminId },
    data: { lineId: newLineId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lineId: true,
      _count: {
        select: { slots: true },
      },
    },
  });

  console.log("✅ Admin account updated successfully:\n");
  console.log(`  Name: ${updatedUser.name}`);
  console.log(`  Role: ${updatedUser.role}`);
  console.log(`  New LINE ID: ${updatedUser.lineId}`);
  console.log(`  Hosted Slots: ${updatedUser._count.slots}`);
  console.log("\n✅ Migration complete! Reservations will now send LINE notifications.");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
