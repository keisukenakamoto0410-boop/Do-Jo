// Simple LINE text message test
import "dotenv/config";

async function main() {
  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineUserId = "Ud5e0232288d9f44462caf87d81f1c90f"; // 中元景介

  console.log("🧪 Testing simple LINE text message...\n");
  console.log("LINE_CHANNEL_ACCESS_TOKEN:", LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 20) + "...");
  console.log("Target LINE User ID:", lineUserId);
  console.log();

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: "text",
            text: "テストメッセージ：Do Joからの通知テストです。",
          },
        ],
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response statusText:", response.statusText);

    const responseText = await response.text();
    console.log("Response body:", responseText);

    if (response.ok) {
      console.log("\n✅ Message sent successfully!");
    } else {
      console.log("\n❌ Failed to send message");
      // Try to parse as JSON for more details
      try {
        const errorData = JSON.parse(responseText);
        console.log("Error details:", JSON.stringify(errorData, null, 2));
      } catch (e) {
        // Response is not JSON
      }
    }
  } catch (error) {
    console.error("❌ Exception occurred:", error);
  }
}

main().catch(console.error);
