import { sendLineBookingNotification } from "@/lib/line";

async function testAsahiLineNotification() {
  console.log("Testing LINE notification to Asahi...\n");

  const result = await sendLineBookingNotification({
    lineUserId: "U54c120927f04b7c2987376f0d5fdccd0",
    hostName: "あさひ",
    learnerName: "Keisuke Nakamoto (テスト)",
    sessionDate: new Date("2026-04-13T05:00:00.000Z"),
    sessionUrl: "https://do-jo.vercel.app/senior/session/test",
    topic: "テスト通知",
    words: ["テスト"],
  });

  console.log("\nResult:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n✅ LINE notification sent successfully!");
  } else {
    console.log("\n❌ LINE notification failed!");
    console.error("Error:", result.error);
  }
}

testAsahiLineNotification().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
