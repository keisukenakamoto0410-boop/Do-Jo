// lib/line/handlers.ts
// LINE Webhook Event Handlers for Do Jo

import { replyMessage, getProfile } from "./messaging";
import { prisma } from "@/lib/prisma";
import {
  buildScheduleStatusMessage,
} from "./flex-templates";

// ==============================
// follow: Friend added -> Auto-register with LINE profile
// ==============================
export async function handleFollow(event: {
  source: { userId: string };
  replyToken: string;
}) {
  const lineId = event.source.userId;

  // Check if user already exists with this LINE ID
  const existingUser = await prisma.user.findUnique({
    where: { lineId },
  });

  if (existingUser) {
    // Returning user
    await replyMessage(event.replyToken, {
      type: "text",
      text: `${existingUser.name}さん、おかえりなさい！\n\nスケジュールの確認はメニューの「スケジュール」から、登録はWebアプリから行えます。\n\nhttps://do-jo.vercel.app`,
    });
    return;
  }

  // Fetch LINE profile to get display name and picture
  const profile = await getProfile(lineId);
  const displayName = profile?.displayName || "Do Joユーザー";
  const pictureUrl = profile?.pictureUrl || null;

  // Check if there's an existing user with the same name (potential duplicate)
  const existingUserByName = await prisma.user.findFirst({
    where: {
      name: displayName,
      lineId: null, // Only check users without LINE ID (Web registered users)
    },
  });

  if (existingUserByName) {
    // Found a potential duplicate - ask for confirmation
    // Create a temporary user with pending merge status
    const placeholderEmail = `${lineId}@line.local`;
    const avatarPath = pictureUrl || "https://do-jo.vercel.app/avatars/n_60s.png";

    await prisma.user.create({
      data: {
        lineId,
        email: placeholderEmail,
        name: displayName,
        avatar: avatarPath,
        role: "senior",
        registrationStep: "AWAITING_MERGE_CONFIRMATION",
        prefecture: "豊橋市",
        termsAccepted: false,
        lastLoginAt: new Date(),
      },
    });

    // Send confirmation message
    await replyMessage(event.replyToken, {
      type: "text",
      text: `${displayName}さん、Do Joへようこそ！\n\n「${displayName}」という既存アカウントが見つかりました。\n\nこのアカウントとLINEを統合しますか？\n\n1️⃣ はい、統合する\n2️⃣ いいえ、新しいアカウントを作成\n\n番号を送信してください。`,
    });
  } else {
    // No duplicate found - create new user directly
    const placeholderEmail = `${lineId}@line.local`;
    const avatarPath = pictureUrl || "https://do-jo.vercel.app/avatars/n_60s.png";

    await prisma.user.create({
      data: {
        lineId,
        email: placeholderEmail,
        name: displayName,
        avatar: avatarPath,
        role: "senior",
        registrationStep: "COMPLETED",
        prefecture: "豊橋市",
        termsAccepted: false,
        lastLoginAt: new Date(),
      },
    });

    // Send welcome message
    await replyMessage(event.replyToken, {
      type: "text",
      text: `${displayName}さん、Do Joへようこそ！\n\n日本語を学ぶ外国人の方と会話するボランティアプラットフォームです。\n\nまずはWebアプリでスケジュールを登録しましょう：\nhttps://do-jo.vercel.app/senior/schedule/create`,
    });
  }
}

// ==============================
// message: Text received -> Name input, etc.
// ==============================
export async function handleMessage(event: {
  source: { userId: string };
  replyToken: string;
  message: { text: string };
}) {
  const lineId = event.source.userId;
  const text = event.message.text.trim();

  const user = await prisma.user.findUnique({
    where: { lineId },
  });

  if (!user) {
    await replyMessage(event.replyToken, {
      type: "text",
      text: "まずはDo Joと友だちになってください！",
    });
    return;
  }

  // Handle account merge confirmation
  if (user.registrationStep === "AWAITING_MERGE_CONFIRMATION") {
    if (text === "1" || text === "１") {
      // User wants to merge accounts
      // Find the existing account with the same name
      const existingUser = await prisma.user.findFirst({
        where: {
          name: user.name,
          lineId: null,
          id: { not: user.id }, // Exclude current LINE user
        },
      });

      if (existingUser) {
        // Merge: Update existing account with LINE ID
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            lineId: user.lineId,
            avatar: user.avatar || existingUser.avatar,
            lastLoginAt: new Date(),
            registrationStep: "COMPLETED",
          },
        });

        // Delete the temporary LINE user
        await prisma.user.delete({
          where: { id: user.id },
        });

        await replyMessage(event.replyToken, {
          type: "text",
          text: `✅ アカウントを統合しました！\n\n既存のアカウントにLINEが紐付けられました。\n\nWebアプリはこちら：\nhttps://do-jo.vercel.app/senior/dashboard`,
        });
      } else {
        // Existing user not found anymore, just complete registration
        await prisma.user.update({
          where: { id: user.id },
          data: { registrationStep: "COMPLETED" },
        });

        await replyMessage(event.replyToken, {
          type: "text",
          text: `✅ 登録完了！\n\nWebアプリでスケジュールを登録しましょう：\nhttps://do-jo.vercel.app/senior/schedule/create`,
        });
      }
    } else if (text === "2" || text === "２") {
      // User wants a new account
      await prisma.user.update({
        where: { id: user.id },
        data: { registrationStep: "COMPLETED" },
      });

      await replyMessage(event.replyToken, {
        type: "text",
        text: `✅ 新しいアカウントを作成しました！\n\nWebアプリでスケジュールを登録しましょう：\nhttps://do-jo.vercel.app/senior/schedule/create`,
      });
    } else {
      // Invalid input
      await replyMessage(event.replyToken, {
        type: "text",
        text: `既存アカウントとLINEを統合しますか？\n\n1️⃣ はい、統合する\n2️⃣ いいえ、新しいアカウントを作成\n\n「1」または「2」を送信してください。`,
      });
    }
    return;
  }

  // All users are auto-registered, so handle all text messages as rich menu actions
  await handleRichMenuText(event.replyToken, user.id, user.name, text);
}

// ==============================
// postback: Button tap -> Route to handler
// ==============================
export async function handlePostback(event: {
  source: { userId: string };
  replyToken: string;
  postback: { data: string };
}) {
  const lineId = event.source.userId;
  const data = new URLSearchParams(event.postback.data);
  const action = data.get("action");

  const user = await prisma.user.findUnique({
    where: { lineId },
  });

  if (!user) {
    await replyMessage(event.replyToken, {
      type: "text",
      text: "ユーザー情報が見つかりません。もう一度友だち追加をお試しください。",
    });
    return;
  }

  switch (action) {
    // --- View Reservations ---
    case "view_reservations":
      await handleViewReservations(event, user);
      break;

    default:
      await replyMessage(event.replyToken, {
        type: "text",
        text: "Webアプリをご利用ください：\nhttps://do-jo.vercel.app",
      });
  }
}

// --- Handler Functions ---

async function handleViewReservations(
  event: { replyToken: string },
  user: { id: string; lineId: string | null; name: string }
) {
  const reservations = await prisma.reservation.findMany({
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
    take: 5,
  });

  if (reservations.length === 0) {
    try {
      await replyMessage(event.replyToken, {
        type: "text",
        text: "現在、予約はありません。\n\nWebアプリでスケジュールを登録しましょう：\nhttps://do-jo.vercel.app/senior/schedule/create",
      });
    } catch (error) {
      console.error("[LINE] Failed to reply in handleViewReservations:", error);
    }
    return;
  }

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]}) ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const reservationList = reservations
    .map((r) => `📌 ${formatDate(r.slot.startTime)} - ${r.learner.name}さん`)
    .join("\n");

  try {
    await replyMessage(event.replyToken, {
      type: "text",
      text: `📋 直近の予約\n\n${reservationList}`,
    });
  } catch (error) {
    console.error("[LINE] Failed to reply in handleViewReservations:", error);
  }
}

/**
 * Handle rich menu text messages
 */
async function handleRichMenuText(
  replyToken: string,
  userId: string,
  userName: string,
  text: string
) {
  try {
    switch (text) {
      case "スケジュール": {
        // Fetch available slots
        const availableSlots = await prisma.slot.findMany({
          where: {
            hostId: userId,
            status: "available",
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 10,
        });

        // Fetch booked reservations
        const bookedReservations = await prisma.reservation.findMany({
          where: {
            hostId: userId,
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
        });

        const bookedSlots = bookedReservations.map((r) => ({
          startTime: r.slot.startTime,
          learnerName: r.learner.name,
          topic: r.selectedTopic,
        }));

        // Show current schedule and guide to web app for creating new slots
        await replyMessage(
          replyToken,
          buildScheduleStatusMessage({
            availableSlots,
            bookedSlots,
            showWebAppLink: true
          })
        );
        break;
      }

      case "プロフィール": {
        await replyMessage(replyToken, {
          type: "text",
          text: "プロフィールの確認・編集はWebアプリから行えます。\nhttps://do-jo.vercel.app/senior/dashboard",
        });
        break;
      }

      case "使い方":
        await replyMessage(replyToken, {
          type: "text",
          text: "【Do Joの使い方】\n\n1. 「スケジュール」から空き時間を確認\n2. Webアプリでスケジュールを登録\n3. 学習者からの予約を待つ\n4. 予約が入ったらLINEでお知らせ\n\n詳しくはWebアプリをご確認ください。\nhttps://do-jo.vercel.app",
        });
        break;

      case "メニュー":
      case "menu":
        await replyMessage(replyToken, {
          type: "text",
          text: `${userName}さん、こんにちは！\n\nメニューから「スケジュール」を選んで現在の予定を確認できます。\n\n新しいスケジュールの登録はWebアプリから：\nhttps://do-jo.vercel.app/senior/schedule/create`,
        });
        break;

      default:
        // Any other text is treated as inquiry/feedback
        await replyMessage(replyToken, {
          type: "text",
          text: "メッセージを受け付けました。\n\nスケジュールの確認・登録はWebアプリから：\nhttps://do-jo.vercel.app",
        });
    }
  } catch (error) {
    console.error("[LINE] Failed to handle rich menu text:", error);
  }
}
