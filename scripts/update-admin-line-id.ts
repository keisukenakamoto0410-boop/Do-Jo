// Update admin account's LINE ID to the new one
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔄 Updating admin account LINE ID...\n");

  const oldAdminId = "cmnnbewef0000l9043izezdlb"; // 古いadminアカウント
  const newLineId = "U722d7cebe77d4f83582aa103ff2e141d"; // 新しいLINE ID

  // 古いadminアカウントのLINE IDを更新
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
  console.log(`  Old LINE ID: Ud5e0232288d9f44462caf87d81f1c90f`);
  console.log(`  New LINE ID: ${updatedUser.lineId}`);
  console.log(`  Hosted Slots: ${updatedUser._count.slots}`);
  console.log("\n📝 Now reservations will send LINE notifications to the new LINE ID!");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
