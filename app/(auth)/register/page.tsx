"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserType, JapaneseLevel } from "@prisma/client";
import type { RegisterFormData } from "@/types/auth";

const registerSchema = z
  .object({
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: z
      .string()
      .min(8, "パスワードは8文字以上である必要があります")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "パスワードには大文字、小文字、数字を含める必要があります"
      ),
    confirmPassword: z.string(),
    name: z.string().min(2, "名前は2文字以上である必要があります"),
    userType: z.nativeEnum(UserType),
    japaneseLevel: z.nativeEnum(JapaneseLevel).optional(),
    acceptsMarketing: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.userType === UserType.CANDIDATE) {
        return !!data.japaneseLevel;
      }
      return true;
    },
    {
      message: "候補者の場合、日本語レベルを選択してください",
      path: ["japaneseLevel"],
    }
  );

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: UserType.CANDIDATE,
      acceptsMarketing: false,
    },
  });

  const userType = watch("userType");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "登録に失敗しました");
        return;
      }

      // Redirect to login page
      router.push("/login?registered=true");
    } catch (err) {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Do Jo に新規登録
          </h1>
          <p className="text-gray-600">アカウントを作成して始めましょう</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザータイプ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                  userType === UserType.CANDIDATE
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 hover:border-primary-300"
                }`}
              >
                <input
                  type="radio"
                  {...register("userType")}
                  value={UserType.CANDIDATE}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">👨‍💼</div>
                  <div className="font-medium">候補者</div>
                  <div className="text-xs text-gray-600">
                    面接練習を受ける
                  </div>
                </div>
              </label>

              <label
                className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                  userType === UserType.INTERVIEWER
                    ? "border-secondary-500 bg-secondary-50"
                    : "border-gray-300 hover:border-secondary-300"
                }`}
              >
                <input
                  type="radio"
                  {...register("userType")}
                  value={UserType.INTERVIEWER}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">👔</div>
                  <div className="font-medium">面接官</div>
                  <div className="text-xs text-gray-600">面接を実施する</div>
                </div>
              </label>
            </div>
            {errors.userType && (
              <p className="mt-1 text-sm text-red-600">
                {errors.userType.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              id="name"
              autoComplete="name"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              autoComplete="email"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Japanese Level (only for candidates) */}
          {userType === UserType.CANDIDATE && (
            <div>
              <label
                htmlFor="japaneseLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                日本語能力レベル <span className="text-red-500">*</span>
              </label>
              <select
                {...register("japaneseLevel")}
                id="japaneseLevel"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value={JapaneseLevel.N1}>N1 - 上級</option>
                <option value={JapaneseLevel.N2}>N2 - 中上級</option>
                <option value={JapaneseLevel.N3}>N3 - 中級</option>
                <option value={JapaneseLevel.N4}>N4 - 初中級</option>
                <option value={JapaneseLevel.N5}>N5 - 初級</option>
              </select>
              {errors.japaneseLevel && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.japaneseLevel.message}
                </p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              {...register("password")}
              type="password"
              id="password"
              autoComplete="new-password"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              8文字以上、大文字・小文字・数字を含む
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              パスワード確認 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Marketing Consent (only for candidates) */}
          {userType === UserType.CANDIDATE && (
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  {...register("acceptsMarketing")}
                  id="acceptsMarketing"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="acceptsMarketing"
                  className="font-medium text-gray-700"
                >
                  メールマガジンの受信に同意する
                </label>
                <p className="text-gray-500">
                  面接のコツや学習情報をお送りします（任意）
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                登録中...
              </span>
            ) : (
              "アカウントを作成"
            )}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちの場合は{" "}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                ログイン
              </Link>
            </p>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            登録することで、
            <Link href="/terms" className="text-primary-600 hover:underline">
              利用規約
            </Link>
            と
            <Link href="/privacy" className="text-primary-600 hover:underline">
              プライバシーポリシー
            </Link>
            に同意したものとみなされます
          </p>
        </form>
      </div>
    </div>
  );
}
