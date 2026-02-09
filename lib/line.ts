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
 * @param message - Message text to send
 * @returns Promise with success status
 */
export async function sendLinePushMessage(
  lineUserId: string,
  message: string
): Promise<LinePushMessageResponse> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.error("[LINE] LINE_CHANNEL_ACCESS_TOKEN is not set");
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" };
  }

  try {
    const response = await fetch(LINE_MESSAGING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
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
 * Send booking confirmation to host via LINE
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
  const topicText = topic ? `\n📝 今日のトピック: ${topic}` : "";
  const wordsText =
    words && words.length > 0
      ? `\n\n💬 練習したい単語:\n${words.map((w) => `・${w}`).join("\n")}`
      : "";

  const message = `【Do Jo】新しい予約が入りました

${hostName}さん、こんにちは！

新しい会話セッションの予約が入りました。

📅 日時: ${formatDateJa(sessionDate)}
👤 相手: ${learnerName} さん${topicText}${wordsText}

当日は開始5分前にログインしてお待ちください。

🔗 セッションURL:
${sessionUrl}`;

  console.log("[LINE] Sending booking notification to:", lineUserId);
  return sendLinePushMessage(lineUserId, message);
}

/**
 * Send session reminder via LINE (30 minutes before)
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
  const message = `【Do Jo】まもなくセッション開始です

${name}さん

セッションの開始時刻が近づいています！

📅 日時: ${formatDateJa(sessionDate)}
👤 相手: ${partnerName} さん

下のリンクをタップしてセッションに参加してください👇

🔗 ${sessionUrl}`;

  console.log("[LINE] Sending reminder to:", lineUserId);
  return sendLinePushMessage(lineUserId, message);
}

/**
 * Send cancellation notification via LINE
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
  let message = `【Do Jo】予約がキャンセルされました

${recipientName}さん

予定されていた会話セッションがキャンセルされました。

📅 予定日時: ${formatDateJa(sessionDate)}
👤 学習者: ${cancellerName} さん`;

  if (reason) {
    message += `\n\n💬 キャンセル理由:\n「${reason}」`;
  }

  message += `\n\nこの時間帯は再び予約可能になりました。`;

  console.log("[LINE] Sending cancellation notification to:", lineUserId);
  return sendLinePushMessage(lineUserId, message);
}
