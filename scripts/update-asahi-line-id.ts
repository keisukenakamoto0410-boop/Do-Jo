import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // アカウント2（スロット6個がある方）
  const targetUserId = "cmnnzfef30000k104pzu0fk8a";

  // 現在使っているLINE ID（アカウント1から取得）
  const newLineId = "Uf201e908360c1a5a6b8ecad8d461bd2f";

  console.log("\n=== Updating あさひ's LINE ID ===\n");

  // アカウント2のLINE IDを更新
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { lineId: newLineId },
    select: {
      id: true,
      name: true,
      email: true,
      lineId: true,
      _count: {
        select: { slots: true },
      },
    },
  });

  console.log("✅ Updated user:");
  console.log(`  Name: ${updatedUser.name}`);
  console.log(`  Email: ${updatedUser.email}`);
  console.log(`  LINE ID: ${updatedUser.lineId}`);
  console.log(`  Slots: ${updatedUser._count.slots}`);
  console.log();

  // アカウント1を削除
  console.log("Deleting old account (User 1)...");
  await prisma.user.delete({
    where: { id: "cmnnyonjq0000lb04gt8c8uk3" },
  });

  console.log("✅ Old account deleted");
  console.log();
  console.log("🎉 あさひ should now receive LINE notifications!");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
