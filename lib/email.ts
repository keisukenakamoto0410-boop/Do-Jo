import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const FROM_EMAIL = "Do Jo <noreply@do-jo.vercel.app>";

interface BookingEmailParams {
  hostEmail: string;
  hostName: string;
  learnerName: string;
  sessionDate: Date;
  sessionUrl: string;
}

interface ReminderEmailParams {
  email: string;
  name: string;
  partnerName: string;
  sessionDate: Date;
  sessionUrl: string;
  isHost: boolean;
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

// Format date in English style
function formatDateEn(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  };
  return date.toLocaleDateString("en-US", options) + " (JST)";
}

// Send booking confirmation email to host (senior)
export async function sendBookingConfirmationEmail({
  hostEmail,
  hostName,
  learnerName,
  sessionDate,
  sessionUrl,
}: BookingEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: hostEmail,
      subject: "【Do Jo】新しい予約が入りました",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #d97706; font-size: 24px; margin-bottom: 20px;">新しい予約が入りました</h1>

          <p style="font-size: 16px; color: #333;">${hostName}さん</p>

          <p style="font-size: 16px; color: #333;">新しい会話セッションの予約が入りました。</p>

          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>📅 日時:</strong> ${formatDateJa(sessionDate)}</p>
            <p style="margin: 8px 0;"><strong>👤 相手:</strong> ${learnerName} さん</p>
            <p style="margin: 8px 0;"><strong>🔗 セッションURL:</strong> <a href="${sessionUrl}" style="color: #d97706;">${sessionUrl}</a></p>
          </div>

          <p style="font-size: 14px; color: #666;">当日は開始5分前にログインしてお待ちください。</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999; text-align: center;">
            Do Jo - 日本語会話練習アプリ<br />
            <a href="${BASE_URL}" style="color: #d97706;">${BASE_URL}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send booking email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send booking email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send reminder email (30 minutes before session)
export async function sendReminderEmail({
  email,
  name,
  partnerName,
  sessionDate,
  sessionUrl,
  isHost,
}: ReminderEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    // Japanese email for hosts (seniors)
    if (isHost) {
      const { error } = await getResend().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "【Do Jo】まもなくセッション開始です（30分前）",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #d97706; font-size: 24px; margin-bottom: 20px;">まもなくセッション開始です</h1>

            <p style="font-size: 16px; color: #333;">${name}さん</p>

            <p style="font-size: 16px; color: #333;">セッションの開始時刻が近づいています。</p>

            <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>📅 日時:</strong> ${formatDateJa(sessionDate)}</p>
              <p style="margin: 8px 0;"><strong>👤 相手:</strong> ${partnerName} さん</p>
            </div>

            <a href="${sessionUrl}" style="display: inline-block; background: #d97706; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
              セッションに参加する →
            </a>

            <p style="font-size: 14px; color: #666;">↑ このリンクをクリックしてセッションに参加してください。</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

            <p style="font-size: 12px; color: #999; text-align: center;">
              Do Jo - 日本語会話練習アプリ<br />
              <a href="${BASE_URL}" style="color: #d97706;">${BASE_URL}</a>
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Failed to send reminder email:", error);
        return { success: false, error: error.message };
      }
    } else {
      // English email for learners
      const { error } = await getResend().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "【Do Jo】Session starting soon (30 min reminder)",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">Session Starting Soon!</h1>

            <p style="font-size: 16px; color: #333;">Hi ${name},</p>

            <p style="font-size: 16px; color: #333;">Your session is starting soon!</p>

            <div style="background: #dbeafe; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>📅 Time:</strong> ${formatDateEn(sessionDate)}</p>
              <p style="margin: 8px 0;"><strong>👤 Partner:</strong> ${partnerName}-san</p>
            </div>

            <a href="${sessionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
              Join Session →
            </a>

            <p style="font-size: 14px; color: #666;">Click the link above to join the session.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

            <p style="font-size: 12px; color: #999; text-align: center;">
              Do Jo - Japanese Conversation Practice App<br />
              <a href="${BASE_URL}" style="color: #2563eb;">${BASE_URL}</a>
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Failed to send reminder email:", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
