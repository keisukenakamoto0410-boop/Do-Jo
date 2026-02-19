// lib/line/handlers.ts
// LINE Webhook Event Handlers for Do Jo

import { replyMessage } from "./messaging";
import { prisma } from "@/lib/prisma";
import {
  buildWelcomeMessage,
  buildAreaSelectMessage,
  buildDaySelectMessage,
  buildTimeSelectMessage,
  buildScheduleConfirmMessage,
  buildMainMenuMessage,
} from "./flex-templates";

// ==============================
// follow: Friend added -> Start registration
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
      text: `おかえりなさい、${existingUser.name}さん！\n下のメニューから操作できます。`,
    });
    return;
  }

  // Create new user for LINE registration flow
  // Generate a unique placeholder email since email is required and unique
  const placeholderEmail = `line_${lineId}_${Date.now()}@line.local`;

  await prisma.user.create({
    data: {
      lineId,
      email: placeholderEmail,
      name: "LINE登録中",
      role: "senior", // Japanese volunteer
      registrationStep: "AWAITING_NAME",
    },
  });

  await replyMessage(event.replyToken, buildWelcomeMessage());
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

  switch (user.registrationStep) {
    case "AWAITING_NAME":
      // Save name and proceed to area selection
      await prisma.user.update({
        where: { lineId },
        data: { name: text, registrationStep: "AWAITING_AREA" },
      });
      await replyMessage(event.replyToken, buildAreaSelectMessage(text));
      break;

    case "COMPLETED":
    case null:
      // Registered user sending text -> show menu
      if (text === "メニュー" || text === "menu") {
        await replyMessage(event.replyToken, buildMainMenuMessage(user.name));
      } else {
        await replyMessage(event.replyToken, {
          type: "text",
          text: "「メニュー」と送ると操作メニューが表示されます！",
        });
      }
      break;

    default:
      await replyMessage(event.replyToken, {
        type: "text",
        text: "登録を続けるには、ボタンをタップしてください。",
      });
  }
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
    // --- Registration Flow ---
    case "select_area":
      await handleSelectArea(event, user, data);
      break;

    // --- Schedule Registration: Day Selection ---
    case "toggle_day":
      await handleToggleDay(event, user, data);
      break;

    case "confirm_days":
      await handleConfirmDays(event, user);
      break;

    case "start_schedule":
      await handleStartSchedule(event, user);
      break;

    // --- Schedule Registration: Time Selection ---
    case "select_time":
      await handleSelectTime(event, user, data);
      break;

    // --- View Reservations ---
    case "view_reservations":
      await handleViewReservations(event, user);
      break;

    default:
      await replyMessage(event.replyToken, {
        type: "text",
        text: "不明な操作です。メニューからお選びください。",
      });
  }
}

// --- Handler Functions ---

async function handleSelectArea(
  event: { replyToken: string },
  user: { id: string; lineId: string | null; name: string },
  data: URLSearchParams
) {
  const area = data.get("area");

  await prisma.user.update({
    where: { id: user.id },
    data: { prefecture: area, registrationStep: "COMPLETED" },
  });

  try {
    await replyMessage(event.replyToken, [
      { type: "text", text: `${user.name}さん、登録が完了しました！` },
      { type: "text", text: "早速スケジュールを登録しましょう！" },
      buildDaySelectMessage(),
    ]);
  } catch (error) {
    console.error("[LINE] Failed to reply in handleSelectArea:", error);
  }
}

async function handleStartSchedule(
  event: { replyToken: string },
  user: { id: string; lineId: string | null }
) {
  // Clear any previous selection state
  await prisma.user.update({
    where: { id: user.id },
    data: { selectedDays: null, scheduleStep: null },
  });

  try {
    await replyMessage(event.replyToken, buildDaySelectMessage());
  } catch (error) {
    console.error("[LINE] Failed to reply in handleStartSchedule:", error);
  }
}

async function handleToggleDay(
  event: { replyToken: string },
  user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const day = data.get("day");
  if (!day) return;

  // Use transaction to prevent race condition from button spam
  const updatedUser = await prisma.$transaction(async (tx) => {
    // Re-fetch latest data from DB
    const latestUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { selectedDays: true },
    });

    const currentDays: string[] = latestUser?.selectedDays
      ? JSON.parse(latestUser.selectedDays)
      : [];

    // Toggle the day
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    // Save updated selection
    return tx.user.update({
      where: { id: user.id },
      data: { selectedDays: JSON.stringify(updatedDays) },
      select: { selectedDays: true },
    });
  });

  const updatedDays: string[] = updatedUser.selectedDays
    ? JSON.parse(updatedUser.selectedDays)
    : [];

  // Show updated day selection message
  try {
    await replyMessage(event.replyToken, buildDaySelectMessage(updatedDays));
  } catch (error) {
    console.error("[LINE] Failed to reply in handleToggleDay:", error);
  }
}

async function handleConfirmDays(
  event: { replyToken: string },
  user: { id: string; lineId: string | null }
) {
  // Re-fetch latest data from DB to prevent race condition
  const latestUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { selectedDays: true },
  });

  const days: string[] = latestUser?.selectedDays
    ? JSON.parse(latestUser.selectedDays)
    : [];

  if (days.length === 0) {
    try {
      await replyMessage(event.replyToken, {
        type: "text",
        text: "曜日を1つ以上選んでください！",
      });
    } catch (error) {
      console.error("[LINE] Failed to reply in handleConfirmDays:", error);
    }
    return;
  }

  // Sort days by weekday order
  const dayOrder = ["月", "火", "水", "木", "金", "土", "日"];
  days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  // Initialize schedule step
  await prisma.user.update({
    where: { id: user.id },
    data: {
      scheduleStep: JSON.stringify({
        days,
        currentIndex: 0,
        selectedTimes: {},
      }),
    },
  });

  // Show time selection for first day
  try {
    await replyMessage(event.replyToken, buildTimeSelectMessage(days[0]));
  } catch (error) {
    console.error("[LINE] Failed to reply in handleConfirmDays:", error);
  }
}

async function handleSelectTime(
  event: { replyToken: string },
  user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const time = data.get("time");
  const day = data.get("day");
  if (!time || !day) return;

  // Re-fetch latest data from DB to prevent race condition
  const latestUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { scheduleStep: true },
  });

  const stepData = latestUser?.scheduleStep
    ? JSON.parse(latestUser.scheduleStep)
    : { days: [], currentIndex: 0, selectedTimes: {} };

  // Create the slot for this day/time
  await createSlot(user.id, day, time);

  // Move to next day
  const nextIndex = stepData.currentIndex + 1;

  if (nextIndex < stepData.days.length) {
    // More days to process
    await prisma.user.update({
      where: { id: user.id },
      data: {
        scheduleStep: JSON.stringify({
          ...stepData,
          currentIndex: nextIndex,
        }),
      },
    });
    try {
      await replyMessage(
        event.replyToken,
        buildTimeSelectMessage(stepData.days[nextIndex])
      );
    } catch (error) {
      console.error("[LINE] Failed to reply in handleSelectTime:", error);
    }
  } else {
    // All days completed
    const slots = await getUserUpcomingSlots(user.id);
    try {
      await replyMessage(event.replyToken, buildScheduleConfirmMessage(slots));
    } catch (error) {
      console.error("[LINE] Failed to reply in handleSelectTime:", error);
    }

    // Clear temporary data
    await prisma.user.update({
      where: { id: user.id },
      data: { selectedDays: null, scheduleStep: null },
    });
  }
}

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
        text: "現在、予約はありません。\nスケジュールを登録して学習者からの予約を待ちましょう！",
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

// --- Helper Functions ---

/**
 * Create a slot for the given day and time (next week)
 */
async function createSlot(userId: string, dayName: string, time: string) {
  const nextDate = getNextWeekDay(dayName);
  const [hours, minutes] = time.split(":").map(Number);

  const startTime = new Date(nextDate);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime.getTime() + 25 * 60 * 1000); // 25 min session

  await prisma.slot.create({
    data: {
      hostId: userId,
      startTime,
      endTime,
      status: "available",
      sessionType: "both", // Default to both business and casual
    },
  });
}

/**
 * Get the date of the next occurrence of a weekday (always next week)
 */
function getNextWeekDay(dayName: string): Date {
  const dayMap: Record<string, number> = {
    日: 0,
    月: 1,
    火: 2,
    水: 3,
    木: 4,
    金: 5,
    土: 6,
  };

  const now = new Date();
  const target = dayMap[dayName];
  const current = now.getDay();

  let diff = target - current;
  if (diff <= 0) diff += 7; // If today or past, move to next week
  diff += 7; // Always push to next week for safety

  const result = new Date(now);
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * Get user's upcoming available slots
 */
async function getUserUpcomingSlots(userId: string) {
  return prisma.slot.findMany({
    where: {
      hostId: userId,
      startTime: { gte: new Date() },
      status: "available",
    },
    orderBy: { startTime: "asc" },
    take: 20,
  });
}
