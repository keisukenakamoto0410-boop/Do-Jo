import { sendLineBookingNotification } from "@/lib/line";

async function sendTestNotification() {
  console.log("Sending test notification to Asahi...\n");

  const testDate = new Date("2026-04-13T05:00:00.000Z"); // 2026-04-13 14:00 JST

  const result = await sendLineBookingNotification({
    lineUserId: "U54c120927f04b7c2987376f0d5fdccd0",
    hostName: "あさひ",
    learnerName: "Keisuke Nakamoto",
    sessionDate: testDate,
    sessionUrl: "https://do-jo.vercel.app/senior/session/cmnqymz7r0001l204h303ko61",
    topic: "しんしw",
    words: ["我が"],
  });

  console.log("\nResult:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n✅ Test notification sent successfully!");
    console.log("Please check Asahi's LINE to see if the message was received.");
  } else {
    console.log("\n❌ Test notification failed!");
    console.error("Error:", result.error);
  }
}

sendTestNotification().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
