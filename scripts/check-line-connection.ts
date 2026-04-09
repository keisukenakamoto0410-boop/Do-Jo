import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userName = process.argv[2] || "あさひ";

  console.log(`\nChecking LINE connection for user: "${userName}"\n`);

  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: userName,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      lineId: true,
      role: true,
    },
  });

  if (!user) {
    console.log("❌ User not found");
    process.exit(1);
  }

  console.log("✅ User found:");
  console.log(`  Name: ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  LINE ID: ${user.lineId || "❌ NOT CONNECTED"}`);
  console.log();

  if (user.lineId) {
    console.log("✅ LINE is connected - Will receive LINE notifications");
  } else {
    console.log("❌ LINE is NOT connected - Will NOT receive LINE notifications");
    console.log("   (Only email notifications will be sent)");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
