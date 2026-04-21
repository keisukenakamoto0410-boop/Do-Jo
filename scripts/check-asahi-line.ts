import { prisma } from "@/lib/prisma";

async function checkAsahiLine() {
  console.log("Checking Asahi's LINE connection...\n");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: "あさひ", mode: "insensitive" } },
        { name: { contains: "asahi", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      lineId: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log("❌ User not found");
    await prisma.$disconnect();
    return;
  }

  console.log("✅ User found:");
  console.log(JSON.stringify(user, null, 2));

  // Check recent reservations as host
  const reservations = await prisma.reservation.findMany({
    where: {
      hostId: user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      learner: {
        select: { name: true, email: true },
      },
      slot: {
        select: { startTime: true },
      },
    },
  });

  console.log("\n📅 Recent reservations (as host):");
  console.log(JSON.stringify(reservations, null, 2));

  await prisma.$disconnect();
}

checkAsahiLine().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
