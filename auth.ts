// Datag — Auth.js v5 configuration. Email + password (credentials provider)
// with a JWT session. No OAuth, no email magic links — just classic signup.
//
// Requires DATABASE_URL + AUTH_SECRET. Without them, authorize() returns null
// and the auth pages will show a "DB not configured" message.

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";

const credSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(120),
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nickname: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!prisma) return null;
        const parsed = credSchema.safeParse(creds);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;
        const ok = await compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          // nickname is also passed through via the jwt callback below
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as { id: string }).id;
      }
      if (trigger === "update" && session?.nickname) {
        token.nickname = session.nickname;
      }
      // refresh nickname from DB whenever the token is rebuilt
      if (token.id && prisma) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { nickname: true },
          });
          if (u) token.nickname = u.nickname;
        } catch {
          /* ignore */
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.nickname) session.user.nickname = token.nickname as string;
      return session;
    },
  },
  trustHost: true,
});
