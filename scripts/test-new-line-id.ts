// Test LINE push notification with new LINE ID
import "dotenv/config";
import { sendLineBookingNotification } from "../lib/line";

async function main() {
  console.log("🧪 Testing LINE push notification with NEW LINE ID...\n");

  const newLineUserId = "U722d7cebe77d4f83582aa103ff2e141d"; // 新しい中元景介 LINE ID

  console.log(`📱 Sending test notification to NEW LINE ID: ${newLineUserId}`);

  const result = await sendLineBookingNotification({
    lineUserId: newLineUserId,
    hostName: "中元景介",
    learnerName: "テスト学習者",
    sessionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明日
    sessionUrl: "https://do-jo.vercel.app",
    topic: "病院・薬局",
    words: ["病院", "薬", "症状"],
  });

  if (result.success) {
    console.log("\n✅ LINE notification sent successfully!");
    console.log("   Check your LINE app.");
    console.log("\n📝 If you received the notification, we should update the admin account's LINE ID.");
  } else {
    console.log("\n❌ Failed to send LINE notification:");
    console.log("   Error:", result.error);
  }
}

main().catch(console.error);
