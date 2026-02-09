import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

// LINE署名検証
function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// LINEにメッセージを返信
async function replyMessage(replyToken: string, message: string) {
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("[LINE Webhook] Reply failed:", response.status, error);
    }
  } catch (error) {
    console.error("[LINE Webhook] Reply error:", error);
  }
}

// メールアドレスの形式チェック
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // 署名検証
    if (!verifySignature(body, signature)) {
      console.error("[LINE Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);
    console.log("[LINE Webhook] Received:", JSON.stringify(data, null, 2));

    // イベント処理
    for (const event of data.events || []) {
      if (event.type === "message" && event.message.type === "text") {
        const lineUserId = event.source.userId;
        const messageText = event.message.text.trim();
        const replyToken = event.replyToken;

        console.log("[LINE Webhook] Message from:", lineUserId, "Text:", messageText);

        // メールアドレスかどうか判定
        if (isValidEmail(messageText)) {
          const email = messageText.toLowerCase();

          // DBでユーザーを検索
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, lineId: true },
          });

          if (!user) {
            // ユーザーが見つからない
            await replyMessage(
              replyToken,
              `このメールアドレスで登録されたアカウントが見つかりませんでした。\n\nDo Joに登録したメールアドレスを入力してください。\n\n登録がまだの方は先にアプリで登録してください:\nhttps://do-jo.vercel.app/login`
            );
          } else if (user.lineId === lineUserId) {
            // 既に連携済み
            await replyMessage(
              replyToken,
              `${user.name}さん、このアカウントは既にLINEと連携されています！\n\n予約が入った時にLINEでお知らせします。`
            );
          } else if (user.lineId && user.lineId !== lineUserId) {
            // 別のLINEアカウントと連携済み
            await replyMessage(
              replyToken,
              `このメールアドレスは既に別のLINEアカウントと連携されています。\n\n連携を変更したい場合はサポートまでご連絡ください。`
            );
          } else {
            // LINE IDを紐付け
            await prisma.user.update({
              where: { id: user.id },
              data: { lineId: lineUserId },
            });

            console.log("[LINE Webhook] Linked user:", user.email, "to LINE:", lineUserId);

            await replyMessage(
              replyToken,
              `${user.name}さん、LINE連携が完了しました！\n\n今後、予約が入った時やセッションのリマインダーをLINEでお知らせします。`
            );
          }
        } else if (messageText === "解除" || messageText === "連携解除") {
          // 連携解除
          const user = await prisma.user.findFirst({
            where: { lineId: lineUserId },
            select: { id: true, name: true },
          });

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { lineId: null },
            });

            await replyMessage(
              replyToken,
              `${user.name}さん、LINE連携を解除しました。\n\n再度連携する場合は、登録したメールアドレスを送ってください。`
            );
          } else {
            await replyMessage(
              replyToken,
              `現在、連携されているアカウントはありません。`
            );
          }
        } else if (messageText === "確認" || messageText === "ステータス") {
          // 連携状態確認
          const user = await prisma.user.findFirst({
            where: { lineId: lineUserId },
            select: { name: true, email: true },
          });

          if (user) {
            await replyMessage(
              replyToken,
              `連携状態: 連携済み\n\n名前: ${user.name}\nメール: ${user.email}\n\n連携を解除する場合は「解除」と送ってください。`
            );
          } else {
            await replyMessage(
              replyToken,
              `連携状態: 未連携\n\nDo Joに登録したメールアドレスを送ると、LINE通知が届くようになります。`
            );
          }
        } else {
          // ヘルプメッセージ
          await replyMessage(
            replyToken,
            `Do Jo LINE通知サービスです。\n\n【使い方】\n・Do Joに登録したメールアドレスを送る → LINE連携\n・「確認」と送る → 連携状態を確認\n・「解除」と送る → 連携を解除\n\n連携すると、予約通知やリマインダーがLINEに届きます。`
          );
        }
      } else if (event.type === "follow") {
        // 友だち追加時
        const lineUserId = event.source.userId;
        const replyToken = event.replyToken;

        console.log("[LINE Webhook] New follower:", lineUserId);

        // 既に連携されているか確認
        const existingUser = await prisma.user.findFirst({
          where: { lineId: lineUserId },
          select: { name: true },
        });

        if (existingUser) {
          await replyMessage(
            replyToken,
            `${existingUser.name}さん、おかえりなさい！\n\nLINE連携は有効です。予約が入った時にお知らせします。`
          );
        } else {
          await replyMessage(
            replyToken,
            `Do Joへようこそ！\n\nLINE通知を受け取るには、Do Joに登録したメールアドレスをこちらに送ってください。\n\n例: example@gmail.com\n\nまだ登録していない方はこちらから:\nhttps://do-jo.vercel.app/login`
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LINE Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// LINE Developers ConsoleからのWebhook URL検証用
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
