import nodemailer from "nodemailer";

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_EMAIL = process.env.GMAIL_USER || "noreply@do-jo.vercel.app";

interface BookingEmailParams {
  hostEmail: string;
  hostName: string;
  learnerName: string;
  sessionDate: Date;
  sessionUrl: string;
  topic?: string;
  words?: string[];
}

interface LearnerBookingEmailParams {
  learnerEmail: string;
  learnerName: string;
  hostName: string;
  sessionDate: Date;
  sessionUrl: string;
  prepareUrl: string;
}

interface PasswordResetEmailParams {
  email: string;
  name: string;
  resetUrl: string;
}

interface ReminderEmailParams {
  email: string;
  name: string;
  partnerName: string;
  sessionDate: Date;
  sessionUrl: string;
  isHost: boolean;
}

interface FeedbackNotificationEmailParams {
  learnerEmail: string;
  learnerName: string;
  hostName: string;
  sessionDate: Date;
  summaryUrl: string;
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
  topic,
  words,
}: BookingEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email if using LINE-only account (@line.local)
    if (hostEmail.endsWith('@line.local')) {
      console.log('[Email] Skipping email for LINE-only account:', hostEmail);
      return { success: true }; // Return success since LINE notification will handle this
    }

    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";

    // トピックと単語のHTMLを生成
    const topicHtml = topic
      ? `<p style="margin: 12px 0;"><strong>📝 今日のトピック:</strong> ${topic}</p>`
      : "";

    const wordsHtml =
      words && words.length > 0
        ? `
          <div style="margin: 12px 0;">
            <p style="margin: 0 0 8px 0;"><strong>💬 練習したい単語:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${words.map((word) => `<li style="margin: 4px 0;">${word}</li>`).join("")}
            </ul>
          </div>
        `
        : "";

    await transporter.sendMail({
      from: `Do Jo <${FROM_EMAIL}>`,
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
            ${topicHtml}
            ${wordsHtml}
          </div>

          <a href="${sessionUrl}" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            セッションに参加する →
          </a>

          <p style="font-size: 14px; color: #666; margin-top: 20px;">当日は開始5分前にログインしてお待ちください。</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999; text-align: center;">
            Do Jo - 日本語会話練習アプリ<br />
            <a href="${BASE_URL}" style="color: #d97706;">${BASE_URL}</a>
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send booking email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send booking confirmation email to learner
export async function sendLearnerBookingConfirmationEmail({
  learnerEmail,
  learnerName,
  hostName,
  sessionDate,
  sessionUrl,
  prepareUrl,
}: LearnerBookingEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email if using LINE-only account (@line.local)
    if (learnerEmail.endsWith('@line.local')) {
      console.log('[Email] Skipping email for LINE-only account:', learnerEmail);
      return { success: true };
    }

    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    await transporter.sendMail({
      from: `Do Jo <${FROM_EMAIL}>`,
      to: learnerEmail,
      subject: "【Do Jo】Booking Confirmed - Your session is scheduled!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0ea5e9; font-size: 24px; margin-bottom: 20px;">Booking Confirmed!</h1>

          <p style="font-size: 16px; color: #333;">Hi ${learnerName},</p>

          <p style="font-size: 16px; color: #333;">Your Japanese conversation session has been confirmed!</p>

          <div style="background: #e0f2fe; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>📅 Date & Time:</strong> ${formatDateEn(sessionDate)}</p>
            <p style="margin: 8px 0;"><strong>👤 Partner:</strong> ${hostName}-san</p>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            <strong>Next step:</strong> Prepare for your session by selecting a topic and setting your goals.
          </p>

          <a href="${prepareUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">
            Prepare for Session →
          </a>

          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Session URL: <a href="${sessionUrl}" style="color: #0ea5e9;">${sessionUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999; text-align: center;">
            Do Jo - Japanese Conversation Practice App<br />
            <a href="${BASE_URL}" style="color: #0ea5e9;">${BASE_URL}</a>
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send learner booking email:", error);
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
    // Skip email if using LINE-only account (@line.local)
    if (email.endsWith('@line.local')) {
      console.log('[Email] Skipping email for LINE-only account:', email);
      return { success: true };
    }

    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    // Japanese email for hosts (seniors)
    if (isHost) {
      await transporter.sendMail({
        from: `Do Jo <${FROM_EMAIL}>`,
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
    } else {
      // English email for learners
      await transporter.sendMail({
        from: `Do Jo <${FROM_EMAIL}>`,
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

// Send feedback notification email to learner
export async function sendFeedbackNotificationEmail({
  learnerEmail,
  learnerName,
  hostName,
  sessionDate,
  summaryUrl,
}: FeedbackNotificationEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email if using LINE-only account (@line.local)
    if (learnerEmail.endsWith('@line.local')) {
      console.log('[Email] Skipping email for LINE-only account:', learnerEmail);
      return { success: true };
    }

    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    await transporter.sendMail({
      from: `Do Jo <${FROM_EMAIL}>`,
      to: learnerEmail,
      subject: "【Do Jo】You received feedback from your session!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981; font-size: 24px; margin-bottom: 20px;">🎉 You Received Feedback!</h1>

          <p style="font-size: 16px; color: #333;">Hi ${learnerName},</p>

          <p style="font-size: 16px; color: #333;">
            Great job on completing your conversation session! ${hostName}-san has sent you detailed feedback and an encouragement message.
          </p>

          <div style="background: #d1fae5; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>📅 Session Date:</strong> ${formatDateEn(sessionDate)}</p>
            <p style="margin: 8px 0;"><strong>👤 Partner:</strong> ${hostName}-san</p>
          </div>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Your feedback includes:
          </p>
          <ul style="color: #333; padding-left: 20px;">
            <li>Pronunciation evaluation</li>
            <li>Grammar & word usage evaluation</li>
            <li>Communication enthusiasm evaluation</li>
            <li>Listening comprehension evaluation</li>
            <li>Improvement suggestions</li>
            <li>Personal encouragement message</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${summaryUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View Your Feedback →
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            Keep practicing Japanese - every conversation brings you closer to your goals! 頑張ってください！
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999; text-align: center;">
            Do Jo - Japanese Conversation Practice App<br />
            <a href="${BASE_URL}" style="color: #10b981;">${BASE_URL}</a>
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send feedback notification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send password reset email
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: PasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email if using LINE-only account (@line.local)
    if (email.endsWith('@line.local')) {
      console.log('[Email] Skipping email for LINE-only account:', email);
      return { success: true };
    }

    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    await transporter.sendMail({
      from: `Do Jo <${FROM_EMAIL}>`,
      to: email,
      subject: "【Do Jo】Password Reset Request / パスワードリセット",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0ea5e9; font-size: 24px; margin-bottom: 20px;">Password Reset / パスワードリセット</h1>

          <p style="font-size: 16px; color: #333;">Hi ${name} / ${name}さん</p>

          <p style="font-size: 16px; color: #333;">
            We received a request to reset your password.<br />
            パスワードリセットのリクエストを受け付けました。
          </p>

          <p style="font-size: 16px; color: #333;">
            Click the button below to reset your password. This link will expire in 1 hour.<br />
            下のボタンをクリックしてパスワードをリセットしてください。このリンクは1時間で期限切れになります。
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #0ea5e9, #2563eb); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password / パスワードをリセット
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            If you didn't request this, you can safely ignore this email.<br />
            このリクエストに心当たりがない場合は、このメールを無視してください。
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999; text-align: center;">
            Do Jo - Japanese Conversation Practice App<br />
            <a href="${BASE_URL}" style="color: #0ea5e9;">${BASE_URL}</a>
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Admin notification email params
interface AdminBookingNotificationParams {
  hostName: string;
  learnerName: string;
  sessionDate: Date;
  sessionUrl: string;
  topic?: string;
  words?: string[];
}

// Cancellation email params
interface CancellationEmailParams {
  recipientEmail: string;
  recipientName: string;
  cancellerName: string;
  cancelledBy: "learner" | "host";
  sessionDate: Date;
  reason?: string;
}

// Send booking notification to admin for manual LINE forwarding
export async function sendAdminBookingNotification({
  hostName,
  learnerName,
  sessionDate,
  sessionUrl,
  topic,
  words,
}: AdminBookingNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const ADMIN_EMAIL = "keisuke.nakamoto0410@gmail.com";

    // トピックと単語のテキストを生成
    const topicText = topic ? `📝 トピック: ${topic}` : "📝 トピック: なし";
    const wordsText =
      words && words.length > 0
        ? `💬 練習したい単語: ${words.join("、")}`
        : "💬 練習したい単語: なし";

    await transporter.sendMail({
      from: `Do Jo <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `【Do Jo】新規予約 - ${hostName}さん宛`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7c3aed; font-size: 24px; margin-bottom: 20px;">🎉 新しい予約が入りました</h1>

          <p style="font-size: 16px; color: #333;">
            以下の内容をLINEで<strong>${hostName}さん</strong>に転送してください：
          </p>

          <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <p style="margin: 8px 0;"><strong>👤 ホスト:</strong> ${hostName}</p>
            <p style="margin: 8px 0;"><strong>🌍 学習者（外国人）:</strong> ${learnerName}</p>
            <p style="margin: 8px 0;"><strong>📅 日時:</strong> ${formatDateJa(sessionDate)}</p>
            <p style="margin: 12px 0 4px 0;">${topicText}</p>
            <p style="margin: 4px 0;">${wordsText}</p>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">📋 LINEで送るテキスト（コピペ用）:</p>
            <div style="background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-all;">
${hostName}さん、こんにちは！

新しい予約が入りました。

👤 学習者: ${learnerName}さん
📅 日時: ${formatDateJa(sessionDate)}
${topicText}
${wordsText}

🔗 セッションURL:
${sessionUrl}

当日は開始5分前にログインしてお待ちください。
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${sessionUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              セッションURLを確認 →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999; text-align: center;">
            Do Jo - 管理者通知
          </p>
        </div>
      `,
    });

    console.log("[Email] Admin booking notification sent to:", ADMIN_EMAIL);
    return { success: true };
  } catch (error) {
    console.error("Failed to send admin booking notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send cancellation notification email
export async function sendCancellationEmail({
  recipientEmail,
  recipientName,
  cancellerName,
  cancelledBy,
  sessionDate,
  reason,
}: CancellationEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email if using LINE-only account (@line.local)
    if (recipientEmail.endsWith('@line.local')) {
      console.log('[Email] Skipping email for LINE-only account:', recipientEmail);
      return { success: true };
    }

    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    const isHost = cancelledBy === "host";

    // Different email based on who cancelled and who receives
    if (isHost) {
      // Host cancelled -> Send English email to learner
      await transporter.sendMail({
        from: `Do Jo <${FROM_EMAIL}>`,
        to: recipientEmail,
        subject: "【Do Jo】Session Cancelled / セッションがキャンセルされました",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">Session Cancelled</h1>

            <p style="font-size: 16px; color: #333;">Hi ${recipientName},</p>

            <p style="font-size: 16px; color: #333;">
              Unfortunately, your scheduled session has been cancelled by your partner.
            </p>

            <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 8px 0;"><strong>📅 Original Date:</strong> ${formatDateEn(sessionDate)}</p>
              <p style="margin: 8px 0;"><strong>👤 Partner:</strong> ${cancellerName}-san</p>
              ${reason ? `<p style="margin: 12px 0 0 0;"><strong>💬 Reason:</strong></p><p style="margin: 4px 0; color: #666; font-style: italic;">"${reason}"</p>` : ""}
            </div>

            <p style="font-size: 16px; color: #333;">
              We're sorry for the inconvenience. Please book another session when you're ready.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/learner/browse" style="display: inline-block; background: linear-gradient(to right, #0ea5e9, #2563eb); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Find Another Host →
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

            <p style="font-size: 12px; color: #999; text-align: center;">
              Do Jo - Japanese Conversation Practice App<br />
              <a href="${BASE_URL}" style="color: #0ea5e9;">${BASE_URL}</a>
            </p>
          </div>
        `,
      });
    } else {
      // Learner cancelled -> Send Japanese email to host
      await transporter.sendMail({
        from: `Do Jo <${FROM_EMAIL}>`,
        to: recipientEmail,
        subject: "【Do Jo】予約がキャンセルされました",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">予約がキャンセルされました</h1>

            <p style="font-size: 16px; color: #333;">${recipientName}さん</p>

            <p style="font-size: 16px; color: #333;">
              予定されていた会話セッションが学習者によりキャンセルされました。
            </p>

            <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 8px 0;"><strong>📅 予定日時:</strong> ${formatDateJa(sessionDate)}</p>
              <p style="margin: 8px 0;"><strong>👤 学習者:</strong> ${cancellerName} さん</p>
              ${reason ? `<p style="margin: 12px 0 0 0;"><strong>💬 キャンセル理由:</strong></p><p style="margin: 4px 0; color: #666; font-style: italic;">「${reason}」</p>` : ""}
            </div>

            <p style="font-size: 16px; color: #333;">
              ご不便をおかけして申し訳ございません。<br />
              この時間帯は再び予約可能になりました。
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/senior/dashboard" style="display: inline-block; background: linear-gradient(to right, #0ea5e9, #0284c7); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                ダッシュボードを確認 →
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

            <p style="font-size: 12px; color: #999; text-align: center;">
              Do Jo - 日本語会話練習アプリ<br />
              <a href="${BASE_URL}" style="color: #0ea5e9;">${BASE_URL}</a>
            </p>
          </div>
        `,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
