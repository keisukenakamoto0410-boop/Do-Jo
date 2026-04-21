// Check and fix user role
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get user email or LINE ID from command line
  const identifier = process.argv[2];

  if (!identifier) {
    console.log("Usage: npx tsx scripts/check-and-fix-user-role.ts <email-or-line-id>");
    console.log("\nExample:");
    console.log("  npx tsx scripts/check-and-fix-user-role.ts user@example.com");
    console.log("  npx tsx scripts/check-and-fix-user-role.ts U1234567890abcdef");
    process.exit(1);
  }

  console.log(`\n🔍 Looking up user: ${identifier}\n`);

  // Try to find user by email first, then by LINE ID
  let user = await prisma.user.findUnique({
    where: { email: identifier },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { lineId: identifier },
    });
  }

  if (!user) {
    console.log("❌ User not found");
    process.exit(1);
  }

  console.log("📋 Current user information:");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Name:", user.name);
  console.log("  Role:", user.role);
  console.log("  LINE ID:", user.lineId || "(not set)");
  console.log("  Terms Accepted:", user.termsAccepted);

  // If role is not senior, offer to change it
  if (user.role !== "senior") {
    console.log(`\n⚠️  Current role is "${user.role}", not "senior"`);
    console.log(`\nChanging role to "senior"...`);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "senior" },
    });

    console.log("✅ Role updated successfully!");
    console.log("\n📋 Updated user information:");
    console.log("  Role:", updated.role);
    console.log("\n💡 Please log out and log back in for the changes to take effect.");
  } else {
    console.log("\n✅ User role is already set to 'senior'");
  }
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
