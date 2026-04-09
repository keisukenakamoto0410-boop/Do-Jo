import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lineId = 'Ud5e0232288d9f44462caf87d81f1c90f';

  // まず、ユーザー情報を表示
  const user = await prisma.user.findUnique({
    where: { lineId },
    include: {
      _count: {
        select: {
          reservationsAsLearner: true,
          reservationsAsHost: true,
          slots: true,
          feedbackGiven: true,
          feedbackReceived: true,
        }
      }
    }
  });

  if (!user) {
    console.log('❌ ユーザーが見つかりません');
    return;
  }

  console.log('削除するユーザー情報:');
  console.log({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    関連データ: {
      学習者としての予約: user._count.reservationsAsLearner,
      ホストとしての予約: user._count.reservationsAsHost,
      スロット: user._count.slots,
      与えたフィードバック: user._count.feedbackGiven,
      受け取ったフィードバック: user._count.feedbackReceived,
    }
  });

  console.log('\n⚠️  削除を実行しています...');

  // ユーザーを削除（関連データも CASCADE で削除される）
  await prisma.user.delete({
    where: { lineId }
  });

  console.log('✓ ユーザーとすべての関連データを削除しました');
  console.log('✓ 再度LINEログインすれば新しいアカウントが作成されます');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
