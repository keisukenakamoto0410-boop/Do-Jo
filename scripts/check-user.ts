import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userName = process.argv[2] || "あさひ";

  console.log(`\nSearching for user: "${userName}"\n`);

  // Search by name
  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: userName,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lineId: true,
      createdAt: true,
      _count: {
        select: {
          slots: true,
        },
      },
    },
  });

  if (users.length === 0) {
    console.log("❌ User not found");
  } else {
    console.log(`✅ Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  LINE ID: ${user.lineId || "None"}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Hosted Slots: ${user._count.slots}`);
      console.log();
    });
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
