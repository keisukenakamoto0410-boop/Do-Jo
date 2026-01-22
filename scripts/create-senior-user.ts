import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("senior123", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "senior@test.com" },
    update: {},
    create: {
      email: "senior@test.com",
      password: hashedPassword,
      name: "山田 太郎",
      role: "senior",
      bio: "元大手メーカー勤務。若い人との交流を楽しみにしています。",
      careerHistory: "大手メーカーで営業部長として30年勤務。人材育成や海外営業を担当。",
      expertise: ["営業", "人事", "経営"],
      ageRange: "60s",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log("Created senior user:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
