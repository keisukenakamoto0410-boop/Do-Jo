import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Resetting base64 avatars...");

  // Find all users with base64 avatars
  const usersWithBase64Avatar = await prisma.user.findMany({
    where: {
      avatar: {
        startsWith: "data:",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log(`Found ${usersWithBase64Avatar.length} users with base64 avatars`);

  // Reset all base64 avatars to null
  const result = await prisma.user.updateMany({
    where: {
      avatar: {
        startsWith: "data:",
      },
    },
    data: {
      avatar: null,
    },
  });

  console.log(`✅ Reset ${result.count} avatars`);

  // List affected users
  for (const user of usersWithBase64Avatar) {
    console.log(`  - ${user.name} (${user.email})`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
