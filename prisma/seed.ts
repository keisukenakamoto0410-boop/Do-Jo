import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Learner User
  const learnerPassword = await bcrypt.hash("learner123", 10);
  const learner1 = await prisma.user.upsert({
    where: { email: "learner@dojo.com" },
    update: {},
    create: {
      email: "learner@dojo.com",
      password: learnerPassword,
      name: "Rajesh Kumar",
      role: "learner",
      jlptLevel: "N3",
      nativeLanguage: "English",
      learningGoal: "business",
      country: "India",
      wantsToWorkInJapan: true,
      bio: "I want to work in Japan as a software engineer.",
      interests: ["Technology", "Anime", "Travel"],
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Created learner:", learner1.email);

  // Create Senior Host User
  const seniorPassword = await bcrypt.hash("senior123", 10);
  const senior1 = await prisma.user.upsert({
    where: { email: "senior@dojo.com" },
    update: {},
    create: {
      email: "senior@dojo.com",
      password: seniorPassword,
      name: "田中 太郎",
      role: "senior",
      bio: "大手メーカーで営業部長として30年勤務。人材育成や海外営業を担当してきました。",
      careerHistory: "大手電機メーカーで営業部長として30年勤務。海外営業、人材育成を担当。",
      expertise: ["営業", "人事", "製造"],
      interests: ["ゴルフ", "読書", "料理"],
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Created senior host:", senior1.email);

  // Create Student Host User
  const studentPassword = await bcrypt.hash("student123", 10);
  const student1 = await prisma.user.upsert({
    where: { email: "student@dojo.com" },
    update: {},
    create: {
      email: "student@dojo.com",
      password: studentPassword,
      name: "佐藤 花子",
      role: "student",
      bio: "東京大学で経済学を学んでいます。国際交流に興味があります。",
      university: "東京大学",
      major: "経済学部",
      graduationYear: 2026,
      interests: ["アニメ", "旅行", "音楽", "ファッション"],
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Created student host:", student1.email);

  // Create some slots for the hosts
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  // Create slots for senior host
  for (let i = 0; i < 4; i++) {
    const startTime = new Date(tomorrow);
    startTime.setHours(10 + i, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 25);

    await prisma.slot.create({
      data: {
        hostId: senior1.id,
        sessionType: "business",
        startTime,
        endTime,
        status: "available",
      },
    });
  }
  console.log("✅ Created 4 slots for senior host");

  // Create slots for student host
  for (let i = 0; i < 4; i++) {
    const startTime = new Date(tomorrow);
    startTime.setHours(14 + i, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 25);

    await prisma.slot.create({
      data: {
        hostId: student1.id,
        sessionType: "casual",
        startTime,
        endTime,
        status: "available",
      },
    });
  }
  console.log("✅ Created 4 slots for student host");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📝 Login credentials:");
  console.log("Learner:  learner@dojo.com / learner123");
  console.log("Senior:   senior@dojo.com / senior123");
  console.log("Student:  student@dojo.com / student123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
