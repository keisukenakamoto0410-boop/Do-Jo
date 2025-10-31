/**
 * Email Sender
 *
 * Handles sending emails. Currently using console.log for MVP.
 * Ready for SendGrid/Resend integration.
 *
 * TODO: Integration Steps for Production:
 *
 * 1. Choose email service (SendGrid or Resend recommended):
 *    - SendGrid: npm install @sendgrid/mail
 *    - Resend: npm install resend
 *
 * 2. Add environment variables to .env:
 *    SENDGRID_API_KEY=your_api_key_here
 *    SENDGRID_FROM_EMAIL=noreply@dojo-platform.com
 *    OR
 *    RESEND_API_KEY=your_api_key_here
 *    RESEND_FROM_EMAIL=noreply@dojo-platform.com
 *
 * 3. Replace the console.log implementation with actual API calls
 *
 * 4. Add error handling and retry logic
 *
 * 5. Add email tracking (optional):
 *    - Open tracking
 *    - Click tracking
 *    - Bounce handling
 *
 * 6. Test email deliverability:
 *    - Check spam scores
 *    - Verify SPF/DKIM/DMARC records
 *    - Test on different email clients
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@dojo-platform.com";
const FROM_NAME = "Do Jo";

/**
 * Send email (MVP: console.log only)
 *
 * @param options Email options
 * @returns Promise<boolean> Success status
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // MVP: Log email details to console
    console.log("\n" + "=".repeat(80));
    console.log("📧 EMAIL NOTIFICATION (MVP - Console Only)");
    console.log("=".repeat(80));
    console.log(`From: ${FROM_NAME} <${options.from || FROM_EMAIL}>`);
    console.log(`To: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
    if (options.cc) {
      console.log(`CC: ${Array.isArray(options.cc) ? options.cc.join(", ") : options.cc}`);
    }
    if (options.bcc) {
      console.log(`BCC: ${Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc}`);
    }
    if (options.replyTo) {
      console.log(`Reply-To: ${options.replyTo}`);
    }
    console.log(`Subject: ${options.subject}`);
    console.log("-".repeat(80));
    console.log("Text Content:");
    console.log(options.text || "No text version provided");
    console.log("-".repeat(80));
    console.log("HTML Content (truncated):");
    console.log(options.html.substring(0, 500) + "...");
    console.log("=".repeat(80) + "\n");

    // TODO: Replace with actual email sending
    /*
    // Example SendGrid implementation:
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: options.to,
      from: {
        email: options.from || FROM_EMAIL,
        name: FROM_NAME
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });
    */

    /*
    // Example Resend implementation:
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `${FROM_NAME} <${options.from || FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });
    */

    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);

    // TODO: Add proper error handling
    // - Log to error tracking service (Sentry, etc.)
    // - Queue for retry if transient error
    // - Alert admins if persistent failure

    return false;
  }
}

/**
 * Send bulk emails (batch processing)
 *
 * @param emails Array of email options
 * @returns Promise<number> Number of successfully sent emails
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<number> {
  let successCount = 0;

  // TODO: For production, use batch API endpoints for better performance
  // SendGrid supports up to 1000 emails per API call
  // Resend supports batch sending as well

  for (const email of emails) {
    const success = await sendEmail(email);
    if (success) {
      successCount++;
    }

    // Add delay to avoid rate limiting (remove in production with proper batch API)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Bulk email summary: ${successCount}/${emails.length} sent successfully\n`);

  return successCount;
}

/**
 * Queue email for later sending
 * Useful for high-volume or scheduled emails
 *
 * TODO: Implement with a job queue (Bull, BullMQ, etc.)
 * For now, just sends immediately
 */
export async function queueEmail(options: EmailOptions, sendAt?: Date): Promise<boolean> {
  if (sendAt && sendAt > new Date()) {
    console.log(`📅 Email queued for sending at: ${sendAt.toISOString()}`);
    // TODO: Add to job queue with scheduled send time
    return true;
  }

  // Send immediately if no future date specified
  return sendEmail(options);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email content to prevent XSS
 */
export function sanitizeEmailContent(content: string): string {
  // Basic sanitization - in production, use a library like DOMPurify
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "");
}

export default {
  sendEmail,
  sendBulkEmails,
  queueEmail,
  isValidEmail,
  sanitizeEmailContent,
};
