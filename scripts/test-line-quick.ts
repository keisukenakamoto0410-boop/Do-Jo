// Quick test to verify LINE notification works
import { config } from "dotenv";
import { sendLineBookingNotification } from "../lib/line";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function main() {
  console.log("🧪 Quick LINE API test...\n");

  // Use the actual LINE ID from the database
  const lineUserId = "Ud5e0232288d9f44462caf87d81f1c90f";

  console.log("📤 Sending test notification to LINE ID:", lineUserId);
  console.log("   (This is your actual LINE account)\n");

  const result = await sendLineBookingNotification({
    lineUserId: lineUserId,
    hostName: "中元　景介",
    learnerName: "Rajesh Kumar (Test)",
    sessionDate: new Date(Date.now() + 30 * 60 * 1000), // 30分後
    sessionUrl: "https://do-jo.vercel.app/senior/dashboard",
    topic: "Shopping & Money",
    words: ["買う", "高い", "安い"],
  });

  console.log("\n=== 結果 ===");
  if (result.success) {
    console.log("✅ LINE通知の送信に成功しました！");
    console.log("   LINEアプリで通知を確認してください。");
  } else {
    console.log("❌ LINE通知の送信に失敗しました");
    console.log("   エラー:", result.error);
  }
}

main()
  .then(() => {
    console.log("\n✅ テスト完了");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ エラー:", error);
    process.exit(1);
  });
