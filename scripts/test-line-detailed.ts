// Detailed LINE API test
import "dotenv/config";

async function main() {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const testUserId = "Ud5e0232288d9f44462caf87d81f1c90f"; // 中元景介

  console.log("🧪 Testing LINE API...\n");
  console.log("Access Token:", accessToken?.substring(0, 20) + "...");
  console.log("Test User ID:", testUserId);
  console.log("");

  if (!accessToken) {
    console.log("❌ LINE_CHANNEL_ACCESS_TOKEN not found");
    return;
  }

  // Test 1: Get bot info
  console.log("📋 Test 1: Getting bot info...");
  try {
    const botInfoResponse = await fetch("https://api.line.me/v2/bot/info", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (botInfoResponse.ok) {
      const botInfo = await botInfoResponse.json();
      console.log("✅ Bot info:", JSON.stringify(botInfo, null, 2));
    } else {
      const error = await botInfoResponse.json();
      console.log("❌ Bot info failed:", botInfoResponse.status, error);
    }
  } catch (error) {
    console.log("❌ Bot info error:", error);
  }

  console.log("");

  // Test 2: Send simple text message
  console.log("📨 Test 2: Sending simple text message...");
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: testUserId,
        messages: [
          {
            type: "text",
            text: "テスト通知です",
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("✅ Message sent successfully!");
    } else {
      const error = await response.json();
      console.log("❌ Message failed:", response.status, JSON.stringify(error, null, 2));

      if (response.status === 400) {
        console.log("\n💡 Possible causes:");
        console.log("   1. User has not added this LINE bot as a friend");
        console.log("   2. User ID is incorrect");
        console.log("   3. LINE bot settings have issues");
      }
    }
  } catch (error) {
    console.log("❌ Send error:", error);
  }
}

main().catch(console.error);
