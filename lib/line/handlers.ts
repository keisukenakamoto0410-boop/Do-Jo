// lib/line/handlers.ts
// LINE Webhook Event Handlers for Do Jo

import { replyMessage, getProfile } from "./messaging";
import { prisma } from "@/lib/prisma";
import {
  buildDaySelectMessage,
  buildTimeSelectMessage,
  buildStartTimeSelectMessage,
  buildEndTimeSelectMessage,
  buildScheduleConfirmMessage,
  buildMainMenuMessage,
  buildScheduleStatusMessage,
  buildUsageGuideMessage,
  buildProfileIncompleteMessage,
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
    await replyMessage(event.replyToken, buildMainMenuMessage(existingUser.name));
    return;
  }

  // Fetch LINE profile to get display name and picture
  const profile = await getProfile(lineId);
  const displayName = profile?.displayName || "Do Joユーザー";
  const pictureUrl = profile?.pictureUrl || null;

  // Create new user with LINE profile data - skip manual registration
  // Generate a unique placeholder email since email is required and unique
  const placeholderEmail = `${lineId}@line.local`;

  // Generate default avatar path if no picture
  const avatarPath = pictureUrl || "https://do-jo.vercel.app/avatars/n_60s.png";

  await prisma.user.create({
    data: {
      lineId,
      email: placeholderEmail,
      name: displayName,
      avatar: avatarPath,
      role: "senior", // Japanese volunteer
      registrationStep: "COMPLETED", // Auto-complete registration
      prefecture: "豊橋市", // Default
      lastLoginAt: new Date(),
    },
  });

  // Send welcome message with main menu
  await replyMessage(event.replyToken, {
    type: "text",
    text: `${displayName}さん、Do Joへようこそ！\n\n日本語を学ぶ外国人の方と会話するボランティアプラットフォームです。\n\n下のメニューから「スケジュール」を選んで、対応可能な時間帯を登録してください。`,
  });
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

  // All users are auto-registered, so handle all text messages as rich menu actions
  await handleRichMenuText(event.replyToken, user.id, user.name, text);
}

// ==============================
// postback: Button tap -> Route to handler
// ==============================
// Actions that require processing lock (to prevent button spam)
const LOCKABLE_ACTIONS = [
  "toggle_day",
  "confirm_days",
  "select_time",
  "start_schedule",
];

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

  // Check if this action requires locking
  const requiresLock = action && LOCKABLE_ACTIONS.includes(action);

  if (requiresLock) {
    // Check if already processing
    if (user.isProcessing) {
      try {
        await replyMessage(event.replyToken, {
          type: "text",
          text: "処理中です、少々お待ちください。",
        });
      } catch (error) {
        console.error("[LINE] Failed to send processing message:", error);
      }
      return;
    }

    // Set processing flag
    await prisma.user.update({
      where: { id: user.id },
      data: { isProcessing: true },
    });
  }

  try {
    switch (action) {
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

      case "select_start_time":
        await handleSelectStartTime(event, user, data);
        break;

      case "select_end_time":
        await handleSelectEndTime(event, user, data);
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
  } finally {
    // Always release the lock
    if (requiresLock) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isProcessing: false },
      });
    }
  }
}

// --- Handler Functions ---

async function handleStartSchedule(
  event: { replyToken: string },
  user: { id: string; lineId: string | null }
) {
  // Check if profile is complete
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { registrationStep: true },
  });

  if (userData?.registrationStep !== "COMPLETED") {
    try {
      await replyMessage(event.replyToken, buildProfileIncompleteMessage());
    } catch (error) {
      console.error("[LINE] Failed to reply profile incomplete:", error);
    }
    return;
  }

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

  // Show start time selection for first day (new flow)
  try {
    await replyMessage(event.replyToken, buildStartTimeSelectMessage(days[0]));
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

// New flow: Start time selection
async function handleSelectStartTime(
  event: { replyToken: string },
  _user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const time = data.get("time");
  const day = data.get("day");
  if (!time || !day) return;

  // Show end time selection
  try {
    await replyMessage(event.replyToken, buildEndTimeSelectMessage(day, time));
  } catch (error) {
    console.error("[LINE] Failed to reply in handleSelectStartTime:", error);
  }
}

// New flow: End time selection and slot creation
async function handleSelectEndTime(
  event: { replyToken: string },
  user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const day = data.get("day");
  const startTime = data.get("startTime");
  const endTime = data.get("endTime");
  if (!day || !startTime || !endTime) return;

  // Validate that end time is after start time
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    await replyMessage(event.replyToken, {
      type: "text",
      text: "終了時刻は開始時刻より後にしてください。もう一度やり直してください。",
    });
    return;
  }

  // Create slots for the range
  let currentMinutes = startMinutes;
  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    await createSlot(user.id, day, timeStr);
    currentMinutes += 30;
  }

  // Re-fetch latest data from DB
  const latestUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { scheduleStep: true },
  });

  const stepData = latestUser?.scheduleStep
    ? JSON.parse(latestUser.scheduleStep)
    : { days: [], currentIndex: 0, selectedTimes: {} };

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
        buildStartTimeSelectMessage(stepData.days[nextIndex])
      );
    } catch (error) {
      console.error("[LINE] Failed to reply in handleSelectEndTime:", error);
    }
  } else {
    // All days completed
    const slots = await getUserUpcomingSlots(user.id);
    try {
      await replyMessage(event.replyToken, buildScheduleConfirmMessage(slots));
    } catch (error) {
      console.error("[LINE] Failed to reply in handleSelectEndTime:", error);
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
 * Get the Monday of next week
 */
function getNextMonday(): Date {
  const now = new Date();
  const current = now.getDay(); // 0=Sun, 1=Mon, ...

  // Days until next Monday
  let daysUntilMonday = 1 - current; // Monday = 1
  if (daysUntilMonday <= 0) {
    daysUntilMonday += 7; // Move to next week
  }
  daysUntilMonday += 7; // Always push to the week after next

  const result = new Date(now);
  result.setDate(result.getDate() + daysUntilMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the date for a specific weekday based on next Monday
 */
function getDateForDay(dayName: string): Date {
  const dayOffsets: Record<string, number> = {
    月: 0,
    火: 1,
    水: 2,
    木: 3,
    金: 4,
    土: 5,
    日: 6,
  };

  const nextMonday = getNextMonday();
  const result = new Date(nextMonday);
  result.setDate(nextMonday.getDate() + dayOffsets[dayName]);
  return result;
}

/**
 * Create a slot for the given day and time (next week)
 * Skips if a slot with the same hostId and startTime already exists
 */
async function createSlot(userId: string, dayName: string, time: string) {
  const nextDate = getDateForDay(dayName);
  const [hours, minutes] = time.split(":").map(Number);

  const startTime = new Date(nextDate);
  startTime.setHours(hours, minutes, 0, 0);

  // Check if slot already exists
  const existingSlot = await prisma.slot.findFirst({
    where: {
      hostId: userId,
      startTime,
    },
  });

  if (existingSlot) {
    console.log(`[LINE] Slot already exists for ${userId} at ${startTime}, skipping`);
    return;
  }

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
        // Check if profile is complete
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { registrationStep: true },
        });

        if (user?.registrationStep !== "COMPLETED") {
          await replyMessage(replyToken, buildProfileIncompleteMessage());
          return;
        }

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

        await replyMessage(
          replyToken,
          buildScheduleStatusMessage({ availableSlots, bookedSlots })
        );
        break;
      }

      case "プロフィール": {
        await replyMessage(replyToken, {
          type: "text",
          text: "プロフィールはLINEアカウント情報から自動で設定されています。\n\n詳細な情報を変更したい場合は、Webアプリからログインしてください。",
        });
        break;
      }

      case "使い方":
        await replyMessage(replyToken, buildUsageGuideMessage());
        break;

      case "メニュー":
      case "menu":
        await replyMessage(replyToken, buildMainMenuMessage(userName));
        break;

      default:
        // Any other text is treated as inquiry/feedback
        await replyMessage(replyToken, {
          type: "text",
          text: "メッセージを受け付けました。担当者が確認してお返事します。\n\n下のメニューから「スケジュール」「プロフィール」「使い方」を選ぶこともできます。",
        });
    }
  } catch (error) {
    console.error("[LINE] Failed to handle rich menu text:", error);
  }
}
