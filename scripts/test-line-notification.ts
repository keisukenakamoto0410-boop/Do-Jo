// Test script for LINE notification
// Creates a test reservation and triggers LINE notification

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Starting LINE notification test...\n");

  // 1. Create test senior (Japanese host) with LINE ID
  const seniorPassword = await bcrypt.hash("test123", 10);

  console.log("📝 Step 1: Creating test senior user...");
  const senior = await prisma.user.upsert({
    where: { email: "test-senior@dojo.com" },
    update: {},
    create: {
      email: "test-senior@dojo.com",
      password: seniorPassword,
      name: "テスト太郎",
      role: "senior",
      // TODO: Replace with your actual LINE User ID
      lineId: "YOUR_LINE_USER_ID_HERE", // ← これを実際のLINE IDに置き換えてください
      bio: "テスト用のシニアアカウントです",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Senior created:", senior.email, "LINE ID:", senior.lineId);

  // 2. Create test learner
  console.log("\n📝 Step 2: Creating test learner...");
  const learnerPassword = await bcrypt.hash("test123", 10);
  const learner = await prisma.user.upsert({
    where: { email: "test-learner@dojo.com" },
    update: {},
    create: {
      email: "test-learner@dojo.com",
      password: learnerPassword,
      name: "Test Student",
      role: "learner",
      country: "Test Country",
      nativeLanguage: "English",
      jlptLevel: "N3",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Learner created:", learner.email);

  // 3. Create a slot (30 minutes from now)
  console.log("\n📝 Step 3: Creating test slot...");
  const now = new Date();
  const slotStart = new Date(now.getTime() + 30 * 60 * 1000); // 30分後
  const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // さらに30分後

  const slot = await prisma.slot.create({
    data: {
      hostId: senior.id,
      sessionType: "both",
      startTime: slotStart,
      endTime: slotEnd,
      status: "available",
    },
  });
  console.log("✅ Slot created:", slotStart.toISOString());

  // 4. Create reservation (this should trigger LINE notification)
  console.log("\n📝 Step 4: Creating reservation (this will trigger LINE notification)...");

  // First update slot status
  await prisma.slot.update({
    where: { id: slot.id },
    data: { status: "reserved" },
  });

  const reservation = await prisma.reservation.create({
    data: {
      slotId: slot.id,
      learnerId: learner.id,
      hostId: senior.id,
      sessionType: "both",
      status: "confirmed",
      selectedTopic: "Hospital & Pharmacy",
      targetWords: ["病院", "薬", "症状"],
    },
    include: {
      host: true,
      learner: true,
      slot: true,
    },
  });
  console.log("✅ Reservation created:", reservation.id);

  // 5. Manually trigger LINE notification
  console.log("\n📝 Step 5: Sending LINE notification...");

  if (!senior.lineId || senior.lineId === "YOUR_LINE_USER_ID_HERE") {
    console.log("❌ ERROR: Please set your actual LINE User ID in the script!");
    console.log("   Update the 'lineId' field in the senior user creation.");
    console.log("\n💡 To get your LINE User ID:");
    console.log("   1. Login to https://do-jo.vercel.app with LINE");
    console.log("   2. Check the database for your lineId");
    console.log("   3. Update this script with your lineId");
  } else {
    // Import and call the LINE notification function
    const { sendLineBookingNotification } = await import("../lib/line");

    const result = await sendLineBookingNotification({
      lineUserId: senior.lineId,
      hostName: senior.name,
      learnerName: learner.name,
      sessionDate: slotStart,
      sessionUrl: `https://do-jo.vercel.app/senior/session/${reservation.id}`,
      topic: reservation.selectedTopic || undefined,
      words: reservation.targetWords || [],
    });

    if (result.success) {
      console.log("✅ LINE notification sent successfully!");
      console.log("   Check your LINE app for the notification.");
    } else {
      console.log("❌ Failed to send LINE notification:", result.error);
    }
  }

  console.log("\n✅ Test completed!");
  console.log("\nTest accounts created:");
  console.log("  Senior: test-senior@dojo.com / test123");
  console.log("  Learner: test-learner@dojo.com / test123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("❌ Error:", error);
    prisma.$disconnect();
    process.exit(1);
  });
