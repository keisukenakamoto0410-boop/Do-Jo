// List all users with their roles
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n📋 All Users:\n");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      lineId: true,
      termsAccepted: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (users.length === 0) {
    console.log("No users found");
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   LINE ID: ${user.lineId || "(not set)"}`);
    console.log(`   Terms: ${user.termsAccepted ? "✓ Accepted" : "✗ Not accepted"}`);
    console.log(`   Last Login: ${user.lastLoginAt?.toLocaleString() || "Never"}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    console.log("");
  });

  // Count by role
  const roleCount = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("📊 Users by role:");
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`);
  });
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
