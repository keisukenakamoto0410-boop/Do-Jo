// Email notification utilities
// For MVP, this is a mock implementation
// TODO: Implement with SendGrid or similar service

interface BookingConfirmationData {
  candidate: {
    email: string;
    name: string;
  };
  interviewer: {
    email: string;
    name: string;
  };
  slot: {
    startTime: Date;
    endTime: Date;
    jobCategory: string;
  };
}

/**
 * Send booking confirmation email to candidate
 * Mock implementation for MVP
 */
export async function sendBookingConfirmationEmail(
  data: BookingConfirmationData
): Promise<void> {
  console.log("📧 [Mock Email] Booking Confirmation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`To: ${data.candidate.email}`);
  console.log(`Subject: 面接予約完了のお知らせ`);
  console.log("\nBody:");
  console.log(`${data.candidate.name}様`);
  console.log("\n面接の予約が完了しました。");
  console.log("\n【予約詳細】");
  console.log(`日時: ${formatDateTime(data.slot.startTime)}`);
  console.log(
    `時間: ${formatTime(data.slot.startTime)} - ${formatTime(data.slot.endTime)}`
  );
  console.log(`面接官: ${data.interviewer.name}`);
  console.log(`カテゴリー: ${data.slot.jobCategory}`);
  console.log("\n面接開始10分前までにログインしてください。");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // TODO: Implement actual email sending
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: data.candidate.email,
  //   from: process.env.SENDGRID_FROM_EMAIL,
  //   subject: '面接予約完了のお知らせ',
  //   html: generateBookingEmailHtml(data),
  // });
}

/**
 * Send notification email to interviewer
 * Mock implementation for MVP
 */
export async function sendInterviewerNotificationEmail(
  data: BookingConfirmationData
): Promise<void> {
  console.log("📧 [Mock Email] Interviewer Notification");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`To: ${data.interviewer.email}`);
  console.log(`Subject: 新しい面接予約のお知らせ`);
  console.log("\nBody:");
  console.log(`${data.interviewer.name}様`);
  console.log("\n新しい面接予約が入りました。");
  console.log("\n【予約詳細】");
  console.log(`候補者: ${data.candidate.name}`);
  console.log(`日時: ${formatDateTime(data.slot.startTime)}`);
  console.log(
    `時間: ${formatTime(data.slot.startTime)} - ${formatTime(data.slot.endTime)}`
  );
  console.log(`カテゴリー: ${data.slot.jobCategory}`);
  console.log("\nダッシュボードからご確認ください。");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * Send interview reminder email (24 hours before)
 * Mock implementation for MVP
 */
export async function sendInterviewReminderEmail(data: {
  email: string;
  name: string;
  interviewTime: Date;
}): Promise<void> {
  console.log("📧 [Mock Email] Interview Reminder");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`To: ${data.email}`);
  console.log(`Subject: 明日の面接についてのリマインダー`);
  console.log("\nBody:");
  console.log(`${data.name}様`);
  console.log("\n明日、面接が予定されています。");
  console.log(`日時: ${formatDateTime(data.interviewTime)}`);
  console.log("\n準備はお済みですか？");
  console.log("- 履歴書の確認");
  console.log("- 自己紹介の練習");
  console.log("- インターネット接続の確認");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * Send interview cancellation email
 * Mock implementation for MVP
 */
export async function sendCancellationEmail(data: {
  email: string;
  name: string;
  interviewTime: Date;
  reason?: string;
}): Promise<void> {
  console.log("📧 [Mock Email] Interview Cancellation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`To: ${data.email}`);
  console.log(`Subject: 面接キャンセルのお知らせ`);
  console.log("\nBody:");
  console.log(`${data.name}様`);
  console.log("\n面接がキャンセルされました。");
  console.log(`日時: ${formatDateTime(data.interviewTime)}`);
  if (data.reason) {
    console.log(`理由: ${data.reason}`);
  }
  console.log("\n別の日時での予約をお願いいたします。");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Helper functions

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generate HTML template for booking confirmation email
 * For future implementation
 */
function generateBookingEmailHtml(data: BookingConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Noto Sans JP', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .details { background-color: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>面接予約完了</h1>
          </div>
          <div class="content">
            <p>${data.candidate.name}様</p>
            <p>面接の予約が完了しました。</p>
            <div class="details">
              <h3>予約詳細</h3>
              <p><strong>日時:</strong> ${formatDateTime(data.slot.startTime)}</p>
              <p><strong>時間:</strong> ${formatTime(data.slot.startTime)} - ${formatTime(data.slot.endTime)}</p>
              <p><strong>面接官:</strong> ${data.interviewer.name}</p>
              <p><strong>カテゴリー:</strong> ${data.slot.jobCategory}</p>
            </div>
            <p>面接開始10分前までにログインしてください。</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Do Jo Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
