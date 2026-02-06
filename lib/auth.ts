import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  // Vi bruger JWT strategi (vigtigt for at undgå redirect loops)
  session: {
    strategy: "jwt",
  },

  // HER ER DIN NYE TILFØJELSE ⬇️
  pages: {
    signIn: '/login', // Fortæller NextAuth: "Brug min custom side her"
    error: '/login',  // Hvis der sker en fejl, send dem også tilbage til login
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    // 1. Læg rollen ned i tokenet
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role;
        (token as any).id = user.id;
      }
      return token;
    },

    // 2. Læg rollen ned i sessionen så frontend kan se den
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role;
        (session.user as any).id = (token as any).id;
      }
      return session;
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};