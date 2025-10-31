/**
 * Email Templates
 *
 * These functions generate HTML email content for various notification types.
 * Currently using console.log for MVP - ready for SendGrid/Resend integration.
 *
 * TODO: When integrating with actual email service:
 * 1. Replace console.log in sender.ts with actual email API calls
 * 2. Test email deliverability and spam scores
 * 3. Add email tracking (opens, clicks)
 * 4. Consider using a templating engine like Handlebars for more complex emails
 * 5. Add i18n support for English/Japanese email content
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string; // Plain text version for email clients that don't support HTML
}

const APP_NAME = "Do Jo";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Base email wrapper with consistent styling
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          background-color: #667eea;
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #5568d3;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 12px;
        }
        .highlight {
          background-color: #fff3cd;
          padding: 15px;
          border-left: 4px solid #ffc107;
          margin: 15px 0;
        }
        .info-box {
          background-color: #e7f3ff;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 ${APP_NAME}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>このメールは${APP_NAME}から自動送信されています。</p>
          <p>返信する必要はありません。</p>
          <p>&copy; 2024 ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Booking Confirmation Email
 * Sent to candidate immediately after booking request
 */
export function bookingConfirmation(
  candidateName: string,
  interviewDate: string,
  interviewerName: string,
  interviewId: string
): EmailTemplate {
  const html = emailWrapper(`
    <h2>面接予約リクエストを受け付けました</h2>
    <p>${candidateName}様</p>
    <p>面接予約のリクエストを受け付けました。面接官の承認をお待ちください。</p>

    <div class="info-box">
      <h3>📅 予約詳細</h3>
      <p><strong>面接日時:</strong> ${interviewDate}</p>
      <p><strong>面接官:</strong> ${interviewerName}</p>
    </div>

    <div class="highlight">
      <p><strong>⏳ 承認待ち</strong></p>
      <p>面接官が24時間以内に承認します。承認され次第、メールでお知らせします。</p>
    </div>

    <a href="${APP_URL}/candidate/dashboard" class="button">ダッシュボードを確認</a>

    <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
  `);

  const text = `
面接予約リクエストを受け付けました

${candidateName}様

面接予約のリクエストを受け付けました。面接官の承認をお待ちください。

予約詳細:
面接日時: ${interviewDate}
面接官: ${interviewerName}

承認待ち: 面接官が24時間以内に承認します。承認され次第、メールでお知らせします。

ダッシュボードを確認: ${APP_URL}/candidate/dashboard

${APP_NAME}
  `;

  return {
    subject: `【${APP_NAME}】面接予約リクエストを受け付けました`,
    html,
    text,
  };
}

/**
 * Booking Approved Email
 * Sent to candidate when interviewer approves the booking
 */
export function bookingApproved(
  candidateName: string,
  interviewDate: string,
  interviewerName: string,
  interviewId: string
): EmailTemplate {
  const html = emailWrapper(`
    <h2>🎉 面接予約が承認されました！</h2>
    <p>${candidateName}様</p>
    <p>おめでとうございます！面接予約が承認されました。</p>

    <div class="info-box">
      <h3>📅 面接詳細</h3>
      <p><strong>面接日時:</strong> ${interviewDate}</p>
      <p><strong>面接官:</strong> ${interviewerName}</p>
    </div>

    <div class="highlight">
      <p><strong>📝 準備のヒント</strong></p>
      <ul>
        <li>レジュメを最新の状態に更新しておきましょう</li>
        <li>想定質問への回答を準備しましょう</li>
        <li>面接前日にリマインダーメールをお送りします</li>
        <li>当日は開始時刻の5分前にログインしてください</li>
      </ul>
    </div>

    <a href="${APP_URL}/candidate/interview/${interviewId}" class="button">面接詳細を確認</a>

    <p>頑張ってください！応援しています。</p>
  `);

  const text = `
面接予約が承認されました！

${candidateName}様

おめでとうございます！面接予約が承認されました。

面接詳細:
面接日時: ${interviewDate}
面接官: ${interviewerName}

準備のヒント:
- レジュメを最新の状態に更新しておきましょう
- 想定質問への回答を準備しましょう
- 面接前日にリマインダーメールをお送りします
- 当日は開始時刻の5分前にログインしてください

面接詳細を確認: ${APP_URL}/candidate/interview/${interviewId}

頑張ってください！応援しています。

${APP_NAME}
  `;

  return {
    subject: `【${APP_NAME}】🎉 面接予約が承認されました！`,
    html,
    text,
  };
}

/**
 * Booking Rejected Email
 * Sent to candidate when interviewer rejects the booking
 */
export function bookingRejected(
  candidateName: string,
  interviewDate: string,
  reason?: string
): EmailTemplate {
  const html = emailWrapper(`
    <h2>面接予約について</h2>
    <p>${candidateName}様</p>
    <p>申し訳ございませんが、${interviewDate}の面接予約リクエストを承認できませんでした。</p>

    ${reason ? `
    <div class="highlight">
      <p><strong>理由:</strong></p>
      <p>${reason}</p>
    </div>
    ` : ''}

    <p>他の日時で再度予約をお試しください。空き枠は随時更新されています。</p>

    <a href="${APP_URL}/candidate/book" class="button">別の日時を予約する</a>

    <p>ご不便をおかけして申し訳ございません。</p>
  `);

  const text = `
面接予約について

${candidateName}様

申し訳ございませんが、${interviewDate}の面接予約リクエストを承認できませんでした。

${reason ? `理由: ${reason}` : ''}

他の日時で再度予約をお試しください。空き枠は随時更新されています。

別の日時を予約する: ${APP_URL}/candidate/book

ご不便をおかけして申し訳ございません。

${APP_NAME}
  `;

  return {
    subject: `【${APP_NAME}】面接予約について`,
    html,
    text,
  };
}

/**
 * Feedback Ready Email
 * Sent to candidate when interviewer submits evaluation
 */
export function feedbackReady(
  candidateName: string,
  interviewDate: string,
  interviewId: string,
  overallScore?: number
): EmailTemplate {
  const html = emailWrapper(`
    <h2>✨ フィードバックが届きました！</h2>
    <p>${candidateName}様</p>
    <p>${interviewDate}の面接フィードバックが届きました。</p>

    <div class="highlight">
      <p><strong>🎯 面接お疲れ様でした！</strong></p>
      <p>面接官から詳細なフィードバックとアドバイスが届いています。</p>
      ${overallScore ? `<p><strong>総合スコア:</strong> ${overallScore}%</p>` : ''}
    </div>

    <div class="info-box">
      <h3>フィードバックで確認できること</h3>
      <ul>
        <li>📊 詳細な評価スコア（5つのカテゴリ）</li>
        <li>💬 面接官からのコメント</li>
        <li>💡 具体的な改善アドバイス</li>
        <li>🤖 AI による流暢性分析結果</li>
        <li>💪 あなた専用の改善プラン</li>
        <li>🌟 面接官からの応援メッセージ</li>
      </ul>
    </div>

    <a href="${APP_URL}/candidate/interview/${interviewId}/feedback" class="button">フィードバックを見る</a>

    <p>フィードバックを活かして、さらなる成長を目指しましょう！</p>
  `);

  const text = `
フィードバックが届きました！

${candidateName}様

${interviewDate}の面接フィードバックが届きました。

面接お疲れ様でした！
面接官から詳細なフィードバックとアドバイスが届いています。
${overallScore ? `総合スコア: ${overallScore}%` : ''}

フィードバックで確認できること:
- 詳細な評価スコア（5つのカテゴリ）
- 面接官からのコメント
- 具体的な改善アドバイス
- AI による流暢性分析結果
- あなた専用の改善プラン
- 面接官からの応援メッセージ

フィードバックを見る: ${APP_URL}/candidate/interview/${interviewId}/feedback

フィードバックを活かして、さらなる成長を目指しましょう！

${APP_NAME}
  `;

  return {
    subject: `【${APP_NAME}】✨ フィードバックが届きました！`,
    html,
    text,
  };
}

/**
 * Reminder One Day Before Interview
 * Sent to candidate 24 hours before scheduled interview
 */
export function reminderOneDayBefore(
  candidateName: string,
  interviewDate: string,
  interviewerName: string,
  interviewId: string
): EmailTemplate {
  const html = emailWrapper(`
    <h2>⏰ 明日は面接です！</h2>
    <p>${candidateName}様</p>
    <p>明日の面接のリマインダーです。準備は万全ですか？</p>

    <div class="info-box">
      <h3>📅 面接詳細</h3>
      <p><strong>面接日時:</strong> ${interviewDate}</p>
      <p><strong>面接官:</strong> ${interviewerName}</p>
    </div>

    <div class="highlight">
      <p><strong>📝 最終チェックリスト</strong></p>
      <ul>
        <li>✅ レジュメを確認しましたか？</li>
        <li>✅ 想定質問への回答を準備しましたか？</li>
        <li>✅ インターネット接続は安定していますか？</li>
        <li>✅ 静かな場所を確保していますか？</li>
        <li>✅ カメラとマイクの動作確認をしましたか？</li>
      </ul>
    </div>

    <p><strong>⏱️ 開始時刻の5分前にはログインしてください。</strong></p>

    <a href="${APP_URL}/candidate/interview/${interviewId}" class="button">面接ページを開く</a>

    <p>リラックスして、ベストを尽くしてください。応援しています！</p>
  `);

  const text = `
明日は面接です！

${candidateName}様

明日の面接のリマインダーです。準備は万全ですか？

面接詳細:
面接日時: ${interviewDate}
面接官: ${interviewerName}

最終チェックリスト:
✅ レジュメを確認しましたか？
✅ 想定質問への回答を準備しましたか？
✅ インターネット接続は安定していますか？
✅ 静かな場所を確保していますか？
✅ カメラとマイクの動作確認をしましたか？

開始時刻の5分前にはログインしてください。

面接ページを開く: ${APP_URL}/candidate/interview/${interviewId}

リラックスして、ベストを尽くしてください。応援しています！

${APP_NAME}
  `;

  return {
    subject: `【${APP_NAME}】⏰ 明日は面接です！`,
    html,
    text,
  };
}

/**
 * Interview Request for Interviewer
 * Sent to interviewer when a candidate books their slot
 */
export function interviewRequestForInterviewer(
  interviewerName: string,
  candidateName: string,
  interviewDate: string,
  candidateLevel: string,
  interviewId: string
): EmailTemplate {
  const html = emailWrapper(`
    <h2>📬 新しい面接予約リクエスト</h2>
    <p>${interviewerName}様</p>
    <p>新しい面接予約のリクエストが届きました。</p>

    <div class="info-box">
      <h3>👤 候補者情報</h3>
      <p><strong>名前:</strong> ${candidateName}</p>
      <p><strong>日本語レベル:</strong> ${candidateLevel}</p>
      <p><strong>希望日時:</strong> ${interviewDate}</p>
    </div>

    <div class="highlight">
      <p><strong>⏰ 24時間以内に承認または拒否してください</strong></p>
      <p>候補者は承認を待っています。</p>
    </div>

    <a href="${APP_URL}/interviewer/requests" class="button">リクエストを確認</a>

    <p>ご協力ありがとうございます。</p>
  `);

  const text = `
新しい面接予約リクエスト

${interviewerName}様

新しい面接予約のリクエストが届きました。

候補者情報:
名前: ${candidateName}
日本語レベル: ${candidateLevel}
希望日時: ${interviewDate}

24時間以内に承認または拒否してください
候補者は承認を待っています。

リクエストを確認: ${APP_URL}/interviewer/requests

ご協力ありがとうございます。

${APP_NAME}
  `;

  return {
    subject: `【${APP_NAME}】📬 新しい面接予約リクエスト`,
    html,
    text,
  };
}

/**
 * Evaluation Reminder for Interviewer
 * Sent to interviewer after interview is conducted
 */
export function evaluationReminder(
  interviewerName: string,
  candidateName: string,
  interviewDate: string,
  interviewId: string,
  daysSince: number
): EmailTemplate {
  const urgency = daysSince >= 3 ? "urgent" : "normal";

  const html = emailWrapper(`
    <h2>${urgency === "urgent" ? "🔴 緊急: " : "📝 "}評価のお願い</h2>
    <p>${interviewerName}様</p>
    <p>${interviewDate}に実施した面接の評価がまだ提出されていません。</p>

    <div class="info-box">
      <h3>👤 面接情報</h3>
      <p><strong>候補者:</strong> ${candidateName}</p>
      <p><strong>面接日:</strong> ${interviewDate}</p>
      <p><strong>経過日数:</strong> ${daysSince}日</p>
    </div>

    <div class="highlight">
      <p><strong>${urgency === "urgent" ? "⚠️ 至急提出をお願いします" : "💡 早めの評価をお願いします"}</strong></p>
      <p>候補者は貴重なフィードバックを待っています。面接後3日以内の評価提出にご協力ください。</p>
    </div>

    <a href="${APP_URL}/interviewer/evaluate/${interviewId}" class="button">今すぐ評価する</a>

    <p>ご協力ありがとうございます。</p>
  `);

  const text = `
${urgency === "urgent" ? "緊急: " : ""}評価のお願い

${interviewerName}様

${interviewDate}に実施した面接の評価がまだ提出されていません。

面接情報:
候補者: ${candidateName}
面接日: ${interviewDate}
経過日数: ${daysSince}日

${urgency === "urgent" ? "至急提出をお願いします" : "早めの評価をお願いします"}
候補者は貴重なフィードバックを待っています。面接後3日以内の評価提出にご協力ください。

今すぐ評価する: ${APP_URL}/interviewer/evaluate/${interviewId}

ご協力ありがとうございます。

${APP_NAME}
  `;

  return {
    subject: `【${APP_NAME}】${urgency === "urgent" ? "🔴 緊急: " : ""}評価のお願い - ${candidateName}`,
    html,
    text,
  };
}
