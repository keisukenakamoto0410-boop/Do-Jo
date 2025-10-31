import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { UserType, JapaneseLevel } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      userType,
      japaneseLevel,
      acceptsMarketing,
    } = body;

    // Validate required fields
    if (!email || !password || !name || !userType) {
      return NextResponse.json(
        { error: "必須フィールドが入力されていません" },
        { status: 400 }
      );
    }

    // Validate candidate must have Japanese level
    if (userType === UserType.CANDIDATE && !japaneseLevel) {
      return NextResponse.json(
        { error: "候補者の場合、日本語レベルを選択してください" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Prepare profile data
    const profile: any = {};
    if (userType === UserType.CANDIDATE && acceptsMarketing !== undefined) {
      profile.acceptsMarketing = acceptsMarketing;
    }

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        userType,
        japaneseLevel: userType === UserType.CANDIDATE ? japaneseLevel : null,
        profile: Object.keys(profile).length > 0 ? profile : null,
      },
    });

    // If candidate, create usage tracking for current month
    if (userType === UserType.CANDIDATE) {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      await db.usageTracking.create({
        data: {
          candidateId: user.id,
          month: currentMonth,
          usageCount: 0,
          limit: 2,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "アカウントが作成されました",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "登録に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
