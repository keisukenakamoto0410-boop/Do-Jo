// lib/line/handlers.ts
// LINE Webhook Event Handlers for Do Jo

import { replyMessage, getProfile } from "./messaging";
import { prisma } from "@/lib/prisma";
import {
  buildWelcomeMessage,
  buildGenderSelectMessage,
  buildAgeSelectMessage,
  buildInterestsSelectMessage,
  buildBioPromptMessage,
  buildRegistrationCompleteMessage,
  buildDaySelectMessage,
  buildTimeSelectMessage,
  buildScheduleConfirmMessage,
  buildMainMenuMessage,
  buildScheduleStatusMessage,
  buildUsageGuideMessage,
  buildProfileMessage,
  buildProfileIncompleteMessage,
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

  // Fetch LINE profile to get display name
  const profile = await getProfile(lineId);
  const displayName = profile?.displayName || null;

  // Create new user for LINE registration flow
  // Generate a unique placeholder email since email is required and unique
  const placeholderEmail = `line_${lineId}_${Date.now()}@line.local`;

  await prisma.user.create({
    data: {
      lineId,
      email: placeholderEmail,
      name: displayName || "LINE登録中",
      role: "senior", // Japanese volunteer
      registrationStep: "AWAITING_NAME",
    },
  });

  await replyMessage(event.replyToken, buildWelcomeMessage(displayName || undefined));
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
      // Save name and proceed to gender selection
      await prisma.user.update({
        where: { lineId },
        data: { name: text, registrationStep: "AWAITING_GENDER" },
      });
      await replyMessage(event.replyToken, buildGenderSelectMessage(text));
      break;

    case "AWAITING_BIO":
      // Save bio and complete registration
      const avatarPath = generateAvatarPath(user.gender, user.ageRange);
      await prisma.user.update({
        where: { lineId },
        data: {
          bio: text,
          avatar: avatarPath,
          registrationStep: "COMPLETED",
        },
      });
      await replyMessage(
        event.replyToken,
        buildRegistrationCompleteMessage(user.name, avatarPath)
      );
      break;

    case "COMPLETED":
    case null:
      // Registered user sending text -> handle rich menu actions
      await handleRichMenuText(event.replyToken, user.id, user.name, text);
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
// Actions that require processing lock (to prevent button spam)
const LOCKABLE_ACTIONS = [
  "toggle_day",
  "confirm_days",
  "select_time",
  "start_schedule",
  "confirm_name",
  "select_gender",
  "select_age",
  "toggle_interest",
  "confirm_interests",
  "skip_bio",
  "edit_profile",
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
      // --- Registration Flow ---
      case "confirm_name":
        await handleConfirmName(event, user, data);
        break;

      case "select_gender":
        await handleSelectGender(event, user, data);
        break;

      case "select_age":
        await handleSelectAge(event, user, data);
        break;

      case "toggle_interest":
        await handleToggleInterest(event, user, data);
        break;

      case "confirm_interests":
        await handleConfirmInterests(event, user);
        break;

      case "skip_bio":
        await handleSkipBio(event, user);
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

      // --- Profile Edit ---
      case "edit_profile":
        await handleEditProfile(event, user);
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

/**
 * Generate avatar path based on gender and age
 */
function generateAvatarPath(
  gender: string | null,
  ageRange: string | null
): string {
  // Default avatar
  const baseUrl = "https://do-jo.vercel.app/avatars";

  // Map gender and age to avatar filename
  const genderKey = gender === "male" ? "m" : gender === "female" ? "f" : "n";
  const ageKey = ageRange || "50s";

  return `${baseUrl}/${genderKey}_${ageKey}.png`;
}

async function handleConfirmName(
  event: { replyToken: string },
  user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const name = data.get("name");
  if (!name) return;

  const decodedName = decodeURIComponent(name);

  await prisma.user.update({
    where: { id: user.id },
    data: { name: decodedName, registrationStep: "AWAITING_GENDER" },
  });

  try {
    await replyMessage(event.replyToken, buildGenderSelectMessage(decodedName));
  } catch (error) {
    console.error("[LINE] Failed to reply in handleConfirmName:", error);
  }
}

async function handleSelectGender(
  event: { replyToken: string },
  user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const gender = data.get("gender");
  if (!gender) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { gender, registrationStep: "AWAITING_AGE" },
  });

  try {
    await replyMessage(event.replyToken, buildAgeSelectMessage());
  } catch (error) {
    console.error("[LINE] Failed to reply in handleSelectGender:", error);
  }
}

async function handleSelectAge(
  event: { replyToken: string },
  user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const age = data.get("age");
  if (!age) return;

  // Set age and default prefecture to 豊橋市, then proceed to interests
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ageRange: age,
      prefecture: "豊橋市",
      registrationStep: "AWAITING_INTERESTS",
    },
  });

  try {
    await replyMessage(event.replyToken, buildInterestsSelectMessage());
  } catch (error) {
    console.error("[LINE] Failed to reply in handleSelectAge:", error);
  }
}

async function handleToggleInterest(
  event: { replyToken: string },
  user: { id: string; lineId: string | null },
  data: URLSearchParams
) {
  const interest = data.get("interest");
  if (!interest) return;

  const decodedInterest = decodeURIComponent(interest);

  // Use transaction to prevent race condition
  const updatedUser = await prisma.$transaction(async (tx) => {
    const latestUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { interests: true },
    });

    const currentInterests = latestUser?.interests || [];

    // Toggle the interest
    const updatedInterests = currentInterests.includes(decodedInterest)
      ? currentInterests.filter((i) => i !== decodedInterest)
      : [...currentInterests, decodedInterest];

    return tx.user.update({
      where: { id: user.id },
      data: { interests: updatedInterests },
      select: { interests: true },
    });
  });

  try {
    await replyMessage(
      event.replyToken,
      buildInterestsSelectMessage(updatedUser.interests)
    );
  } catch (error) {
    console.error("[LINE] Failed to reply in handleToggleInterest:", error);
  }
}

async function handleConfirmInterests(
  event: { replyToken: string },
  user: { id: string; lineId: string | null }
) {
  await prisma.user.update({
    where: { id: user.id },
    data: { registrationStep: "AWAITING_BIO" },
  });

  try {
    await replyMessage(event.replyToken, buildBioPromptMessage());
  } catch (error) {
    console.error("[LINE] Failed to reply in handleConfirmInterests:", error);
  }
}

async function handleSkipBio(
  event: { replyToken: string },
  user: { id: string; lineId: string | null }
) {
  // Fetch user data for avatar generation
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, gender: true, ageRange: true },
  });

  const avatarPath = generateAvatarPath(
    userData?.gender || null,
    userData?.ageRange || null
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      avatar: avatarPath,
      registrationStep: "COMPLETED",
    },
  });

  try {
    await replyMessage(
      event.replyToken,
      buildRegistrationCompleteMessage(userData?.name || "", avatarPath)
    );
  } catch (error) {
    console.error("[LINE] Failed to reply in handleSkipBio:", error);
  }
}

async function handleEditProfile(
  event: { replyToken: string },
  user: { id: string; lineId: string | null }
) {
  // Fetch LINE profile for display name
  const profile = user.lineId ? await getProfile(user.lineId) : null;
  const displayName = profile?.displayName || undefined;

  // Reset registration step to restart flow
  await prisma.user.update({
    where: { id: user.id },
    data: { registrationStep: "AWAITING_NAME" },
  });

  try {
    await replyMessage(event.replyToken, buildWelcomeMessage(displayName));
  } catch (error) {
    console.error("[LINE] Failed to reply in handleEditProfile:", error);
  }
}

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
        // Fetch user profile data
        const profileUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            gender: true,
            ageRange: true,
            prefecture: true,
            interests: true,
            bio: true,
          },
        });

        if (profileUser) {
          await replyMessage(
            replyToken,
            buildProfileMessage({
              name: profileUser.name,
              gender: profileUser.gender,
              ageRange: profileUser.ageRange,
              prefecture: profileUser.prefecture,
              interests: profileUser.interests,
              bio: profileUser.bio,
            })
          );
        }
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
