async function testLineProfile() {
  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineUserId = "U54c120927f04b7c2987376f0d5fdccd0";

  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN not set");
    return;
  }

  console.log("Testing LINE profile fetch for:", lineUserId);
  console.log("Using token:", LINE_CHANNEL_ACCESS_TOKEN.substring(0, 20) + "...\n");

  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineUserId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("\n❌ Failed to fetch profile");
      console.error("Error response:", errorText);
      return;
    }

    const profile = await response.json();
    console.log("\n✅ Profile fetched successfully:");
    console.log(JSON.stringify(profile, null, 2));
  } catch (error) {
    console.error("\n❌ Exception:", error);
  }
}

testLineProfile();
