import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  handleFollow,
  handleMessage,
  handlePostback,
} from "@/lib/line/handlers";
import { replyMessage } from "@/lib/line/messaging";
import { buildStatusMessage } from "@/lib/line/flex-templates";

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

// LINE署名検証
function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") || "";

  // 署名検証
  if (!verifySignature(body, signature)) {
    console.error("[LINE Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(body);
  console.log("[LINE Webhook] Received events:", data.events?.length || 0);

  // イベントを並列処理（各イベントは独立して処理）
  const eventPromises = (data.events || []).map(async (event: LineEvent) => {
    const lineUserId = event.source?.userId;
    if (!lineUserId) return;

    console.log("[LINE Webhook] Event type:", event.type, "User:", lineUserId);

    try {
      switch (event.type) {
        case "follow":
          await handleFollow(event);
          break;

        case "postback":
          await handlePostback(event);
          break;

        case "message":
          if (event.message?.type === "text") {
            const handled = await handleLegacyEmailLinking(event);
            if (!handled) {
              await handleMessage(event);
            }
          }
          break;

        case "unfollow":
          console.log("[LINE Webhook] User unfollowed:", lineUserId);
          break;
      }
    } catch (eventError) {
      console.error("[LINE Webhook] Event processing error:", eventError);
    }
  });

  // 全イベントを並列処理（LINEには即座にレスポンスを返す必要があるが、
  // replyTokenの有効期限内に処理を完了する必要がある）
  await Promise.allSettled(eventPromises);

  return NextResponse.json({ success: true });
}

// LINE Developers ConsoleからのWebhook URL検証用
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

// ============================================
// Types
// ============================================

interface LineEvent {
  type: string;
  source?: { userId: string };
  replyToken?: string;
  message?: { type: string; text?: string };
  postback?: { data: string };
}

// ============================================
// Legacy Email Linking Handler
// 既存のメール連携機能を維持（学習者向け）
// ============================================

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

async function replyMessageLegacy(replyToken: string, message: string) {
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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Handle legacy email-based linking for existing users (learners)
 * Returns true if the message was handled by this function
 */
async function handleLegacyEmailLinking(event: {
  source: { userId: string };
  replyToken: string;
  message: { text: string };
}): Promise<boolean> {
  const lineUserId = event.source.userId;
  const messageText = event.message.text.trim();
  const replyToken = event.replyToken;

  // Check if user is in LINE registration flow (senior volunteer)
  const registrationUser = await prisma.user.findUnique({
    where: { lineId: lineUserId },
    select: { registrationStep: true },
  });

  // If user is in registration flow, let the new handlers handle it
  if (
    registrationUser?.registrationStep &&
    registrationUser.registrationStep !== "COMPLETED"
  ) {
    return false;
  }

  // Handle email-based linking for existing users
  if (isValidEmail(messageText)) {
    const email = messageText.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, lineId: true },
    });

    if (!user) {
      await replyMessageLegacy(
        replyToken,
        `このメールアドレスで登録されたアカウントが見つかりませんでした。\n\nDo Joに登録したメールアドレスを入力してください。\n\n登録がまだの方は先にアプリで登録してください:\nhttps://do-jo.vercel.app/login`
      );
    } else if (user.lineId === lineUserId) {
      await replyMessageLegacy(
        replyToken,
        `${user.name}さん、このアカウントは既にLINEと連携されています！\n\n予約が入った時にLINEでお知らせします。`
      );
    } else if (user.lineId && user.lineId !== lineUserId) {
      await replyMessageLegacy(
        replyToken,
        `このメールアドレスは既に別のLINEアカウントと連携されています。\n\n連携を変更したい場合はサポートまでご連絡ください。`
      );
    } else {
      // Update in parallel with reply
      const updatePromise = prisma.user.update({
        where: { id: user.id },
        data: { lineId: lineUserId },
      });

      await Promise.all([
        replyMessageLegacy(
          replyToken,
          `${user.name}さん、LINE連携が完了しました！\n\n今後、予約が入った時やセッションのリマインダーをLINEでお知らせします。`
        ),
        updatePromise,
      ]);

      console.log(
        "[LINE Webhook] Linked user:",
        user.email,
        "to LINE:",
        lineUserId
      );
    }
    return true;
  }

  // Handle special commands
  if (messageText === "解除" || messageText === "連携解除") {
    const user = await prisma.user.findFirst({
      where: { lineId: lineUserId },
      select: { id: true, name: true },
    });

    if (user) {
      // Update in parallel with reply
      const updatePromise = prisma.user.update({
        where: { id: user.id },
        data: { lineId: null },
      });

      await Promise.all([
        replyMessageLegacy(
          replyToken,
          `${user.name}さん、LINE連携を解除しました。\n\n再度連携する場合は、登録したメールアドレスを送ってください。`
        ),
        updatePromise,
      ]);
    } else {
      await replyMessageLegacy(
        replyToken,
        `現在、連携されているアカウントはありません。`
      );
    }
    return true;
  }

  if (messageText === "確認" || messageText === "ステータス") {
    const user = await prisma.user.findFirst({
      where: { lineId: lineUserId },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      // Fetch slots and reservations in parallel
      const [availableSlots, bookedReservations] = await Promise.all([
        prisma.slot.findMany({
          where: {
            hostId: user.id,
            status: "available",
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 10,
        }),
        prisma.reservation.findMany({
          where: {
            hostId: user.id,
            status: { in: ["pending", "active"] },
            slot: {
              startTime: { gte: new Date() },
            },
          },
          include: {
            slot: true,
            learner: { select: { name: true } },
          },
          orderBy: { slot: { startTime: "asc" } },
          take: 10,
        }),
      ]);

      const bookedSlots = bookedReservations.map((r) => ({
        startTime: r.slot.startTime,
        learnerName: r.learner.name,
        topic: r.selectedTopic,
      }));

      try {
        await replyMessage(
          replyToken,
          buildStatusMessage({
            userName: user.name,
            userEmail: user.email,
            availableSlots,
            bookedSlots,
          })
        );
      } catch (error) {
        console.error("[LINE Webhook] Failed to send status message:", error);
      }
    } else {
      await replyMessageLegacy(
        replyToken,
        `連携状態: 未連携\n\nDo Joに登録したメールアドレスを送ると、LINE通知が届くようになります。`
      );
    }
    return true;
  }

  // Not handled by legacy system
  return false;
}
