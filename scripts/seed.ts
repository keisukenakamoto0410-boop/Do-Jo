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

  // Create completed reservation with feedback and engagement data
  const completedSlotTime = new Date(now);
  completedSlotTime.setDate(completedSlotTime.getDate() - 2);
  completedSlotTime.setHours(15, 0, 0, 0);

  const completedSlot = await prisma.slot.create({
    data: {
      hostId: senior.id,
      sessionType: "business",
      startTime: completedSlotTime,
      endTime: new Date(completedSlotTime.getTime() + 25 * 60 * 1000),
      status: "completed",
    },
  });
  console.log("Created completed slot:", completedSlot.id);

  const completedReservation = await prisma.reservation.create({
    data: {
      slotId: completedSlot.id,
      learnerId: learner.id,
      hostId: senior.id,
      sessionType: "business",
      status: "completed",
      readyToTalk: true,
      selectedTopic: "work_career",
      startedAt: completedSlotTime,
      completedAt: new Date(completedSlotTime.getTime() + 25 * 60 * 1000),
    },
  });
  console.log("Created completed reservation:", completedReservation.id);

  // Create detailed feedback from senior to learner
  const detailedFeedback = await prisma.detailedFeedback.create({
    data: {
      reservationId: completedReservation.id,
      topics: ["仕事・キャリア", "日本のビジネス文化", "敬語の使い方"],
      pronunciationScore: 4,
      grammarScore: 3,
      enthusiasmScore: 5,
      comprehensionScore: 4,
      goodExpression: "「よろしくお願いします」の発音がとても自然で良かったです。ビジネスの場面でも使える丁寧な表現ができていました。",
      improvementFrom: "私は会社に働きます",
      improvementTo: "私は会社で働いています",
      encouragementMessage: "今日はありがとうございました！日本のビジネス文化について一生懸命学ぼうとする姿勢が素晴らしかったです。敬語の使い方も基本はしっかりできているので、あとは実践を重ねていけば自然に身につくと思います。日本の会社でもきっとうまくやっていけますよ。これからも頑張ってください！応援しています！",
    },
  });
  console.log("Created detailed feedback:", detailedFeedback.id);

  // Create engagement log (発話量データ)
  const engagementLog = await prisma.engagementLog.create({
    data: {
      sessionId: completedReservation.id,
      foreignerSpeakSec: 420, // 7分（外国人の発話）
      seniorSpeakSec: 540, // 9分（シニアの発話）
      silenceSec: 540, // 9分（沈黙）
      seniorEnergyRating: 4, // シニアによる主観的元気度評価（4 = 元気だった）
    },
  });
  console.log("Created engagement log:", engagementLog.id);

  // Create another completed reservation with different stats
  const completedSlot2Time = new Date(now);
  completedSlot2Time.setDate(completedSlot2Time.getDate() - 1);
  completedSlot2Time.setHours(14, 0, 0, 0);

  const completedSlot2 = await prisma.slot.create({
    data: {
      hostId: senior.id,
      sessionType: "casual",
      startTime: completedSlot2Time,
      endTime: new Date(completedSlot2Time.getTime() + 25 * 60 * 1000),
      status: "completed",
    },
  });

  const completedReservation2 = await prisma.reservation.create({
    data: {
      slotId: completedSlot2.id,
      learnerId: learner2.id,
      hostId: senior.id,
      sessionType: "casual",
      status: "completed",
      readyToTalk: true,
      selectedTopic: "daily_life",
      startedAt: completedSlot2Time,
      completedAt: new Date(completedSlot2Time.getTime() + 25 * 60 * 1000),
    },
  });
  console.log("Created completed reservation 2:", completedReservation2.id);

  const detailedFeedback2 = await prisma.detailedFeedback.create({
    data: {
      reservationId: completedReservation2.id,
      topics: ["日常会話", "趣味", "アニメ"],
      pronunciationScore: 3,
      grammarScore: 3,
      enthusiasmScore: 2,
      comprehensionScore: 3,
      encouragementMessage: "今日は楽しく話せました。アニメの話で盛り上がりましたね！もう少し自分から質問してくれると、もっと会話が広がると思います。次回も楽しみにしています！",
    },
  });
  console.log("Created detailed feedback 2:", detailedFeedback2.id);

  // Low energy session (元気がない学習者)
  const engagementLog2 = await prisma.engagementLog.create({
    data: {
      sessionId: completedReservation2.id,
      foreignerSpeakSec: 300, // 5分（発話率20% = 低い）
      seniorSpeakSec: 900, // 15分（シニアが多く話す）
      silenceSec: 300, // 5分（沈黙）
      seniorEnergyRating: 2, // シニアによる評価: 少し元気がなかった
    },
  });
  console.log("Created engagement log 2:", engagementLog2.id);

  // Create one more high energy session
  const completedSlot3Time = new Date(now);
  completedSlot3Time.setDate(completedSlot3Time.getDate() - 3);
  completedSlot3Time.setHours(10, 30, 0, 0);

  const completedSlot3 = await prisma.slot.create({
    data: {
      hostId: student.id,
      sessionType: "casual",
      startTime: completedSlot3Time,
      endTime: new Date(completedSlot3Time.getTime() + 25 * 60 * 1000),
      status: "completed",
    },
  });

  const completedReservation3 = await prisma.reservation.create({
    data: {
      slotId: completedSlot3.id,
      learnerId: learner.id,
      hostId: student.id,
      sessionType: "casual",
      status: "completed",
      readyToTalk: true,
      selectedTopic: "hobbies",
      startedAt: completedSlot3Time,
      completedAt: new Date(completedSlot3Time.getTime() + 25 * 60 * 1000),
    },
  });

  const detailedFeedback3 = await prisma.detailedFeedback.create({
    data: {
      reservationId: completedReservation3.id,
      topics: ["趣味", "休日の過ごし方", "音楽"],
      pronunciationScore: 5,
      grammarScore: 4,
      enthusiasmScore: 5,
      comprehensionScore: 5,
      goodExpression: "「週末はいつも友達と遊びに行きます」という表現がとても自然でした！",
      encouragementMessage: "すごく楽しかったです！たくさん話してくれて嬉しかったです。日本語も上手だし、会話も弾んで、友達と話しているみたいでした♪これからも一緒に楽しく日本語を学びましょう！",
    },
  });
  console.log("Created detailed feedback 3:", detailedFeedback3.id);

  // Very high energy session (元気な学習者)
  const engagementLog3 = await prisma.engagementLog.create({
    data: {
      sessionId: completedReservation3.id,
      foreignerSpeakSec: 720, // 12分（発話率48% = 高い）
      seniorSpeakSec: 600, // 10分
      silenceSec: 180, // 3分（沈黙少ない）
      seniorEnergyRating: 5, // シニアによる評価: とても元気で明るかった
    },
  });
  console.log("Created engagement log 3:", engagementLog3.id);

  console.log("\n✅ Seeding completed!");
  console.log("\nTest accounts:");
  console.log("  Admin:   admin@dojo.com / admin123");
  console.log("  Senior:  tanaka@example.com / senior123");
  console.log("  Student: yamada@example.com / student123");
  console.log("  Learner: john@example.com / learner123");
  console.log("  Learner: maria@example.com / maria123");
  console.log("\nCompleted sessions with feedback:");
  console.log("  Session 1:", completedReservation.id, "(High quality - 発話率28%)");
  console.log("  Session 2:", completedReservation2.id, "(Low energy - 発話率20%)");
  console.log("  Session 3:", completedReservation3.id, "(Very high energy - 発話率48%)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
