// Create learner account for keisuke.nakamoto0410@gmail.com
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("📝 外国人（学習者）アカウントを作成中...\n");

  const password = await bcrypt.hash("Keisuke0410", 10);

  const learner = await prisma.user.upsert({
    where: { email: "keisuke.nakamoto0410@gmail.com" },
    update: {
      password: password,
      name: "Keisuke Nakamoto",
      role: "learner",
      country: "Japan",
      nativeLanguage: "Japanese",
      jlptLevel: "N1",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
    create: {
      email: "keisuke.nakamoto0410@gmail.com",
      password: password,
      name: "Keisuke Nakamoto",
      role: "learner",
      country: "Japan",
      nativeLanguage: "Japanese",
      jlptLevel: "N1",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log("✅ 外国人アカウント作成完了！\n");
  console.log("📧 メール: keisuke.nakamoto0410@gmail.com");
  console.log("🔑 パスワード: Keisuke0410");
  console.log("👤 名前:", learner.name);
  console.log("🌍 役割:", learner.role);
  console.log("🌏 国:", learner.country);
  console.log("\n💡 https://do-jo.vercel.app/login からログインできます");
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("❌ エラー:", error);
    prisma.$disconnect();
    process.exit(1);
  });
