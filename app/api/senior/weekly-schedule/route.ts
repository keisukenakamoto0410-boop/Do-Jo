import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface DaySchedule {
  enabled: boolean;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

interface WeeklySchedule {
  [key: string]: DaySchedule;
}

// POST: Create slots for 4 weeks based on weekly schedule
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "senior") {
      return NextResponse.json(
        { error: "Only seniors can use this feature" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const schedule: WeeklySchedule = body.schedule;

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule is required" },
        { status: 400 }
      );
    }

    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const slotsToCreate: Array<{
      hostId: string;
      sessionType: string;
      startTime: Date;
      endTime: Date;
      status: string;
    }> = [];

    const now = new Date();
    const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    // Get existing slots to avoid duplicates
    const existingSlots = await prisma.slot.findMany({
      where: {
        hostId: session.user.id,
        startTime: {
          gte: now,
          lte: fourWeeksLater,
        },
      },
      select: {
        startTime: true,
      },
    });

    const existingTimes = new Set(
      existingSlots.map((s) => s.startTime.getTime())
    );

    // Generate slots for each enabled day
    for (const [day, config] of Object.entries(schedule)) {
      if (!config.enabled || !config.startTime || !config.endTime) continue;

      const targetDayOfWeek = dayMap[day.toLowerCase()];
      if (targetDayOfWeek === undefined) continue;

      const [startHour, startMinute] = config.startTime.split(":").map(Number);
      const [endHour, endMinute] = config.endTime.split(":").map(Number);

      // For each of the next 4 weeks
      for (let week = 0; week < 4; week++) {
        // Find the next occurrence of this day
        const currentDate = new Date(now);
        currentDate.setDate(currentDate.getDate() + week * 7);

        // Find the specific day in this week
        const daysUntilTarget =
          (targetDayOfWeek - currentDate.getDay() + 7) % 7;
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() + daysUntilTarget);

        // Skip if in the past
        if (targetDate < now && week === 0 && daysUntilTarget === 0) {
          continue;
        }

        // Create 30-minute slots from start to end time
        let slotStartHour = startHour;
        let slotStartMinute = startMinute;

        while (
          slotStartHour < endHour ||
          (slotStartHour === endHour && slotStartMinute < endMinute)
        ) {
          const slotStart = new Date(targetDate);
          slotStart.setHours(slotStartHour, slotStartMinute, 0, 0);

          const slotEnd = new Date(slotStart.getTime() + 25 * 60 * 1000); // 25 minutes

          // Skip if slot is in the past
          if (slotStart > now && !existingTimes.has(slotStart.getTime())) {
            slotsToCreate.push({
              hostId: session.user.id,
              sessionType: "casual",
              startTime: slotStart,
              endTime: slotEnd,
              status: "available",
            });
            existingTimes.add(slotStart.getTime());
          }

          // Move to next 30-minute slot
          slotStartMinute += 30;
          if (slotStartMinute >= 60) {
            slotStartMinute = 0;
            slotStartHour++;
          }
        }
      }
    }

    if (slotsToCreate.length === 0) {
      return NextResponse.json(
        { message: "No new slots to create", created: 0 },
        { status: 200 }
      );
    }

    // Create all slots
    const result = await prisma.slot.createMany({
      data: slotsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json(
      {
        message: `${result.count}件の時間を登録しました`,
        created: result.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating weekly schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
