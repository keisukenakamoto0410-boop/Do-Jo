// Accept terms for all users who haven't accepted yet
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Accepting terms for all users...");

  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { termsAccepted: false },
        { termsAccepted: null },
      ],
    },
    data: {
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log(`✅ Updated ${result.count} users to have terms accepted`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
