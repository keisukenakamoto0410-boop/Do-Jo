/**
 * LINE Messaging API utilities
 */

const LINE_MESSAGING_API_URL = "https://api.line.me/v2/bot/message/push";

interface LinePushMessageResponse {
  success: boolean;
  error?: string;
}

/**
 * Send a push message to a LINE user
 * @param lineUserId - LINE user ID
 * @param message - Message text or Flex Message object
 * @returns Promise with success status
 */
export async function sendLinePushMessage(
  lineUserId: string,
  message: string | object
): Promise<LinePushMessageResponse> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.error("[LINE] LINE_CHANNEL_ACCESS_TOKEN is not set");
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" };
  }

  try {
    // メッセージがstringならテキストメッセージ、objectならそのまま使う
    const messageObj = typeof message === "string"
      ? { type: "text", text: message }
      : message;

    const response = await fetch(LINE_MESSAGING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [messageObj],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[LINE] Push message failed:", response.status, errorData);
      return {
        success: false,
        error: `LINE API error: ${response.status} - ${JSON.stringify(errorData)}`,
      };
    }

    console.log("[LINE] Push message sent successfully to:", lineUserId);
    return { success: true };
  } catch (error) {
    console.error("[LINE] Push message error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send push messages to multiple LINE users
 * @param users - Array of objects with lineId and optional name
 * @param message - Message text to send
 * @returns Promise with results for each user
 */
export async function sendLinePushMessageToMultiple(
  users: { lineId: string; name?: string }[],
  message: string
): Promise<{
  total: number;
  success: number;
  failed: number;
  results: { lineId: string; name?: string; success: boolean; error?: string }[];
}> {
  const results = await Promise.all(
    users.map(async (user) => {
      const result = await sendLinePushMessage(user.lineId, message);
      return {
        lineId: user.lineId,
        name: user.name,
        success: result.success,
        error: result.error,
      };
    })
  );

  const successCount = results.filter((r) => r.success).length;

  return {
    total: users.length,
    success: successCount,
    failed: users.length - successCount,
    results,
  };
}

// Format date in Japanese style
function formatDateJa(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  };
  return date.toLocaleDateString("ja-JP", options);
}

/**
 * Send booking confirmation to host via LINE using Flex Message with button
 */
export async function sendLineBookingNotification({
  lineUserId,
  hostName,
  learnerName,
  sessionDate,
  sessionUrl,
  topic,
  words,
}: {
  lineUserId: string;
  hostName: string;
  learnerName: string;
  sessionDate: Date;
  sessionUrl: string;
  topic?: string;
  words?: string[];
}): Promise<LinePushMessageResponse> {
  // トピックと単語のテキストを生成
  const topicLine = topic ? `📝 トピック: ${topic}` : "";
  const wordsLine =
    words && words.length > 0
      ? `💬 練習したい単語: ${words.join("、")}`
      : "";

  // Build content items for the Flex Message body
  const bodyContents: object[] = [
    {
      type: "text",
      text: `${hostName}さん、こんにちは！`,
      size: "md",
      color: "#333333",
      wrap: true,
    },
    {
      type: "text",
      text: "新しい会話セッションの予約が入りました。",
      size: "sm",
      color: "#666666",
      margin: "md",
      wrap: true,
    },
    {
      type: "separator",
      margin: "lg",
    },
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "sm",
      contents: [
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "📅 日時",
              color: "#666666",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: formatDateJa(sessionDate),
              wrap: true,
              color: "#333333",
              size: "sm",
              flex: 5,
            },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "👤 相手",
              color: "#666666",
              size: "sm",
              flex: 2,
            },
            {
              type: "text",
              text: `${learnerName} さん`,
              wrap: true,
              color: "#333333",
              size: "sm",
              flex: 5,
            },
          ],
        },
      ],
    },
  ];

  // Add topic if exists
  if (topicLine) {
    bodyContents.push({
      type: "text",
      text: topicLine,
      size: "sm",
      color: "#333333",
      margin: "lg",
      wrap: true,
    });
  }

  // Add words if exists
  if (wordsLine) {
    bodyContents.push({
      type: "text",
      text: wordsLine,
      size: "sm",
      color: "#333333",
      margin: "sm",
      wrap: true,
    });
  }

  // Add note
  bodyContents.push({
    type: "text",
    text: "当日は開始5分前にログインしてお待ちください。",
    size: "xs",
    color: "#888888",
    margin: "xl",
    wrap: true,
  });

  // Flex Message structure
  const flexMessage = {
    type: "flex",
    altText: "【Do Jo】新しい予約が入りました",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎉 新しい予約",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: "#4F46E5",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "セッションを開く",
              uri: sessionUrl,
            },
            style: "primary",
            color: "#4F46E5",
            height: "md",
          },
        ],
        paddingAll: "15px",
      },
    },
  };

  console.log("[LINE] Sending booking notification (Flex) to:", lineUserId);
  return sendLinePushMessage(lineUserId, flexMessage);
}

/**
 * Send session reminder via LINE (30 minutes before) using Flex Message with button
 */
export async function sendLineReminderNotification({
  lineUserId,
  name,
  partnerName,
  sessionDate,
  sessionUrl,
}: {
  lineUserId: string;
  name: string;
  partnerName: string;
  sessionDate: Date;
  sessionUrl: string;
}): Promise<LinePushMessageResponse> {
  const flexMessage = {
    type: "flex",
    altText: "【Do Jo】まもなくセッション開始です",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⏰ まもなく開始",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: "#F59E0B",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${name}さん`,
            size: "md",
            color: "#333333",
            weight: "bold",
          },
          {
            type: "text",
            text: "セッションの開始時刻が近づいています！",
            size: "sm",
            color: "#666666",
            margin: "md",
            wrap: true,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "📅 日時",
                    color: "#666666",
                    size: "sm",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: formatDateJa(sessionDate),
                    wrap: true,
                    color: "#333333",
                    size: "sm",
                    flex: 5,
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "👤 相手",
                    color: "#666666",
                    size: "sm",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: `${partnerName} さん`,
                    wrap: true,
                    color: "#333333",
                    size: "sm",
                    flex: 5,
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: "15px",
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
            color: "#F59E0B",
            height: "md",
          },
        ],
        paddingAll: "15px",
      },
    },
  };

  console.log("[LINE] Sending reminder (Flex) to:", lineUserId);
  return sendLinePushMessage(lineUserId, flexMessage);
}

/**
 * Send cancellation notification via LINE using Flex Message
 */
export async function sendLineCancellationNotification({
  lineUserId,
  recipientName,
  cancellerName,
  sessionDate,
  reason,
}: {
  lineUserId: string;
  recipientName: string;
  cancellerName: string;
  sessionDate: Date;
  reason?: string;
}): Promise<LinePushMessageResponse> {
  const bodyContents: object[] = [
    {
      type: "text",
      text: `${recipientName}さん`,
      size: "md",
      color: "#333333",
      weight: "bold",
    },
    {
      type: "text",
      text: "予定されていた会話セッションがキャンセルされました。",
      size: "sm",
      color: "#666666",
      margin: "md",
      wrap: true,
    },
    {
      type: "separator",
      margin: "lg",
    },
    {
      type: "box",
      layout: "vertical",
      margin: "lg",
      spacing: "sm",
      contents: [
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "📅 予定日時",
              color: "#666666",
              size: "sm",
              flex: 3,
            },
            {
              type: "text",
              text: formatDateJa(sessionDate),
              wrap: true,
              color: "#333333",
              size: "sm",
              flex: 5,
            },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "👤 学習者",
              color: "#666666",
              size: "sm",
              flex: 3,
            },
            {
              type: "text",
              text: `${cancellerName} さん`,
              wrap: true,
              color: "#333333",
              size: "sm",
              flex: 5,
            },
          ],
        },
      ],
    },
  ];

  // Add reason if exists
  if (reason) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "lg",
      contents: [
        {
          type: "text",
          text: "💬 キャンセル理由",
          color: "#666666",
          size: "sm",
        },
        {
          type: "text",
          text: `「${reason}」`,
          color: "#333333",
          size: "sm",
          margin: "sm",
          wrap: true,
        },
      ],
    });
  }

  // Add note
  bodyContents.push({
    type: "text",
    text: "この時間帯は再び予約可能になりました。",
    size: "xs",
    color: "#888888",
    margin: "xl",
    wrap: true,
  });

  const flexMessage = {
    type: "flex",
    altText: "【Do Jo】予約がキャンセルされました",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "❌ 予約キャンセル",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: "#EF4444",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
        paddingAll: "15px",
      },
    },
  };

  console.log("[LINE] Sending cancellation notification (Flex) to:", lineUserId);
  return sendLinePushMessage(lineUserId, flexMessage);
}
