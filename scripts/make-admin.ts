import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lineId = 'Ud5e0232288d9f44462caf87d81f1c90f';

  const user = await prisma.user.update({
    where: { lineId },
    data: { role: 'admin' }
  });

  console.log('✓ ユーザーを管理者に変更しました:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
