import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      role, // "learner" | "senior" | "student"
      agreedToTerms,
      // 共通
      bio,
      interests,
      languages,
      // 学習者用
      jlptLevel,
      nativeLanguage,
      learningGoal,
      country,
      wantsToWorkInJapan,
      // シニア用
      careerHistory,
      expertise,
      // 大学生用
      university,
      major,
      graduationYear,
    } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["learner", "senior", "student"].includes(role)) {
      return NextResponse.json(
        { error: "無効なユーザータイプです" },
        { status: 400 }
      );
    }

    // Validate terms acceptance
    if (!agreedToTerms) {
      return NextResponse.json(
        { error: "You must agree to the Terms of Service" },
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

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        bio: bio || null,
        interests: interests || [],
        languages: languages || [],
        // 利用規約
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        // 学習者用
        jlptLevel: role === "learner" ? jlptLevel : null,
        nativeLanguage: role === "learner" ? nativeLanguage : null,
        learningGoal: role === "learner" ? learningGoal : null,
        country: role === "learner" ? country : null,
        wantsToWorkInJapan: role === "learner" ? (wantsToWorkInJapan || false) : false,
        // シニア用
        careerHistory: role === "senior" ? careerHistory : null,
        expertise: role === "senior" ? (expertise || []) : [],
        // 大学生用
        university: role === "student" ? university : null,
        major: role === "student" ? major : null,
        graduationYear: role === "student" ? graduationYear : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "アカウントが作成されました",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
