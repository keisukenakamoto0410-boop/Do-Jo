// Check all senior/host accounts and their LINE connection status
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n📋 Checking all senior/host accounts...\n");

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["senior", "student", "admin"],
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
          reservationsAsHost: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`Found ${users.length} senior/host/admin account(s):\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   LINE ID: ${user.lineId || "❌ Not connected"}`);
    console.log(`   Slots: ${user._count.slots}`);
    console.log(`   Reservations: ${user._count.reservationsAsHost}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    console.log();
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
