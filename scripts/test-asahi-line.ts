// Test LINE notification for あさひ
import "dotenv/config";

async function testLineNotification(lineUserId: string, userName: string) {
  console.log(`\n📱 Testing notification for ${userName} (${lineUserId})`);

  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    console.log("❌ LINE_CHANNEL_ACCESS_TOKEN not found");
    return false;
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: "text",
            text: `${userName}さん、こんにちは！\n\nDo Joからのテスト通知です 🎉`,
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("✅ Message sent successfully!");
      return true;
    } else {
      const error = await response.json();
      console.log("❌ Message failed:", response.status, JSON.stringify(error, null, 2));
      return false;
    }
  } catch (error) {
    console.log("❌ Send error:", error);
    return false;
  }
}

async function main() {
  console.log("🧪 Testing LINE notifications for あさひ accounts...");

  // Test both あさひ accounts
  const account1 = await testLineNotification(
    "U54c120927f04b7c2987376f0d5fdccd0",
    "あさひ (Account 1)"
  );

  const account2 = await testLineNotification(
    "Uf201e908360c1a5a6b8ecad8d461bd2f",
    "あさひ (Account 2)"
  );

  console.log("\n📊 Results:");
  console.log(`Account 1 (U54c1...): ${account1 ? "✅ Success" : "❌ Failed"}`);
  console.log(`Account 2 (Uf201...): ${account2 ? "✅ Success" : "❌ Failed"}`);

  if (account1 || account2) {
    console.log("\n🎉 At least one account received the notification!");
    console.log("Check the LINE app to confirm.");
  } else {
    console.log("\n❌ Both accounts failed. The users may not have added this LINE bot as a friend.");
  }
}

main().catch(console.error);
