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

  // ==================== トピックマスター ====================
  const topics = [
    { name: "Daily Conversation", nameJa: "日常会話", category: "basic", level: "N5", keywords: ["挨拶", "自己紹介", "天気", "時間"] },
    { name: "Japanese Food Culture", nameJa: "日本の食文化", category: "culture", level: "N4", keywords: ["料理", "食べ物", "レストラン", "朝ごはん"] },
    { name: "Travel in Japan", nameJa: "日本旅行", category: "travel", level: "N4", keywords: ["観光", "電車", "ホテル", "お土産"] },
    { name: "Japanese Seasons", nameJa: "日本の四季", category: "culture", level: "N4", keywords: ["春", "夏", "秋", "冬", "祭り"] },
    { name: "Family & Daily Life", nameJa: "家族と日常", category: "basic", level: "N5", keywords: ["家族", "仕事", "趣味", "週末"] },
    { name: "Hobbies & Entertainment", nameJa: "趣味・娯楽", category: "lifestyle", level: "N4", keywords: ["映画", "音楽", "スポーツ", "ゲーム"] },
    { name: "Shopping", nameJa: "買い物", category: "practical", level: "N5", keywords: ["店", "値段", "お金", "服"] },
    { name: "Japanese History", nameJa: "日本の歴史", category: "culture", level: "N3", keywords: ["歴史", "城", "侍", "伝統"] },
    { name: "Work & Business", nameJa: "仕事・ビジネス", category: "business", level: "N3", keywords: ["会社", "仕事", "会議", "敬語"] },
    { name: "Health & Wellness", nameJa: "健康", category: "lifestyle", level: "N4", keywords: ["病院", "薬", "運動", "体"] },
  ];

  for (const topicData of topics) {
    const topicId = topicData.name.toLowerCase().replace(/ /g, "_").replace(/&/g, "and");
    await prisma.topic.upsert({
      where: { id: topicId },
      update: {},
      create: {
        id: topicId,
        name: topicData.name,
        nameJa: topicData.nameJa,
        category: topicData.category,
        level: topicData.level,
        keywords: topicData.keywords,
      },
    });
  }
  console.log("✅ Created", topics.length, "topics");

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
