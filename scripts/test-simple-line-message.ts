import { sendLinePushMessage } from "@/lib/line";

async function testSimpleMessage() {
  console.log("Testing simple LINE message to Asahi...\n");

  const result = await sendLinePushMessage(
    "U54c120927f04b7c2987376f0d5fdccd0",
    "テストメッセージです。予約通知のテストを行っています。"
  );

  console.log("\nResult:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n✅ Simple message sent successfully!");
  } else {
    console.log("\n❌ Simple message failed!");
    console.error("Error:", result.error);
  }
}

testSimpleMessage().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
