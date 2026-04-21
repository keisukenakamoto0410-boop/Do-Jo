import { sendLineBookingNotification } from "@/lib/line";

async function testAsahiNotification() {
  console.log("Testing LINE notification to Asahi (NEW LINE ID)...\n");

  const result = await sendLineBookingNotification({
    lineUserId: "Uf201e908360c1a5a6b8ecad8d461bd2f",
    hostName: "あさひ",
    learnerName: "Keisuke Nakamoto (テスト)",
    sessionDate: new Date("2026-04-13T05:00:00.000Z"),
    sessionUrl: "https://do-jo.vercel.app/senior/session/cmnqymz7r0001l204h303ko61",
    topic: "しんしw",
    words: ["我が"],
  });

  console.log("\nResult:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n✅ LINE notification sent successfully!");
    console.log("Please ask Asahi to check their LINE app.");
  } else {
    console.log("\n❌ LINE notification failed!");
    console.error("Error:", result.error);
  }
}

testAsahiNotification().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
