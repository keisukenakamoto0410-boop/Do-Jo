import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { UserType } from "@prisma/client";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: UserType;
      japaneseLevel?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    userType: UserType;
    japaneseLevel?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: UserType;
    japaneseLevel?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error("ユーザーが見つかりません");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("パスワードが正しくありません");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          japaneseLevel: user.japaneseLevel || undefined,
        };
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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.japaneseLevel = user.japaneseLevel;
      }

      // Update session
      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.japaneseLevel = token.japaneseLevel;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
