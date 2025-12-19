import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dojo.com" },
    update: {},
    create: {
      email: "admin@dojo.com",
      password: adminPassword,
      name: "Admin",
      role: "admin",
      bio: "Do Jo管理者",
      languages: ["日本語", "English"],
    },
  });
  console.log("Created admin user:", admin.email);

  // Create sample senior user
  const seniorPassword = await bcrypt.hash("senior123", 10);
  const senior = await prisma.user.upsert({
    where: { email: "tanaka@example.com" },
    update: {},
    create: {
      email: "tanaka@example.com",
      password: seniorPassword,
      name: "田中 太郎",
      role: "senior",
      bio: "元営業部長として30年間の経験があります。ビジネスマナーや敬語を教えるのが得意です。外国人の方に日本のビジネス文化をお伝えしたいと思っています。",
      languages: ["日本語"],
      careerHistory: "大手メーカーで営業部長として30年勤務。人材育成や海外営業を担当。",
      expertise: ["営業", "人事", "ビジネスマナー"],
      interests: ["歴史", "ゴルフ", "読書"],
    },
  });
  console.log("Created senior user:", senior.email);

  // Create sample student user
  const studentPassword = await bcrypt.hash("student123", 10);
  const student = await prisma.user.upsert({
    where: { email: "yamada@example.com" },
    update: {},
    create: {
      email: "yamada@example.com",
      password: studentPassword,
      name: "山田 花子",
      role: "student",
      bio: "東京大学の3年生です。アニメや日本の若者文化について話すのが好きです！外国の方と楽しくおしゃべりしたいです♪",
      languages: ["日本語", "English"],
      university: "東京大学",
      major: "文学部",
      graduationYear: 2026,
      interests: ["アニメ", "旅行", "音楽", "ファッション"],
    },
  });
  console.log("Created student user:", student.email);

  // Create sample learner user
  const learnerPassword = await bcrypt.hash("learner123", 10);
  const learner = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      password: learnerPassword,
      name: "John Smith",
      role: "learner",
      bio: "I want to work in Japan! Currently studying Japanese and interested in business culture.",
      languages: ["English", "日本語"],
      country: "USA",
      nativeLanguage: "English",
      jlptLevel: "N3",
      learningGoal: "business",
      wantsToWorkInJapan: true,
      interests: ["Anime", "Technology", "Business"],
    },
  });
  console.log("Created learner user:", learner.email);

  // Create another learner
  const learner2Password = await bcrypt.hash("maria123", 10);
  const learner2 = await prisma.user.upsert({
    where: { email: "maria@example.com" },
    update: {},
    create: {
      email: "maria@example.com",
      password: learner2Password,
      name: "Maria Garcia",
      role: "learner",
      bio: "日本のアニメと文化が大好き！カジュアルな会話を楽しみたいです。",
      languages: ["Spanish", "English", "日本語"],
      country: "Mexico",
      nativeLanguage: "Spanish",
      jlptLevel: "N4",
      learningGoal: "casual",
      wantsToWorkInJapan: false,
      interests: ["Anime", "Music", "Travel"],
    },
  });
  console.log("Created learner user:", learner2.email);

  // Create sample slots for the senior
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const slot1 = await prisma.slot.create({
    data: {
      hostId: senior.id,
      sessionType: "business",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 25 * 60 * 1000),
      status: "available",
    },
  });
  console.log("Created slot for senior:", slot1.id);

  const slot2Time = new Date(tomorrow);
  slot2Time.setHours(14, 0, 0, 0);
  const slot2 = await prisma.slot.create({
    data: {
      hostId: senior.id,
      sessionType: "business",
      startTime: slot2Time,
      endTime: new Date(slot2Time.getTime() + 25 * 60 * 1000),
      status: "available",
    },
  });
  console.log("Created slot for senior:", slot2.id);

  // Create sample slots for the student
  const studentSlot1Time = new Date(tomorrow);
  studentSlot1Time.setHours(19, 0, 0, 0);
  const studentSlot1 = await prisma.slot.create({
    data: {
      hostId: student.id,
      sessionType: "casual",
      startTime: studentSlot1Time,
      endTime: new Date(studentSlot1Time.getTime() + 25 * 60 * 1000),
      status: "available",
    },
  });
  console.log("Created slot for student:", studentSlot1.id);

  const studentSlot2Time = new Date(tomorrow);
  studentSlot2Time.setHours(20, 0, 0, 0);
  const studentSlot2 = await prisma.slot.create({
    data: {
      hostId: student.id,
      sessionType: "casual",
      startTime: studentSlot2Time,
      endTime: new Date(studentSlot2Time.getTime() + 25 * 60 * 1000),
      status: "available",
    },
  });
  console.log("Created slot for student:", studentSlot2.id);

  console.log("\n✅ Seeding completed!");
  console.log("\nTest accounts:");
  console.log("  Admin:   admin@dojo.com / admin123");
  console.log("  Senior:  tanaka@example.com / senior123");
  console.log("  Student: yamada@example.com / student123");
  console.log("  Learner: john@example.com / learner123");
  console.log("  Learner: maria@example.com / maria123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
