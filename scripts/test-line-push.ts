// Simple LINE push notification test
import "dotenv/config";
import { sendLineBookingNotification } from "../lib/line";

async function main() {
  console.log("🧪 Testing LINE push notification...\n");

  const lineUserId = "Ud5e0232288d9f44462caf87d81f1c90f"; // 中元景介

  console.log(`📱 Sending test notification to: ${lineUserId}`);

  const result = await sendLineBookingNotification({
    lineUserId: lineUserId,
    hostName: "中元景介",
    learnerName: "テスト学習者",
    sessionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明日
    sessionUrl: "https://do-jo.vercel.app",
    topic: "病院・薬局",
    words: ["病院", "薬", "症状"],
  });

  if (result.success) {
    console.log("✅ LINE notification sent successfully!");
    console.log("   Check your LINE app.");
  } else {
    console.log("❌ Failed to send LINE notification:");
    console.log("   Error:", result.error);
  }
}

main().catch(console.error);
