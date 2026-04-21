import { prisma } from "@/lib/prisma";

async function checkMyLineId() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "keisuke.nakamoto0410@gmail.com" },
        { name: { contains: "Keisuke", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      lineId: true,
      role: true,
    },
  });

  console.log("User found:");
  console.log(JSON.stringify(user, null, 2));

  await prisma.$disconnect();
}

checkMyLineId().catch(console.error);
