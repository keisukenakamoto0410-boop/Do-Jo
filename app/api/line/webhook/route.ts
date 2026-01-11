import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { Client } from '@line/bot-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    // 署名検証
    if (!process.env.LINE_CHANNEL_SECRET) {
      console.error('LINE_CHANNEL_SECRET not configured');
      return NextResponse.json({ error: 'LINE not configured' }, { status: 500 });
    }

    const hash = crypto
      .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET)
      .update(body)
      .digest('base64');

    if (signature !== hash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    for (const event of data.events) {
      // 友だち追加時
      if (event.type === 'follow') {
        console.log('New LINE follower:', event.source.userId);
      }

      // メッセージ受信時（メールアドレスで紐付け）
      if (event.type === 'message' && event.message.type === 'text') {
        const lineUserId = event.source.userId;
        const text = event.message.text.trim().toLowerCase();

        // メールアドレスっぽければ紐付け
        if (text.includes('@')) {
          const user = await prisma.user.findUnique({
            where: { email: text },
          });

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { lineUserId },
            });

            // 紐付け完了メッセージを送信
            const client = new Client({
              channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
            });
            await client.pushMessage(lineUserId, {
              type: 'text',
              text: '✅ アカウント連携が完了しました！\n\n予約が入るとLINEで通知が届きます。',
            });
          } else {
            // ユーザーが見つからない場合
            const client = new Client({
              channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
            });
            await client.pushMessage(lineUserId, {
              type: 'text',
              text: '❌ このメールアドレスは登録されていません。\n\nDo Joに登録済みのメールアドレスを送信してください。',
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
