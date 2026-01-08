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

// Send password reset email
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: PasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
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
