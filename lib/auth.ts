import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// User role type
type UserRole = "learner" | "senior" | "student" | "admin";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      lineId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    lineId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    lineId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter is removed because it's not compatible with CredentialsProvider
  // CredentialsProvider requires JWT strategy which doesn't use the adapter for sessions
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // LINE OAuth Provider (LINEログイン用 - Messaging APIとは別のチャネル)
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID || "",
      clientSecret: process.env.LINE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize called with email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Error: Missing email or password");
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        try {
          console.log("[AUTH] Looking up user in database...");
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          console.log("[AUTH] User found:", user ? { id: user.id, email: user.email, hasPassword: !!user.password } : null);

          if (!user || !user.password) {
            console.log("[AUTH] Error: User not found or no password set");
            throw new Error("ユーザーが見つかりません");
          }

          console.log("[AUTH] Comparing passwords...");
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("[AUTH] Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("[AUTH] Error: Invalid password");
            throw new Error("パスワードが正しくありません");
          }

          // Update last login
          console.log("[AUTH] Updating last login...");
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          console.log("[AUTH] Success! Returning user:", { id: user.id, email: user.email, role: user.role });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            lineId: user.lineId,
          };
        } catch (error) {
          console.error("[AUTH] Error in authorize:", error);
          throw error;
        }
      },
    }),
    // LIFF (LINE Front-end Framework) 用の認証プロバイダー
    CredentialsProvider({
      id: "line-credentials",
      name: "LINE",
      credentials: {
        lineUserId: { label: "LINE User ID", type: "text" },
      },
      async authorize(credentials) {
        console.log("[AUTH] LINE authorize called with LINE ID:", credentials?.lineUserId);

        if (!credentials?.lineUserId) {
          console.log("[AUTH] Error: Missing LINE User ID");
          throw new Error("LINE User IDが必要です");
        }

        try {
          console.log("[AUTH] Looking up user by LINE ID in database...");
          const user = await db.user.findUnique({
            where: { lineId: credentials.lineUserId },
          });

          console.log("[AUTH] User found:", user ? { id: user.id, email: user.email, lineId: user.lineId } : null);

          if (!user) {
            console.log("[AUTH] Error: User not found for LINE ID");
            throw new Error("ユーザーが見つかりません");
          }

          // Update last login
          console.log("[AUTH] Updating last login...");
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          console.log("[AUTH] Success! Returning user:", { id: user.id, email: user.email, role: user.role });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            lineId: user.lineId,
          };
        } catch (error) {
          console.error("[AUTH] Error in LINE authorize:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Googleログインの場合、ユーザーをDBに作成/更新
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // 新規ユーザー作成（デフォルトはlearner）
            await db.user.create({
              data: {
                email: user.email,
                name: user.name || "User",
                role: "learner",
                lastLoginAt: new Date(),
              },
            });
            console.log("[AUTH] Created new Google user:", user.email);
          } else {
            // 既存ユーザーの最終ログイン更新
            await db.user.update({
              where: { email: user.email },
              data: { lastLoginAt: new Date() },
            });
            console.log("[AUTH] Updated existing Google user:", user.email);
          }
        } catch (error) {
          console.error("[AUTH] Error in signIn callback:", error);
          return false;
        }
      }

      // LINEログインの場合、ユーザーをDBに作成/更新
      if (account?.provider === "line" && user.email) {
        try {
          const lineUserId = account.providerAccountId;

          // まずLINE IDで既存ユーザーを検索
          let existingUser = await db.user.findUnique({
            where: { lineId: lineUserId },
          });

          // LINE IDで見つからない場合はメールで検索
          if (!existingUser && user.email) {
            existingUser = await db.user.findUnique({
              where: { email: user.email },
            });
          }

          if (!existingUser) {
            // 新規ユーザー作成（デフォルトはsenior - LINEは主にシニア向け）
            await db.user.create({
              data: {
                email: user.email,
                name: user.name || "User",
                role: "senior",
                lineId: lineUserId,
                lastLoginAt: new Date(),
              },
            });
            console.log("[AUTH] Created new LINE user:", user.email);
          } else {
            // 既存ユーザーの更新（LINE IDも保存）
            await db.user.update({
              where: { id: existingUser.id },
              data: {
                lastLoginAt: new Date(),
                lineId: lineUserId,
              },
            });
            console.log("[AUTH] Updated existing LINE user:", user.email);
          }
        } catch (error) {
          console.error("[AUTH] Error in LINE signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Googleログインの場合、DBからユーザー情報を取得
      if (account?.provider === "google" && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
          token.lineId = dbUser.lineId;
        }
      }

      // LINEログインの場合、DBからユーザー情報を取得
      if (account?.provider === "line") {
        const lineUserId = account.providerAccountId;
        // まずLINE IDで検索
        let dbUser = await db.user.findUnique({
          where: { lineId: lineUserId },
        });
        // 見つからない場合はメールで検索
        if (!dbUser && token.email) {
          dbUser = await db.user.findUnique({
            where: { email: token.email as string },
          });
        }
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
          token.lineId = dbUser.lineId;
        }
      }

      // Credentialsログイン (email/password または LINE credentials) の場合
      // userオブジェクトからIDとroleを取得
      if (user && !account?.provider) {
        console.log("[AUTH JWT] Credentials login, setting token from user:", { id: user.id, role: user.role });
        token.id = user.id;
        token.role = user.role;
        token.lineId = user.lineId;
      } else if (user && user.role && !token.role) {
        // OAuthでもroleがない場合は設定
        console.log("[AUTH JWT] OAuth login without role, setting from user:", { id: user.id, role: user.role });
        token.id = user.id;
        token.role = user.role;
        token.lineId = user.lineId;
      }

      // トークンにIDがない場合（既存セッション）、DBから取得
      if (!token.id && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
          token.lineId = dbUser.lineId;
        }
      }

      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH SESSION] Creating session from token:", {
        tokenId: token.id,
        tokenRole: token.role,
        tokenEmail: token.email,
        tokenLineId: token.lineId
      });

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email as string;
        session.user.lineId = token.lineId;

        console.log("[AUTH SESSION] Session created:", {
          userId: session.user.id,
          userRole: session.user.role,
          userLineId: session.user.lineId
        });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 開発環境で複数オリジン（localhost, IPアドレス）からアクセスを許可
      const allowedHosts = ["localhost", "127.0.0.1", "192.168.0.10"];

      // 相対URLの場合
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const urlObj = new URL(url);
        // 許可されたホストからのリクエストはそのまま通す
        if (allowedHosts.includes(urlObj.hostname)) {
          return url;
        }
      } catch {
        // URL解析エラーの場合はbaseUrlを使用
      }

      // 同じオリジンの場合
      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // デフォルトはベースURL
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
