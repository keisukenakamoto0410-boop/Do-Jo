// lib/line/messaging.ts
// LINE Messaging API - Reply & Push Message Functions

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

export interface LineMessage {
  type: string;
  text?: string;
  altText?: string;
  contents?: object;
  [key: string]: unknown;
}

/**
 * Reply to a LINE event using the replyToken
 * Used for responding to user actions (messages, postbacks, follow events)
 */
export async function replyMessage(
  replyToken: string,
  messages: LineMessage | LineMessage[]
): Promise<void> {
  const messageArray = Array.isArray(messages) ? messages : [messages];

  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: messageArray,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LINE reply error:", errorText);
    throw new Error(`LINE reply failed: ${response.status} ${errorText}`);
  }
}

/**
 * Push a message to a specific LINE user
 * Used for proactive notifications (reminders, booking confirmations, etc.)
 */
export async function pushMessage(
  lineUserId: string,
  messages: LineMessage | LineMessage[]
): Promise<void> {
  const messageArray = Array.isArray(messages) ? messages : [messages];

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: messageArray,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LINE push error:", errorText);
    throw new Error(`LINE push failed: ${response.status} ${errorText}`);
  }
}
