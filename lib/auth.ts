import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

// Vi sikrer, at Prisma ikke initialiseres flere gange i udvikling (Hydration fix)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Her bruger vi det lokale prisma objekt
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Tjek om brugeren findes i databasen
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // Hvis brugeren ikke findes, opretter vi dem automatisk som contributor
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "Google Bruger",
              role: "contributor", // Standard rolle for nye Google logins
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // Ved første login, tilføj rolle fra databasen til tokenet
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id; // Tilføj denne linje
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};