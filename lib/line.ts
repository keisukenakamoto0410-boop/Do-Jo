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
