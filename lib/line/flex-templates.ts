// lib/line/flex-templates.ts
// LINE Flex Message Templates for Do Jo Registration Flow

import { LineMessage } from "./messaging";

// Design constants
const COLORS = {
  primary: "#4F46E5", // Indigo - main color
  warning: "#F59E0B", // Yellow - reminders
  error: "#EF4444", // Red - cancellation
  success: "#10B981", // Green - success
  selected: "#4F46E5", // Selected button
  unselected: "#E5E7EB", // Unselected button
};

/**
 * Welcome message for new LINE friends
 * Prompts user to enter their name
 */
export function buildWelcomeMessage(): LineMessage {
  return {
    type: "flex",
    altText: "Do Joへようこそ！お名前を入力してください",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎉 Do Joへようこそ！",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: COLORS.primary,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "日本語会話練習のボランティアにご登録いただきありがとうございます！",
            wrap: true,
            size: "sm",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "まずはお名前を教えてください",
            weight: "bold",
            margin: "lg",
          },
          {
            type: "text",
            text: "（ニックネームでもOK）",
            size: "xs",
            color: "#888888",
          },
        ],
      },
    },
  };
}

/**
 * Area selection message after name input
 */
export function buildAreaSelectMessage(name: string): LineMessage {
  const prefectures = [
    ["北海道", "東北", "関東", "中部"],
    ["近畿", "中国", "四国", "九州"],
  ];

  const buttons = prefectures.flat().map((area) => ({
    type: "button",
    style: "secondary",
    action: {
      type: "postback",
      label: area,
      data: `action=select_area&area=${area}`,
    },
    height: "sm",
    margin: "sm",
  }));

  return {
    type: "flex",
    altText: `${name}さん、お住まいの地域を選んでください`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${name}さん、ようこそ！`,
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: COLORS.primary,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📍 お住まいの地域を選んでください",
            weight: "bold",
            wrap: true,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            contents: buttons.slice(0, 4).map((btn) => ({
              ...btn,
              type: "button" as const,
            })),
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            contents: buttons.slice(4).map((btn) => ({
              ...btn,
              type: "button" as const,
            })),
            margin: "sm",
          },
        ],
      },
    },
  };
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
  if (diff <= 0) diff += 7;
  diff += 7; // Always push to next week

  const result = new Date(now);
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * Day selection message for schedule registration
 * Shows toggleable day buttons with actual dates
 */
export function buildDaySelectMessage(selectedDays: string[] = []): LineMessage {
  const days = ["月", "火", "水", "木", "金", "土", "日"];
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  // Calculate dates for each day
  const dayDates = days.map((day) => {
    const date = getNextWeekDay(day);
    return {
      day,
      date,
      month: date.getMonth() + 1,
      dayOfMonth: date.getDate(),
      dayName: dayNames[date.getDay()],
    };
  });

  // Get date range for header
  const mondayDate = dayDates[0]; // 月曜日
  const sundayDate = dayDates[6]; // 日曜日
  const dateRangeText = `📅 ${mondayDate.month}/${mondayDate.dayOfMonth}(${mondayDate.dayName}) 〜 ${sundayDate.month}/${sundayDate.dayOfMonth}(${sundayDate.dayName})`;

  const dayButtons = dayDates.map(({ day, month, dayOfMonth }) => {
    const isSelected = selectedDays.includes(day);
    return {
      type: "button",
      style: isSelected ? "primary" : "secondary",
      color: isSelected ? COLORS.selected : undefined,
      action: {
        type: "postback",
        label: `${day} ${month}/${dayOfMonth}${isSelected ? " ✓" : ""}`,
        data: `action=toggle_day&day=${day}`,
      },
      height: "sm",
      margin: "xs",
      flex: 1,
    };
  });

  return {
    type: "flex",
    altText: "スケジュール登録 - 曜日を選んでください",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: dateRangeText,
            weight: "bold",
            size: "md",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: COLORS.primary,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "空き日を選んでください",
            weight: "bold",
            wrap: true,
          },
          {
            type: "text",
            text: "（複数選択可能）",
            size: "xs",
            color: "#888888",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: dayButtons.slice(0, 4).map((btn) => ({
              ...btn,
              type: "button" as const,
            })),
            margin: "lg",
            spacing: "xs",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: dayButtons.slice(4).map((btn) => ({
              ...btn,
              type: "button" as const,
            })),
            margin: "sm",
            spacing: "xs",
          },
          selectedDays.length > 0
            ? {
                type: "text",
                text: `選択中: ${selectedDays.join("・")}`,
                size: "sm",
                color: COLORS.primary,
                margin: "lg",
                align: "center",
              }
            : {
                type: "filler",
              },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: selectedDays.length > 0 ? COLORS.success : COLORS.unselected,
            action: {
              type: "postback",
              label: "この日程で決定 ✓",
              data: "action=confirm_days",
            },
          },
        ],
      },
    },
  };
}

/**
 * Time slot selection message for a specific day
 */
export function buildTimeSelectMessage(
  day: string,
  selectedTimes: string[] = []
): LineMessage {
  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  // Create 3 rows of 4 buttons each
  const rows = [];
  for (let i = 0; i < timeSlots.length; i += 4) {
    const rowSlots = timeSlots.slice(i, i + 4);
    rows.push({
      type: "box",
      layout: "horizontal",
      contents: rowSlots.map((time) => {
        const isSelected = selectedTimes.includes(time);
        return {
          type: "button",
          style: isSelected ? "primary" : "secondary",
          action: {
            type: "postback",
            label: time,
            data: `action=select_time&day=${day}&time=${time}`,
          },
          height: "sm",
          flex: 1,
        };
      }),
      spacing: "xs",
      margin: "sm",
    });
  }

  return {
    type: "flex",
    altText: `${day}曜日の時間を選んでください`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `⏰ ${day}曜日の時間帯`,
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: COLORS.primary,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "会話可能な時間を選んでください",
            weight: "bold",
            wrap: true,
          },
          {
            type: "text",
            text: "（1つ選択すると次の曜日へ進みます）",
            size: "xs",
            color: "#888888",
          },
          {
            type: "separator",
            margin: "lg",
          },
          ...rows,
        ],
      },
    },
  };
}

/**
 * Schedule confirmation message after all slots are registered
 */
export function buildScheduleConfirmMessage(
  slots: Array<{ startTime: Date; endTime: Date }>
): LineMessage {
  const formatSlot = (slot: { startTime: Date }) => {
    const date = new Date(slot.startTime);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const dayName = dayNames[date.getDay()];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month}/${day}(${dayName}) ${hours}:${minutes}`;
  };

  const slotTexts = slots.map((slot) => ({
    type: "text",
    text: `📌 ${formatSlot(slot)}`,
    size: "sm",
    margin: "sm",
  }));

  return {
    type: "flex",
    altText: "スケジュール登録完了！",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ スケジュール登録完了！",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: COLORS.success,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "以下の時間で登録しました",
            weight: "bold",
            wrap: true,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            contents: slotTexts.slice(0, 10), // Limit to 10 slots for display
            margin: "md",
          },
          slots.length > 10
            ? {
                type: "text",
                text: `他${slots.length - 10}件...`,
                size: "xs",
                color: "#888888",
              }
            : { type: "filler" },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "学習者から予約が入るとLINEでお知らせします！",
            size: "sm",
            wrap: true,
            margin: "lg",
            color: "#666666",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "スケジュールを追加する",
              data: "action=start_schedule",
            },
          },
        ],
      },
    },
  };
}

/**
 * Menu message for registered users
 */
export function buildMainMenuMessage(userName: string): LineMessage {
  return {
    type: "flex",
    altText: "Do Jo メニュー",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${userName}さん`,
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: "何をしますか？",
            size: "sm",
            color: "#888888",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "button",
            style: "primary",
            color: COLORS.primary,
            action: {
              type: "postback",
              label: "📅 スケジュールを登録",
              data: "action=start_schedule",
            },
            margin: "lg",
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "📋 予約一覧を見る",
              data: "action=view_reservations",
            },
            margin: "sm",
          },
        ],
      },
    },
  };
}

/**
 * Booking notification message for hosts when a learner books a session
 * Includes OK and Cancel buttons for quick response
 */
export function buildBookingNotification(params: {
  learnerName: string;
  day: string;
  time: string;
  topic?: string;
  reservationId?: string;
}): LineMessage {
  const { learnerName, day, time, topic, reservationId } = params;

  const infoContents: object[] = [
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "相手",
          size: "sm",
          color: "#999999",
          flex: 2,
        },
        {
          type: "text",
          text: `${learnerName} さん`,
          size: "sm",
          flex: 5,
        },
      ],
    },
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "日時",
          size: "sm",
          color: "#999999",
          flex: 2,
        },
        {
          type: "text",
          text: `${day} ${time}`,
          size: "sm",
          flex: 5,
        },
      ],
    },
  ];

  // Add topic row
  infoContents.push({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: "トピック",
        size: "sm",
        color: "#999999",
        flex: 2,
      },
      {
        type: "text",
        text: topic || "未定",
        size: "sm",
        flex: 5,
      },
    ],
  });

  return {
    type: "flex",
    altText: "予約が確定しました！",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ 予約が確定しました！",
            weight: "bold",
            size: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: infoContents,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            action: {
              type: "postback",
              label: "OK 👍",
              data: `action=ack_booking${reservationId ? `&reservationId=${reservationId}` : ""}`,
            },
            style: "primary",
            color: "#06C755",
            flex: 1,
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "キャンセル",
              data: `action=cancel_booking${reservationId ? `&reservationId=${reservationId}` : ""}`,
            },
            style: "secondary",
            flex: 1,
          },
        ],
      },
    },
  };
}

/**
 * Session info message sent before the session starts (e.g., 30 minutes before)
 * Includes session details in a styled box and a session URL button
 */
/**
 * Status message showing user's slots and reservations
 */
export function buildStatusMessage(params: {
  userName: string;
  userEmail: string;
  availableSlots: Array<{ startTime: Date }>;
  bookedSlots: Array<{
    startTime: Date;
    learnerName: string;
    topic?: string | null;
  }>;
}): LineMessage {
  const { userName, userEmail, availableSlots, bookedSlots } = params;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayName = dayNames[d.getDay()];
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${month}/${day}(${dayName}) ${hours}:${minutes}`;
  };

  const bodyContents: object[] = [
    {
      type: "text",
      text: "📋 あなたの予約状況",
      weight: "bold",
      size: "lg",
    },
    {
      type: "separator",
      margin: "lg",
    },
  ];

  // No slots at all
  if (availableSlots.length === 0 && bookedSlots.length === 0) {
    bodyContents.push({
      type: "text",
      text: "まだスケジュールが登録されていません",
      size: "sm",
      color: "#888888",
      margin: "lg",
      wrap: true,
    });
  } else {
    // Available slots section
    if (availableSlots.length > 0) {
      bodyContents.push({
        type: "text",
        text: "【募集中】",
        weight: "bold",
        size: "sm",
        margin: "lg",
        color: COLORS.primary,
      });

      for (const slot of availableSlots.slice(0, 5)) {
        bodyContents.push({
          type: "text",
          text: `・${formatDate(slot.startTime)} - まだ予約なし`,
          size: "sm",
          margin: "sm",
          wrap: true,
        });
      }

      if (availableSlots.length > 5) {
        bodyContents.push({
          type: "text",
          text: `他${availableSlots.length - 5}件...`,
          size: "xs",
          color: "#888888",
          margin: "sm",
        });
      }
    }

    // Booked slots section
    if (bookedSlots.length > 0) {
      bodyContents.push({
        type: "text",
        text: "【予約確定】",
        weight: "bold",
        size: "sm",
        margin: "lg",
        color: COLORS.success,
      });

      for (const slot of bookedSlots.slice(0, 5)) {
        const topicText = slot.topic ? `（トピック: ${slot.topic}）` : "";
        bodyContents.push({
          type: "text",
          text: `・${formatDate(slot.startTime)} - ${slot.learnerName} さん${topicText}`,
          size: "sm",
          margin: "sm",
          wrap: true,
        });
      }

      if (bookedSlots.length > 5) {
        bodyContents.push({
          type: "text",
          text: `他${bookedSlots.length - 5}件...`,
          size: "xs",
          color: "#888888",
          margin: "sm",
        });
      }
    }
  }

  // User info section
  bodyContents.push({
    type: "separator",
    margin: "lg",
  });
  bodyContents.push({
    type: "text",
    text: `連携情報: ${userName} / ${userEmail}`,
    size: "xs",
    color: "#888888",
    margin: "lg",
    wrap: true,
  });

  const footerContents: object[] = [];

  // Show schedule registration button if no slots
  if (availableSlots.length === 0 && bookedSlots.length === 0) {
    footerContents.push({
      type: "button",
      style: "primary",
      color: COLORS.primary,
      action: {
        type: "postback",
        label: "📅 スケジュールを登録",
        data: "action=start_schedule",
      },
    });
  }

  footerContents.push({
    type: "text",
    text: "連携を解除する場合は「解除」と送ってください",
    size: "xs",
    color: "#888888",
    align: "center",
    margin: footerContents.length > 0 ? "md" : "none",
  });

  return {
    type: "flex",
    altText: "あなたの予約状況",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: footerContents,
      },
    },
  };
}

export function buildSessionInfoMessage(params: {
  learnerName: string;
  topic?: string;
  targetWords?: string[];
  sessionUrl: string;
}): LineMessage {
  const { learnerName, topic, targetWords, sessionUrl } = params;

  // Info box contents
  const infoBoxContents: object[] = [
    {
      type: "text",
      text: `👤 ${learnerName} さん`,
      weight: "bold",
      size: "md",
    },
    {
      type: "text",
      text: `📝 トピック: ${topic || "日常会話"}`,
      size: "sm",
      margin: "md",
    },
    {
      type: "text",
      text: `💬 使いたい単語: ${targetWords && targetWords.length > 0 ? targetWords.join(", ") : "なし"}`,
      size: "sm",
      margin: "sm",
      wrap: true,
    },
  ];

  return {
    type: "flex",
    altText: "まもなくセッション開始！",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📋 まもなくセッション開始！",
            weight: "bold",
            size: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            backgroundColor: "#F5F5F5",
            cornerRadius: "md",
            paddingAll: "lg",
            contents: infoBoxContents,
          },
          {
            type: "text",
            text: "💡 相手の単語を自然に会話に入れてあげると喜ばれます！",
            size: "xs",
            color: "#666666",
            margin: "lg",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "セッションに参加",
              uri: sessionUrl,
            },
            style: "primary",
            color: "#06C755",
          },
        ],
      },
    },
  };
}

/**
 * Schedule status message with current slots/reservations and schedule registration button
 * Used for rich menu "スケジュール" action
 */
export function buildScheduleStatusMessage(params: {
  availableSlots: Array<{ startTime: Date }>;
  bookedSlots: Array<{
    startTime: Date;
    learnerName: string;
    topic?: string | null;
  }>;
}): LineMessage {
  const { availableSlots, bookedSlots } = params;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayName = dayNames[d.getDay()];
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${month}/${day}(${dayName}) ${hours}:${minutes}`;
  };

  const bodyContents: object[] = [
    {
      type: "text",
      text: "📅 スケジュール",
      weight: "bold",
      size: "lg",
    },
    {
      type: "separator",
      margin: "lg",
    },
  ];

  // No slots at all
  if (availableSlots.length === 0 && bookedSlots.length === 0) {
    bodyContents.push({
      type: "text",
      text: "まだスケジュールが登録されていません",
      size: "sm",
      color: "#888888",
      margin: "lg",
      wrap: true,
    });
    bodyContents.push({
      type: "text",
      text: "下のボタンからスケジュールを登録しましょう！",
      size: "sm",
      color: "#888888",
      margin: "sm",
      wrap: true,
    });
  } else {
    // Available slots section
    if (availableSlots.length > 0) {
      bodyContents.push({
        type: "text",
        text: "【募集中】",
        weight: "bold",
        size: "sm",
        margin: "lg",
        color: COLORS.primary,
      });

      for (const slot of availableSlots.slice(0, 5)) {
        bodyContents.push({
          type: "text",
          text: `・${formatDate(slot.startTime)} - まだ予約なし`,
          size: "sm",
          margin: "sm",
          wrap: true,
        });
      }

      if (availableSlots.length > 5) {
        bodyContents.push({
          type: "text",
          text: `他${availableSlots.length - 5}件...`,
          size: "xs",
          color: "#888888",
          margin: "sm",
        });
      }
    }

    // Booked slots section
    if (bookedSlots.length > 0) {
      bodyContents.push({
        type: "text",
        text: "【予約確定】",
        weight: "bold",
        size: "sm",
        margin: "lg",
        color: COLORS.success,
      });

      for (const slot of bookedSlots.slice(0, 5)) {
        const topicText = slot.topic ? `（${slot.topic}）` : "";
        bodyContents.push({
          type: "text",
          text: `・${formatDate(slot.startTime)} - ${slot.learnerName} さん${topicText}`,
          size: "sm",
          margin: "sm",
          wrap: true,
        });
      }

      if (bookedSlots.length > 5) {
        bodyContents.push({
          type: "text",
          text: `他${bookedSlots.length - 5}件...`,
          size: "xs",
          color: "#888888",
          margin: "sm",
        });
      }
    }
  }

  return {
    type: "flex",
    altText: "スケジュール",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: COLORS.primary,
            action: {
              type: "postback",
              label: "📅 新しくスケジュールを登録",
              data: "action=start_schedule",
            },
          },
        ],
      },
    },
  };
}

/**
 * Usage guide message explaining how to use Do Jo
 * Used for rich menu "使い方" action
 */
export function buildUsageGuideMessage(): LineMessage {
  return {
    type: "flex",
    altText: "Do Joの使い方",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📖 Do Joの使い方",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: COLORS.primary,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🌏 Do Joとは？",
            weight: "bold",
            size: "md",
          },
          {
            type: "text",
            text: "外国人の日本語学習者と25分間の会話練習をするボランティアサービスです。",
            size: "sm",
            wrap: true,
            margin: "sm",
            color: "#666666",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "📅 スケジュール登録",
            weight: "bold",
            size: "md",
            margin: "lg",
          },
          {
            type: "text",
            text: "会話できる曜日と時間を登録すると、学習者があなたのスケジュールを見て予約できるようになります。",
            size: "sm",
            wrap: true,
            margin: "sm",
            color: "#666666",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "🔔 予約通知",
            weight: "bold",
            size: "md",
            margin: "lg",
          },
          {
            type: "text",
            text: "学習者から予約が入ると、LINEに通知が届きます。",
            size: "sm",
            wrap: true,
            margin: "sm",
            color: "#666666",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "💬 セッション前",
            weight: "bold",
            size: "md",
            margin: "lg",
          },
          {
            type: "text",
            text: "セッション30分前に、学習者が話したいトピックと練習したい単語が届きます。会話の参考にしてください！",
            size: "sm",
            wrap: true,
            margin: "sm",
            color: "#666666",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: COLORS.primary,
            action: {
              type: "postback",
              label: "📅 スケジュールを登録する",
              data: "action=start_schedule",
            },
          },
        ],
      },
    },
  };
}

/**
 * Weekly reminder message sent every Sunday to prompt schedule registration
 */
export function buildWeeklyReminderMessage(): LineMessage {
  return {
    type: "flex",
    altText: "今週のスケジュール登録",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📅 今週のスケジュール登録",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: COLORS.primary,
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "来週の空き時間を登録しませんか？",
            weight: "bold",
            size: "md",
            wrap: true,
          },
          {
            type: "text",
            text: "ボタン1つで簡単に登録できます！",
            size: "sm",
            color: "#666666",
            margin: "md",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: COLORS.primary,
            action: {
              type: "postback",
              label: "スケジュールを登録する",
              data: "action=start_schedule",
            },
          },
        ],
      },
    },
  };
}
