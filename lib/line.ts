import { Client, TextMessage } from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new Client(config);

// LINE通知送信
export async function sendLineMessage(
  userId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      return { success: false, error: 'LINE not configured' };
    }

    const textMessage: TextMessage = { type: 'text', text: message };
    await client.pushMessage(userId, textMessage);
    return { success: true };
  } catch (error) {
    console.error('LINE send error:', error);
    return { success: false, error: String(error) };
  }
}

// 予約通知（日本人ホスト向け）
export async function sendBookingLineNotification(
  lineUserId: string,
  learnerName: string,
  dateTime: string,
  sessionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const message = `【Do Jo】新しい予約が入りました！

📅 日時: ${dateTime}
👤 学習者: ${learnerName}さん

セッションURL:
${sessionUrl}`;

  return sendLineMessage(lineUserId, message);
}

// リマインダー通知
export async function sendReminderLineNotification(
  lineUserId: string,
  partnerName: string,
  sessionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const message = `【Do Jo】まもなくセッション開始！

👤 ${partnerName}さんとの会話が30分後に始まります。

セッションURL:
${sessionUrl}`;

  return sendLineMessage(lineUserId, message);
}
