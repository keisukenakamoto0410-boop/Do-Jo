import { prisma } from "@/lib/prisma";

async function checkReservationDetails() {
  console.log("Checking reservation details...\n");

  const reservationId = "cmnqymz7r0001l204h303ko61";

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      slot: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          lineId: true,
          role: true,
        },
      },
      learner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!reservation) {
    console.log("❌ Reservation not found");
    await prisma.$disconnect();
    return;
  }

  console.log("✅ Reservation found:");
  console.log(JSON.stringify(reservation, null, 2));

  console.log("\n📋 Key details:");
  console.log("- Reservation ID:", reservation.id);
  console.log("- Created at:", reservation.createdAt);
  console.log("- Host name:", reservation.host.name);
  console.log("- Host LINE ID:", reservation.host.lineId);
  console.log("- Host role:", reservation.host.role);
  console.log("- Learner name:", reservation.learner.name);
  console.log("- Session date:", reservation.slot.startTime);
  console.log("- Selected topic:", reservation.selectedTopic);
  console.log("- Target words:", reservation.targetWords);

  await prisma.$disconnect();
}

checkReservationDetails().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
