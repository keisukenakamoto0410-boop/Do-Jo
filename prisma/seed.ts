import { PrismaClient, UserType, JapaneseLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dojo.com" },
    update: {},
    create: {
      email: "admin@dojo.com",
      password: adminPassword,
      name: "Admin User",
      userType: UserType.ADMIN,
      profile: {
        phone: "+81-90-1234-5678",
      },
    },
  });
  console.log("✅ Created admin user:", admin.email);

  // Create Test Interviewers
  const interviewerPassword = await bcrypt.hash("interviewer123", 10);

  const interviewer1 = await prisma.user.upsert({
    where: { email: "interviewer1@dojo.com" },
    update: {},
    create: {
      email: "interviewer1@dojo.com",
      password: interviewerPassword,
      name: "田中 太郎",
      userType: UserType.INTERVIEWER,
      profile: {
        phone: "+81-90-2345-6789",
        bio: "10年以上の面接官経験があります。IT業界専門。",
        specialties: ["IT", "エンジニア"],
      },
    },
  });
  console.log("✅ Created interviewer 1:", interviewer1.email);

  const interviewer2 = await prisma.user.upsert({
    where: { email: "interviewer2@dojo.com" },
    update: {},
    create: {
      email: "interviewer2@dojo.com",
      password: interviewerPassword,
      name: "佐藤 花子",
      userType: UserType.INTERVIEWER,
      profile: {
        phone: "+81-90-3456-7890",
        bio: "人事部門で15年の経験。営業・事務職の面接を担当。",
        specialties: ["営業", "事務", "カスタマーサポート"],
      },
    },
  });
  console.log("✅ Created interviewer 2:", interviewer2.email);

  // Create Test Candidates
  const candidatePassword = await bcrypt.hash("candidate123", 10);

  const candidate1 = await prisma.user.upsert({
    where: { email: "candidate1@dojo.com" },
    update: {},
    create: {
      email: "candidate1@dojo.com",
      password: candidatePassword,
      name: "Rajesh Kumar",
      userType: UserType.CANDIDATE,
      japaneseLevel: JapaneseLevel.N3,
      profile: {
        phone: "+91-98765-43210",
        nationality: "India",
        targetJob: "ITエンジニア",
        yearsOfExperience: 3,
      },
    },
  });
  console.log("✅ Created candidate 1:", candidate1.email);

  const candidate2 = await prisma.user.upsert({
    where: { email: "candidate2@dojo.com" },
    update: {},
    create: {
      email: "candidate2@dojo.com",
      password: candidatePassword,
      name: "Priya Sharma",
      userType: UserType.CANDIDATE,
      japaneseLevel: JapaneseLevel.N2,
      profile: {
        phone: "+91-98765-43211",
        nationality: "India",
        targetJob: "営業",
        yearsOfExperience: 2,
      },
    },
  });
  console.log("✅ Created candidate 2:", candidate2.email);

  const candidate3 = await prisma.user.upsert({
    where: { email: "candidate3@dojo.com" },
    update: {},
    create: {
      email: "candidate3@dojo.com",
      password: candidatePassword,
      name: "Amit Patel",
      userType: UserType.CANDIDATE,
      japaneseLevel: JapaneseLevel.N4,
      profile: {
        phone: "+91-98765-43212",
        nationality: "India",
        targetJob: "事務",
        yearsOfExperience: 1,
      },
    },
  });
  console.log("✅ Created candidate 3:", candidate3.email);

  // Create Interview Slots for both interviewers
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const jobCategories = ["IT", "営業", "事務"];
  let totalSlots = 0;

  // Slots for Interviewer 1 (IT specialist)
  for (let i = 0; i < 4; i++) {
    const startTime = new Date(tomorrow);
    startTime.setHours(10 + i * 2, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1, 0, 0, 0);

    await prisma.interviewSlot.create({
      data: {
        interviewerId: interviewer1.id,
        startTime,
        endTime,
        status: "AVAILABLE",
        jobCategory: "IT",
      },
    });
    totalSlots++;
  }

  // Slots for Interviewer 2 (Sales/Admin specialist)
  for (let i = 0; i < 4; i++) {
    const startTime = new Date(tomorrow);
    startTime.setHours(9 + i * 2, 30, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1, 0, 0, 0);

    await prisma.interviewSlot.create({
      data: {
        interviewerId: interviewer2.id,
        startTime,
        endTime,
        status: "AVAILABLE",
        jobCategory: jobCategories[i % 2 + 1], // Alternates between 営業 and 事務
      },
    });
    totalSlots++;
  }
  console.log(`✅ Created ${totalSlots} interview slots`);

  // Create Usage Tracking for all candidates
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const candidates = [candidate1, candidate2, candidate3];
  for (const candidate of candidates) {
    await prisma.usageTracking.upsert({
      where: {
        candidateId_month: {
          candidateId: candidate.id,
          month: currentMonth,
        },
      },
      update: {},
      create: {
        candidateId: candidate.id,
        month: currentMonth,
        usageCount: 0,
        limit: 2,
      },
    });
  }
  console.log("✅ Created usage tracking for all candidates");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📝 Login credentials:");
  console.log("Admin:         admin@dojo.com / admin123");
  console.log("Interviewer 1: interviewer1@dojo.com / interviewer123");
  console.log("Interviewer 2: interviewer2@dojo.com / interviewer123");
  console.log("Candidate 1:   candidate1@dojo.com / candidate123");
  console.log("Candidate 2:   candidate2@dojo.com / candidate123");
  console.log("Candidate 3:   candidate3@dojo.com / candidate123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
