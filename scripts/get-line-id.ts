// Get LINE IDs from database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 Finding users with LINE ID...\n");

  const users = await prisma.user.findMany({
    where: {
      lineId: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      lineId: true,
      role: true,
    },
  });

  if (users.length === 0) {
    console.log("❌ No users with LINE ID found.");
    console.log("\n💡 To get your LINE ID:");
    console.log("   1. Go to https://do-jo.vercel.app/login");
    console.log("   2. Login with LINE");
    console.log("   3. Run this script again");
  } else {
    console.log(`✅ Found ${users.length} user(s) with LINE ID:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   LINE ID: ${user.lineId}`);
      console.log("");
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("Error:", error);
    prisma.$disconnect();
    process.exit(1);
  });
