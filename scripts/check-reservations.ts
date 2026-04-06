// Check all reservations in database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 予約状況を確認中...\n");

  // Get all reservations
  const reservations = await prisma.reservation.findMany({
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          lineId: true,
        },
      },
      learner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      slot: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`✅ 全予約数: ${reservations.length}\n`);

  if (reservations.length === 0) {
    console.log("❌ 予約が見つかりません。");
    console.log("\n💡 予約作成時にエラーが発生している可能性があります。");
  } else {
    reservations.forEach((res, index) => {
      console.log(`${index + 1}. 予約ID: ${res.id}`);
      console.log(`   ステータス: ${res.status}`);
      console.log(`   日本人: ${res.host.name} (${res.host.email})`);
      console.log(`   学習者: ${res.learner.name} (${res.learner.email})`);
      console.log(`   開始時刻: ${res.slot.startTime.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`);
      console.log(`   日本人のLINE ID: ${res.host.lineId || "❌ なし"}`);
      console.log(`   作成日時: ${res.createdAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`);
      console.log("");
    });
  }

  // Check slots
  const slots = await prisma.slot.findMany({
    include: {
      reservation: true,
    },
    orderBy: {
      startTime: "desc",
    },
    take: 10,
  });

  console.log(`\n📊 最新のスロット（最大10件）:\n`);
  slots.forEach((slot, index) => {
    console.log(`${index + 1}. スロットID: ${slot.id}`);
    console.log(`   ステータス: ${slot.status}`);
    console.log(`   開始時刻: ${slot.startTime.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`);
    console.log(`   予約: ${slot.reservation ? "あり (ID: " + slot.reservation.id + ")" : "なし"}`);
    console.log("");
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("エラー:", error);
    prisma.$disconnect();
    process.exit(1);
  });
