// app/api/auth/liff-login/route.ts
// LIFF認証用APIエンドポイント

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "next-auth/react";

/**
 * POST /api/auth/liff-login
 *
 * LIFFから取得したユーザー情報を使用してログイン/登録を行う
 *
 * Request body:
 * {
 *   "lineUserId": "U1234567890abcdef",
 *   "displayName": "山田太郎",
 *   "pictureUrl": "https://profile.line-scdn.net/..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lineUserId, displayName, pictureUrl } = body;

    console.log("[LIFF-LOGIN] Request:", { lineUserId, displayName, pictureUrl });

    // バリデーション
    if (!lineUserId) {
      return NextResponse.json(
        { error: "lineUserId is required" },
        { status: 400 }
      );
    }

    if (!displayName) {
      return NextResponse.json(
        { error: "displayName is required" },
        { status: 400 }
      );
    }

    // LINE IDでユーザーを検索
    let user = await prisma.user.findUnique({
      where: { lineId: lineUserId },
    });

    if (!user) {
      // 新規ユーザーを作成
      console.log("[LIFF-LOGIN] Creating new user for LINE ID:", lineUserId);

      user = await prisma.user.create({
        data: {
          // LINEログインの場合はemailがないため、一時的にlineUserIdをemailに設定
          email: `${lineUserId}@line.local`,
          name: displayName,
          role: "senior", // デフォルトはsenior（必要に応じて変更可能）
          lineId: lineUserId,
          avatar: pictureUrl,
          lastLoginAt: new Date(),
        },
      });

      console.log("[LIFF-LOGIN] User created:", user.id);
    } else {
      // 既存ユーザーの情報を更新
      console.log("[LIFF-LOGIN] Updating existing user:", user.id);

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: displayName,
          avatar: pictureUrl,
          lastLoginAt: new Date(),
        },
      });
    }

    // セッション情報を返す
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LIFF-LOGIN] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to login with LIFF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
