// Debug LINE notification issue
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

async function main() {
  console.log("🔍 LINE設定のデバッグ\n");

  // 1. Check environment variables
  console.log("=== 環境変数の確認 ===");
  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  console.log("LINE_CHANNEL_ID:", channelId || "❌ 未設定");
  console.log("LINE_CHANNEL_SECRET:", channelSecret ? "✅ 設定済み" : "❌ 未設定");
  console.log("LINE_CHANNEL_ACCESS_TOKEN:", channelAccessToken ? "✅ 設定済み" : "❌ 未設定");

  if (!channelAccessToken) {
    console.log("\n❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
    return;
  }

  // 2. Test LINE API with a simple bot info request
  console.log("\n=== LINE Bot情報の取得 ===");
  try {
    const botInfoResponse = await fetch("https://api.line.me/v2/bot/info", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${channelAccessToken}`,
      },
    });

    if (botInfoResponse.ok) {
      const botInfo = await botInfoResponse.json();
      console.log("✅ Bot情報の取得成功:");
      console.log("   Bot ID:", botInfo.userId);
      console.log("   Bot名:", botInfo.displayName);
      console.log("   Bot説明:", botInfo.statusMessage || "なし");
    } else {
      const errorData = await botInfoResponse.json().catch(() => ({}));
      console.log("❌ Bot情報の取得失敗:");
      console.log("   ステータス:", botInfoResponse.status);
      console.log("   エラー:", errorData);
    }
  } catch (error) {
    console.log("❌ Bot情報の取得でエラー:", error);
  }

  // 3. Get follower/friend count (if available)
  console.log("\n=== 友だち数の確認 ===");
  console.log("💡 LINE Developers Consoleで確認してください:");
  console.log("   https://developers.line.biz/console/channel/" + channelId + "/messaging-api");
  console.log("   「友だち」セクションで友だち数を確認");

  // 4. Check database for LINE IDs
  console.log("\n=== データベースのLINE ID確認 ===");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const usersWithLine = await prisma.user.findMany({
      where: {
        lineId: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        lineId: true,
        role: true,
      },
    });

    if (usersWithLine.length === 0) {
      console.log("❌ LINE IDが設定されているユーザーが見つかりません");
    } else {
      console.log(`✅ ${usersWithLine.length}人のユーザーにLINE IDが設定されています:`);
      usersWithLine.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.role})`);
        console.log(`   Email: ${user.email}`);
        console.log(`   LINE ID: ${user.lineId}`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.log("❌ データベースエラー:", error);
  }

  // 5. Test sending a message to the LINE ID in database
  console.log("\n=== テストメッセージ送信 ===");
  const { PrismaClient: PrismaClient2 } = await import("@prisma/client");
  const prisma2 = new PrismaClient2();

  try {
    const userWithLine = await prisma2.user.findFirst({
      where: {
        lineId: {
          not: null,
        },
      },
      select: {
        lineId: true,
        name: true,
      },
    });

    if (userWithLine && userWithLine.lineId) {
      console.log(`📤 ${userWithLine.name} さんのLINEにテストメッセージを送信します...`);
      console.log(`   LINE ID: ${userWithLine.lineId}`);

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
          to: userWithLine.lineId,
          messages: [
            {
              type: "text",
              text: "🧪 LINE通知テスト\n\nこのメッセージが届いていれば、LINE通知機能は正常に動作しています！",
            },
          ],
        }),
      });

      if (response.ok) {
        console.log("\n✅ テストメッセージの送信成功！");
        console.log("   LINEアプリでメッセージを確認してください。");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log("\n❌ テストメッセージの送信失敗:");
        console.log("   ステータス:", response.status);
        console.log("   エラー:", JSON.stringify(errorData, null, 2));

        if (response.status === 400) {
          console.log("\n💡 400エラーの原因:");
          console.log("   1. LINE公式アカウントを友だち追加していない");
          console.log("   2. 友だち追加したがブロックしている");
          console.log("   3. 異なるLINEアカウントで友だち追加している");
          console.log("   4. 間違ったチャンネルのQRコードを読み取っている");
        }
      }
    }

    await prisma2.$disconnect();
  } catch (error) {
    console.log("❌ テストメッセージ送信エラー:", error);
  }

  console.log("\n=== デバッグ完了 ===");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("エラー:", error);
    process.exit(1);
  });
